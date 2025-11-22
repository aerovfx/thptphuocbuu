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

const updatePermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
})

// PUT /api/admin/roles/[id]/permissions - Update role permissions
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = updatePermissionsSchema.parse(body)

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          select: {
            permissionId: true,
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

    // Get current permission IDs
    const currentPermissionIds = role.rolePermissions.map((rp) => rp.permissionId)
    const newPermissionIds = validatedData.permissionIds

    // Find permissions to add and remove
    const toAdd = newPermissionIds.filter((id) => !currentPermissionIds.includes(id))
    const toRemove = currentPermissionIds.filter((id) => !newPermissionIds.includes(id))

    // Verify all permission IDs exist
    if (newPermissionIds.length > 0) {
      const existingPermissions = await prisma.permission.findMany({
        where: {
          id: { in: newPermissionIds },
        },
        select: { id: true },
      })

      const existingIds = existingPermissions.map((p) => p.id)
      const invalidIds = newPermissionIds.filter((id) => !existingIds.includes(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Không tìm thấy quyền: ${invalidIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Update permissions
    await prisma.$transaction([
      // Remove old permissions
      ...(toRemove.length > 0
        ? [
            prisma.rolePermission.deleteMany({
              where: {
                roleId: id,
                permissionId: { in: toRemove },
              },
            }),
          ]
        : []),
      // Add new permissions
      ...(toAdd.length > 0
        ? [
            prisma.rolePermission.createMany({
              data: toAdd.map((permissionId) => ({
                roleId: id,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ])

    // Get updated role with permissions
    const updatedRole = await prisma.role.findUnique({
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
      },
    })

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'role.update_permissions',
      'role',
      role.id,
      {
        roleName: role.name,
        added: toAdd,
        removed: toRemove,
        finalPermissions: newPermissionIds,
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Cập nhật quyền thành công',
      data: updatedRole,
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
    console.error('Error updating role permissions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật quyền' },
      { status: 500 }
    )
  }
}

