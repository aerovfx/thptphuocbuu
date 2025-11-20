/**
 * Machine Learning Service cho News Feed
 * 
 * Implementations:
 * - Collaborative Filtering (User-based và Item-based)
 * - Matrix Factorization (SVD)
 * - Deep Learning embeddings (simplified)
 */

import { prisma } from '@/lib/prisma'

interface UserEmbedding {
  userId: string
  embedding: number[]
}

interface PostEmbedding {
  postId: string
  embedding: number[]
}

interface SimilarityScore {
  id: string
  score: number
}

/**
 * Collaborative Filtering - User-based
 * Tìm users tương tự dựa trên engagement patterns
 */
export async function findSimilarUsers(
  userId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get user's engagement history
  const userEngagements = await prisma.like.findMany({
    where: { userId },
    select: { postId: true },
    take: 100,
  })

  const userPostIds = new Set(userEngagements.map((e) => e.postId))

  if (userPostIds.size === 0) {
    return []
  }

  // Find users who liked similar posts
  const similarUsers = await prisma.like.groupBy({
    by: ['userId'],
    where: {
      postId: { in: Array.from(userPostIds) },
      userId: { not: userId },
    },
    _count: {
      postId: true,
    },
    orderBy: {
      _count: {
        postId: 'desc',
      },
    },
    take: limit * 2, // Get more to calculate similarity
  })

  // Calculate Jaccard similarity
  const similarities: SimilarityScore[] = []

  for (const similarUser of similarUsers) {
    const otherUserEngagements = await prisma.like.findMany({
      where: { userId: similarUser.userId },
      select: { postId: true },
      take: 100,
    })

    const otherUserPostIds = new Set(otherUserEngagements.map((e) => e.postId))

    // Jaccard similarity: intersection / union
    const intersection = new Set(
      [...userPostIds].filter((x) => otherUserPostIds.has(x))
    )
    const union = new Set([...userPostIds, ...otherUserPostIds])

    const similarity = union.size > 0 ? intersection.size / union.size : 0

    if (similarity > 0) {
      similarities.push({
        id: similarUser.userId,
        score: similarity,
      })
    }
  }

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Collaborative Filtering - Item-based
 * Tìm posts tương tự dựa trên co-engagement
 */
export async function findSimilarPosts(
  postId: string,
  limit: number = 10
): Promise<SimilarityScore[]> {
  // Get users who liked this post
  const postLikes = await prisma.like.findMany({
    where: { postId },
    select: { userId: true },
  })

  const userIds = postLikes.map((l) => l.userId)

  if (userIds.length === 0) {
    return []
  }

  // Find posts liked by same users
  const similarPosts = await prisma.like.groupBy({
    by: ['postId'],
    where: {
      userId: { in: userIds },
      postId: { not: postId },
    },
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: 'desc',
      },
    },
    take: limit * 2,
  })

  // Calculate cosine similarity (simplified)
  const similarities: SimilarityScore[] = []

  for (const similarPost of similarPosts) {
    const otherPostLikes = await prisma.like.findMany({
      where: { postId: similarPost.postId },
      select: { userId: true },
    })

    const otherUserIds = new Set(otherPostLikes.map((l) => l.userId))
    const currentUserIds = new Set(userIds)

    // Cosine similarity: intersection / sqrt(|A| * |B|)
    const intersection = new Set(
      [...currentUserIds].filter((x) => otherUserIds.has(x))
    )

    const similarity =
      currentUserIds.size > 0 && otherUserIds.size > 0
        ? intersection.size /
          Math.sqrt(currentUserIds.size * otherUserIds.size)
        : 0

    if (similarity > 0) {
      similarities.push({
        id: similarPost.postId,
        score: similarity,
      })
    }
  }

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Matrix Factorization - Simplified SVD
 * Tạo user và post embeddings từ engagement matrix
 */
