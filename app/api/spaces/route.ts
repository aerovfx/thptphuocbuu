import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getCurrentAcademicYear } from '@/lib/academic-year'

const createSpaceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'SCHOOL_HUB',
    'BGH_SPACE',
    'BAN_TT',
    'TO_CHUYEN_MON',
    'TO_HANH_CHINH',
    'BAO_VE',
    'LAO_CONG',
    'LOP',
    'DOAN_DANG',
    'TAI_CHINH',
    'Y_TE',
    'PUBLIC_NEWS',
  ]),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE']).default('INTERNAL'),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().default(0),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const parentId = searchParams.get('parentId')
    const includeChildren = searchParams.get('includeChildren') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const academicYear = searchParams.get('academicYear')

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (parentId) {
      where.parentId = parentId
    } else if (parentId === null) {
      where.parentId = null
    }
    
    // By default, exclude archived spaces unless explicitly requested
    if (!includeArchived) {
      where.archivedAt = null // Only show non-archived spaces
    }
    
    if (academicYear) {
      where.academicYear = academicYear
    }

    let spaces
    try {
      spaces = await prisma.space.findMany({
        where,
        include: {
          parent: true,
          children: includeChildren,
          _count: {
            select: {
              members: true,
              departments: true,
            },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      })
    } catch (prismaError: any) {
      console.error('Prisma error fetching spaces:', prismaError)
      console.error('Prisma error code:', prismaError?.code)
      console.error('Prisma error message:', prismaError?.message)
      console.error('Where clause:', where)
      
      return NextResponse.json(
        { 
          error: 'Lỗi khi truy vấn database',
          details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(spaces)
  } catch (error: any) {
    console.error('Error fetching spaces:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi lấy danh sách spaces',
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN or SUPER_ADMIN can create spaces
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Bạn không có quyền tạo space' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createSpaceSchema.parse(body)

    // Check if code already exists
    const existing = await prisma.space.findUnique({
      where: { code: validatedData.code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Mã space đã tồn tại' },
        { status: 400 }
      )
    }

    // Auto-set academic year when creating space
    const currentAcademicYear = getCurrentAcademicYear()
    
    // Prepare data for creation
    const createData: any = {
      name: validatedData.name,
      code: validatedData.code,
      type: validatedData.type,
      visibility: validatedData.visibility || 'INTERNAL',
      academicYear: currentAcademicYear, // Auto-set current academic year
      progress: validatedData.progress || 0,
      order: validatedData.order || 0,
    }
    
    // Optional fields
    if (validatedData.description) createData.description = validatedData.description
    if (validatedData.parentId) createData.parentId = validatedData.parentId
    if (validatedData.icon) createData.icon = validatedData.icon
    if (validatedData.color) createData.color = validatedData.color
    if (validatedData.startDate) createData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate) createData.endDate = new Date(validatedData.endDate)
    
    const space = await prisma.space.create({
      data: createData,
      include: {
        parent: true,
        _count: {
          select: {
            members: true,
            departments: true,
          },
        },
      },
    })

    return NextResponse.json(space, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating space:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi tạo space',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

