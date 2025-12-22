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
    const resolvedParams = await params
    const { id } = resolvedParams
    
    if (!id) {
      return NextResponse.json(
        { error: 'Module ID không hợp lệ' },
        { status: 400 }
      )
    }
    
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
    let updatedModule
    try {
      updatedModule = await prisma.module.update({
        where: { id },
        data: { enabled: validatedData.enabled },
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
    } catch (updateError: any) {
      console.error('Error updating module:', updateError)
      // Check if it's a Prisma client sync issue
      if (updateError.message?.includes('Invalid') || updateError.code === 'P2009') {
        return NextResponse.json(
          { 
            error: 'Lỗi cập nhật module. Vui lòng chạy: npx prisma generate',
            details: process.env.NODE_ENV === 'development' ? {
              message: updateError.message,
              code: updateError.code,
            } : undefined
          },
          { status: 500 }
        )
      }
      throw new Error(`Failed to update module: ${updateError.message}`)
    }

    // Create audit log (non-blocking - don't fail if audit log fails)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    try {
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
    } catch (auditError) {
      // Log but don't fail the request if audit log fails
      console.error('Failed to create audit log (non-critical):', auditError)
    }

    // Serialize DateTime objects
    const serializeDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj
      if (obj instanceof Date || (typeof obj === 'object' && obj !== null && obj.constructor && obj.constructor.name === 'Date')) {
        try {
          return new Date(obj).toISOString()
        } catch {
          return obj.toString()
        }
      }
      if (Array.isArray(obj)) return obj.map(serializeDates)
      if (typeof obj === 'object') {
        const result: any = {}
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key]
            if (value instanceof Date || (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'Date')) {
              try {
                result[key] = new Date(value).toISOString()
              } catch {
                result[key] = value.toString()
              }
            } else if (Array.isArray(value)) {
              result[key] = value.map(serializeDates)
            } else if (value !== null && typeof value === 'object') {
              result[key] = serializeDates(value)
            } else {
              result[key] = value
            }
          }
        }
        return result
      }
      return obj
    }

    const serializedModule = serializeDates(updatedModule)
    
    // Final safety net
    let finalData
    try {
      finalData = JSON.parse(JSON.stringify(serializedModule, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString()
        }
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Date') {
          return new Date(value).toISOString()
        }
        return value
      }))
    } catch {
      finalData = serializedModule
    }

    // Format response to ensure all DateTime fields are serializable
    return NextResponse.json({
      message: validatedData.enabled
        ? 'Đã bật module'
        : 'Đã tắt module',
      data: finalData,
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
    console.error('Error enabling/disabling module:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      meta: error.meta,
      stack: error.stack,
    })
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `${error.message || 'Unknown error'}${error.code ? ` (Code: ${error.code})` : ''}`
      : 'Đã xảy ra lỗi khi cập nhật trạng thái module'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
          name: error.name,
        } : undefined
      },
      { status: 500 }
    )
  }
}

