import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireDepartmentAccess } from '@/lib/space-rbac-middleware'
import { z } from 'zod'

const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  spaceId: z.string().nullable().optional(),
  leaderId: z.string().nullable().optional(),
  subject: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check access using RBAC
    const accessCheck = await requireDepartmentAccess(id, 'read')
    if (!accessCheck.hasAccess) {
      return accessCheck.error
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        space: true,
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            documents: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department không tồn tại' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin department' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN, SUPER_ADMIN, BGH, or department leader can update
    const department = await prisma.department.findUnique({
      where: { id: (await params).id },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department không tồn tại' }, { status: 404 })
    }

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    const isLeader = department.leaderId === session.user.id

    if (!allowedRoles.includes(session.user.role) && !isLeader) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật department này' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateDepartmentSchema.parse(body)

    const updated = await prisma.department.update({
      where: { id },
      data: validatedData,
      include: {
        space: true,
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            documents: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating department:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật department' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN or BGH can delete departments
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BGH') {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa department' },
        { status: 403 }
      )
    }

    const { id } = await params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            documents: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Department không tồn tại' }, { status: 404 })
    }

    if (department._count.members > 0 || department._count.documents > 0) {
      // Soft delete
      await prisma.department.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({ message: 'Department đã được vô hiệu hóa' })
    }

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Department đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa department' },
      { status: 500 }
    )
  }
}

