/**
 * Feed Ranking Algorithm - Tối ưu News Feed theo kiểu X.com
 * 
 * Thuật toán bao gồm:
 * - Relevance Score
 * - Freshness Score (decay theo thời gian)
 * - Quality Score
 * - Virality Score
 * - Personalization Score
 * - Two-stage ranking (candidate generation + fine-grained ranking)
 * - Diversification (MMR algorithm)
 */

export interface PostWithMetrics {
  id: string
  content: string
  createdAt: Date
  authorId: string
  type: string
  imageUrl?: string | null
  videoUrl?: string | null
  linkUrl?: string | null
  likes: number
  comments: number
  reposts: number
  bookmarks: number
  author?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
}

export interface UserContext {
  id: string
  followingIds?: string[]
  interests?: string[]
  pastEngagements?: {
    postId: string
    type: 'like' | 'comment' | 'repost' | 'bookmark'
    timestamp: Date
  }[]
}

interface ScoredPost extends PostWithMetrics {
  score: number
  relevanceScore: number
  freshnessScore: number
  qualityScore: number
  viralityScore: number
  personalizationScore: number
}

/**
 * Tính Relevance Score (0-1)
 */
export function calculateRelevanceScore(
  post: PostWithMetrics,
  userContext: UserContext,
  query?: string
): number {
  let score = 0.5 // Base score

  // Topic match (nếu có query)
  if (query) {
    const lowerQuery = query.toLowerCase()
    const lowerContent = post.content.toLowerCase()
    if (lowerContent.includes(lowerQuery)) {
      score += 0.3
    }
  }

  // Entity match - kiểm tra hashtags, mentions
  const hashtagPattern = /#\w+/g
  const hashtags = post.content.match(hashtagPattern) || []
  if (hashtags.length > 0) {
    score += Math.min(hashtags.length * 0.05, 0.2)
  }

  // Semantic similarity - đơn giản hóa bằng keyword matching
  if (userContext.interests && userContext.interests.length > 0) {
    const contentLower = post.content.toLowerCase()
    const matchedInterests = userContext.interests.filter((interest) =>
      contentLower.includes(interest.toLowerCase())
    )
    score += Math.min(matchedInterests.length * 0.1, 0.3)
  }

  // Social graph affinity - bài từ người đang follow
  if (userContext.followingIds?.includes(post.authorId)) {
    score += 0.4
  }

  return Math.min(score, 1.0)
}

/**
 * Tính Freshness Score (decay theo thời gian)
 */
export function calculateFreshnessScore(post: PostWithMetrics, lambda: number = 0.1): number {
  const now = new Date()
  const postTime = new Date(post.createdAt)
  const hoursSincePost = (now.getTime() - postTime.getTime()) / (1000 * 60 * 60)

  // Exponential decay
  const freshness = Math.exp(-lambda * hoursSincePost)

  // Boost cho bài viết rất mới (< 1 giờ)
  if (hoursSincePost < 1) {
    return Math.min(freshness * 1.2, 1.0)
  }

  return freshness
}

/**
 * Tính Quality Score
 */
export function calculateQualityScore(post: PostWithMetrics): number {
  let score = 0.5 // Base score

  // Content completeness
  const contentLength = post.content.length
  if (contentLength > 50 && contentLength < 500) {
    score += 0.2 // Optimal length
  } else if (contentLength > 500) {
    score += 0.15 // Long but acceptable
  } else if (contentLength < 10) {
    score -= 0.2 // Too short
  }

  // Media quality
  if (post.imageUrl || post.videoUrl) {
    score += 0.2
  }

  // Engagement rate (normalized)
  const totalEngagements = post.likes + post.comments + post.reposts + post.bookmarks
  const engagementRate = Math.min(totalEngagements / 100, 1.0) // Cap at 100 engagements
  score += engagementRate * 0.15

  // Spam probability (đơn giản hóa)
  const spamIndicators = [
    /(click here|buy now|limited time)/i,
    /(http|www\.)/g,
  ]
  let spamScore = 0
  spamIndicators.forEach((pattern) => {
    if (pattern.test(post.content)) {
      spamScore += 0.1
    }
  })
  score -= Math.min(spamScore, 0.3)

  return Math.max(Math.min(score, 1.0), 0.0)
}

