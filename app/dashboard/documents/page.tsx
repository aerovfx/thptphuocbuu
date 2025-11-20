import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import DocumentsTabs from '@/components/DMS/DocumentsTabs'

async function getDocuments(userId: string, role: string) {
  if (role === 'ADMIN' || role === 'TEACHER') {
    return await prisma.document.findMany({
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            access: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    return await prisma.document.findMany({
      where: {
        OR: [
          { access: { some: { userId } } },
          { access: { none: {} } }, // Public documents
        ],
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            access: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

async function getIncomingDocuments(userId: string, role: string) {
  const where: any = {}

  // Role-based filtering
  if (role === 'STUDENT' || role === 'PARENT') {
    where.assignments = {
      some: {
        assignedToId: userId,
      },
    }
  }

  return await prisma.incomingDocument.findMany({
    where,
    select: {
      id: true,
      documentNumber: true,
      title: true,
      type: true,
      status: true,
      priority: true,
      sender: true,
      receivedDate: true,
      deadline: true,
      summary: true,
      ocrConfidence: true,
      aiCategory: true,
      aiConfidence: true,
      fileUrl: true,
      fileName: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      assignments: {
        select: {
          id: true,
          status: true,
          deadline: true,
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

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  // Fetch user to get firstName and lastName
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  if (!user) return null

  const [documents, incomingDocuments, outgoingDocuments] = await Promise.all([
    getDocuments(user.id, user.role),
    getIncomingDocuments(user.id, user.role),
    getOutgoingDocuments(user.id, user.role),
  ])

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Văn bản', posts: '856' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Quản lý văn bản"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <DocumentsTabs
        documents={documents.map(doc => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        }))}
        incomingDocuments={incomingDocuments.map(doc => ({
          ...doc,
          receivedDate: doc.receivedDate.toISOString(),
          deadline: doc.deadline?.toISOString() || null,
          createdAt: doc.createdAt.toISOString(),
          assignments: doc.assignments.map(assignment => ({
            ...assignment,
            deadline: assignment.deadline?.toISOString() || null,
            assignedTo: {
              id: assignment.assignedTo.id,
              firstName: assignment.assignedTo.firstName,
              lastName: assignment.assignedTo.lastName,
            },
          })),
        }))}
        outgoingDocuments={outgoingDocuments.map(doc => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          sendDate: doc.sendDate?.toISOString() || null,
        }))}
        currentUser={user}
      />
    </SharedLayout>
  )
}

