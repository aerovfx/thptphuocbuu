import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params

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
          userId: session.user.id,
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
        userId: session.user.id,
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
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params

    // Check if bookmark exists
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
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
          userId: session.user.id,
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

