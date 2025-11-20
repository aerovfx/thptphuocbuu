import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-helpers'
import { z } from 'zod'

const classSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  subject: z.string().min(1),
  grade: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    // Require TEACHER or ADMIN role
    const { session, error } = await requireRoleAPI(['TEACHER', 'ADMIN'])
    if (error) {
      return error
    }

    const body = await request.json()
    const validatedData = classSchema.parse(body)

    const existingClass = await prisma.class.findUnique({
      where: { code: validatedData.code },
    })

    if (existingClass) {
      return NextResponse.json(
        { error: 'Mã lớp học đã tồn tại' },
        { status: 400 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        ...validatedData,
        teacherId: session.user.id,
      },
      include: {
        teacher: true,
      },
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating class:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo lớp học' },
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

    let classes
    if (session.user.role === 'TEACHER') {
      classes = await prisma.class.findMany({
        where: { teacherId: session.user.id },
        include: {
          teacher: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      classes = await prisma.class.findMany({
        where: { enrollments: { some: { userId: session.user.id } } },
        include: {
          teacher: true,
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

