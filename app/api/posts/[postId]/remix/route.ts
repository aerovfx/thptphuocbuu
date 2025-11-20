import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/posts/[postId]/remix - Remix (repost) a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Bài viết không tồn tại' }, { status: 404 })
    }

    // Check if user already remixed this post
    const existingRepost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    if (existingRepost) {
      // Unremix (remove repost)
      await prisma.repost.delete({
        where: {
          id: existingRepost.id,
        },
      })

      return NextResponse.json({
        remixed: false,
        message: 'Đã hủy remix bài viết',
      })
    }

    // Create repost
    const repost = await prisma.repost.create({
      data: {
        postId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      remixed: true,
      repost,
      message: 'Đã remix bài viết',
    })
  } catch (error) {
    console.error('Error remixing post:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi remix bài viết' }, { status: 500 })
  }
}

// GET /api/posts/[postId]/remix - Check if current user has remixed this post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ remixed: false })
    }

    const { postId } = await params

    const repost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ remixed: !!repost })
  } catch (error) {
    console.error('Error checking remix status:', error)
    return NextResponse.json({ remixed: false })
  }
}

