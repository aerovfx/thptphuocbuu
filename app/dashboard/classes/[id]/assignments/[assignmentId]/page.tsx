import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import AssignmentDetailContent from '@/components/Classes/AssignmentDetailContent'

async function getAssignmentDetail(assignmentId: string, classId: string, userId: string, role: string) {
  // First verify the class exists and user has access
  const classItem = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      enrollments: {
        where: { userId },
      },
    },
  })

  if (!classItem) {
    return null
  }

  // Check access
  const isTeacher = classItem.teacherId === userId
  const isStudent = classItem.enrollments.length > 0
  const isAdmin = role === 'ADMIN'

  if (!isTeacher && !isStudent && !isAdmin) {
    return null
  }

  // Get assignment with related data
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
      },
      submissions: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          grade: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  })

  if (!assignment || assignment.classId !== classId) {
    return null
  }

  // Get user's submission if exists
  const userSubmission = assignment.submissions.find((s) => s.studentId === userId)

  return {
    assignment,
    userSubmission: userSubmission || null,
    isTeacher,
  }
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id: classId, assignmentId } = await params
  const data = await getAssignmentDetail(assignmentId, classId, session.user.id, session.user.role)

  if (!data) {
    redirect(`/dashboard/classes/${classId}`)
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'LMS Platform', posts: '1.2K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Học trực tuyến', posts: '856' },
  ]

  return (
    <SharedLayout
      title={data.assignment.title}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <AssignmentDetailContent
        assignment={data.assignment}
        userSubmission={data.userSubmission}
        isTeacher={data.isTeacher}
        currentUser={session}
      />
    </SharedLayout>
  )
}

