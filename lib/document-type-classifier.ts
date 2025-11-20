/**
 * Document Type Classifier
 * 
 * Sử dụng taxonomy từ document-types.json để phân loại văn bản
 */

// @ts-ignore - JSON import
import documentTypesData from './document-types.json'

export interface DocumentTypeInfo {
  code: string
  name: string
  group: string
  description?: string
  synonyms: string[]
  keywords: string[]
  order: number
}

export interface ClassificationResult {
  code: string
  name: string
  group: string
  confidence: number
  reasoning?: string
}

const documentTypes: DocumentTypeInfo[] = documentTypesData.documentTypes

/**
 * Classify document using keyword matching
 * Fallback method when AI is not available
 */
export function classifyDocumentByKeywords(
  title: string,
  content: string,
  context?: 'incoming' | 'outgoing' | 'internal'
): ClassificationResult {
  const text = `${title} ${content}`.toLowerCase()
  let bestMatch: DocumentTypeInfo | null = null
  let bestScore = 0
  let matchedKeywords: string[] = []

  // Score each document type
  for (const docType of documentTypes) {
    let score = 0
    const foundKeywords: string[] = []

    // Check synonyms (exact match gets higher score)
    for (const synonym of docType.synonyms) {
      const lowerSynonym = synonym.toLowerCase()
      if (text.includes(lowerSynonym)) {
        // Exact match in title gets highest score
        if (title.toLowerCase().includes(lowerSynonym)) {
          score += 10
        } else {
          score += 5
        }
        foundKeywords.push(synonym)
      }
    }

    // Check keywords
    for (const keyword of docType.keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (text.includes(lowerKeyword)) {
        score += 2
        if (!foundKeywords.includes(keyword)) {
          foundKeywords.push(keyword)
        }
      }
    }

    // Context-based scoring
    if (context === 'inbound' && docType.group === 'inbound') {
      score += 3
    } else if (context === 'outbound' && docType.group === 'outbound') {
      score += 3
    } else if (context === 'internal' && docType.group === 'internal') {
      score += 3
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = docType
      matchedKeywords = foundKeywords
    }
  }

  // Calculate confidence (0.0 - 1.0)
  let confidence = Math.min(bestScore / 20, 1.0)
  if (confidence < 0.3) {
    confidence = 0.3 // Minimum confidence
  }

  // Default to CV if no good match
  if (!bestMatch || bestScore < 3) {
    bestMatch = documentTypes.find((dt) => dt.code === 'CV') || documentTypes[0]
    confidence = 0.5
  }

  return {
    code: bestMatch.code,
    name: bestMatch.name,
    group: bestMatch.group,
    confidence,
    reasoning: matchedKeywords.length > 0
      ? `Phát hiện từ khóa: ${matchedKeywords.join(', ')}`
      : 'Không tìm thấy từ khóa đặc trưng, sử dụng loại mặc định',
  }
}

/**
 * Get document type by code
 */
export function getDocumentTypeByCode(code: string): DocumentTypeInfo | undefined {
  return documentTypes.find((dt) => dt.code === code)
}

/**
 * Get all document types by group
 */
export function getDocumentTypesByGroup(group: string): DocumentTypeInfo[] {
  return documentTypes.filter((dt) => dt.group === group).sort((a, b) => a.order - b.order)
}

/**
 * Get all document types
 */
export function getAllDocumentTypes(): DocumentTypeInfo[] {
  return documentTypes.sort((a, b) => a.order - b.order)
}

/**
 * Search document types by keyword
 */
export function searchDocumentTypes(keyword: string): DocumentTypeInfo[] {
  const lowerKeyword = keyword.toLowerCase()
  return documentTypes.filter(
    (dt) =>
      dt.name.toLowerCase().includes(lowerKeyword) ||
      dt.code.toLowerCase().includes(lowerKeyword) ||
      dt.synonyms.some((s) => s.toLowerCase().includes(lowerKeyword)) ||
      dt.keywords.some((k) => k.toLowerCase().includes(lowerKeyword))
  )
}

/**
 * Validate document type code
 */
export function isValidDocumentTypeCode(code: string): boolean {
  return documentTypes.some((dt) => dt.code === code)
}

