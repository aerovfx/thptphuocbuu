import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import ClassDetailContent from '@/components/Classes/ClassDetailContent'

async function getClassDetail(classId: string, userId: string, role: string) {
  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      },
      assignments: {
        include: {
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      },
      _count: {
        select: {
          enrollments: true,
          assignments: true,
        },
      },
    },
  })

  if (!classItem) {
    return null
  }

  // Check access
  if (role === 'TEACHER') {
    if (classItem.teacherId !== userId) {
      return null // Teacher can only access their own classes
    }
  } else {
    // Student can only access classes they're enrolled in
    const isEnrolled = classItem.enrollments.some((e) => e.userId === userId)
    if (!isEnrolled) {
      return null
    }
  }

  return classItem
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  const classDetail = await getClassDetail(id, session.user.id, session.user.role)

  if (!classDetail) {
    redirect('/dashboard/classes')
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'LMS Platform', posts: '1.2K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Học trực tuyến', posts: '856' },
  ]

  return (
    <SharedLayout
      title={classDetail.name}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <ClassDetailContent classDetail={classDetail} currentUser={session} />
    </SharedLayout>
  )
}

