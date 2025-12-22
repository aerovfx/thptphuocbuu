import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Log module load
console.log('[permissions/route.ts] Module loaded')

// Helper function to check admin permission
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'BGH' && session.user.role !== 'SUPER_ADMIN')) {
    throw new Error('Unauthorized: Admin access required')
  }
  return session
}

// Helper function to serialize DateTime objects and handle Prisma special types
const serializeDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  
  // Handle Date objects
  if (obj instanceof Date || (typeof obj === 'object' && obj !== null && obj.constructor && obj.constructor.name === 'Date')) {
    try {
      return new Date(obj).toISOString()
    } catch {
      return obj.toString()
    }
  }
  
  // Handle BigInt (Prisma sometimes returns BigInt)
  if (typeof obj === 'bigint') {
    return Number(obj)
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeDates)
  }
  
  // Handle objects (but skip functions and special Prisma types)
  if (typeof obj === 'object') {
    // Skip functions
    if (typeof obj === 'function') {
      return undefined
    }
    
    const result: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Skip private/internal properties
        if (key.startsWith('_') && key !== '_count') {
          continue
        }
        
        const value = obj[key]
        
        // Skip functions
        if (typeof value === 'function') {
          continue
        }
        
        // Handle Date
        if (value instanceof Date || (typeof value === 'object' && value !== null && value.constructor && value.constructor.name === 'Date')) {
          try {
            result[key] = new Date(value).toISOString()
          } catch {
            result[key] = value.toString()
          }
        }
        // Handle BigInt
        else if (typeof value === 'bigint') {
          result[key] = Number(value)
        }
        // Handle arrays
        else if (Array.isArray(value)) {
          result[key] = value.map(serializeDates)
        }
        // Handle nested objects
        else if (value !== null && typeof value === 'object') {
          result[key] = serializeDates(value)
        }
        // Handle primitives
        else {
          result[key] = value
        }
      }
    }
    return result
  }
  
  return obj
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

