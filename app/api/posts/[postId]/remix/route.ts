import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest } from '@/lib/auth-helpers-api'

// POST /api/posts/[postId]/remix - Remix (repost) a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // Authenticate using unified helper (supports both JWT and session)
    const auth = await authenticateApiRequest(request)
    if ('error' in auth) {
      return auth.error
    }
    const { userId } = auth

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
          userId: userId,
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
        userId: userId,
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
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // Authenticate using unified helper (supports both JWT and session)
    const auth = await authenticateApiRequest(request)
    if ('error' in auth) {
      // For GET requests, return false instead of error (optional auth)
      return NextResponse.json({ remixed: false })
    }
    const { userId } = auth

    const repost = await prisma.repost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    }).catch(() => null)

    return NextResponse.json({ remixed: !!repost })
  } catch (error) {
    console.error('Error checking remix status:', error)
    return NextResponse.json({ remixed: false })
  }
}

