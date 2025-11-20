import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookOpen, Users, FileText, MessageSquare } from 'lucide-react'
import DashboardContent from '@/components/Dashboard/DashboardContent'

async function getStats(userId: string, role: string) {
  if (role === 'TEACHER') {
    const [classes, students, documents, posts] = await Promise.all([
      prisma.class.count({ where: { teacherId: userId } }),
      prisma.classEnrollment.count({
        where: { class: { teacherId: userId } },
      }),
      prisma.document.count({ where: { uploadedById: userId } }),
      prisma.post.count({ where: { authorId: userId } }),
    ])
    return { classes, students, documents, posts }
  } else if (role === 'STUDENT') {
    const [classes, documents, posts, friends] = await Promise.all([
      prisma.classEnrollment.count({ where: { userId } }),
      prisma.documentAccess.count({ where: { userId } }),
      prisma.post.count({ where: { authorId: userId } }),
      prisma.friendship.count({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      }),
    ])
    return { classes, documents, posts, friends }
  }
  return { classes: 0, documents: 0, posts: 0, friends: 0, students: 0 }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const stats = await getStats(session.user.id, session.user.role)

  const statCards = [
    {
      title: 'Lớp học',
      value: stats.classes,
      iconName: 'BookOpen',
      href: '/dashboard/classes',
      color: 'bg-blue-500',
    },
    {
      title: session.user.role === 'TEACHER' ? 'Học sinh' : 'Bạn bè',
      value: session.user.role === 'TEACHER' ? (stats.students || 0) : (stats.friends || 0),
      iconName: 'Users',
      href: '/dashboard/users',
      color: 'bg-green-500',
    },
    {
      title: 'Văn bản',
      value: stats.documents,
      iconName: 'FileText',
      href: '/dashboard/documents',
      color: 'bg-purple-500',
    },
    {
      title: 'Bài viết',
      value: stats.posts,
      iconName: 'MessageSquare',
      href: '/dashboard/social',
      color: 'bg-orange-500',
    },
  ]

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'LMS Platform', posts: '1.2K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Học trực tuyến', posts: '856' },
  ]

  return (
    <DashboardContent
      statCards={statCards}
      trendingTopics={trendingTopics}
      currentUser={session}
    />
  )
}

