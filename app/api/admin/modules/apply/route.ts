import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BGH' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// Helper function to create audit log
async function createAuditLog(
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

const applyModulesSchema = z.object({
  moduleIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một module'),
  criteria: z.object({
    type: z.enum(['PREMIUM_PLAN', 'ROLE', 'MANUAL', 'ALL']),
    premiumPlans: z.array(z.enum(['STANDARD', 'PRO', 'ENTERPRISE'])).optional(),
    roles: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }),
  action: z.enum(['GRANT', 'REVOKE']),
  reason: z.string().optional(),
})

// POST /api/admin/modules/apply - Apply modules to users based on criteria
export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()
    const validatedData = applyModulesSchema.parse(body)

    const { moduleIds, criteria, action, reason } = validatedData

    // Verify all modules exist
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, key: true, name: true, enabled: true },
    })

    if (modules.length !== moduleIds.length) {
      return NextResponse.json(
        { error: 'Một số module không tồn tại' },
        { status: 400 }
      )
    }

    // Check if modules are enabled
    const disabledModules = modules.filter((m) => !m.enabled)
    if (disabledModules.length > 0) {
      return NextResponse.json(
        { 
          error: `Các module sau chưa được bật: ${disabledModules.map(m => m.name).join(', ')}`,
          disabledModules: disabledModules.map(m => ({ id: m.id, name: m.name }))
        },
        { status: 400 }
      )
    }

    // Build user query based on criteria
    let whereClause: any = {}

    if (criteria.type === 'PREMIUM_PLAN') {
      if (!criteria.premiumPlans || criteria.premiumPlans.length === 0) {
        return NextResponse.json(
          { error: 'Phải chọn ít nhất một gói premium' },
          { status: 400 }
        )
      }

      // Find users with active premium subscriptions matching the plans
      const subscriptions = await prisma.premiumSubscription.findMany({
        where: {
          plan: { in: criteria.premiumPlans },
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
        select: { userId: true },
        distinct: ['userId'],
      })

      const userIds = subscriptions.map((s) => s.userId)
      if (userIds.length === 0) {
        return NextResponse.json(
          { 
            message: 'Không tìm thấy user nào phù hợp với tiêu chí',
            affectedUsers: 0,
            affectedModules: 0,
          }
        )
      }

      whereClause.id = { in: userIds }
    } else if (criteria.type === 'ROLE') {
      if (!criteria.roles || criteria.roles.length === 0) {
        return NextResponse.json(
          { error: 'Phải chọn ít nhất một role' },
          { status: 400 }
        )
      }

      whereClause.role = { in: criteria.roles }
    } else if (criteria.type === 'MANUAL') {
      if (!criteria.userIds || criteria.userIds.length === 0) {
        return NextResponse.json(
          { error: 'Phải chọn ít nhất một user' },
          { status: 400 }
        )
      }

      whereClause.id = { in: criteria.userIds }
    } else if (criteria.type === 'ALL') {
      // All users - no additional filter
    }

    // Get users matching criteria
    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { 
          message: 'Không tìm thấy user nào phù hợp với tiêu chí',
          affectedUsers: 0,
          affectedModules: 0,
        }
      )
    }

    const userIds = users.map((u) => u.id)
    let affectedCount = 0

    if (action === 'GRANT') {
      // Grant access: Create UserModuleAccess records
      const accessRecords = []
      for (const userId of userIds) {
        for (const moduleId of moduleIds) {
          try {
            await prisma.userModuleAccess.upsert({
              where: {
                userId_moduleId: {
                  userId,
                  moduleId,
                },
              },
              update: {
                grantedBy: session.user.id,
                grantedAt: new Date(),
                reason: reason || criteria.type,
                updatedAt: new Date(),
              },
              create: {
                userId,
                moduleId,
                grantedBy: session.user.id,
                reason: reason || criteria.type,
              },
            })
            affectedCount++
          } catch (error: any) {
            // Skip if already exists (upsert should handle this, but just in case)
            if (error.code !== 'P2002') {
              console.error(`Error granting access to user ${userId} for module ${moduleId}:`, error)
            }
          }
        }
      }
    } else {
      // Revoke access: Delete UserModuleAccess records
      const deleted = await prisma.userModuleAccess.deleteMany({
        where: {
          userId: { in: userIds },
          moduleId: { in: moduleIds },
        },
      })
      affectedCount = deleted.count
    }

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      `module.${action.toLowerCase()}`,
      'module',
      null,
      {
        moduleIds,
        moduleNames: modules.map((m) => m.name),
        criteria,
        action,
        affectedUsers: users.length,
        affectedCount,
        reason,
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: action === 'GRANT' 
        ? `Đã cấp quyền truy cập ${moduleIds.length} module cho ${users.length} user`
        : `Đã thu hồi quyền truy cập ${moduleIds.length} module từ ${users.length} user`,
      affectedUsers: users.length,
      affectedModules: moduleIds.length,
      affectedCount,
      modules: modules.map((m) => ({ id: m.id, name: m.name, key: m.key })),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error applying modules:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi áp dụng modules' },
      { status: 500 }
    )
  }
}

