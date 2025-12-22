import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: brandId } = await params

    // Only members of the brand (or ADMIN) can view analytics
    const isAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN' || session.user.role === 'BGH'

    const membership = await prisma.brandMember.findUnique({
      where: {
        brandId_userId: {
          brandId,
          userId: session.user.id,
        },
      },
      select: { id: true },
    })

    if (!membership && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const members = await prisma.brandMember.findMany({
      where: { brandId },
      select: { userId: true },
    })
    const memberIds = members.map((m) => m.userId)

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalPosts,
      totalLikes,
      totalComments,
      followersTotal,
      posts30d,
      likes30d,
      comments30d,
    ] = await Promise.all([
      prisma.post.count({ where: { authorId: { in: memberIds } } }),
      prisma.like.count({ where: { post: { authorId: { in: memberIds } } } }),
      prisma.comment.count({ where: { post: { authorId: { in: memberIds } } } }),
      prisma.friendship.count({ where: { user2Id: { in: memberIds } } }),
      prisma.post.count({ where: { authorId: { in: memberIds }, createdAt: { gte: since30d } } }),
      prisma.like.count({
        where: { post: { authorId: { in: memberIds } }, createdAt: { gte: since30d } },
      }),
      prisma.comment.count({
        where: { post: { authorId: { in: memberIds } }, createdAt: { gte: since30d } },
      }),
    ])

    // Per-member breakdown (max 6 accounts, so this is cheap)
    const perMember = await Promise.all(
      memberIds.map(async (userId) => {
        const [posts, likes, comments] = await Promise.all([
          prisma.post.count({ where: { authorId: userId } }),
          prisma.like.count({ where: { post: { authorId: userId } } }),
          prisma.comment.count({ where: { post: { authorId: userId } } }),
        ])
        return { userId, posts, likes, comments }
      })
    )

    return NextResponse.json({
      totals: {
        posts: totalPosts,
        likes: totalLikes,
        comments: totalComments,
        followers: followersTotal,
      },
      last30Days: {
        posts: posts30d,
        likes: likes30d,
        comments: comments30d,
      },
      perMember,
      memberCount: memberIds.length,
    })
  } catch (error) {
    console.error('Error fetching brand analytics:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy analytics thương hiệu' },
      { status: 500 }
    )
  }
}


