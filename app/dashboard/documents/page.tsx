import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import DocumentsTabs from '@/components/DMS/DocumentsTabs'

async function getDocuments(userId: string, role: string) {
  // Mọi người (kể cả GUEST chưa đăng nhập) đều được xem tất cả văn bản
  return await prisma.document.findMany({
    include: {
      uploadedBy: {
        select: {
          id: true,
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

async function getIncomingDocuments(userId: string, role: string) {
  const where: any = {}

  // Role-based filtering
  // Role-based filtering removed to allow all users (including STUDENTS/PARENTS) to view all documents
  // if (role === 'ADMIN' || role === 'BGH') { ... } 

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

  // GUEST và mọi người đều thấy văn bản đi (chế độ công khai)
  // Các role nội bộ có thể thấy nhiều hơn, nhưng GUEST vẫn xem được tất cả
  if (role !== 'ADMIN' && role !== 'BGH' && role !== 'GUEST' && role !== 'SUPER_ADMIN') {
    if (role === 'TEACHER') {
      where.createdById = userId
    }
    // STUDENT/PARENT/... có thể xem tất cả văn bản đi công khai
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
  // No redirect for guest access

  try {
    // Initialize user as Guest by default
    let user: any = null

    if (session?.user?.id) {
      // Authenticated user: fetch from DB
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      })

      // Fallback: If user not found by ID, try email
      if (!user && session.user.email) {
        console.warn(`DocumentsPage: User not found by ID ${session.user.id}, trying email ${session.user.email}`)
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        })
      }

      if (!user) {
        console.error('DocumentsPage: User found in session but not in database', session.user.id)
        return (
          <SharedLayout title="Lỗi">
            <div className="p-6 text-center text-red-500">
              Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.
            </div>
          </SharedLayout>
        )
      }
    } else {
      // Unauthenticated: Guest user
      user = {
        id: '',
        firstName: 'Khách',
        lastName: '',
        role: 'GUEST',
      }
    }

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
            createdBy: doc.createdBy ? {
              id: doc.createdBy.id,
              firstName: doc.createdBy.firstName,
              lastName: doc.createdBy.lastName,
              avatar: doc.createdBy.avatar,
            } : undefined,
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
  } catch (error) {
    console.error('Error loading documents page:', error)
    return (
      <SharedLayout title="Lỗi">
        <div className="p-6 text-center text-red-500">
          Đã xảy ra lỗi khi tải dữ liệu: {(error as Error).message}
        </div>
      </SharedLayout>
    )
  }
}

