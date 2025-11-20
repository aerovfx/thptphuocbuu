import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveSchema = z.object({
  action: z.enum(['approve', 'reject', 'return']),
  comment: z.string().optional(),
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

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        incomingDocument: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        outgoingDocument: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        workItem: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Phê duyệt không tồn tại' }, { status: 404 })
    }

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin phê duyệt' },
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
    const body = await request.json()
    const validatedData = approveSchema.parse(body)

    // Get approval
    const approval = await prisma.approval.findUnique({
      where: { id },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Phê duyệt không tồn tại' }, { status: 404 })
    }

    // Check if user is the approver
    if (approval.approverId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền phê duyệt này' },
        { status: 403 }
      )
    }

    // Check if already processed
    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Phê duyệt đã được xử lý' },
        { status: 400 }
      )
    }

    // Update approval
    const newStatus =
      validatedData.action === 'approve'
        ? 'APPROVED'
        : validatedData.action === 'reject'
        ? 'REJECTED'
        : 'RETURNED'

    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: newStatus,
        comment: validatedData.comment || null,
        approvedAt: new Date(),
      },
    })

    // Update document status based on approval result
    if (validatedData.action === 'approve') {
      // Check if all approvals are approved
      const allApprovals = await prisma.approval.findMany({
        where: {
          ...(approval.outgoingDocumentId
            ? { outgoingDocumentId: approval.outgoingDocumentId }
            : approval.incomingDocumentId
            ? { incomingDocumentId: approval.incomingDocumentId }
            : { workItemId: approval.workItemId }),
        },
      })

      const allApproved = allApprovals.every((a) => a.status === 'APPROVED')
      const anyRejected = allApprovals.some((a) => a.status === 'REJECTED')

      if (allApproved) {
        // All approvals done, update document status
        if (approval.outgoingDocumentId) {
          await prisma.outgoingDocument.update({
            where: { id: approval.outgoingDocumentId },
            data: { status: 'APPROVED' },
          })
        } else if (approval.incomingDocumentId) {
          await prisma.incomingDocument.update({
            where: { id: approval.incomingDocumentId },
            data: { status: 'APPROVED' },
          })
        }
      } else if (anyRejected) {
        // Some approval rejected
        if (approval.outgoingDocumentId) {
          await prisma.outgoingDocument.update({
            where: { id: approval.outgoingDocumentId },
            data: { status: 'REJECTED' },
          })
        } else if (approval.incomingDocumentId) {
          await prisma.incomingDocument.update({
            where: { id: approval.incomingDocumentId },
            data: { status: 'REJECTED' },
          })
        }
      }
    } else if (validatedData.action === 'reject') {
      // Reject immediately
      if (approval.outgoingDocumentId) {
        await prisma.outgoingDocument.update({
          where: { id: approval.outgoingDocumentId },
          data: { status: 'REJECTED' },
        })
      } else if (approval.incomingDocumentId) {
        await prisma.incomingDocument.update({
          where: { id: approval.incomingDocumentId },
          data: { status: 'REJECTED' },
        })
      }
    } else if (validatedData.action === 'return') {
      // Return to previous level or creator
      if (approval.outgoingDocumentId) {
        await prisma.outgoingDocument.update({
          where: { id: approval.outgoingDocumentId },
          data: { status: 'PENDING' },
        })
      } else if (approval.incomingDocumentId) {
        await prisma.incomingDocument.update({
          where: { id: approval.incomingDocumentId },
          data: { status: 'PENDING' },
        })
      }
    }

    // TODO: Send notifications

    return NextResponse.json({
      message: `Đã ${validatedData.action === 'approve' ? 'phê duyệt' : validatedData.action === 'reject' ? 'từ chối' : 'trả lại'} thành công`,
      approval: updatedApproval,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý phê duyệt' },
      { status: 500 }
    )
  }
}

