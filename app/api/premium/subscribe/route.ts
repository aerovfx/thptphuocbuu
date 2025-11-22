import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const subscribeSchema = z.object({
  plan: z.enum(['STANDARD', 'PRO', 'ENTERPRISE']),
  paymentMethod: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = subscribeSchema.parse(body)

    // Check if user already has premium
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true },
    })

    if (user?.isPremium) {
      return NextResponse.json(
        { error: 'Bạn đã có tài khoản Premium' },
        { status: 400 }
      )
    }

    // Check premium points requirement based on plan
    // Formula: 1 task = 1 point, 1 post = 1.5 points, 1 like received = 0.3 points
    const planRequirements: Record<string, number> = {
      'STANDARD': 50,
      'PRO': 290,
      'ENTERPRISE': 0, // Enterprise doesn't require points
    }

    const requiredPoints = planRequirements[validatedData.plan] || 0
    let totalPoints = 0
    let breakdown = {
      tasks: 0,
      posts: 0,
      likes: 0,
    }
    
    if (requiredPoints > 0) {
      // Calculate start and end of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Count completed tasks, posts, and likes received in current month
      const [completedTasksCount, completedAssignmentsCount, postsCount, likesReceivedCount] = await Promise.all([
        prisma.task.count({
          where: {
            assigneeId: session.user.id,
            status: 'COMPLETED',
            completedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.incomingDocumentAssignment.count({
          where: {
            assignedToId: session.user.id,
            status: 'COMPLETED',
            completedAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.post.count({
          where: {
            authorId: session.user.id,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        prisma.like.count({
          where: {
            post: {
              authorId: session.user.id,
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          },
        }),
      ])

      breakdown = {
        tasks: completedTasksCount + completedAssignmentsCount,
        posts: postsCount,
        likes: likesReceivedCount,
      }

      // Calculate total points using the formula
      const taskPoints = breakdown.tasks // 1 point per task
      const postPoints = breakdown.posts * 1.5 // 1.5 points per post
      const likePoints = breakdown.likes * 0.3 // 0.3 points per like received
      
      totalPoints = Math.floor(taskPoints + postPoints + likePoints)

      if (totalPoints < requiredPoints) {
        return NextResponse.json(
          { 
            error: `Bạn cần đạt ít nhất ${requiredPoints} điểm trong tháng này để đăng ký gói ${validatedData.plan}. Hiện tại bạn đã đạt ${totalPoints} điểm (${breakdown.tasks} công việc, ${breakdown.posts} bài đăng, ${breakdown.likes} lượt like).`,
            points: totalPoints,
            requiredPoints,
            breakdown,
          },
          { status: 400 }
        )
      }
    }

    // Calculate subscription end date (1 month from now)
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)

    // Create subscription record
    let subscription = null
    try {
      subscription = await prisma.premiumSubscription.create({
        data: {
          userId: session.user.id,
          plan: validatedData.plan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          activatedBy: 'MANUAL',
          completedTasks: requiredPoints > 0 ? (breakdown.tasks || 0) : 0,
        },
      })
    } catch (error: any) {
      // If subscription table doesn't exist yet, just update user
      console.log('Subscription table not available, skipping subscription creation')
    }

    // Update user to premium
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isPremium: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isPremium: true,
      },
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'Đã nâng cấp tài khoản Premium thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error subscribing to premium:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi nâng cấp tài khoản' },
      { status: 500 }
    )
  }
}

