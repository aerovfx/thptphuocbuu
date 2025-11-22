import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import DocumentDetail from '@/components/DMS/DocumentDetail'

async function getDocument(id: string, userId: string, role: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
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
        orderBy: { timestamp: 'desc' },
      },
      access: {
        select: {
          id: true,
          userId: true,
          role: true,
          canView: true,
          canDownload: true,
        },
      },
    },
  })

  if (!document) {
    return null
  }

  // Check access permission
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    const hasAccess = document.access.some(
      (access) => access.userId === userId
    )
    if (!hasAccess && document.access.length > 0) {
      return null
    }
  }

  return document
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  
  // Get user info for firstName and lastName
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
    },
  })
  
  const document = await getDocument(id, session.user.id, session.user.role)

  if (!document) {
    return (
      <SharedLayout title="Tài liệu không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy tài liệu này hoặc bạn không có quyền truy cập.</p>
        </div>
      </SharedLayout>
    )
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Tài liệu', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý văn bản', posts: '642' },
  ]

  return (
    <SharedLayout
      title={document.title}
    >
      <DocumentDetail
        document={{
          ...document,
          createdAt: document.createdAt.toISOString(),
          signatures: document.signatures.map((sig) => ({
            ...sig,
            timestamp: sig.timestamp?.toISOString() || new Date().toISOString(),
          })),
        }}
        currentUser={{
          id: session.user.id,
          role: session.user.role,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
        }}
      />
    </SharedLayout>
  )
}

