import { prisma } from '@/lib/prisma'

const PLAN_REQUIREMENTS: Record<string, number> = {
  STANDARD: 50,
  PRO: 290,
  ENTERPRISE: 0,
}

/**
 * Auto-activate Premium subscription when user completes enough tasks
 * This is called after a task is marked as completed
 */
export async function checkAndActivatePremium(userId: string) {
  try {
    // Check if user already has active premium
    const activeSubscription = await prisma.premiumSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
    })

    // If already has active premium, skip
    if (activeSubscription) {
      return { activated: false, reason: 'Already has active premium' }
    }

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

    const totalCompletedTasks = completedTasksCount + completedAssignmentsCount

    // Determine which plan the user qualifies for (highest priority)
    let selectedPlan: string | null = null
    if (totalCompletedTasks >= PLAN_REQUIREMENTS.PRO) {
      selectedPlan = 'PRO'
    } else if (totalCompletedTasks >= PLAN_REQUIREMENTS.STANDARD) {
      selectedPlan = 'STANDARD'
    }

    if (!selectedPlan) {
      return { activated: false, reason: 'Not enough completed tasks', completedTasks: totalCompletedTasks }
    }

    // Calculate subscription end date (1 month from now)
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)

    // Create premium subscription
    let subscription = null
    try {
      subscription = await prisma.premiumSubscription.create({
        data: {
          userId,
          plan: selectedPlan,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          activatedBy: 'TASKS',
          completedTasks: totalCompletedTasks,
        },
      })
    } catch (error: any) {
      // If subscription table doesn't exist yet, just update user
      console.log('Subscription table not available yet, skipping subscription creation')
    }

    // Update user to premium
    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
    })

    return {
      activated: true,
      plan: selectedPlan,
      subscription,
      completedTasks: totalCompletedTasks,
    }
  } catch (error: any) {
    console.error('Error auto-activating premium:', error)
    return { activated: false, error: error.message }
  }
}

/**
 * Check and expire premium subscriptions that have passed their end date
 * This should be called periodically (e.g., via cron job or on user login)
 */
export async function checkAndExpirePremiumSubscriptions() {
  try {
    const now = new Date()

    // Find all active subscriptions that have expired
    const expiredSubscriptions = await prisma.premiumSubscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    })

    if (expiredSubscriptions.length === 0) {
      return { expired: 0 }
    }

    // Update expired subscriptions
    const userIds = expiredSubscriptions.map((sub) => sub.userId)
    
    await prisma.premiumSubscription.updateMany({
      where: {
        id: { in: expiredSubscriptions.map((sub) => sub.id) },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    // Check if users still have other active subscriptions
    for (const userId of userIds) {
      const activeSubscription = await prisma.premiumSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: now },
        },
      })

      // If no active subscription, remove premium status
      if (!activeSubscription) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: false },
        })
      }
    }

    return { expired: expiredSubscriptions.length }
  } catch (error: any) {
    console.error('Error expiring premium subscriptions:', error)
    return { expired: 0, error: error.message }
  }
}

