import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import EditOutgoingDocument from '@/components/DMS/EditOutgoingDocument'

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
    },
  })

  if (!document) {
    return null
  }

  // Check permission - only creator or ADMIN can edit
  if (role !== 'ADMIN' && document.createdById !== userId) {
    return null
  }

  // Cannot edit if already approved or sent
  if (document.status === 'APPROVED' || document.status === 'COMPLETED') {
    return null
  }

  return document
}

export default async function EditOutgoingDocumentPage({
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
      <SharedLayout title="Không thể chỉnh sửa">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">
            Không tìm thấy văn bản này, bạn không có quyền chỉnh sửa, hoặc văn bản đã được phê duyệt/gửi.
          </p>
        </div>
      </SharedLayout>
    )
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đi', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  // Convert Date objects to strings for client component
  const documentForClient = {
    ...document,
    sendDate: document.sendDate ? document.sendDate.toISOString() : null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }

  // EditOutgoingDocument now handles its own layout (Google Docs style) and hydration
  return <EditOutgoingDocument document={documentForClient} currentUser={session} />
}

