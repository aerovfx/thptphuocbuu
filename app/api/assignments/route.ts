import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-helpers'
import { z } from 'zod'

const assignmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  classId: z.string().min(1),
  dueDate: z.string().datetime(),
  maxScore: z.number().int().min(1).max(1000).default(100),
})

export async function POST(request: Request) {
  try {
    // Require TEACHER or ADMIN role
    const { session, error } = await requireRoleAPI(['TEACHER', 'ADMIN'])
    if (error) {
      return error
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    // Verify the class exists and teacher owns it
    const classItem = await prisma.class.findUnique({
      where: { id: validatedData.classId },
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 })
    }

    if (classItem.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo bài học cho lớp này' },
        { status: 403 }
      )
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        classId: validatedData.classId,
        teacherId: session.user.id,
        dueDate: new Date(validatedData.dueDate),
        maxScore: validatedData.maxScore,
      },
      include: {
        class: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo bài học' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    // Verify access
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 })
    }

    // Check if user has access
    const isTeacher = classItem.teacherId === session.user.id
    const isStudent = classItem.enrollments.length > 0
    const isAdmin = session.user.role === 'ADMIN'

    if (!isTeacher && !isStudent && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập lớp học này' },
        { status: 403 }
      )
    }

    const assignments = await prisma.assignment.findMany({
      where: { classId },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

