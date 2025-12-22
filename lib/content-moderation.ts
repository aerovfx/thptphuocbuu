import { prisma } from './prisma'
import { ModerationSeverity, ContentCategory, UserRole } from '@prisma/client'

export interface ModerationResult {
  allowed: boolean
  severity: ModerationSeverity | null
  violations: {
    keyword: string
    category: ContentCategory
    severity: ModerationSeverity
    replacement?: string
    position: { start: number; end: number }
  }[]
  suggestions: {
    original: string
    suggested: string
  }[]
  message?: string
}

// Cache filters in memory for performance
let filterCache: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getActiveFilters() {
  const now = Date.now()

  // Return cache if valid
  if (filterCache && (now - cacheTimestamp < CACHE_TTL)) {
    return filterCache
  }

  // Fetch from database
  filterCache = await prisma.contentFilter.findMany({
    where: { active: true },
    orderBy: { severity: 'asc' }, // FORBIDDEN first
  })

  cacheTimestamp = now
  return filterCache
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose Vietnamese
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim()
}

// Detect common evasion patterns
function expandEvasionPatterns(keyword: string): string[] {
  const patterns = [keyword]

  // Leet speak: a->4, e->3, i->1, o->0
  const leetMap: Record<string, string> = {
    a: '[a4@]',
    e: '[e3]',
    i: '[i1!]',
    o: '[o0]',
    u: 'u',
  }

  let regex = keyword
  for (const [char, replacement] of Object.entries(leetMap)) {
    regex = regex.replace(new RegExp(char, 'g'), replacement)
  }
  patterns.push(regex)

  // Spaced out: "d u m b" -> "d\\s*u\\s*m\\s*b"
  patterns.push(keyword.split('').join('\\s*'))

  // Repeated chars: "dummmb"
  patterns.push(keyword.replace(/(.)/g, '$1+'))

  return patterns
}

export async function moderateContent(
  content: string,
  userRole: UserRole,
  contentType: 'POST' | 'COMMENT' | 'DOCUMENT',
  userId: string
): Promise<ModerationResult> {
  const filters = await getActiveFilters()
  const normalizedContent = normalizeText(content)

  const violations: ModerationResult['violations'] = []
  const suggestions: ModerationResult['suggestions'] = []
  let highestSeverity: ModerationSeverity | null = null

  for (const filter of filters) {
    const patterns = filter.isRegex
      ?[filter.keyword]
      : expandEvasionPatterns(normalizeText(filter.keyword))

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(
          filter.wholeWord ? `\\b${pattern}\\b` : pattern,
          filter.caseSensitive ? 'g' : 'gi'
        )

        let match
        while ((match = regex.exec(filter.caseSensitive ? content : normalizedContent)) !== null) {
          // Check if allowed in context
          if (filter.allowedContexts) {
            try {
              const contexts = JSON.parse(filter.allowedContexts)
              const hasAllowedContext = contexts.some((ctx: string) =>
                normalizedContent.includes(normalizeText(ctx))
              )
              if (hasAllowedContext) continue
            } catch (e) {
              // Invalid JSON, skip context check
            }
          }

          violations.push({
            keyword: match[0],
            category: filter.category,
            severity: filter.severity,
            replacement: filter.replacement || undefined,
            position: {
              start: match.index,
              end: match.index + match[0].length,
            },
          })

          if (filter.replacement) {
            suggestions.push({
              original: match[0],
              suggested: filter.replacement,
            })
          }

          // Track highest severity
          if (
            !highestSeverity ||
            severityWeight(filter.severity) > severityWeight(highestSeverity)
          ) {
            highestSeverity = filter.severity
          }
        }
      } catch (error) {
        // Invalid regex pattern, skip
        console.warn(`Invalid regex pattern for filter: ${filter.keyword}`, error)
      }
    }
  }

  // Determine if content is allowed based on severity and user role
  const allowed = determineAllowed(highestSeverity, userRole)

  // Log moderation
  if (violations.length > 0) {
    await logModeration({
      contentType,
      contentId: 'pending', // Will be updated after creation
      originalText: content.substring(0, 1000), // Limit length
      violationType: violations[0].category,
      severity: highestSeverity!,
      matchedKeywords: JSON.stringify(violations.slice(0, 10).map((v) => v.keyword)),
      action: allowed ? 'ALLOWED' : 'BLOCKED',
      userId,
      userRole,
    })
  }

  return {
    allowed,
    severity: highestSeverity,
    violations,
    suggestions,
    message: allowed
      ? highestSeverity
        ? `Nội dung có từ ngữ không phù hợp. Vui lòng xem xét lại.`
        : undefined
      : `Nội dung vi phạm quy định. Không thể đăng.`,
  }
}

