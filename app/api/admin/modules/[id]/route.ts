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

// GET /api/admin/modules/[id] - Get module details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const module = await prisma.module.findUnique({
      where: { id },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Không tìm thấy module' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: module })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching module:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin module' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/modules/[id] - Update module
const updateModuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  config: z.string().optional(),
  version: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = updateModuleSchema.parse(body)

    // Get old module data for audit
    const oldModule = await prisma.module.findUnique({
      where: { id },
      select: { key: true, name: true, enabled: true, config: true },
    })

    if (!oldModule) {
      return NextResponse.json(
        { error: 'Không tìm thấy module' },
        { status: 404 }
      )
    }

    // Validate config is valid JSON if provided
    if (validatedData.config) {
      try {
        JSON.parse(validatedData.config)
      } catch {
        return NextResponse.json(
          { error: 'Config phải là JSON hợp lệ' },
          { status: 400 }
        )
      }
    }

    // Update module
    const updateData: any = {}
    if (validatedData.name) {
      updateData.name = validatedData.name.trim()
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description?.trim()
    }
    if (validatedData.enabled !== undefined) {
      updateData.enabled = validatedData.enabled
    }
    if (validatedData.config !== undefined) {
      updateData.config = validatedData.config
    }
    if (validatedData.version) {
      updateData.version = validatedData.version
    }

    const module = await prisma.module.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'module.update',
      'module',
      module.id,
      {
        key: module.key,
        old: oldModule,
        new: {
          name: module.name,
          enabled: module.enabled,
          config: module.config,
        },
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Cập nhật module thành công',
      data: module,
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
    console.error('Error updating module:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật module' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/modules/[id] - Delete module
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    const module = await prisma.module.findUnique({
      where: { id },
      select: { id: true, key: true, name: true },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Không tìm thấy module' },
        { status: 404 }
      )
    }

    // Delete module
    await prisma.module.delete({
      where: { id },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'module.delete',
      'module',
      module.id,
      { key: module.key, name: module.name },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Xóa module thành công',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa module' },
      { status: 500 }
    )
  }
}