export async function generateEmbeddings(
  userIds: string[],
  postIds: string[]
): Promise<{
  userEmbeddings: UserEmbedding[]
  postEmbeddings: PostEmbedding[]
}> {
  // Build engagement matrix
  const engagements = await prisma.like.findMany({
    where: {
      userId: { in: userIds },
      postId: { in: postIds },
    },
    select: {
      userId: true,
      postId: true,
    },
  })

  // Create sparse matrix representation
  const matrix: Map<string, Map<string, number>> = new Map()

  for (const engagement of engagements) {
    if (!matrix.has(engagement.userId)) {
      matrix.set(engagement.userId, new Map())
    }
    matrix.get(engagement.userId)!.set(engagement.postId, 1)
  }

  // Simplified embedding generation (PCA-like)
  // In production, use proper SVD or neural network
  const embeddingSize = 10

  const userEmbeddings: UserEmbedding[] = []
  const postEmbeddings: PostEmbedding[] = []

  // Generate user embeddings
  for (const userId of userIds) {
    const userRow = matrix.get(userId) || new Map()
    const embedding: number[] = []

    for (let i = 0; i < embeddingSize; i++) {
      let sum = 0
      let count = 0

      for (const postId of postIds) {
        const value = userRow.get(postId) || 0
        // Simple hash-based feature
        const hash = (userId + postId + i).split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0)
        }, 0)
        sum += value * (hash % 10) / 10
        count++
      }

      embedding.push(count > 0 ? sum / count : 0)
    }

    userEmbeddings.push({ userId, embedding })
  }

  // Generate post embeddings
  for (const postId of postIds) {
    const embedding: number[] = []

    for (let i = 0; i < embeddingSize; i++) {
      let sum = 0
      let count = 0

      for (const userId of userIds) {
        const userRow = matrix.get(userId) || new Map()
        const value = userRow.get(postId) || 0
        const hash = (userId + postId + i).split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0)
        }, 0)
        sum += value * (hash % 10) / 10
        count++
      }

      embedding.push(count > 0 ? sum / count : 0)
    }

    postEmbeddings.push({ postId, embedding })
  }

  return { userEmbeddings, postEmbeddings }
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator > 0 ? dotProduct / denominator : 0
}

/**
 * Get ML-based recommendations for user
 */
export async function getMLRecommendations(
  userId: string,
  limit: number = 20
): Promise<string[]> {
  // Get user's engagement history
  const userLikes = await prisma.like.findMany({
    where: { userId },
    select: { postId: true },
    take: 50,
  })

  if (userLikes.length === 0) {
    // Cold start - return trending posts
    const trending = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true },
    })
    return trending.map((p) => p.id)
  }

  // Find similar users
  const similarUsers = await findSimilarUsers(userId, 5)

  if (similarUsers.length === 0) {
    return []
  }

  // Get posts liked by similar users but not by current user
  const userPostIds = new Set(userLikes.map((l) => l.postId))

  const recommendations = new Map<string, number>()

  for (const similarUser of similarUsers) {
    const similarUserLikes = await prisma.like.findMany({
      where: { userId: similarUser.id },
      select: { postId: true },
      take: 20,
    })

    for (const like of similarUserLikes) {
      if (!userPostIds.has(like.postId)) {
        const currentScore = recommendations.get(like.postId) || 0
        recommendations.set(
          like.postId,
          currentScore + similarUser.score
        )
      }
    }
  }

  // Sort by score and return top recommendations
  return Array.from(recommendations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([postId]) => postId)
}

/**
 * Hybrid recommendation combining CF and content-based
 */
export async function getHybridRecommendations(
  userId: string,
  limit: number = 20
): Promise<string[]> {
  // Get CF recommendations
  const cfRecommendations = await getMLRecommendations(userId, limit)

  // Get content-based recommendations (from similar posts)
  const userLikes = await prisma.like.findMany({
    where: { userId },
    select: { postId: true },
    take: 10,
  })

  const contentBasedRecommendations = new Map<string, number>()

  for (const like of userLikes) {
    const similarPosts = await findSimilarPosts(like.postId, 5)
    for (const similar of similarPosts) {
      const currentScore = contentBasedRecommendations.get(similar.id) || 0
      contentBasedRecommendations.set(similar.id, currentScore + similar.score)
    }
  }

  // Combine recommendations with weights
  const combined = new Map<string, number>()

  // CF weight: 0.6
  for (let i = 0; i < cfRecommendations.length; i++) {
    const postId = cfRecommendations[i]
    const score = (cfRecommendations.length - i) / cfRecommendations.length * 0.6
    combined.set(postId, (combined.get(postId) || 0) + score)
  }

  // Content-based weight: 0.4
  const contentBasedArray = Array.from(contentBasedRecommendations.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  for (let i = 0; i < contentBasedArray.length; i++) {
    const [postId, similarity] = contentBasedArray[i]
    const score = (contentBasedArray.length - i) / contentBasedArray.length * 0.4 * similarity
    combined.set(postId, (combined.get(postId) || 0) + score)
  }

  // Return top recommendations
  return Array.from(combined.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([postId]) => postId)
}

