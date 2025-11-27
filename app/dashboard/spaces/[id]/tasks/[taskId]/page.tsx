import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import SpaceTaskDetail from '@/components/Spaces/SpaceTaskDetail'
import { requireSpaceAccess } from '@/lib/space-rbac-middleware'

async function getTask(spaceId: string, taskId: string, userId: string, role: string) {
  // Check space access
  const accessCheck = await requireSpaceAccess(spaceId, 'read')
  if (!accessCheck.hasAccess) {
    return null
  }

  const task = await prisma.spaceTask.findFirst({
    where: {
      id: taskId,
      spaceId,
    },
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
  })

  if (!task) {
    return null
  }

  return {
    ...task,
    commentsCount: task._count.comments,
  }
}

export default async function SpaceTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id: spaceId, taskId } = await params

  const task = await getTask(spaceId, taskId, session.user.id, session.user.role)

  if (!task) {
    return (
      <SharedLayout title="Công việc không tồn tại">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">
            Không tìm thấy công việc này hoặc bạn không có quyền truy cập.
          </p>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title={task.title}>
      <SpaceTaskDetail task={task as any} currentUser={session} />
    </SharedLayout>
  )
}

