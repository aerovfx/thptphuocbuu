import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// GET /api/admin/audit-logs - List audit logs with filters
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const actorId = searchParams.get('actorId')
    const action = searchParams.get('action')
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (actorId) {
      where.actorId = actorId
    }

    if (action) {
      where.action = action
    }

    if (targetType) {
      where.targetType = targetType
    }

    if (targetId) {
      where.targetId = targetId
    }

    if (from || to) {
      where.createdAt = {}
      if (from) {
        where.createdAt.gte = new Date(from)
      }
      if (to) {
        where.createdAt.lte = new Date(to)
      }
    }

    // Get audit logs and total count
    const [logs, total] = await Promise.all([
      (prisma as any).adminAuditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      (prisma as any).adminAuditLog.count({ where }),
    ])

    // Parse details JSON for each log
    const logsWithParsedDetails = logs.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }))

    return NextResponse.json({
      data: logsWithParsedDetails,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy lịch sử audit' },
      { status: 500 }
    )
  }
}

