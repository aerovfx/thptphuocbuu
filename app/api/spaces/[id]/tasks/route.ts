import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  column: z.string().default('todo'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional().default('NORMAL'),
  dueDate: z.string().datetime().optional().nullable(),
  images: z.string().optional().nullable(), // JSON array string
  attachments: z.string().optional().nullable(), // JSON array string
  checklist: z.string().optional().nullable(), // JSON array string
  tags: z.string().optional().nullable(), // JSON array string
  assignedToId: z.string().optional().nullable(),
  order: z.number().optional().default(0),
})

const updateTaskSchema = createTaskSchema.partial().extend({
  title: z.string().min(1).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify space exists
    const space = await prisma.space.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Get tasks grouped by column
    const tasks = await prisma.spaceTask.findMany({
      where: { spaceId: id },
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
      orderBy: [{ column: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    })

    // Group by column
    const groupedTasks: { [key: string]: typeof tasks } = {}
    tasks.forEach((task) => {
      if (!groupedTasks[task.column]) {
        groupedTasks[task.column] = []
      }
      groupedTasks[task.column].push(task)
    })

    return NextResponse.json({ tasks, groupedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách công việc' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify space exists and user has permission
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Check permission - members can create tasks
    const isMember = space.members.length > 0
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo công việc trong space này' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Get max order in column
    const maxOrderTask = await prisma.spaceTask.findFirst({
      where: {
        spaceId: id,
        column: validatedData.column,
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const order = (maxOrderTask?.order ?? -1) + 1

    const task = await prisma.spaceTask.create({
      data: {
        spaceId: id,
        title: validatedData.title,
        description: validatedData.description || null,
        column: validatedData.column,
        order,
        priority: validatedData.priority || 'NORMAL',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        images: validatedData.images || null,
        attachments: validatedData.attachments || null,
        checklist: validatedData.checklist || null,
        tags: validatedData.tags || null,
        assignedToId: validatedData.assignedToId || null,
        createdById: session.user.id,
        commentsCount: 0,
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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo công việc' },
      { status: 500 }
    )
  }
}

