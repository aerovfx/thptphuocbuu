import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SpaceDetailContent from '@/components/Spaces/SpaceDetailContent'

async function getSpace(id: string, userId: string, role: string) {
  const space = await prisma.space.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: { order: 'asc' },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
      departments: {
        include: {
          leader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
      workflows: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      sprints: {
        orderBy: { startDate: 'desc' },
        take: 5,
      },
      currentSprint: true,
      _count: {
        select: {
          members: true,
          departments: true,
          documents: true,
          tasks: true,
        },
      },
    },
  })

  if (!space) {
    return null
  }

  // Check access
  const isMember = space.members.some((m) => m.userId === userId)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  if (space.visibility === 'PRIVATE' && !isMember && !isAdmin) {
    return null // No access
  }

  return space
}

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const space = await getSpace(id, session.user.id, session.user.role)

  if (!space) {
    redirect('/dashboard/spaces')
  }

  return <SpaceDetailContent space={space} currentUser={session} />
}

