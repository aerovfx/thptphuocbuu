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

const enableModuleSchema = z.object({
  enabled: z.boolean(),
  reason: z.string().optional(),
})

// PUT /api/admin/modules/[id]/enable - Enable/disable module
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = enableModuleSchema.parse(body)

    const module = await prisma.module.findUnique({
      where: { id },
      select: { id: true, key: true, name: true, enabled: true },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Không tìm thấy module' },
        { status: 404 }
      )
    }

    // Update enabled status
    const updatedModule = await prisma.module.update({
      where: { id },
      data: { enabled: validatedData.enabled },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      `module.${validatedData.enabled ? 'enable' : 'disable'}`,
      'module',
      module.id,
      {
        key: module.key,
        name: module.name,
        oldEnabled: module.enabled,
        newEnabled: validatedData.enabled,
        reason: validatedData.reason,
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: validatedData.enabled
        ? 'Đã bật module'
        : 'Đã tắt module',
      data: updatedModule,
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
    console.error('Error enabling/disabling module:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật trạng thái module' },
      { status: 500 }
    )
  }
}

