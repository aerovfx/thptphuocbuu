import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CourseContentView from '@/components/Classes/CourseContentView'

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
      chapters: {
        include: {
          lessons: {
            include: {
              completions: {
                where: {
                  userId: userId,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
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
  if (role === 'ADMIN') {
    // ADMIN can access all classes
    // No restriction
  } else if (role === 'TEACHER') {
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
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      redirect('/login')
    }

    const { id } = await params
    const classDetail = await getClassDetail(id, session.user.id, session.user.role)

    if (!classDetail) {
      redirect('/dashboard/classes')
    }

  // Format chapters and lessons with completion status
  const formattedChapters = (classDetail.chapters || []).map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    order: chapter.order,
    lessons: (chapter.lessons || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      order: lesson.order,
      duration: lesson.duration,
      isCompleted: (lesson.completions || []).length > 0,
      completedCount: lesson.completions?.[0]?.completedCount || 0,
    })),
  }))

    // Get enrolled users for right sidebar
    const enrolledUsers = classDetail.enrollments.map((enrollment) => enrollment.user)

    return (
      <CourseContentView
        classDetail={{
          id: classDetail.id,
          name: classDetail.name,
          code: classDetail.code,
          description: classDetail.description,
          subject: classDetail.subject,
          teacher: classDetail.teacher,
        }}
        chapters={formattedChapters}
        currentUser={session}
        enrolledUsers={enrolledUsers}
      />
    )
  } catch (error) {
    console.error('Error loading class detail:', error)
    redirect('/dashboard/classes')
  }
}

