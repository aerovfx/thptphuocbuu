import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import ApprovalForm from '@/components/DMS/ApprovalForm'

async function getApprovalInfo(documentId: string, userId: string) {
  const document = await prisma.outgoingDocument.findUnique({
    where: { id: documentId },
    include: {
      approvals: {
        where: {
          approverId: userId,
          status: 'PENDING',
        },
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!document) {
    return null
  }

  const pendingApproval = document.approvals.find((a) => a.status === 'PENDING')

  return {
    document,
    approval: pendingApproval,
  }
}

export default async function ApproveOutgoingDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const approvalInfo = await getApprovalInfo(id, session.user.id)

  if (!approvalInfo || !approvalInfo.approval) {
    redirect(`/dashboard/dms/outgoing/${id}`)
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Phê duyệt', posts: '856' },
  ]

  return (
    <SharedLayout
      title="Phê duyệt văn bản"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <ApprovalForm
        approval={approvalInfo.approval}
        document={approvalInfo.document}
        documentType="OUTGOING"
        currentUser={session}
      />
    </SharedLayout>
  )
}

