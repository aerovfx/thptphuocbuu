import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import DocumentDetail from '@/components/DMS/DocumentDetail'

async function getDocument(id: string) {
  // Văn bản công khai — không lọc theo quyền truy cập
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

  return document || null
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Không bắt buộc đăng nhập — văn bản là công khai
  const session = await getServerSession(authOptions)

  const { id } = await params

  // Lấy thông tin user nếu đã đăng nhập
  let user: { firstName: string; lastName: string } | null = null
  if (session?.user?.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    })
  }

  const document = await getDocument(id)

  if (!document) {
    return (
      <SharedLayout title="Tài liệu không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy tài liệu này.</p>
        </div>
      </SharedLayout>
    )
  }

  // Xây dựng currentUser: nếu chưa đăng nhập thì là GUEST
  const currentUser = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
      }
    : {
        id: '',
        role: 'GUEST',
        firstName: 'Khách',
        lastName: '',
      }

  return (
    <SharedLayout title={document.title}>
      <DocumentDetail
        document={{
          ...document,
          createdAt: document.createdAt.toISOString(),
          signatures: document.signatures.map((sig) => ({
            ...sig,
            timestamp: sig.timestamp?.toISOString() || new Date().toISOString(),
          })),
        }}
        currentUser={currentUser}
      />
    </SharedLayout>
  )
}

