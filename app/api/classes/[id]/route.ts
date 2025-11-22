import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateClassSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).optional(),
  grade: z.string().min(1).optional(),
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
    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check access
    if (session.user.role === 'ADMIN') {
      // ADMIN can access all classes
    } else if (session.user.role === 'TEACHER') {
      if (classItem.teacherId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // STUDENT/PARENT can only access classes they're enrolled in
      const isEnrolled = await prisma.classEnrollment.findUnique({
        where: {
          userId_classId: {
            userId: session.user.id,
            classId: id,
          },
        },
      })
      if (!isEnrolled) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(classItem)
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require TEACHER or ADMIN role
    const { session, error } = await requireRoleAPI(['TEACHER', 'ADMIN'])
    if (error) {
      return error
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateClassSchema.parse(body)

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check permission: TEACHER can only edit their own classes
    if (session.user.role === 'TEACHER' && existingClass.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể chỉnh sửa lớp học của mình' },
        { status: 403 }
      )
    }

    // Check if code is being changed and if new code already exists
    if (validatedData.code && validatedData.code !== existingClass.code) {
      const codeExists = await prisma.class.findUnique({
        where: { code: validatedData.code },
      })
      if (codeExists) {
        return NextResponse.json(
          { error: 'Mã lớp học đã tồn tại' },
          { status: 400 }
        )
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: validatedData,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating class:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật lớp học' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require TEACHER or ADMIN role
    const { session, error } = await requireRoleAPI(['TEACHER', 'ADMIN'])
    if (error) {
      return error
    }

    const { id } = await params

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check permission: TEACHER can only delete their own classes
    if (session.user.role === 'TEACHER' && existingClass.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể xóa lớp học của mình' },
        { status: 403 }
      )
    }

    // Delete class (cascade will handle related records)
    await prisma.class.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Lớp học đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting class:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa lớp học' },
      { status: 500 }
    )
  }
}

