import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
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

// App-level simplification: we treat user status as only ACTIVE or UNACTIVE.
// UNACTIVE is stored as SUSPENDED in DB.
const suspendSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
})

// POST /api/admin/users/[id]/suspend - Suspend or activate user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = suspendSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, status: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Update status
    // If user was previously DELETED/PENDING, reactivating sets to ACTIVE.
    // Deactivating always sets to SUSPENDED.
    await prisma.user.update({
      where: { id },
      data: { status: validatedData.status },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      `user.${validatedData.status.toLowerCase()}`,
      'user',
      user.id,
      {
        email: user.email,
        oldStatus: user.status,
        newStatus: validatedData.status,
        reason: validatedData.reason,
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: validatedData.status === 'SUSPENDED' 
        ? 'Đã tạm dừng tài khoản người dùng' 
        : 'Đã kích hoạt lại tài khoản người dùng',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật trạng thái người dùng' },
      { status: 500 }
    )
  }
}

