import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import OutgoingDocumentDetail from '@/components/DMS/OutgoingDocumentDetail'

async function getDocument(id: string, userId: string, role: string) {
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
    return null
  }

  // Check access permission
  if (role === 'ADMIN' || role === 'BGH') {
    // ADMIN and BGH can access all documents
    // No restriction
  } else if (role === 'STUDENT' || role === 'PARENT') {
    const hasAccess = document.approvals.some(
      (approval) => approval.approverId === userId
    )
    if (!hasAccess) {
      return null
    }
  } else if (role === 'TEACHER' && document.createdById !== userId) {
    return null
  }

  return document
}

export default async function OutgoingDocumentDetailPage({
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
        <div className="p-6 text-center text-bluelock-dark/60 dark:text-gray-400">
          <p className="font-poppins">
            Không tìm thấy văn bản này hoặc bạn không có quyền truy cập.
          </p>
        </div>
      </SharedLayout>
    )
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đi', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title={document.title}
    >
      <OutgoingDocumentDetail document={document} currentUser={session} />
    </SharedLayout>
  )
}

