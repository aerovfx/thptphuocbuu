import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checklistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
      order: z.number(),
    })
  ),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params

    const assignment = await prisma.incomingDocumentAssignment.findUnique({
      where: { id: assignmentId },
      select: { checklistItems: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Phân công không tồn tại' }, { status: 404 })
    }

    // Parse checklist items from JSON string or return empty array
    let items = []
    if (assignment.checklistItems) {
      try {
        items = typeof assignment.checklistItems === 'string' 
          ? JSON.parse(assignment.checklistItems) 
          : assignment.checklistItems
      } catch (e) {
        items = []
      }
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching checklist:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy checklist' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId } = await params
    const body = await request.json()
    const validatedData = checklistSchema.parse(body)

    // Check if assignment exists
    const assignment = await prisma.incomingDocumentAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Phân công không tồn tại' }, { status: 404 })
    }

    // Check permission
    const canUpdate =
      session.user.role === 'ADMIN' ||
      session.user.role === 'TEACHER' ||
      assignment.assignedToId === session.user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật checklist này' },
        { status: 403 }
      )
    }

    // Update checklist items as JSON string
    await prisma.incomingDocumentAssignment.update({
      where: { id: assignmentId },
      data: {
        checklistItems: JSON.stringify(validatedData.items),
      },
    })

    return NextResponse.json({ success: true, items: validatedData.items })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating checklist:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật checklist' },
      { status: 500 }
    )
  }
}

