import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProgressLogSchema = z.object({
  progress: z.number().min(0).max(100).optional(),
  milestone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  checklist: z.string().optional().nullable(), // JSON array string
  order: z.number().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, logId } = await params

    // Verify space exists and user has permission
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Check permission
    const canManage =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN' ||
      space.members.some((m) => m.canManage)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật tiến độ' },
        { status: 403 }
      )
    }

    // Verify log exists
    const existingLog = await prisma.spaceProgressLog.findUnique({
      where: { id: logId },
    })

    if (!existingLog || existingLog.spaceId !== spaceId) {
      return NextResponse.json({ error: 'Progress log không tồn tại' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateProgressLogSchema.parse(body)

    const updateData: any = {}
    if (validatedData.progress !== undefined) updateData.progress = validatedData.progress
    if (validatedData.milestone !== undefined) updateData.milestone = validatedData.milestone
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.checklist !== undefined) updateData.checklist = validatedData.checklist
    if (validatedData.order !== undefined) updateData.order = validatedData.order

    // If progress is updated, also update space progress
    if (validatedData.progress !== undefined) {
      await prisma.space.update({
        where: { id: spaceId },
        data: { progress: validatedData.progress },
      })
    }

    const updatedLog = await prisma.spaceProgressLog.update({
      where: { id: logId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(updatedLog)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating progress log:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật progress log' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: spaceId, logId } = await params

    // Verify space exists and user has permission
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Check permission
    const canManage =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN' ||
      space.members.some((m) => m.canManage)

    if (!canManage) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa progress log' },
        { status: 403 }
      )
    }

    await prisma.spaceProgressLog.delete({
      where: { id: logId },
    })

    return NextResponse.json({ message: 'Progress log đã được xóa' })
  } catch (error) {
    console.error('Error deleting progress log:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa progress log' },
      { status: 500 }
    )
  }
}

