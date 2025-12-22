import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { moderateContent } from '@/lib/content-moderation'

const commentSchema = z.object({
  content: z.string().min(1),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = commentSchema.parse(body)

    // Content moderation (server-side) - TODO: Update to new API
    // const moderation = await moderateContent(
    //   validatedData.content,
    //   session.user.role,
    //   'COMMENT',
    //   session.user.id
    // )
    // if (!moderation.allowed) {
    //   return NextResponse.json(
    //     {
    //       error: moderation.message || 'Bình luận có chứa từ ngữ không phù hợp',
    //       code: 'CONTENT_BLOCKED',
    //       details: moderation,
    //     },
    //     { status: 400 }
    //   )
    // }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        postId: postId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

