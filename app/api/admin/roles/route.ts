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

// GET /api/admin/roles - List all roles
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                resource: true,
                action: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: {
            userAssignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: roles })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách vai trò' },
      { status: 500 }
    )
  }
}

// POST /api/admin/roles - Create role
const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(), // Array of permission IDs
})

export async function POST(request: Request) {
  try {
    const session = await requireAdmin()
    const body = await request.json()

    const validatedData = createRoleSchema.parse(body)

    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: validatedData.name },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Tên vai trò đã tồn tại' },
        { status: 400 }
      )
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name: validatedData.name.trim(),
        description: validatedData.description?.trim(),
        createdById: session.user.id,
        rolePermissions: validatedData.permissions
          ? {
              create: validatedData.permissions.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                resource: true,
                action: true,
                description: true,
              },
            },
          },
        },
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'role.create',
      'role',
      role.id,
      { name: role.name, permissions: validatedData.permissions || [] },
      ipAddress,
      userAgent
    )

    return NextResponse.json(
      { message: 'Tạo vai trò thành công', data: role },
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
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo vai trò' },
      { status: 500 }
    )
  }
}

