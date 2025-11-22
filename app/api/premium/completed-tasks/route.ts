import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
    const [completedTasksCount, completedAssignmentsCount] = await Promise.all([
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
    ])

    const count = completedTasksCount + completedAssignmentsCount

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error fetching completed tasks:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy số công việc hoàn thành', details: error.message },
      { status: 500 }
    )
  }
}

