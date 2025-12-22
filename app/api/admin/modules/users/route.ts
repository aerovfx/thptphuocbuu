import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BGH' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// GET /api/admin/modules/users - Get users with their module access
export async function GET(request: Request) {
  try {
    await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const premiumPlan = searchParams.get('premiumPlan')

    let whereClause: any = {}

    if (moduleId) {
      whereClause.moduleId = moduleId
    }

    if (userId) {
      whereClause.userId = userId
    }

    const accesses = await prisma.userModuleAccess.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isPremium: true,
            avatar: true,
          },
        },
        module: {
          select: {
            id: true,
            key: true,
            name: true,
            enabled: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
      take: 1000, // Limit to prevent huge responses
    })

    // Filter by role or premium plan if specified
    let filteredAccesses = accesses
    if (role) {
      filteredAccesses = filteredAccesses.filter((a) => a.user.role === role)
    }
    if (premiumPlan) {
      // Check if user has active subscription with this plan
      const userIds = filteredAccesses.map((a) => a.user.id)
      const subscriptions = await prisma.premiumSubscription.findMany({
        where: {
          userId: { in: userIds },
          plan: premiumPlan,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
        select: { userId: true },
      })
      const subscribedUserIds = new Set(subscriptions.map((s) => s.userId))
      filteredAccesses = filteredAccesses.filter((a) => subscribedUserIds.has(a.user.id))
    }

    return NextResponse.json({
      data: filteredAccesses,
      count: filteredAccesses.length,
    })
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching user module accesses:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách user module access' },
      { status: 500 }
    )
  }
}

