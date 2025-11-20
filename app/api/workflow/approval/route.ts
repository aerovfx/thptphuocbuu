import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createApprovalSchema = z.object({
  documentId: z.string(),
  documentType: z.enum(['INCOMING', 'OUTGOING', 'WORK_ITEM']),
  approvers: z.array(
    z.object({
      userId: z.string(),
      level: z.number().int().min(1),
      deadline: z.string().datetime().optional(),
    })
  ).min(1, 'Cần ít nhất một người phê duyệt'),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createApprovalSchema.parse(body)

    // Verify document exists and user has permission
    let document: any = null
    if (validatedData.documentType === 'OUTGOING') {
      document = await prisma.outgoingDocument.findUnique({
        where: { id: validatedData.documentId },
      })
      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
      if (session.user.role !== 'ADMIN' && document.createdById !== session.user.id) {
        return NextResponse.json(
          { error: 'Bạn không có quyền tạo luồng phê duyệt cho văn bản này' },
          { status: 403 }
        )
      }
    } else if (validatedData.documentType === 'INCOMING') {
      document = await prisma.incomingDocument.findUnique({
        where: { id: validatedData.documentId },
      })
      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
    }

    // Check if approvals already exist
    const existingApprovals = await prisma.approval.findMany({
      where: {
        ...(validatedData.documentType === 'OUTGOING'
          ? { outgoingDocumentId: validatedData.documentId }
          : validatedData.documentType === 'INCOMING'
          ? { incomingDocumentId: validatedData.documentId }
          : { workItemId: validatedData.documentId }),
      },
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
            ...(validatedData.documentType === 'OUTGOING'
              ? { outgoingDocumentId: validatedData.documentId }
              : validatedData.documentType === 'INCOMING'
              ? { incomingDocumentId: validatedData.documentId }
              : { workItemId: validatedData.documentId }),
            level: approver.level,
            approverId: approver.userId,
            status: 'PENDING',
            deadline: approver.deadline ? new Date(approver.deadline) : null,
          },
        })
      )
    )

    // Update document status
    if (validatedData.documentType === 'OUTGOING') {
      await prisma.outgoingDocument.update({
        where: { id: validatedData.documentId },
        data: { status: 'PROCESSING' },
      })
    } else if (validatedData.documentType === 'INCOMING') {
      await prisma.incomingDocument.update({
        where: { id: validatedData.documentId },
        data: { status: 'PROCESSING' },
      })
    }

    // TODO: Send notifications to approvers

    return NextResponse.json({
      message: 'Đã tạo luồng phê duyệt thành công',
      approvals,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating approval workflow:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo luồng phê duyệt' },
      { status: 500 }
    )
  }
}

