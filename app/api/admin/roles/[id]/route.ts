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

// GET /api/admin/roles/[id] - Get role details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const role = await prisma.role.findUnique({
      where: { id },
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
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            assignedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Không tìm thấy vai trò' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: role })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin vai trò' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/roles/[id] - Update role
const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = updateRoleSchema.parse(body)

    // Get old role data for audit
    const oldRole = await prisma.role.findUnique({
      where: { id },
      select: { name: true, description: true },
    })

    if (!oldRole) {
      return NextResponse.json(
        { error: 'Không tìm thấy vai trò' },
        { status: 404 }
      )
    }

    // Check name uniqueness if name is being updated
    if (validatedData.name && validatedData.name !== oldRole.name) {
      const existingRole = await prisma.role.findUnique({
        where: { name: validatedData.name.trim() },
      })
      if (existingRole) {
        return NextResponse.json(
          { error: 'Tên vai trò đã tồn tại' },
          { status: 400 }
        )
      }
    }

    // Update role
    const updateData: any = {}
    if (validatedData.name) {
      updateData.name = validatedData.name.trim()
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description?.trim()
    }

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
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
      'role.update',
      'role',
      role.id,
      {
        old: oldRole,
        new: {
          name: role.name,
          description: role.description,
        },
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Cập nhật vai trò thành công',
      data: role,
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
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật vai trò' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/roles/[id] - Delete role
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userAssignments: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Không tìm thấy vai trò' },
        { status: 404 }
      )
    }

    // Check if role is assigned to any users
    if (role._count.userAssignments > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa vai trò đang được gán cho người dùng' },
        { status: 400 }
      )
    }

    // Delete role (cascade will delete rolePermissions)
    await prisma.role.delete({
      where: { id },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'role.delete',
      'role',
      role.id,
      { name: role.name },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Xóa vai trò thành công',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa vai trò' },
      { status: 500 }
    )
  }
}