function severityWeight(severity: ModerationSeverity): number {
  const weights = {
    FORBIDDEN: 4,
    RESTRICTED: 3,
    CONDITIONAL: 2,
    ALLOWED: 1,
  }
  return weights[severity] || 0
}

function determineAllowed(
  severity: ModerationSeverity | null,
  userRole: UserRole
): boolean {
  if (!severity) return true

  switch (severity) {
    case 'FORBIDDEN':
      return false // Block for everyone

    case 'RESTRICTED':
      // Allow for ADMIN, TEACHER, SUPER_ADMIN, BGH
      return ['ADMIN', 'TEACHER', 'SUPER_ADMIN', 'BGH'].includes(userRole)

    case 'CONDITIONAL':
      // Warning but allow
      return true

    case 'ALLOWED':
      return true

    default:
      return true
  }
}

async function logModeration(data: any) {
  try {
    await prisma.moderationLog.create({ data })
  } catch (error) {
    console.error('Failed to log moderation:', error)
  }
}

// Seed initial filters (run once to populate database)
export async function seedContentFilters(createdById: string) {
  const seeds = [
    // 🔴 Profanity
    { keyword: 'đồ chó', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: 'người không tử tế' },
    { keyword: 'ngu', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: 'thiếu hiểu biết' },
    { keyword: 'vl', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'đm', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'cc', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'vcl', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'clgt', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'đéo', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: 'không' },
    { keyword: 'mẹ', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'shit', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },
    { keyword: 'fuck', category: 'PROFANITY', severity: 'FORBIDDEN', replacement: '' },

    // 🔴 Offensive
    { keyword: 'ngu dốt', category: 'OFFENSIVE', severity: 'FORBIDDEN', replacement: 'thiếu hiểu biết' },
    { keyword: 'xấu xa', category: 'OFFENSIVE', severity: 'RESTRICTED', replacement: 'không tốt' },
    { keyword: 'ngu ngốc', category: 'OFFENSIVE', severity: 'FORBIDDEN', replacement: 'chưa hiểu rõ' },
    { keyword: 'đần độn', category: 'OFFENSIVE', severity: 'FORBIDDEN', replacement: 'cần học hỏi thêm' },
    { keyword: 'thằng', category: 'OFFENSIVE', severity: 'CONDITIONAL', replacement: 'bạn' },
    { keyword: 'con', category: 'OFFENSIVE', severity: 'CONDITIONAL', replacement: 'bạn' },

    // 🟡 Sensational
    { keyword: 'sốc', category: 'SENSATIONAL', severity: 'CONDITIONAL', replacement: 'đáng chú ý' },
    { keyword: 'toang', category: 'SENSATIONAL', severity: 'CONDITIONAL', replacement: 'gặp khó khăn' },
    { keyword: 'vạch trần', category: 'SENSATIONAL', severity: 'CONDITIONAL', replacement: 'làm rõ' },
    { keyword: 'rác rưởi', category: 'SENSATIONAL', severity: 'CONDITIONAL', replacement: 'không phù hợp' },
    { keyword: 'kinh hoàng', category: 'SENSATIONAL', severity: 'CONDITIONAL', replacement: 'nghiêm trọng' },
  ] as const

  let count = 0
  for (const seed of seeds) {
    try {
      const existing = await prisma.contentFilter.findFirst({
        where: {
          keyword: seed.keyword,
          category: seed.category
        }
      })

      if (!existing) {
        await prisma.contentFilter.create({
          data: {
            ...seed,
            createdById,
          },
        })
        count++
      }
    } catch (error) {
      console.error(`Failed to seed filter: ${seed.keyword}`, error)
    }
  }

  console.log(`Seeded ${count} content filters`)
  return count
}

// Clear filter cache (call after updating filters)
export function clearFilterCache() {
  filterCache = null
  cacheTimestamp = 0
}
