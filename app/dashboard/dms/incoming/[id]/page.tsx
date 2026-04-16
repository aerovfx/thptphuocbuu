import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import IncomingDocumentDetail from '@/components/DMS/IncomingDocumentDetail'

async function getDocument(id: string) {
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
  return document || null
}

async function getAdjacentIds(id: string, receivedDate: Date) {
  // Lấy văn bản liền trước (nhận sau)
  const next = await prisma.incomingDocument.findFirst({
    where: { receivedDate: { gt: receivedDate } },
    orderBy: { receivedDate: 'asc' },
    select: { id: true, title: true },
  })
  // Lấy văn bản liền sau (nhận trước)
  const prev = await prisma.incomingDocument.findFirst({
    where: { receivedDate: { lt: receivedDate } },
    orderBy: { receivedDate: 'desc' },
    select: { id: true, title: true },
  })
  return { prev, next }
}

export default async function IncomingDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const document = await getDocument(id)

  if (!document) {
    return (
      <SharedLayout title="Văn bản không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy văn bản này.</p>
        </div>
      </SharedLayout>
    )
  }

  const { prev, next } = await getAdjacentIds(id, document.receivedDate)

  const currentUser = session ?? {
    user: { id: '', role: 'GUEST', name: 'Khách', email: '' },
    expires: '',
  }

  return (
    <SharedLayout title={document.title}>
      <IncomingDocumentDetail
        document={document}
        currentUser={currentUser}
        prevDoc={prev ? { id: prev.id, title: prev.title } : null}
        nextDoc={next ? { id: next.id, title: next.title } : null}
      />
    </SharedLayout>
  )
}
