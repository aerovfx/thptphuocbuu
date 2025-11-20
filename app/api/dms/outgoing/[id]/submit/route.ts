import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitApprovalSchema = z.object({
  approvers: z.array(
    z.object({
      userId: z.string(),
      level: z.number().int().min(1),
      deadline: z.string().datetime().optional(),
    })
  ).min(1, 'Cần ít nhất một người phê duyệt'),
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

    const { id } = await params
    const body = await request.json()
    const validatedData = submitApprovalSchema.parse(body)

    // Verify document exists and user has permission
    const document = await prisma.outgoingDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN' && document.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền gửi văn bản này để phê duyệt' },
        { status: 403 }
      )
    }

    if (document.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Văn bản đã được gửi phê duyệt hoặc đã được xử lý' },
        { status: 400 }
      )
    }

    // Check if approvals already exist
    const existingApprovals = await prisma.approval.findMany({
      where: { outgoingDocumentId: id },
    })

    if (existingApprovals.length > 0) {
      return NextResponse.json(
        { error: 'Luồng phê duyệt đã được tạo' },
        { status: 400 }
      )
    }

    // Create approvals
    const approvals = await Promise.all(
      validatedData.approvers.map((approver) =>
        prisma.approval.create({
          data: {
            outgoingDocumentId: id,
            level: approver.level,
            approverId: approver.userId,
            status: 'PENDING',
            deadline: approver.deadline ? new Date(approver.deadline) : null,
          },
        })
      )
    )

    // Update document status
    await prisma.outgoingDocument.update({
      where: { id },
      data: { status: 'PROCESSING' },
    })

    // TODO: Send notifications to approvers

    return NextResponse.json({
      message: 'Đã gửi văn bản để phê duyệt thành công',
      approvals,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error submitting for approval:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gửi văn bản để phê duyệt' },
      { status: 500 }
    )
  }
}
