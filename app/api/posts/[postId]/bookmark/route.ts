import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest } from '@/lib/auth-helpers-api'

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
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: userId,
        },
      },
      include: {
        post: {
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
        },
      },
    })

    if (existingBookmark) {
      // Already bookmarked, return success (idempotent)
      return NextResponse.json({ bookmark: existingBookmark }, { status: 200 })
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        postId,
        userId: userId,
      },
      include: {
        post: {
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
        },
      },
    })

    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (error) {
    console.error('Error bookmarking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: userId,
        },
      },
    })

    if (!existingBookmark) {
      // Not bookmarked, return success (idempotent)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Delete bookmark
    await prisma.bookmark.delete({
      where: {
        postId_userId: {
          postId,
          userId: userId,
        },
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error unbookmarking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

