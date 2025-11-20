import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'

async function getClasses(userId: string, role: string) {
  if (role === 'TEACHER') {
    return await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        teacher: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    return await prisma.class.findMany({
      where: { enrollments: { some: { userId } } },
      include: {
        teacher: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export default async function ClassesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const classes = await getClasses(session.user.id, session.user.role)

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'LMS Platform', posts: '1.2K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Học trực tuyến', posts: '856' },
  ]

  return (
    <SharedLayout
      title="Lớp học"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          {session.user.role === 'TEACHER' && (
            <Link
              href="/dashboard/classes/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
            >
              <Plus size={20} />
              <span>Tạo lớp mới</span>
            </Link>
          )}
        </div>

        {classes.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-400 text-lg mb-2 font-poppins">Chưa có lớp học nào</p>
            {session.user.role === 'TEACHER' && (
              <Link
                href="/dashboard/classes/new"
                className="text-blue-500 hover:text-blue-400 font-medium font-poppins"
              >
                Tạo lớp học đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Link
                key={classItem.id}
                href={`/dashboard/classes/${classItem.id}`}
                className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors border border-gray-800"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 font-poppins">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-poppins">{classItem.code}</p>
                  </div>
                  <BookOpen className="text-blue-500" size={24} />
                </div>
                <p className="text-gray-400 text-sm mb-4 font-poppins">{classItem.subject}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 font-poppins">
                    {classItem.teacher.firstName} {classItem.teacher.lastName}
                  </span>
                  <span className="text-blue-500 font-medium font-poppins">
                    {classItem._count.enrollments} học sinh
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SharedLayout>
  )
}

