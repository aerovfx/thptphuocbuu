import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { authenticateApiRequest } from '@/lib/auth-helpers-api'

// GET - Check if user has liked the post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    if (!session || !session.user.id) {
      return NextResponse.json({ liked: false }, { status: 200 })
    }

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id,
        },
      },
    }).catch(() => null)

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json({ liked: false }, { status: 200 })
  }
}

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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    const like = await prisma.like.create({
      data: {
        postId: postId,
        userId: userId,
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

    // Use delete with unique constraint for safety
    try {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId: postId,
            userId: userId,
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

