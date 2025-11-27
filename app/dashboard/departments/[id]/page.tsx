import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DepartmentDetailContent from '@/components/Departments/DepartmentDetailContent'

async function getDepartment(id: string, userId: string, role: string) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      space: true,
      leader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
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
      _count: {
        select: {
          members: true,
          documents: true,
        },
      },
    },
  })

  if (!department) {
    return null
  }

  // Check access - members can view
  const isMember = department.members.some((m) => m.userId === userId)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BGH'
  const isLeader = department.leaderId === userId

  if (!isMember && !isAdmin && !isLeader) {
    // Check if space is accessible
    if (department.space) {
      const spaceMember = await prisma.spaceMember.findUnique({
        where: {
          spaceId_userId: {
            spaceId: department.space.id,
            userId: userId,
          },
        },
      })
      if (!spaceMember && department.space.visibility === 'PRIVATE') {
        return null // No access
      }
    }
  }

  return department
}

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const department = await getDepartment(id, session.user.id, session.user.role)

  if (!department) {
    redirect('/dashboard/departments')
  }

  return <DepartmentDetailContent department={department} currentUser={session} />
}