/**
 * Tính Virality Score
 */
export function calculateViralityScore(post: PostWithMetrics): number {
  const now = new Date()
  const postTime = new Date(post.createdAt)
  const hoursSincePost = Math.max((now.getTime() - postTime.getTime()) / (1000 * 60 * 60), 0.1)

  // Log-based scoring để tránh bias với số lượng lớn
  const likesScore = Math.log(1 + post.likes) * 1.0
  const repostsScore = Math.log(1 + post.reposts) * 1.5
  const commentsScore = Math.log(1 + post.comments) * 1.2

  // Velocity - tương tác/thời gian
  const totalEngagements = post.likes + post.comments + post.reposts + post.bookmarks
  const velocity = totalEngagements / hoursSincePost
  const velocityScore = Math.log(1 + velocity) * 2.0

  // Normalize to 0-1 range
  const maxPossibleScore = Math.log(1 + 1000) * 1.0 + Math.log(1 + 500) * 1.5 + Math.log(1 + 200) * 1.2 + Math.log(1 + 100) * 2.0
  const totalScore = likesScore + repostsScore + commentsScore + velocityScore

  return Math.min(totalScore / maxPossibleScore, 1.0)
}

/**
 * Tính Personalization Score
 */
export function calculatePersonalizationScore(
  post: PostWithMetrics,
  userContext: UserContext
): number {
  let score = 0.3 // Base score

  // User interest match
  if (userContext.interests && userContext.interests.length > 0) {
    const contentLower = post.content.toLowerCase()
    const matchedInterests = userContext.interests.filter((interest) =>
      contentLower.includes(interest.toLowerCase())
    )
    score += (matchedInterests.length / userContext.interests.length) * 0.4
  }

  // Social graph affinity
  if (userContext.followingIds?.includes(post.authorId)) {
    score += 0.3
  }

  // Past engagement pattern
  if (userContext.pastEngagements && userContext.pastEngagements.length > 0) {
    const authorEngagements = userContext.pastEngagements.filter(
      (e) => e.postId === post.id || e.type === 'like'
    ).length
    if (authorEngagements > 0) {
      score += Math.min(authorEngagements * 0.1, 0.2)
    }
  }

  return Math.min(score, 1.0)
}

/**
 * Tính Composite Score tổng hợp
 */
export function calculateCompositeScore(
  post: PostWithMetrics,
  userContext: UserContext,
  query?: string
): ScoredPost {
  const relevance = calculateRelevanceScore(post, userContext, query)
  const freshness = calculateFreshnessScore(post, 0.1)
  const quality = calculateQualityScore(post)
  const virality = calculateViralityScore(post)
  const personalization = calculatePersonalizationScore(post, userContext)

  // Weighted combination
  const compositeScore =
    relevance * 0.25 +
    freshness * 0.2 +
    quality * 0.2 +
    virality * 0.2 +
    personalization * 0.15

  return {
    ...post,
    score: compositeScore,
    relevanceScore: relevance,
    freshnessScore: freshness,
    qualityScore: quality,
    viralityScore: virality,
    personalizationScore: personalization,
  }
}

/**
 * Áp dụng penalties cho các trường hợp đặc biệt
 */
export function applyPenalties(post: ScoredPost, userContext: UserContext): number {
  let penalty = 1.0

  // Penalty cho tác giả đã tương tác quá nhiều (author saturation)
  if (userContext.pastEngagements) {
    const authorEngagements = userContext.pastEngagements.filter(
      (e) => e.postId === post.id
    ).length
    if (authorEngagements > 5) {
      penalty *= 0.5
    }
  }

  // Penalty cho clickbait (đơn giản hóa)
  const clickbaitPatterns = [
    /(bạn sẽ không tin|sốc|phải xem)/i,
    /!{3,}/, // Nhiều dấu chấm than
  ]
  let clickbaitScore = 0
  clickbaitPatterns.forEach((pattern) => {
    if (pattern.test(post.content)) {
      clickbaitScore += 0.3
    }
  })
  if (clickbaitScore > 0.7) {
    penalty *= 0.3
  }

  // Penalty cho nội dung low-quality
  if (post.qualityScore < 0.4) {
    penalty *= 0.2
  }

  return penalty
}

