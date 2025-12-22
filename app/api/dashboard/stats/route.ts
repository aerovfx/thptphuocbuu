import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    // Cache dashboard stats per-user for a short TTL to reduce repeated DB counts
    // (dashboard can poll / re-render frequently).
    const cacheKey = `${cacheKeys.stats(userId)}:${role}`
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    if (role === 'TEACHER' || role === 'ADMIN') {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      const startOfYesterday = new Date(startOfToday)
      startOfYesterday.setDate(startOfYesterday.getDate() - 1)
      const endOfYesterday = new Date(startOfYesterday)
      endOfYesterday.setHours(23, 59, 59, 999)

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
        // Task statistics for summary cards
        dueTasksToday,
        completedTasksToday,
        overdueTasks,
        overdueTasksYesterday,
        openIssues,
        closedIssuesToday,
        featuresProposals,
        implementedFeatures,
      ] = await Promise.all([
        prisma.class.count({ where: { teacherId: userId } }),
        prisma.classEnrollment.count({
          where: { class: { teacherId: userId } },
        }),
        prisma.document.count({ where: { uploadedById: userId } }),
        prisma.post.count({ where: { authorId: userId } }),
        prisma.incomingDocument.count({ where: { createdById: userId } }),
        prisma.outgoingDocument.count({ where: { createdById: userId } }),
        prisma.incomingDocument.count({
          where: { createdById: userId, status: 'PENDING' },
        }),
        prisma.incomingDocument.count({
          where: { createdById: userId, status: 'COMPLETED' },
        }),
        prisma.outgoingDocument.count({
          where: { createdById: userId, status: 'PENDING' },
        }),
        prisma.outgoingDocument.count({
          where: { createdById: userId, status: 'APPROVED' },
        }),
        prisma.task.count({
          where: { assigneeId: userId, status: { not: 'COMPLETED' } },
        }),
        prisma.task.count({
          where: { assigneeId: userId, status: 'COMPLETED' },
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
        // Due Tasks Today
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: { not: 'COMPLETED' },
            dueDate: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),
        // Completed Tasks Today
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: 'COMPLETED',
            completedAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),
        // Overdue Tasks
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: { not: 'COMPLETED' },
            dueDate: { lt: startOfToday },
          },
        }),
        // Overdue Tasks Yesterday
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: { not: 'COMPLETED' },
            dueDate: {
              gte: startOfYesterday,
              lte: endOfYesterday,
            },
          },
        }),
        // Open Issues (pending incoming documents)
        prisma.incomingDocument.count({
          where: {
            createdById: userId,
            status: 'PENDING',
          },
        }),
        // Closed Issues Today (completed incoming documents)
        prisma.incomingDocument.count({
          where: {
            createdById: userId,
            status: 'COMPLETED',
            updatedAt: {
              gte: startOfToday,
              lte: endOfToday,
            },
          },
        }),
        // Features Proposals (pending outgoing documents)
        prisma.outgoingDocument.count({
          where: {
            createdById: userId,
            status: 'PENDING',
          },
        }),
        // Implemented Features (approved outgoing documents)
        prisma.outgoingDocument.count({
          where: {
            createdById: userId,
            status: 'APPROVED',
          },
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

      const payload = {
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
        // Summary card statistics
        dueTasksToday,
        completedTasksToday,
        overdueTasks,
        overdueTasksYesterday,
        openIssues,
        closedIssuesToday,
        featuresProposals,
        implementedFeatures,
        timestamp: new Date().toISOString(),
      }

      cache.set(cacheKey, payload, 30) // 30s TTL
      return NextResponse.json({ ...payload, cached: false })
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

      const payload = {
        classes,
        documents,
        posts,
        friends,
        assignedDocs,
        completedAssignments,
        pendingAssignments,
        workProgress: averageProgress,
        timestamp: new Date().toISOString(),
      }

      cache.set(cacheKey, payload, 30) // 30s TTL
      return NextResponse.json({ ...payload, cached: false })
    }

    const payload = {
      classes: 0,
      documents: 0,
      posts: 0,
      friends: 0,
      students: 0,
      workProgress: 0,
      timestamp: new Date().toISOString(),
    }
    cache.set(cacheKey, payload, 30)
    return NextResponse.json({ ...payload, cached: false })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thống kê', details: error.message },
      { status: 500 }
    )
  }
}

