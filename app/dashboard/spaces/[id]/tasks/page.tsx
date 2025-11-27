import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import SpaceTasksList from '@/components/Spaces/SpaceTasksList'
import { requireSpaceAccess } from '@/lib/space-rbac-middleware'

async function getSpaceTasks(spaceId: string, userId: string, role: string) {
  // Check access
  const accessCheck = await requireSpaceAccess(spaceId, 'read')
  if (!accessCheck.hasAccess) {
    return null
  }

  const tasks = await prisma.spaceTask.findMany({
    where: { spaceId },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      space: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })

  return tasks.map((task) => ({
    ...task,
    commentsCount: task._count.comments,
  }))
}

export default async function SpaceTasksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id: spaceId } = await params

  // Get space info
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId: session.user.id },
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

  const tasks = await getSpaceTasks(spaceId, session.user.id, session.user.role)

  if (tasks === null) {
    return (
      <SharedLayout title="Không có quyền truy cập">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Bạn không có quyền xem công việc trong space này.</p>
        </div>
      </SharedLayout>
    )
  }

  const canManage =
    session.user.role === 'ADMIN' ||
    session.user.role === 'SUPER_ADMIN' ||
    space.members.some((m) => m.canManage)

  return (
    <SharedLayout title={`Công việc - ${space.name}`}>
      <SpaceTasksList
        spaceId={spaceId}
        spaceName={space.name}
        initialTasks={tasks as any}
        canManage={canManage}
      />
    </SharedLayout>
  )
}

