import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import PendingApprovalsList from '@/components/DMS/PendingApprovalsList'

async function getPendingApprovals(userId: string) {
  return await prisma.approval.findMany({
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
          avatar: true,
        },
      },
      incomingDocument: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          sender: true,
        },
      },
      outgoingDocument: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          recipient: true,
        },
      },
      workItem: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
      },
    },
    orderBy: [
      { deadline: 'asc' },
      { createdAt: 'asc' },
    ],
    take: 50,
  })
}

export default async function PendingApprovalsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const approvals = await getPendingApprovals(session.user.id)

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Phê duyệt', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Chờ phê duyệt"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <PendingApprovalsList initialApprovals={approvals} currentUser={session} />
    </SharedLayout>
  )
}

