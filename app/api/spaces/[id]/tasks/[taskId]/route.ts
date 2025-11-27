import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  column: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  images: z.string().optional().nullable(),
  attachments: z.string().optional().nullable(),
  checklist: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  order: z.number().optional(),
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

    const { id: spaceId, taskId } = await params

    const task = await prisma.spaceTask.findFirst({
      where: {
        id: taskId,
        spaceId,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        comments: {
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
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin công việc' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, taskId } = await params

    // Verify task exists
    const existingTask = await prisma.spaceTask.findFirst({
      where: {
        id: taskId,
        spaceId,
      },
      include: {
        space: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 })
    }

    // Check permission
    const isCreator = existingTask.createdById === session.user.id
    const isAssigned = existingTask.assignedToId === session.user.id
    const isMember = existingTask.space.members.length > 0
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    if (!isCreator && !isAssigned && !isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật công việc này' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.column !== undefined) updateData.column = validatedData.column
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }
    if (validatedData.images !== undefined) updateData.images = validatedData.images
    if (validatedData.attachments !== undefined) updateData.attachments = validatedData.attachments
    if (validatedData.checklist !== undefined) updateData.checklist = validatedData.checklist
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId
    if (validatedData.order !== undefined) updateData.order = validatedData.order

    const task = await prisma.spaceTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật công việc' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, taskId } = await params

    // Verify task exists
    const existingTask = await prisma.spaceTask.findFirst({
      where: {
        id: taskId,
        spaceId,
      },
      include: {
        space: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 })
    }

    // Check permission - only creator or admin can delete
    const isCreator = existingTask.createdById === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const canManage = existingTask.space.members.some((m) => m.canManage)

    if (!isCreator && !isAdmin && !canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa công việc này' },
        { status: 403 }
      )
    }

    await prisma.spaceTask.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ message: 'Task đã được xóa' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa công việc' },
      { status: 500 }
    )
  }
}

