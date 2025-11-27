import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params

    const comments = await prisma.spaceTaskComment.findMany({
      where: { taskId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy bình luận' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params

    // Verify task exists
    const task = await prisma.spaceTask.findUnique({
      where: { id: taskId },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Create comment
    const comment = await prisma.spaceTaskComment.create({
      data: {
        taskId,
        content: validatedData.content,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Update comments count
    await prisma.spaceTask.update({
      where: { id: taskId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
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

