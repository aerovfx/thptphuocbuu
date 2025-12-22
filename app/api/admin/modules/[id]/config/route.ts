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

const updateConfigSchema = z.object({
  config: z.string(), // JSON string
})

// PUT /api/admin/modules/[id]/config - Update module config
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const resolvedParams = await params
    const { id } = resolvedParams
    
    if (!id) {
      return NextResponse.json(
        { error: 'Module ID không hợp lệ' },
        { status: 400 }
      )
    }
    
    const body = await request.json()

    const validatedData = updateConfigSchema.parse(body)

    // Validate config is valid JSON
    let parsedConfig: any
    try {
      parsedConfig = JSON.parse(validatedData.config)
    } catch {
      return NextResponse.json(
        { error: 'Config phải là JSON hợp lệ' },
        { status: 400 }
      )
    }

    const module = await prisma.module.findUnique({
      where: { id },
      select: { id: true, key: true, name: true, config: true },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Không tìm thấy module' },
        { status: 404 }
      )
    }

    // Update config
    const updatedModule = await prisma.module.update({
      where: { id },
      data: { config: validatedData.config },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        enabled: true,
        version: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'module.update_config',
      'module',
      module.id,
      {
        key: module.key,
        name: module.name,
        oldConfig: module.config,
        newConfig: parsedConfig,
      },
      ipAddress,
      userAgent
    )

    // Format response to ensure all DateTime fields are serializable
    return NextResponse.json({
      message: 'Cập nhật cấu hình module thành công',
      data: {
        id: updatedModule.id,
        key: updatedModule.key,
        name: updatedModule.name,
        description: updatedModule.description,
        enabled: updatedModule.enabled,
        version: updatedModule.version,
        config: updatedModule.config,
        createdAt: updatedModule.createdAt ? updatedModule.createdAt.toISOString() : null,
        updatedAt: updatedModule.updatedAt ? updatedModule.updatedAt.toISOString() : null,
      },
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
    console.error('Error updating module config:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi cập nhật cấu hình module',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

