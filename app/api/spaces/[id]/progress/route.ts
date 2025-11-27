import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getCurrentAcademicYear } from '@/lib/academic-year'

const createProgressLogSchema = z.object({
  progress: z.number().min(0).max(100),
  milestone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  checklist: z.string().optional().nullable(), // JSON array string
  order: z.number().optional(),
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

    // Verify space exists
    const space = await prisma.space.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!space) {
      return NextResponse.json({ error: 'Space không tồn tại' }, { status: 404 })
    }

    // Get progress logs
    let logs
    try {
      logs = await prisma.spaceProgressLog.findMany({
        where: { spaceId: id },
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
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      })
    } catch (prismaError: any) {
      console.error('Prisma error fetching progress logs:', prismaError)
      console.error('Prisma error code:', prismaError?.code)
      console.error('Prisma error message:', prismaError?.message)
      
      // Check if it's a known Prisma error
      if (prismaError?.code === 'P2021') {
        return NextResponse.json(
          { 
            error: 'Bảng space_progress_logs chưa được tạo trong database',
            details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Lỗi khi truy vấn database',
          details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Error fetching progress logs:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi lấy lịch sử tiến độ',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify space exists and user has permission
    const space = await prisma.space.findUnique({
      where: { id },
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

    const body = await request.json()
    const validatedData = createProgressLogSchema.parse(body)

    // Create progress log
    const progressLog = await prisma.spaceProgressLog.create({
      data: {
        spaceId: id,
        progress: validatedData.progress,
        milestone: validatedData.milestone,
        description: validatedData.description,
        checklist: validatedData.checklist || null,
        order: validatedData.order || 0,
        createdById: session.user.id,
      },
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

    // Update space progress
    const updateData: any = {
      progress: validatedData.progress,
    }

    // If progress reaches 100%, automatically archive the space
    if (validatedData.progress >= 100) {
      const currentAcademicYear = getCurrentAcademicYear()
      updateData.archivedAt = new Date()
      // Only set academicYear if it's not already set
      if (!space.academicYear) {
        updateData.academicYear = currentAcademicYear
      }
      updateData.isActive = false // Mark as inactive when archived
    }

    try {
      await prisma.space.update({
        where: { id },
        data: updateData,
      })
    } catch (updateError: any) {
      console.error('Error updating space:', updateError)
      console.error('Update data:', updateData)
      throw updateError
    }

    return NextResponse.json(progressLog, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating progress log:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật tiến độ' },
      { status: 500 }
    )
  }
}