// GET /api/admin/permissions - List all permissions
export async function GET(request: Request) {
  console.log('[GET /api/admin/permissions] Handler called')
  try {
    console.log('[GET /api/admin/permissions] Starting')
    const session = await requireAdmin()
    console.log('[GET /api/admin/permissions] Auth passed, user ID:', session.user.id)

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    const where: any = {}
    if (resource) {
      where.resource = resource
    }

    console.log('[GET /api/admin/permissions] Querying database')
    let permissions: any[]
    try {
      permissions = await prisma.permission.findMany({
        where,
        select: {
          id: true,
          resource: true,
          action: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              rolePermissions: true,
            },
          },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      })
      console.log('[GET /api/admin/permissions] Got', permissions.length, 'permissions via Prisma')
      
      // Note: If Prisma returns 0, we'll just return empty array
      // Raw SQL fallback removed to avoid potential issues
    } catch (dbError) {
      console.error('[GET /api/admin/permissions] Database query error:', dbError)
      console.error('[GET /api/admin/permissions] DB error details:', {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        code: (dbError as any)?.code,
        name: dbError instanceof Error ? dbError.name : undefined,
        meta: (dbError as any)?.meta,
      })
      throw dbError
    }

    // Simple serialization with better error handling
    const data: any[] = []
    for (const p of permissions) {
      try {
        // Check if createdAt is a valid Date object
        let createdAtStr: string
        if (p.createdAt instanceof Date) {
          createdAtStr = p.createdAt.toISOString()
        } else if (typeof p.createdAt === 'string') {
          // If it's already a string, try to parse it as a date first
          try {
            const date = new Date(p.createdAt)
            if (isNaN(date.getTime())) {
              console.warn('[GET /api/admin/permissions] Invalid date string for permission:', p.id, p.createdAt)
              createdAtStr = new Date().toISOString() // Fallback to current date
            } else {
              createdAtStr = date.toISOString()
            }
          } catch {
            createdAtStr = new Date().toISOString() // Fallback to current date
          }
        } else {
          console.warn('[GET /api/admin/permissions] Unexpected createdAt type for permission:', p.id, typeof p.createdAt, p.createdAt)
          createdAtStr = new Date().toISOString() // Fallback to current date
        }
        
        data.push({
          id: p.id,
          resource: p.resource,
          action: p.action,
          description: p.description,
          createdAt: createdAtStr,
          _count: {
            rolePermissions: p._count?.rolePermissions || 0,
          },
        })
      } catch (e) {
        console.error('[GET /api/admin/permissions] Error serializing permission:', p.id, e)
        // Skip this permission instead of crashing
        continue
      }
    }
    
    console.log('[GET /api/admin/permissions] Successfully serialized', data.length, 'out of', permissions.length, 'permissions')

    console.log('[GET /api/admin/permissions] Returning response with', data.length, 'items')
    const response = NextResponse.json({ data })
    console.log('[GET /api/admin/permissions] Response created successfully')
    return response
  } catch (error: any) {
    console.error('[GET /api/admin/permissions] Caught error:', error)
    
    try {
      const errorMessage = error?.message || String(error) || 'Unknown error'
      const errorCode = error?.code
      const errorName = error?.name
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('Admin access required')) {
        console.error('[GET /api/admin/permissions] Unauthorized error')
        return NextResponse.json({ error: errorMessage }, { status: 403 })
      }
      
      console.error('[GET /api/admin/permissions] Error details:', {
        message: errorMessage,
        code: errorCode,
        name: errorName,
        stack: error?.stack?.substring(0, 500),
        type: typeof error,
        constructor: error?.constructor?.name,
      })
      
      // Return more detailed error in development
      const devMessage = process.env.NODE_ENV === 'development' 
        ? `${errorMessage}${errorCode ? ` (Code: ${errorCode})` : ''}`
        : 'Đã xảy ra lỗi khi lấy danh sách quyền'
      
      const errorResponse = { 
        error: devMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          code: errorCode,
          name: errorName,
          type: typeof error,
        } : undefined
      }
      
      console.error('[GET /api/admin/permissions] Returning error response:', JSON.stringify(errorResponse, null, 2))
      return NextResponse.json(errorResponse, { status: 500 })
    } catch (responseError) {
      console.error('[GET /api/admin/permissions] Error creating error response:', responseError)
      // Last resort: return a simple error response
      try {
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      } catch (finalError) {
        console.error('[GET /api/admin/permissions] Complete failure, cannot return any response:', finalError)
        // This should never happen, but if it does, Next.js will handle it
        throw finalError
      }
    }
  }
}

