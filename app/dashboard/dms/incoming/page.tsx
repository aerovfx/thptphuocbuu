import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import IncomingDocumentsList from '@/components/DMS/IncomingDocumentsList'

async function getIncomingDocuments(userId: string, role: string) {
  const where: any = {}

  // Role-based filtering
  if (role === 'ADMIN') {
    // ADMIN can see all incoming documents
    // where remains empty to show all
  } else if (role === 'STUDENT' || role === 'PARENT') {
    where.assignments = {
      some: {
        assignedToId: userId,
      },
    }
  }

  return await prisma.incomingDocument.findMany({
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
      },
      _count: {
        select: {
          approvals: true,
          assignments: true,
        },
      },
    },
    orderBy: { receivedDate: 'desc' },
    take: 50,
  })
}

export default async function IncomingDocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const documents = await getIncomingDocuments(session.user.id, session.user.role)

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đến', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Văn bản đến"
    >
      <IncomingDocumentsList 
        initialDocuments={documents.map(doc => ({
          ...doc,
          receivedDate: doc.receivedDate.toISOString(),
          deadline: doc.deadline?.toISOString() || null,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        }))} 
        currentUser={session} 
      />
    </SharedLayout>
  )
}

