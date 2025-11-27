import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import CreateSpaceTask from '@/components/Spaces/CreateSpaceTask'
import { requireSpaceAccess } from '@/lib/space-rbac-middleware'

export default async function CreateSpaceTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id: spaceId } = await params

  // Check access
  const accessCheck = await requireSpaceAccess(spaceId, 'manage')
  if (!accessCheck.hasAccess) {
    return (
      <SharedLayout title="Không có quyền">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Bạn không có quyền tạo công việc trong space này.</p>
        </div>
      </SharedLayout>
    )
  }

  // Get space info
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      id: true,
      name: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
        },
      },
    },
  })

  if (!space) {
    return (
      <SharedLayout title="Space không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy space này.</p>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title={`Tạo công việc - ${space.name}`}>
      <CreateSpaceTask spaceId={spaceId} spaceName={space.name} currentUser={session} />
    </SharedLayout>
  )
}

