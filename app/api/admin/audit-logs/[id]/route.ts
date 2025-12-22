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

// GET /api/admin/audit-logs/[id] - Get audit log details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const log = await (prisma as any).adminAuditLog.findUnique({
      where: { id },
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
    })

    if (!log) {
      return NextResponse.json(
        { error: 'Không tìm thấy audit log' },
        { status: 404 }
      )
    }

    // Parse details JSON
    const logWithParsedDetails = {
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }

    return NextResponse.json({ data: logWithParsedDetails })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching audit log:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin audit log' },
      { status: 500 }
    )
  }
}

