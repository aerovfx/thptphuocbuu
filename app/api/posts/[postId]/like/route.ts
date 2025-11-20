import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Check if user has liked the post
export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ liked: false }, { status: 200 })
    }

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.postId,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json({ liked: false }, { status: 200 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.postId,
          userId: session.user.id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    const like = await prisma.like.create({
      data: {
        postId: params.postId,
        userId: session.user.id,
      },
    })

    return NextResponse.json(like)
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation - already liked
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }
    console.error('Error liking post:', error)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use delete with unique constraint for safety
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId: params.postId,
            userId: session.user.id,
          },
        },
      })
    } catch (error: any) {
      // If like doesn't exist, that's fine - already unliked
      if (error.code === 'P2025') {
        return NextResponse.json({ success: true }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unliking post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

