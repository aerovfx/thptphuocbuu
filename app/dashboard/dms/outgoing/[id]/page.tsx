import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import OutgoingDocumentDetail from '@/components/DMS/OutgoingDocumentDetail'

async function getDocument(id: string) {
  const document = await prisma.outgoingDocument.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
      },
      approvals: {
        include: {
          approver: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { level: 'asc' },
      },
      signatures: {
        include: {
          signedByUser: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return document || null
}

async function getAdjacentIds(id: string, createdAt: Date) {
  const next = await prisma.outgoingDocument.findFirst({
    where: { createdAt: { gt: createdAt } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true },
  })
  const prev = await prisma.outgoingDocument.findFirst({
    where: { createdAt: { lt: createdAt } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true },
  })
  return { prev, next }
}

export default async function OutgoingDocumentDetailPage({
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
        <div className="p-6 text-center text-bluelock-dark/60 dark:text-gray-400">
          <p className="font-poppins">Không tìm thấy văn bản này.</p>
        </div>
      </SharedLayout>
    )
  }

  const { prev, next } = await getAdjacentIds(id, document.createdAt)

  const currentUser = session ?? {
    user: { id: '', role: 'GUEST', name: 'Khách', email: '' },
    expires: '',
  }

  return (
    <SharedLayout title={document.title}>
      <OutgoingDocumentDetail
        document={document}
        currentUser={currentUser}
        prevDoc={prev ? { id: prev.id, title: prev.title } : null}
        nextDoc={next ? { id: next.id, title: next.title } : null}
      />
    </SharedLayout>
  )
}
