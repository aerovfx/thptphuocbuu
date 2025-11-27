import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'TO_CHUYEN_MON',
    'TO_HANH_CHINH',
    'BAN_TT',
    'BAN_TAI_CHINH',
    'BAN_Y_TE',
    'DOAN_DANG',
    'OTHER',
  ]),
  spaceId: z.string().optional(),
  leaderId: z.string().optional(),
  subject: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const spaceId = searchParams.get('spaceId')
    const subject = searchParams.get('subject')
    const includeMembers = searchParams.get('includeMembers') === 'true'

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (spaceId) {
      where.spaceId = spaceId
    }
    if (subject) {
      where.subject = subject
    }

    const includeClause: any = {
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
    }

    if (includeMembers) {
      includeClause.members = {
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
      }
    }

    const departments = await prisma.department.findMany({
      where,
      include: includeClause,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách departments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN, SUPER_ADMIN, or BGH can create departments
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo department' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createDepartmentSchema.parse(body)

    // Check if code already exists
    const existing = await prisma.department.findUnique({
      where: { code: validatedData.code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Mã department đã tồn tại' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
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

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo department' },
      { status: 500 }
    )
  }
}

