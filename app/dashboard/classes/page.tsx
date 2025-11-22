import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ClassesPageContent from '@/components/Classes/ClassesPageContent'

async function getClasses(userId: string, role: string) {
  if (role === 'ADMIN') {
    // ADMIN can see all classes
    return await prisma.class.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else if (role === 'TEACHER') {
    return await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    // STUDENT, PARENT: only classes they're enrolled in
    return await prisma.class.findMany({
      where: { enrollments: { some: { userId } } },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export default async function ClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const classes = await getClasses(session.user.id, session.user.role)

  // Format classes for client component
  const formattedClasses = classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    code: cls.code,
    description: cls.description,
    teacher: cls.teacher,
    _count: {
      enrollments: cls._count.enrollments,
      materials: cls._count.assignments || 0, // Using assignments as materials count
    },
    createdAt: cls.createdAt.toISOString(),
  }))

  return (
    <ClassesPageContent
      classes={formattedClasses}
      currentUser={session}
      canCreate={session.user.role === 'TEACHER' || session.user.role === 'ADMIN'}
    />
  )
}
