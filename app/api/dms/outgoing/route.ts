import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const outgoingDocumentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  recipient: z.string().optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  sendDate: z.string().datetime().optional(),
  template: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN và TEACHER mới có thể tạo văn bản đi
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên và giáo viên mới có thể tạo văn bản đi' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = outgoingDocumentSchema.parse(body)

    // Generate document number (format: VB-YYYYMMDD-XXX)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    // Count documents created today
    const todayStart = new Date(year, today.getMonth(), today.getDate())
    const todayCount = await prisma.outgoingDocument.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    })
    
    const documentNumber = `VB-${year}${month}${day}-${String(todayCount + 1).padStart(3, '0')}`

    // Create document
    const document = await prisma.outgoingDocument.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        recipient: validatedData.recipient || null,
        priority: validatedData.priority,
        sendDate: validatedData.sendDate ? new Date(validatedData.sendDate) : null,
        template: validatedData.template || null,
        documentNumber,
        status: 'PENDING',
        createdById: session.user.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating outgoing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo văn bản đi' },
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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }

    // Role-based filtering
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      // Students and parents can only see documents they're involved in (via approvals)
      where.approvals = {
        some: {
          approverId: session.user.id,
        },
      }
    } else {
      // ADMIN and TEACHER can see all or their own documents
      if (session.user.role === 'TEACHER') {
        where.createdById = session.user.id
      }
    }

    const [documents, total] = await Promise.all([
      prisma.outgoingDocument.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              approvals: true,
              signatures: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.outgoingDocument.count({ where }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching outgoing documents:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách văn bản đi' },
      { status: 500 }
    )
  }
}

