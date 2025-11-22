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

    // Check completed tasks requirement based on plan
    const planRequirements: Record<string, number> = {
      'STANDARD': 50,
      'PRO': 290,
      'ENTERPRISE': 0, // Enterprise doesn't require tasks
    }

    const requiredTasks = planRequirements[validatedData.plan] || 0
    let completedTasksCount = 0
    
    if (requiredTasks > 0) {
      // Calculate start and end of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Count completed tasks in current month
      completedTasksCount = await prisma.task.count({
        where: {
          assigneeId: session.user.id,
          status: 'COMPLETED',
          completedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      })

      if (completedTasksCount < requiredTasks) {
        return NextResponse.json(
          { 
            error: `Bạn cần hoàn thành ít nhất ${requiredTasks} công việc trong tháng này để đăng ký gói ${validatedData.plan}. Hiện tại bạn đã hoàn thành ${completedTasksCount} công việc.`,
            completedTasks: completedTasksCount,
            requiredTasks,
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
          completedTasks: requiredTasks > 0 ? (completedTasksCount || 0) : 0,
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

