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

const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
})

// PUT /api/admin/users/[id]/roles - Assign roles to user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const validatedData = assignRolesSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        userRoles: {
          select: {
            roleId: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Verify all role IDs exist
    if (validatedData.roleIds.length > 0) {
      const existingRoles = await prisma.role.findMany({
        where: {
          id: { in: validatedData.roleIds },
        },
        select: { id: true },
      })

      const existingIds = existingRoles.map((r) => r.id)
      const invalidIds = validatedData.roleIds.filter((id) => !existingIds.includes(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Không tìm thấy vai trò: ${invalidIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Get current role IDs
    const currentRoleIds = user.userRoles.map((ur) => ur.roleId)
    const newRoleIds = validatedData.roleIds

    // Find roles to add and remove
    const toAdd = newRoleIds.filter((id) => !currentRoleIds.includes(id))
    const toRemove = currentRoleIds.filter((id) => !newRoleIds.includes(id))

    // Update user roles
    await prisma.$transaction([
      // Remove old roles
      ...(toRemove.length > 0
        ? [
            prisma.userRoleAssignment.deleteMany({
              where: {
                userId: id,
                roleId: { in: toRemove },
              },
            }),
          ]
        : []),
      // Add new roles
      ...(toAdd.length > 0
        ? [
            prisma.userRoleAssignment.createMany({
              data: toAdd.map((roleId) => ({
                userId: id,
                roleId,
                assignedById: session.user.id,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ])

    // Get updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
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

    // Create audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog(
      session.user.id,
      'user.assign_roles',
      'user',
      user.id,
      {
        userEmail: user.email,
        added: toAdd,
        removed: toRemove,
        finalRoles: newRoleIds,
      },
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      message: 'Gán vai trò thành công',
      data: updatedUser,
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
    console.error('Error assigning roles:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gán vai trò' },
      { status: 500 }
    )
  }
}