// POST /api/admin/permissions - Create permission
const createPermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  console.log('[POST /api/admin/permissions] Handler called')
  try {
    console.log('[POST /api/admin/permissions] Starting')
    const session = await requireAdmin()
    console.log('[POST /api/admin/permissions] Auth passed, user:', session.user.id)

    let body
    try {
      body = await request.json()
      console.log('[POST /api/admin/permissions] Body received:', body)
    } catch (parseError) {
      console.error('[POST /api/admin/permissions] Error parsing JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    let validatedData
    try {
      validatedData = createPermissionSchema.parse(body)
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('[POST /api/admin/permissions] Validation error:', zodError.errors)
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: zodError.errors },
          { status: 400 }
        )
      }
      throw zodError
    }

    // Trim and validate
    const resource = validatedData.resource.trim()
    const action = validatedData.action.trim()
    const description = validatedData.description?.trim() || null

    // Validate non-empty after trim
    if (!resource || resource.length === 0) {
      return NextResponse.json(
        { error: 'Resource không được để trống' },
        { status: 400 }
      )
    }
    if (!action || action.length === 0) {
      return NextResponse.json(
        { error: 'Action không được để trống' },
        { status: 400 }
      )
    }

    console.log('[POST /api/admin/permissions] Checking for existing permission')
    // Check if permission already exists
    let existingPermission
    try {
      existingPermission = await prisma.permission.findUnique({
        where: {
          resource_action: {
            resource,
            action,
          },
        },
      })
    } catch (dbError) {
      console.error('[POST /api/admin/permissions] Error checking existing permission:', dbError)
      throw dbError
    }

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Quyền đã tồn tại' },
        { status: 400 }
      )
    }

    console.log('[POST /api/admin/permissions] Creating permission')
    // Create permission
    let permission
    try {
      // Explicitly provide createdAt to ensure it's set correctly
      const now = new Date()
      permission = await prisma.permission.create({
        data: {
          resource,
          action,
          description,
          createdAt: now, // Explicitly set createdAt
        },
        select: {
          id: true,
          resource: true,
          action: true,
          description: true,
          createdAt: true,
        },
      })
      console.log('[POST /api/admin/permissions] Permission created:', permission.id)
    } catch (createError: any) {
      console.error('[POST /api/admin/permissions] Error creating permission:', createError)
      console.error('[POST /api/admin/permissions] Create error details:', {
        message: createError instanceof Error ? createError.message : String(createError),
        code: createError?.code,
        name: createError instanceof Error ? createError.name : undefined,
        meta: createError?.meta,
        cause: createError?.cause,
      })
      
      // Handle specific Prisma errors
      if (createError?.code === 'P2002') {
        // Unique constraint violation
        const target = createError?.meta?.target
        if (target && Array.isArray(target) && target.includes('resource') && target.includes('action')) {
          return NextResponse.json(
            { error: 'Quyền đã tồn tại (resource và action đã được sử dụng)' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Quyền đã tồn tại' },
          { status: 400 }
        )
      }
      
      if (createError?.code === 'P2023') {
        // Invalid data format
        return NextResponse.json(
          { 
            error: 'Dữ liệu không hợp lệ',
            details: process.env.NODE_ENV === 'development' ? {
              message: createError.message,
              meta: createError.meta,
            } : undefined
          },
          { status: 400 }
        )
      }
      
      throw createError
    }

    // Create audit log (non-blocking)
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined
      await createAuditLog(
        session.user.id,
        'permission.create',
        'permission',
        permission.id,
        {
          resource: permission.resource,
          action: permission.action,
        },
        ipAddress,
        userAgent
      )
    } catch (auditError) {
      console.error('[POST /api/admin/permissions] Audit log failed (non-critical):', auditError)
    }

    // Serialize dates manually
    let serialized
    try {
      serialized = {
        ...permission,
        createdAt: permission.createdAt instanceof Date ? permission.createdAt.toISOString() : String(permission.createdAt),
      }
      console.log('[POST /api/admin/permissions] Serialized data:', serialized)
    } catch (serializeError) {
      console.error('[POST /api/admin/permissions] Error serializing:', serializeError)
      // Fallback serialization
      serialized = {
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        createdAt: String(permission.createdAt),
      }
    }

    console.log('[POST /api/admin/permissions] Returning success response')
    return NextResponse.json(
      { message: 'Tạo quyền thành công', data: serialized },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/admin/permissions] Caught error:', error)
    
    try {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: error.errors },
          { status: 400 }
        )
      }
      if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      
      console.error('[POST /api/admin/permissions] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
        meta: (error as any)?.meta,
      })
      
      // Return more detailed error in development
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? `${error instanceof Error ? error.message : String(error)}${(error as any)?.code ? ` (Code: ${(error as any).code})` : ''}`
        : 'Đã xảy ra lỗi khi tạo quyền'
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? {
            message: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code,
            name: error instanceof Error ? error.name : undefined,
            meta: (error as any)?.meta,
          } : undefined
        },
        { status: 500 }
      )
    } catch (responseError) {
      console.error('[POST /api/admin/permissions] Error creating error response:', responseError)
      return NextResponse.json(
        { error: 'Internal server error - failed to process error' },
        { status: 500 }
      )
    }
  }
}

