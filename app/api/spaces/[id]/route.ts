import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireSpaceAccess } from '@/lib/space-rbac-middleware'
import { z } from 'zod'

const updateSpaceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE']).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  overview: z.string().nullable().optional(), // JSON string
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
    const accessCheck = await requireSpaceAccess(id, 'read')
    if (!accessCheck.hasAccess) {
      return accessCheck.error
    }

    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { order: 'asc' },
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
        departments: {
          include: {
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
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            departments: true,
            documents: true,
          },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    return NextResponse.json(space)
  } catch (error) {
    console.error('Error fetching space:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin space' },
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

    const { id } = await params

    // Check if user has permission to update space
    const existingSpace = await prisma.space.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!existingSpace) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    const canManage =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN' ||
      existingSpace.members.some((m) => m.canManage)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật space' },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Request body không hợp lệ', details: 'Không thể parse JSON' },
        { status: 400 }
      )
    }

    let validatedData
    try {
      validatedData = updateSpaceSchema.parse(body)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    const updateData: any = { ...validatedData }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    const updatedSpace = await prisma.space.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            members: true,
            departments: true,
          },
        },
      },
    })

    return NextResponse.json(updatedSpace, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Space không tồn tại' },
          { status: 404 }
        )
      }
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Dữ liệu đã tồn tại (trùng lặp)' },
          { status: 400 }
        )
      }
    }
    
    console.error('Error updating space:', error)
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật space'
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
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

    const { id } = await params

    // Check if space exists and user has permission
    const space = await prisma.space.findUnique({
      where: { id },
      include: {
        children: true,
        members: {
          where: { userId: session.user.id },
        },
        _count: {
          select: {
            members: true,
            departments: true,
            documents: true,
          },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Check permission - SUPER_ADMIN, ADMIN, or space manager (canManage) can delete
    const canManage =
      session.user.role === 'SUPER_ADMIN' ||
      session.user.role === 'ADMIN' ||
      space.members.some((m) => m.canManage)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa space này' },
        { status: 403 }
      )
    }

    if (space.children.length > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa space có space con. Vui lòng xóa các space con trước.' },
        { status: 400 }
      )
    }

    if (space._count.members > 0 || space._count.departments > 0 || space._count.documents > 0) {
      // Soft delete by setting isActive to false
      await prisma.space.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({ message: 'Space đã được vô hiệu hóa' })
    }

    await prisma.space.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Space đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting space:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa space' },
      { status: 500 }
    )
  }
}

