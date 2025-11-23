import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BookOpen, Users, FileText, MessageSquare } from 'lucide-react'
import DashboardContent from '@/components/Dashboard/DashboardContent'

async function getStats(userId: string, role: string) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  if (role === 'TEACHER' || role === 'ADMIN') {
    // For ADMIN, show all data. For TEACHER, show only their data
    const isAdmin = role === 'ADMIN'
    
    const [
      classes,
      students,
      documents,
      posts,
      incomingDocs,
      outgoingDocs,
      pendingIncoming,
      completedIncoming,
      pendingOutgoing,
      completedOutgoing,
      assignments,
      completedAssignments,
      activeTasks,
      // Additional data for comprehensive dashboard
      recentDocuments,
      recentActivities,
      upcomingTasks,
      recentUsers,
    ] = await Promise.all([
      isAdmin 
        ? prisma.class.count()
        : prisma.class.count({ where: { teacherId: userId } }),
      isAdmin
        ? prisma.classEnrollment.count()
        : prisma.classEnrollment.count({
            where: { class: { teacherId: userId } },
          }),
      isAdmin
        ? prisma.document.count()
        : prisma.document.count({ where: { uploadedById: userId } }),
      isAdmin
        ? prisma.post.count()
        : prisma.post.count({ where: { authorId: userId } }),
      isAdmin
        ? prisma.incomingDocument.count()
        : prisma.incomingDocument.count({ where: { createdById: userId } }),
      isAdmin
        ? prisma.outgoingDocument.count()
        : prisma.outgoingDocument.count({ where: { createdById: userId } }),
      isAdmin
        ? prisma.incomingDocument.count({ where: { status: 'PENDING' } })
        : prisma.incomingDocument.count({
            where: { createdById: userId, status: 'PENDING' },
          }),
      isAdmin
        ? prisma.incomingDocument.count({ where: { status: 'COMPLETED' } })
        : prisma.incomingDocument.count({
            where: { createdById: userId, status: 'COMPLETED' },
          }),
      isAdmin
        ? prisma.outgoingDocument.count({ where: { status: 'PENDING' } })
        : prisma.outgoingDocument.count({
            where: { createdById: userId, status: 'PENDING' },
          }),
      isAdmin
        ? prisma.outgoingDocument.count({ where: { status: 'APPROVED' } })
        : prisma.outgoingDocument.count({
            where: { createdById: userId, status: 'APPROVED' },
          }),
      isAdmin
        ? prisma.task.count({ where: { status: { not: 'COMPLETED' } } })
        : prisma.task.count({
            where: { assigneeId: userId, status: { not: 'COMPLETED' } },
          }),
      isAdmin
        ? prisma.task.count({ where: { status: 'COMPLETED' } })
        : prisma.task.count({
            where: { assigneeId: userId, status: 'COMPLETED' },
          }),
      // Get all active tasks with due dates to calculate average progress
      isAdmin
        ? prisma.task.findMany({
            where: {
              status: { not: 'COMPLETED' },
              dueDate: { gte: new Date() }, // Only tasks that are not overdue
            },
            select: {
              createdAt: true,
              dueDate: true,
              status: true,
            },
          })
        : prisma.task.findMany({
            where: {
              assigneeId: userId,
              status: { not: 'COMPLETED' },
              dueDate: { gte: new Date() }, // Only tasks that are not overdue
            },
            select: {
              createdAt: true,
              dueDate: true,
              status: true,
            },
          }),
      // Recent documents (top 10 by activity)
      isAdmin
        ? prisma.incomingDocument.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          })
        : prisma.incomingDocument.findMany({
            where: { createdById: userId },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          }),
      // Recent activities (from audit logs, posts, comments)
      isAdmin
        ? prisma.auditLog.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          }).catch(() => [] as any[])
        : prisma.auditLog.findMany({
            where: { userId },
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          }).catch(() => [] as any[]),
      // Upcoming tasks (for calendar/schedule)
      isAdmin
        ? prisma.task.findMany({
            where: {
              status: { not: 'COMPLETED' },
              dueDate: { gte: now },
            },
            take: 20,
            orderBy: { dueDate: 'asc' },
            include: {
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          }).catch(() => [] as any[])
        : prisma.task.findMany({
            where: {
              assigneeId: userId,
              status: { not: 'COMPLETED' },
              dueDate: { gte: now },
            },
            take: 20,
            orderBy: { dueDate: 'asc' },
            include: {
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          }).catch(() => [] as any[]),
      // Recent users (for activity feed)
      isAdmin
        ? prisma.user.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
              role: true,
              createdAt: true,
            },
          })
        : [],
    ])

    // Calculate average progress for active tasks
    let averageProgress = 0
    if (activeTasks.length > 0) {
      const now = new Date()
      const progressValues = activeTasks.map((task: any) => {
        if (!task.dueDate) {
          // If no due date, estimate based on status
          if (task.status === 'PENDING') return 0
          if (task.status === 'IN_PROGRESS') return 50
          return 0
        }

        const createdAt = new Date(task.createdAt)
        const dueDate = new Date(task.dueDate)
        const totalTime = dueDate.getTime() - createdAt.getTime()
        const elapsedTime = now.getTime() - createdAt.getTime()

        if (totalTime <= 0) return 100 // Already due or invalid

        const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100))
        return progress
      })

      averageProgress = Math.round(
        progressValues.reduce((sum: number, val: number) => sum + val, 0) / progressValues.length
      )
    }

    return {
      classes,
      students,
      documents,
      posts,
      incomingDocs,
      outgoingDocs,
      pendingIncoming,
      completedIncoming,
      pendingOutgoing,
      completedOutgoing,
      assignments,
      completedAssignments,
      workProgress: averageProgress,
      recentDocuments: recentDocuments || [],
      recentActivities: recentActivities || [],
      upcomingTasks: upcomingTasks || [],
      recentUsers: recentUsers || [],
    }
  } else if (role === 'STUDENT') {
    // Count friendships separately for one-way relationship model (user1Id follows user2Id)
    const [followingCount, followersCount] = await Promise.all([
      prisma.friendship.count({ where: { user1Id: userId } }), // People I follow
      prisma.friendship.count({ where: { user2Id: userId } }), // People following me
    ])
    const friends = followingCount + followersCount

    const [
      classes,
      documents,
      posts,
      assignedDocs,
      completedAssignments,
      pendingAssignments,
      activeTasks,
      incomingDocs,
      outgoingDocs,
    ] = await Promise.all([
      prisma.classEnrollment.count({ where: { userId } }),
      prisma.documentAccess.count({ where: { userId } }),
      prisma.post.count({ where: { authorId: userId } }),
      prisma.task.count({
        where: { assigneeId: userId },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: 'COMPLETED' },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: { not: 'COMPLETED' } },
      }),
      // Get all active tasks with due dates to calculate average progress
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: 'COMPLETED' },
          dueDate: { gte: new Date() }, // Only tasks that are not overdue
        },
        select: {
          createdAt: true,
          dueDate: true,
          status: true,
        },
      }),
      // Count incoming documents assigned to this student (distinct documents)
      prisma.incomingDocument.count({
        where: {
          assignments: {
            some: {
              assignedToId: userId,
            },
          },
        },
      }),
      // Count outgoing documents created by this student
      prisma.outgoingDocument.count({
        where: { createdById: userId },
      }),
    ])

    // Calculate average progress for active tasks
    let averageProgress = 0
    if (activeTasks.length > 0) {
      const now = new Date()
      const progressValues = activeTasks.map((task: any) => {
        if (!task.dueDate) {
          // If no due date, estimate based on status
          if (task.status === 'PENDING') return 0
          if (task.status === 'IN_PROGRESS') return 50
          return 0
        }

        const createdAt = new Date(task.createdAt)
        const dueDate = new Date(task.dueDate)
        const totalTime = dueDate.getTime() - createdAt.getTime()
        const elapsedTime = now.getTime() - createdAt.getTime()

        if (totalTime <= 0) return 100 // Already due or invalid

        const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100))
        return progress
      })

      averageProgress = Math.round(
        progressValues.reduce((sum: number, val: number) => sum + val, 0) / progressValues.length
      )
    }

    return {
      classes,
      students: 0, // STUDENT role doesn't have students, but include for consistency
      documents,
      posts,
      friends,
      assignedDocs,
      completedAssignments,
      pendingAssignments,
      incomingDocs,
      outgoingDocs,
      workProgress: averageProgress,
    }
  }
  return {
    classes: 0,
    documents: 0,
    posts: 0,
    friends: 0,
    students: 0,
    workProgress: 0,
  }
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
      title: session.user.role === 'TEACHER' || session.user.role === 'ADMIN' ? 'Học sinh' : 'Bạn bè',
      value: session.user.role === 'TEACHER' || session.user.role === 'ADMIN' ? (stats.students || 0) : (stats.friends || 0),
      iconName: 'Users',
      href: '/dashboard/users',
      color: 'bg-green-500',
    },
    {
      title: 'Văn bản đến',
      value: (stats as any).incomingDocs || 0,
      iconName: 'FileText',
      href: '/dashboard/documents',
      color: 'bg-purple-500',
    },
    {
      title: 'Văn bản đi',
      value: (stats as any).outgoingDocs || 0,
      iconName: 'FileText',
      href: '/dashboard/documents',
      color: 'bg-indigo-500',
    },
    {
      title: 'Công việc',
      value: (stats as any).assignments || (stats as any).assignedDocs || 0,
      iconName: 'FileText',
      href: '/dashboard/documents',
      color: 'bg-yellow-500',
    },
    {
      title: 'Tiến độ',
      value: `${(stats as any).workProgress || 0}%`,
      iconName: 'MessageSquare',
      href: '/dashboard/documents',
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
      stats={stats}
    />
  )
}

