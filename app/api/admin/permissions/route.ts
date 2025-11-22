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

// GET /api/admin/permissions - List all permissions
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    const where: any = {}
    if (resource) {
      where.resource = resource
    }

    const permissions = await prisma.permission.findMany({
      where,
      include: {
        _count: {
          select: {
            rolePermissions: true,
          },
        },
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })

    return NextResponse.json({ data: permissions })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách quyền' },
      { status: 500 }
    )
  }
}

// POST /api/admin/permissions - Create permission
const createPermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const validatedData = createPermissionSchema.parse(body)

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: validatedData.resource.trim(),
          action: validatedData.action.trim(),
        },
      },
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Quyền đã tồn tại' },
        { status: 400 }
      )
    }

    // Create permission
    const permission = await prisma.permission.create({
      data: {
        resource: validatedData.resource.trim(),
        action: validatedData.action.trim(),
        description: validatedData.description?.trim(),
      },
    })

    // Create audit log
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

    return NextResponse.json(
      { message: 'Tạo quyền thành công', data: permission },
      { status: 201 }
    )
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
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo quyền' },
      { status: 500 }
    )
  }
}

