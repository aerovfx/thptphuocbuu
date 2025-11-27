import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('type') || 'INCOMING'

    const steps: any[] = []

    if (documentType === 'INCOMING') {
      // Get document
      const document = await prisma.incomingDocument.findUnique({
        where: { id: documentId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
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
                },
              },
            },
            orderBy: { createdAt: 'asc' },
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
        },
      })

      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }

      // Step 1: Document received
      steps.push({
        id: 'received',
        name: 'Tiếp nhận văn bản',
        status: document.status === 'PENDING' ? 'completed' : 'completed',
        assignee: document.createdBy
          ? {
              id: document.createdBy.id,
              firstName: document.createdBy.firstName,
              lastName: document.createdBy.lastName,
              avatar: document.createdBy.avatar,
            }
          : undefined,
        completedAt: document.receivedDate.toISOString(),
      })

      // Step 2: Assignments
      document.assignments.forEach((assignment, index) => {
        let status: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending'
        if (assignment.status === 'COMPLETED') {
          status = 'completed'
        } else if (assignment.status === 'PROCESSING') {
          status = 'in_progress'
        } else if (assignment.status === 'REJECTED') {
          status = 'rejected'
        }

        steps.push({
          id: `assignment-${assignment.id}`,
          name: `Phân công xử lý ${index + 1}`,
          status,
          assignee: {
            id: assignment.assignedTo.id,
            firstName: assignment.assignedTo.firstName,
            lastName: assignment.assignedTo.lastName,
            avatar: assignment.assignedTo.avatar,
          },
          completedAt: assignment.completedAt?.toISOString(),
          deadline: assignment.deadline?.toISOString(),
          comment: assignment.notes,
        })
      })

      // Step 3: Approvals
      document.approvals.forEach((approval) => {
        let status: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending'
        if (approval.status === 'APPROVED') {
          status = 'completed'
        } else if (approval.status === 'PENDING') {
          // Check if previous approvals are completed
          const previousApprovals = document.approvals.filter((a) => a.level < approval.level)
          if (previousApprovals.every((a) => a.status === 'APPROVED')) {
            status = 'in_progress'
          }
        } else if (approval.status === 'REJECTED') {
          status = 'rejected'
        }

        steps.push({
          id: `approval-${approval.id}`,
          name: `Phê duyệt cấp ${approval.level}`,
          status,
          assignee: {
            id: approval.approver.id,
            firstName: approval.approver.firstName,
            lastName: approval.approver.lastName,
            avatar: approval.approver.avatar,
          },
          completedAt: approval.approvedAt?.toISOString(),
          deadline: approval.deadline?.toISOString(),
          comment: approval.comment,
        })
      })

      // Step 4: Final status
      if (document.status === 'COMPLETED' || document.status === 'ARCHIVED') {
        steps.push({
          id: 'completed',
          name: 'Hoàn thành',
          status: 'completed' as const,
          completedAt: document.updatedAt.toISOString(),
        })
      }
    } else {
      // Outgoing document
      const document = await prisma.outgoingDocument.findUnique({
        where: { id: documentId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
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
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }

      // Step 1: Document created
      steps.push({
        id: 'created',
        name: 'Tạo văn bản',
        status: 'completed' as const,
        assignee: {
          id: document.createdBy.id,
          firstName: document.createdBy.firstName,
          lastName: document.createdBy.lastName,
          avatar: document.createdBy.avatar,
        },
        completedAt: document.createdAt.toISOString(),
      })

      // Step 2: Approvals
      document.approvals.forEach((approval) => {
        let status: 'pending' | 'in_progress' | 'completed' | 'rejected' = 'pending'
        if (approval.status === 'APPROVED') {
          status = 'completed'
        } else if (approval.status === 'PENDING') {
          const previousApprovals = document.approvals.filter((a) => a.level < approval.level)
          if (previousApprovals.every((a) => a.status === 'APPROVED')) {
            status = 'in_progress'
          }
        } else if (approval.status === 'REJECTED') {
          status = 'rejected'
        }

        steps.push({
          id: `approval-${approval.id}`,
          name: `Phê duyệt cấp ${approval.level}`,
          status,
          assignee: {
            id: approval.approver.id,
            firstName: approval.approver.firstName,
            lastName: approval.approver.lastName,
            avatar: approval.approver.avatar,
          },
          completedAt: approval.approvedAt?.toISOString(),
          deadline: approval.deadline?.toISOString(),
          comment: approval.comment,
        })
      })

      // Step 3: Digital signatures
      document.signatures.forEach((signature, index) => {
        steps.push({
          id: `signature-${signature.id}`,
          name: `Ký số ${index + 1}`,
          status: signature.isValid ? ('completed' as const) : ('pending' as const),
          assignee: {
            id: signature.signedByUser.id,
            firstName: signature.signedByUser.firstName,
            lastName: signature.signedByUser.lastName,
            avatar: signature.signedByUser.avatar,
          },
          completedAt: signature.timestamp?.toISOString(),
        })
      })

      // Step 4: Published/Sent
      if (document.status === 'COMPLETED' && document.sendDate) {
        steps.push({
          id: 'sent',
          name: 'Đã gửi',
          status: 'completed' as const,
          completedAt: document.sendDate.toISOString(),
        })
      }
    }

    return NextResponse.json({ steps })
  } catch (error) {
    console.error('Error fetching document progress:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy tiến trình văn bản' },
      { status: 500 }
    )
  }
}

