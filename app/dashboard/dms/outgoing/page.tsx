import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import OutgoingDocumentsList from '@/components/DMS/OutgoingDocumentsList'

async function getOutgoingDocuments(userId: string, role: string) {
  const where: any = {}

  // Role-based filtering
  if (role === 'STUDENT' || role === 'PARENT') {
    where.approvals = {
      some: {
        approverId: userId,
      },
    }
  } else if (role === 'TEACHER') {
    where.createdById = userId
  }
  // ADMIN can see all

  return await prisma.outgoingDocument.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          approvals: true,
          signatures: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export default async function OutgoingDocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const documents = await getOutgoingDocuments(session.user.id, session.user.role)

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đi', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Văn bản đi"
    >
      <OutgoingDocumentsList 
        initialDocuments={documents.map(doc => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          sendDate: doc.sendDate?.toISOString() || null,
        }))} 
        currentUser={session} 
      />
    </SharedLayout>
  )
}

