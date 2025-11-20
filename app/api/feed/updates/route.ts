import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/feed/updates
 * 
 * Polling endpoint để get feed updates
 * Alternative to SSE/WebSocket khi không có custom server
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const lastUpdate = searchParams.get('lastUpdate')

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const since = lastUpdate ? new Date(parseInt(lastUpdate)) : new Date(Date.now() - 60000) // Last minute

    // Get new posts from users being followed
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

    const newPosts = await prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        createdAt: { gte: since },
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
      take: 20,
    })

    // Get new engagements on user's posts
    const userPosts = await prisma.post.findMany({
      where: { authorId: userId },
      select: { id: true },
    })

    const userPostIds = userPosts.map((p) => p.id)

    const newLikes = await prisma.like.findMany({
      where: {
        postId: { in: userPostIds },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        createdAt: true,
      },
      take: 50,
    })

    const newComments = await prisma.comment.findMany({
      where: {
        postId: { in: userPostIds },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        postId: true,
        authorId: true,
        createdAt: true,
      },
      take: 50,
    })

    // Format updates
    const updates = [
      ...newPosts.map((post) => ({
        type: 'new_post' as const,
        timestamp: post.createdAt.toISOString(),
        data: {
          post: {
            id: post.id,
            content: post.content,
            author: post.author,
            createdAt: post.createdAt,
            _count: post._count,
          },
        },
      })),
      ...newLikes.map((like) => ({
        type: 'new_like' as const,
        timestamp: like.createdAt.toISOString(),
        data: {
          postId: like.postId,
          userId: like.userId,
        },
      })),
      ...newComments.map((comment) => ({
        type: 'new_comment' as const,
        timestamp: comment.createdAt.toISOString(),
        data: {
          postId: comment.postId,
          authorId: comment.authorId,
        },
      })),
    ]

    return NextResponse.json(updates)
  } catch (error: any) {
    console.error('Error fetching feed updates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

