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

// GET /api/admin/modules/[id]/permissions - Get module permissions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params
    const { id } = resolvedParams
    
    if (!id) {
      return NextResponse.json(
        { error: 'Module ID không hợp lệ' },
        { status: 400 }
      )
    }

    const moduleData = await prisma.module.findUnique({
      where: { id },
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
        modulePermissions: {
          select: {
            id: true,
            moduleId: true,
            permissionId: true,
            roleId: true,
            createdAt: true,
            permission: {
              select: {
                id: true,
                resource: true,
                action: true,
                description: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    })
    
    if (!moduleData) {
      return NextResponse.json(
        { error: 'Module không tồn tại' },
        { status: 404 }
      )
    }
    
    // Helper function to serialize DateTime objects recursively
    // Handles both Date objects and Prisma DateTime objects
    const serializeDates = (obj: any): any => {
      if (obj === null || obj === undefined) return obj
      
      // Check if it's a Date object (including Prisma DateTime)
      if (obj instanceof Date || (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Date')) {
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
            // Check for Date objects more thoroughly
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
    
    // Convert module to plain object with serialized dates - do this immediately after query
    const module = serializeDates(moduleData)

    // Get all available permissions (select only needed fields)
    const allPermissionsRaw = await prisma.permission.findMany({
      select: {
        id: true,
        resource: true,
        action: true,
        description: true,
        createdAt: true,
      },
      orderBy: { resource: 'asc' },
    })

    // Get all roles (select only needed fields)
    const allRolesRaw = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Serialize all DateTime objects immediately after query
    const serializedPermissions = serializeDates(allPermissionsRaw)
    const serializedRoles = serializeDates(allRolesRaw)

    // Build response object and serialize one more time to be absolutely sure
    const responseData = {
      module: {
        id: module.id,
        key: module.key,
        name: module.name,
        description: module.description,
        enabled: module.enabled,
        version: module.version,
        config: module.config,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      },
      modulePermissions: module.modulePermissions,
      availablePermissions: serializedPermissions,
      availableRoles: serializedRoles,
    }

    // Final serialization pass to catch any remaining Date objects
    let finalResponse = serializeDates(responseData)
    
    // Use JSON.parse(JSON.stringify()) as a final safety net to force serialization
    // This will convert any remaining Date objects to strings
    try {
      finalResponse = JSON.parse(JSON.stringify(finalResponse, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString()
        }
        // Handle Prisma DateTime objects
        if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Date') {
          return new Date(value).toISOString()
        }
        return value
      }))
    } catch (jsonError) {
      console.error('Error in JSON serialization:', jsonError)
      // If JSON serialization fails, use the serialized version
    }

    return NextResponse.json(finalResponse)
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching module permissions:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi lấy phân quyền module',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/modules/[id]/permissions - Update module permissions
const updateModulePermissionsSchema = z.object({
  permissions: z.array(
    z.object({
      permissionId: z.string(),
      roleId: z.string().nullable().optional(),
    })
  ),
})

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

    const module = await prisma.module.findUnique({
      where: { id },
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Module không tồn tại' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateModulePermissionsSchema.parse(body)

    // Delete existing module permissions
    await prisma.modulePermission.deleteMany({
      where: { moduleId: id },
    })

    // Create new module permissions (only if there are permissions to create)
    let modulePermissions = []
    if (validatedData.permissions && validatedData.permissions.length > 0) {
      // Validate all permissions exist before creating
      const permissionIds = validatedData.permissions.map(p => p.permissionId).filter(Boolean)
      const existingPermissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      })
      
      if (existingPermissions.length !== permissionIds.length) {
        return NextResponse.json(
          { error: 'Một hoặc nhiều quyền không tồn tại' },
          { status: 400 }
        )
      }

      // Validate roles if provided
      const roleIds = validatedData.permissions
        .map(p => p.roleId)
        .filter((id): id is string => id !== null && id !== undefined)
      
      if (roleIds.length > 0) {
        const existingRoles = await prisma.role.findMany({
          where: { id: { in: roleIds } },
        })
        
        if (existingRoles.length !== roleIds.length) {
          return NextResponse.json(
            { error: 'Một hoặc nhiều vai trò không tồn tại' },
            { status: 400 }
          )
        }
      }

      // Create permissions one by one to handle unique constraint errors
      for (const perm of validatedData.permissions) {
        try {
          const created = await prisma.modulePermission.create({
            data: {
              moduleId: id,
              permissionId: perm.permissionId,
              roleId: perm.roleId || null,
            },
          })
          modulePermissions.push(created)
        } catch (createError: any) {
          // If it's a unique constraint error, skip it (already exists)
          if (createError.code === 'P2002') {
            console.warn(`Module permission already exists: ${id}/${perm.permissionId}/${perm.roleId || 'null'}`)
            continue
          }
          throw createError
        }
      }
    }

    return NextResponse.json({
      message: 'Cập nhật phân quyền module thành công',
      modulePermissions,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error updating module permissions:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi cập nhật phân quyền module',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

