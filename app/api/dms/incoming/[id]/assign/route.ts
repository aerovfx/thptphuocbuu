import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignmentSchema = z.object({
  assignedToId: z.string().min(1, 'Người được phân công là bắt buộc'),
  notes: z.string().optional(),
  deadline: z.string().datetime().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN và TEACHER mới có thể phân công
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Bạn không có quyền phân công văn bản' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    // Check if document exists
    const document = await prisma.incomingDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check if user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: validatedData.assignedToId },
    })

    if (!assignedUser) {
      return NextResponse.json({ error: 'Người được phân công không tồn tại' }, { status: 404 })
    }

    // Create assignment
    const assignment = await prisma.incomingDocumentAssignment.create({
      data: {
        documentId: id,
        assignedToId: validatedData.assignedToId,
        assignedById: session.user.id,
        notes: validatedData.notes || null,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        status: 'PENDING',
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            role: true,
          },
        },
        document: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    // Update document status to PROCESSING if it's still PENDING
    if (document.status === 'PENDING') {
      await prisma.incomingDocument.update({
        where: { id },
        data: { status: 'PROCESSING' },
      })
    }

    // TODO: Send notification to assigned user

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
      { error: 'Đã xảy ra lỗi khi phân công văn bản' },
      { status: 500 }
    )
  }
}

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

    const assignments = await prisma.incomingDocumentAssignment.findMany({
      where: { documentId: id },
      select: {
        id: true,
        notes: true,
        deadline: true,
        status: true,
        completedAt: true,
        createdAt: true,
        checklistItems: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            role: true,
          },
        },
        document: {
          select: {
            id: true,
            title: true,
            documentNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách phân công' },
      { status: 500 }
    )
  }
}

