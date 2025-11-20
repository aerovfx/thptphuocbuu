/**
 * Feed Service - Wrapper functions để fetch và rank posts
 * Có thể được sử dụng từ cả server components và API routes
 */

import { prisma } from '@/lib/prisma'
import {
  rankCandidates,
  diversifyFeed,
  ensureDiversity,
  type PostWithMetrics,
  type UserContext,
} from '@/lib/feed-ranking'
import { feedCache } from '@/lib/cache'
import { getHybridRecommendations } from '@/lib/ml-service'
import {
  assignToExperiment,
  getUserVariant,
  trackMetric,
  FEED_EXPERIMENTS,
} from '@/lib/ab-testing'

export async function getRankedFeed(
  userId: string | null,
  tab: string = 'top',
  query?: string,
  limit: number = 50,
  useCache: boolean = true
): Promise<PostWithMetrics[]> {
  // Check cache first (only for 'top' tab without query)
  if (useCache && tab === 'top' && !query) {
    const cached = await feedCache.getFeed(userId, tab, query)
    if (cached) {
      return cached
    }
  }
  const now = new Date()

  // Publish scheduled posts
  try {
    await prisma.post.updateMany({
      where: {
        AND: [
          { scheduledAt: { lte: now } },
          { scheduledAt: { not: null } },
        ],
      },
      data: {
        scheduledAt: null,
      },
    })
  } catch (error: any) {
    // Ignore if field doesn't exist
    if (error?.code !== 'P2009' && error?.code !== 'P2011') {
      console.error('Error publishing scheduled posts:', error)
    }
  }

  // Stage 1: Candidate Generation
  let candidates: PostWithMetrics[] = []

  if (tab === 'latest') {
    // Latest tab - chỉ lấy bài mới nhất, không ranking
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
        content: query
          ? {
              contains: query,
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    candidates = posts
      .filter((post: any) => post.content?.trim() || post.imageUrl || post.videoUrl)
      .map((post: any) => ({
        id: post.id,
        content: post.content || '',
        createdAt: post.createdAt,
        authorId: post.authorId,
        type: post.type,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        likes: post._count?.likes || 0,
        comments: post._count?.comments || 0,
        reposts: post._count?.reposts || 0,
        bookmarks: post._count?.bookmarks || 0,
        author: post.author,
        _count: {
          likes: post._count?.likes || 0,
          comments: post._count?.comments || 0,
          reposts: post._count?.reposts || 0,
          bookmarks: post._count?.bookmarks || 0,
        },
      }))
  } else {
    // Top tab - sử dụng ranking algorithm
    const candidateLimit = 1000

    // 1. Từ người dùng theo dõi (40%)
    let followingPosts: any[] = []
    if (userId) {
      const following = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId },
          ],
        },
        select: {
          user1Id: true,
          user2Id: true,
        },
      })

      const followingIds = following.map((f) =>
        f.user1Id === userId ? f.user2Id : f.user1Id
      )

      if (followingIds.length > 0) {
        followingPosts = await prisma.post.findMany({
          where: {
            authorId: { in: followingIds },
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: now } },
            ],
            content: query
              ? {
                  contains: query,
                }
              : undefined,
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
                reposts: true,
                bookmarks: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(candidateLimit * 0.4),
        })
      }
    }

    // 2. Trending posts (30%)
    const trendingPosts = await prisma.post.findMany({
      where: {
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 ngày
        },
        content: query
          ? {
              contains: query,
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(candidateLimit * 0.3),
    })

      // 3. Personalized recommendations (20%) - ML-based
      let recommendedPosts: any[] = []
      if (userId) {
        try {
          // Try ML-based recommendations first
          const mlRecommendations = await getHybridRecommendations(userId, Math.floor(candidateLimit * 0.2))
          
          if (mlRecommendations.length > 0) {
            recommendedPosts = await prisma.post.findMany({
              where: {
                id: { in: mlRecommendations },
                OR: [
                  { scheduledAt: null },
                  { scheduledAt: { lte: now } },
                ],
                content: query
                  ? {
                      contains: query,
                    }
                  : undefined,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                    comments: true,
                    reposts: true,
                    bookmarks: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: Math.floor(candidateLimit * 0.2),
            })
          }
        } catch (error) {
          console.error('Error getting ML recommendations:', error)
          // Fallback to simple author-based recommendations
          const userEngagements = await prisma.like.findMany({
            where: { userId },
            include: {
              post: {
                select: { authorId: true },
              },
            },
            take: 100,
          })

          const engagedAuthorIds = [
            ...new Set(userEngagements.map((e) => e.post.authorId)),
          ]

          if (engagedAuthorIds.length > 0) {
            recommendedPosts = await prisma.post.findMany({
              where: {
                authorId: { in: engagedAuthorIds },
                OR: [
                  { scheduledAt: null },
                  { scheduledAt: { lte: now } },
                ],
                content: query
                  ? {
                      contains: query,
                    }
                  : undefined,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                    comments: true,
                    reposts: true,
                    bookmarks: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: Math.floor(candidateLimit * 0.2),
            })
          }
        }
      }

    // 4. Serendipity (10%)
    const explorePosts = await prisma.post.findMany({
      where: {
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
        content: query
          ? {
              contains: query,
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.floor(candidateLimit * 0.1),
    })

    // Merge và deduplicate
    const allPosts = [...followingPosts, ...trendingPosts, ...recommendedPosts, ...explorePosts]
    const uniquePosts = new Map<string, any>()
    for (const post of allPosts) {
      if (!uniquePosts.has(post.id)) {
        uniquePosts.set(post.id, post)
      }
    }

    candidates = Array.from(uniquePosts.values())
      .filter((post: any) => post.content?.trim() || post.imageUrl || post.videoUrl)
      .map((post: any) => ({
        id: post.id,
        content: post.content || '',
        createdAt: post.createdAt,
        authorId: post.authorId,
        type: post.type,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        likes: post._count?.likes || 0,
        comments: post._count?.comments || 0,
        reposts: post._count?.reposts || 0,
        bookmarks: post._count?.bookmarks || 0,
        author: post.author,
        _count: {
          likes: post._count?.likes || 0,
          comments: post._count?.comments || 0,
          reposts: post._count?.reposts || 0,
          bookmarks: post._count?.bookmarks || 0,
        },
      }))
  }

  // Stage 2: Fine-grained Ranking (chỉ cho tab 'top')
  let rankedPosts = candidates
  if (tab === 'top' && userId) {
    // Build user context
    const following = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    })

    const followingIds = following.map((f) =>
      f.user1Id === userId ? f.user2Id : f.user1Id
    )

    // Get past engagements
    const [pastLikes, pastComments, pastReposts, pastBookmarks] = await Promise.all([
      prisma.like.findMany({
        where: { userId },
        select: { postId: true, createdAt: true },
        take: 100,
      }),
      prisma.comment.findMany({
        where: { authorId: userId },
        select: { postId: true, createdAt: true },
        take: 100,
      }),
      prisma.repost.findMany({
        where: { userId },
        select: { postId: true, createdAt: true },
        take: 100,
      }),
      prisma.bookmark.findMany({
        where: { userId },
        select: { postId: true, createdAt: true },
        take: 100,
      }),
    ])

    const pastEngagements = [
      ...pastLikes.map((e) => ({
        postId: e.postId,
        type: 'like' as const,
        timestamp: e.createdAt,
      })),
      ...pastComments.map((e) => ({
        postId: e.postId,
        type: 'comment' as const,
        timestamp: e.createdAt,
      })),
      ...pastReposts.map((e) => ({
        postId: e.postId,
        type: 'repost' as const,
        timestamp: e.createdAt,
      })),
      ...pastBookmarks.map((e) => ({
        postId: e.postId,
        type: 'bookmark' as const,
        timestamp: e.createdAt,
      })),
    ]

    const userContext: UserContext = {
      id: userId,
      followingIds,
      interests: [],
      pastEngagements,
    }

      // A/B Testing: Get user's variant assignments
      const freshnessVariant = assignToExperiment(userId, FEED_EXPERIMENTS.FRESHNESS_WEIGHT)
      const diversityVariant = assignToExperiment(userId, FEED_EXPERIMENTS.DIVERSITY_LAMBDA)
      
      // Get experiment configs
      let diversityLambda = 0.7 // Default
      if (diversityVariant) {
        // In production, get config from experiment
        diversityLambda = diversityVariant === 'treatment' ? 0.8 : 0.7
      }

      // Rank candidates
      rankedPosts = rankCandidates(candidates, userContext, query)

      // Diversification with A/B tested lambda
      rankedPosts = diversifyFeed(rankedPosts, diversityLambda, limit)
      rankedPosts = ensureDiversity(rankedPosts)
      
      // Track engagement metrics for A/B testing
      // This will be called when user interacts with posts
  } else if (tab === 'top' && !userId) {
    // Guest user - simple ranking
    rankedPosts = candidates.sort((a, b) => {
      const scoreA = a.likes * 1.0 + a.comments * 1.2 + a.reposts * 1.5
      const scoreB = b.likes * 1.0 + b.comments * 1.2 + b.reposts * 1.5
      return scoreB - scoreA
    })
  }

  // Limit results
  const finalPosts = rankedPosts.slice(0, limit)

  // Cache results (only for 'top' tab without query)
  if (useCache && tab === 'top' && !query) {
    await feedCache.setFeed(userId, tab, query, finalPosts)
  }

  return finalPosts
}

