import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  recipient: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'ARCHIVED']).optional(),
  sendDate: z.string().datetime().optional().nullable(),
  template: z.string().optional(),
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

    const document = await prisma.outgoingDocument.findUnique({
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
        signatures: {
          include: {
            signedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      const hasAccess = document.approvals.some(
        (approval) => approval.approverId === session.user.id
      )
      if (!hasAccess) {
        return NextResponse.json({ error: 'Bạn không có quyền xem văn bản này' }, { status: 403 })
      }
    } else if (session.user.role === 'TEACHER' && document.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xem văn bản này' }, { status: 403 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching outgoing document:', error)
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
    const existingDoc = await prisma.outgoingDocument.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check permission - only creator or ADMIN can edit
    if (session.user.role !== 'ADMIN' && existingDoc.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật văn bản này' },
        { status: 403 }
      )
    }

    // Cannot edit if already approved or sent
    if (existingDoc.status === 'APPROVED' || existingDoc.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Không thể chỉnh sửa văn bản đã được phê duyệt hoặc đã gửi' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.content) updateData.content = validatedData.content
    if (validatedData.recipient !== undefined) updateData.recipient = validatedData.recipient
    if (validatedData.priority) updateData.priority = validatedData.priority
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.sendDate !== undefined) {
      updateData.sendDate = validatedData.sendDate ? new Date(validatedData.sendDate) : null
    }
    if (validatedData.template) updateData.template = validatedData.template

    const document = await prisma.outgoingDocument.update({
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
    console.error('Error updating outgoing document:', error)
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

    await prisma.outgoingDocument.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Văn bản đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting outgoing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa văn bản' },
      { status: 500 }
    )
  }
}