/**
 * Candidate Generation - Stage 1
 */
export async function generateCandidates(
  userId: string | null,
  followingIds: string[],
  limit: number = 1000
): Promise<PostWithMetrics[]> {
  // Trong implementation thực tế, đây sẽ là các query riêng biệt
  // Để đơn giản, chúng ta sẽ trả về empty array và để caller fetch
  // Các candidates sẽ được fetch từ database trong API route
  return []
}

/**
 * Fine-grained Ranking - Stage 2
 */
export function rankCandidates(
  candidates: PostWithMetrics[],
  userContext: UserContext,
  query?: string
): ScoredPost[] {
  const scoredPosts = candidates.map((post) => {
    const scored = calculateCompositeScore(post, userContext, query)
    const penalty = applyPenalties(scored, userContext)
    return {
      ...scored,
      score: scored.score * penalty,
    }
  })

  // Sort by score descending
  return scoredPosts.sort((a, b) => b.score - a.score)
}

/**
 * MMR (Maximal Marginal Relevance) - Diversification
 */
export function diversifyFeed(
  rankedPosts: ScoredPost[],
  lambda: number = 0.7,
  feedSize: number = 50
): ScoredPost[] {
  if (rankedPosts.length === 0) return []
  if (rankedPosts.length <= feedSize) return rankedPosts

  const selected: ScoredPost[] = []
  const remaining = [...rankedPosts]

  // Chọn bài đầu tiên (điểm cao nhất)
  selected.push(remaining.shift()!)

  while (selected.length < feedSize && remaining.length > 0) {
    let maxMmr = -Infinity
    let bestPost: ScoredPost | null = null
    let bestIndex = -1

    for (let i = 0; i < remaining.length; i++) {
      const post = remaining[i]
      const relevance = post.score

      // Tính similarity với các bài đã chọn (đơn giản hóa bằng author similarity)
      let maxSimilarity = 0
      for (const selectedPost of selected) {
        let similarity = 0
        // Same author = high similarity
        if (post.authorId === selectedPost.authorId) {
          similarity = 0.8
        }
        // Content similarity (đơn giản hóa)
        const postWords = new Set(post.content.toLowerCase().split(/\s+/))
        const selectedWords = new Set(selectedPost.content.toLowerCase().split(/\s+/))
        const intersection = new Set([...postWords].filter((x) => selectedWords.has(x)))
        const union = new Set([...postWords, ...selectedWords])
        const jaccardSimilarity = intersection.size / union.size
        similarity = Math.max(similarity, jaccardSimilarity * 0.5)

        maxSimilarity = Math.max(maxSimilarity, similarity)
      }

      // MMR = λ × Relevance - (1-λ) × max Similarity
      const mmr = lambda * relevance - (1 - lambda) * maxSimilarity

      if (mmr > maxMmr) {
        maxMmr = mmr
        bestPost = post
        bestIndex = i
      }
    }

    if (bestPost && bestIndex >= 0) {
      selected.push(bestPost)
      remaining.splice(bestIndex, 1)
    } else {
      break
    }
  }

  return selected
}

/**
 * Đảm bảo đa dạng hóa theo các tiêu chí
 */
export function ensureDiversity(feed: ScoredPost[]): ScoredPost[] {
  // Giới hạn bài viết từ cùng 1 tác giả
  const authorCounts = new Map<string, number>()
  const maxPerAuthor = 3

  const diversifiedFeed: ScoredPost[] = []
  for (const post of feed) {
    const count = authorCounts.get(post.authorId) || 0
    if (count < maxPerAuthor) {
      diversifiedFeed.push(post)
      authorCounts.set(post.authorId, count + 1)
    }
  }

  // Đảm bảo có đủ posts (nếu bị giảm do limit author)
  if (diversifiedFeed.length < feed.length * 0.8) {
    // Thêm lại các posts từ authors đã đạt limit nhưng có điểm cao
    const remaining = feed.filter((p) => !diversifiedFeed.includes(p))
    diversifiedFeed.push(...remaining.slice(0, feed.length - diversifiedFeed.length))
  }

  return diversifiedFeed
}

