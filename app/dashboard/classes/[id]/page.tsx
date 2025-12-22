import { getCurrentSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CourseContentView from '@/components/Classes/CourseContentView'

async function getClassDetail(classId: string, role: string) {
  // Chỉ ADMIN, SUPER_ADMIN, BGH mới có thể xem chi tiết lớp học
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'BGH') {
    return null
  }

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

  return classItem
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Module đang trong giai đoạn phát triển - redirect về trang chính
  redirect('/dashboard/classes')
}

