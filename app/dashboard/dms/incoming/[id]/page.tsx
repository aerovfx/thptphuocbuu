import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import IncomingDocumentDetail from '@/components/DMS/IncomingDocumentDetail'

async function getDocument(id: string, userId: string, role: string) {
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
    return null
  }

  // Check access permission
  if (role === 'STUDENT' || role === 'PARENT') {
    const hasAccess = document.assignments.some(
      (assignment) => assignment.assignedToId === userId
    )
    if (!hasAccess) {
      return null
    }
  }

  return document
}

export default async function IncomingDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const document = await getDocument(id, session.user.id, session.user.role)

  if (!document) {
    return (
      <SharedLayout title="Văn bản không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy văn bản này hoặc bạn không có quyền truy cập.</p>
        </div>
      </SharedLayout>
    )
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đến', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title={document.title}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <IncomingDocumentDetail document={document} currentUser={session} />
    </SharedLayout>
  )
}

