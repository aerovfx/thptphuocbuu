import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Premium Points Calculation Formula:
 * - 1 completed task = 1 point
 * - 1 post = 1.5 points
 * - 1 like received = 0.3 points
 * 
 * Premium Standard: 50 points
 * Premium Pro: 290 points
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Calculate start and end of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Count completed tasks in current month (both Task and IncomingDocumentAssignment)
    const [completedTasksCount, completedAssignmentsCount, postsCount, likesReceivedCount] = await Promise.all([
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'COMPLETED',
          completedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.incomingDocumentAssignment.count({
        where: {
          assignedToId: userId,
          status: 'COMPLETED',
          completedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Count posts created in current month
      prisma.post.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Count likes received on user's posts in current month
      prisma.like.count({
        where: {
          post: {
            authorId: userId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      }),
    ])

    // Calculate points using the formula
    const taskPoints = completedTasksCount + completedAssignmentsCount // 1 point per task
    const postPoints = postsCount * 1.5 // 1.5 points per post
    const likePoints = likesReceivedCount * 0.3 // 0.3 points per like received
    
    const totalPoints = Math.floor(taskPoints + postPoints + likePoints)
    const totalTasks = completedTasksCount + completedAssignmentsCount

    return NextResponse.json({ 
      count: totalPoints, // Total points for backward compatibility
      points: totalPoints,
      breakdown: {
        tasks: totalTasks,
        posts: postsCount,
        likes: likesReceivedCount,
        taskPoints: Math.floor(taskPoints),
        postPoints: Math.floor(postPoints),
        likePoints: Math.floor(likePoints),
      },
    })
  } catch (error: any) {
    console.error('Error fetching completed tasks:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy số công việc hoàn thành', details: error.message },
      { status: 500 }
    )
  }
}

