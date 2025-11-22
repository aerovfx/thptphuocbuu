import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung bình luận là bắt buộc'),
  position: z.any().optional(), // JSON position in document
})

const replyCommentSchema = z.object({
  content: z.string().min(1, 'Nội dung phản hồi là bắt buộc'),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

    // Check permission - at least VIEWER can comment
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
        { error: 'Không có quyền bình luận' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    const comment = await prisma.documentComment.create({
      data: {
        documentId,
        userId: session.user.id,
        content: validatedData.content,
        position: validatedData.position || null,
        replies: [],
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

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo bình luận' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

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
        { error: 'Không có quyền xem bình luận' },
        { status: 403 }
      )
    }

    const comments = await prisma.documentComment.findMany({
      where: {
        documentId,
        resolved: false, // Only show unresolved comments by default
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
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy bình luận' },
      { status: 500 }
    )
  }
}

