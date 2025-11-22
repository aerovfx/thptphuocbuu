import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const replyCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung phản hồi là bắt buộc'),
})

const resolveCommentSchema = z.object({
  resolved: z.boolean(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, commentId } = await params

    // Check permission
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id && document.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Không có quyền phản hồi bình luận' },
        { status: 403 }
      )
    }

    const comment = await prisma.documentComment.findUnique({
      where: { id: commentId },
    })

    if (!comment || comment.documentId !== documentId) {
      return NextResponse.json({ error: 'Bình luận không tồn tại' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = replyCommentSchema.parse(body)

    // Get existing replies
    const existingReplies = (comment.replies as any) || []

    // Add new reply
    const newReply = {
      id: `reply-${Date.now()}`,
      userId: session.user.id,
      content: validatedData.content,
      createdAt: new Date().toISOString(),
    }

    const updatedReplies = [...existingReplies, newReply]

    const updatedComment = await prisma.documentComment.update({
      where: { id: commentId },
      data: {
        replies: updatedReplies,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error replying to comment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi phản hồi bình luận' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, commentId } = await params

    // Check permission - owner or editor can resolve comments
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: {
            userId: session.user.id,
            role: { in: ['OWNER', 'EDITOR'] },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id && document.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Không có quyền giải quyết bình luận' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = resolveCommentSchema.parse(body)

    const comment = await prisma.documentComment.update({
      where: { id: commentId },
      data: {
        resolved: validatedData.resolved,
        resolvedAt: validatedData.resolved ? new Date() : null,
        resolvedBy: validatedData.resolved ? session.user.id : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ comment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error resolving comment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi giải quyết bình luận' },
      { status: 500 }
    )
  }
}

