import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  sender: z.string().optional(),
  type: z.enum(['DIRECTIVE', 'RECORD', 'REPORT', 'REQUEST', 'OTHER']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'ARCHIVED']).optional(),
  deadline: z.string().datetime().optional().nullable(),
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

    const document = await prisma.incomingDocument.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        assignments: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { level: 'asc' },
        },
        aiResults: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      const hasAccess = document.assignments.some(
        (assignment) => assignment.assignedToId === session.user.id
      )
      if (!hasAccess) {
        return NextResponse.json({ error: 'Bạn không có quyền xem văn bản này' }, { status: 403 })
      }
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching incoming document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin văn bản' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if document exists
    const existingDoc = await prisma.incomingDocument.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check permission
    if (session.user.role !== 'ADMIN' && existingDoc.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật văn bản này' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.sender !== undefined) updateData.sender = validatedData.sender
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.priority) updateData.priority = validatedData.priority
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null
    }

    const document = await prisma.incomingDocument.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(document)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating incoming document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật văn bản' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể xóa văn bản' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.incomingDocument.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Văn bản đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting incoming document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa văn bản' },
      { status: 500 }
    )
  }
}

