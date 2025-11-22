import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAssignmentSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'ARCHIVED']).optional(),
  notes: z.string().optional(),
  deadline: z.string().datetime().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, assignmentId } = await params
    const body = await request.json()
    const validatedData = updateAssignmentSchema.parse(body)

    // Check if assignment exists and belongs to document
    const assignment = await prisma.incomingDocumentAssignment.findFirst({
      where: {
        id: assignmentId,
        documentId: documentId,
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
            documentNumber: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Phân công không tồn tại' }, { status: 404 })
    }

    // Check permission: assigned user or admin/teacher
    const canUpdate =
      session.user.role === 'ADMIN' ||
      session.user.role === 'TEACHER' ||
      assignment.assignedToId === session.user.id

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật phân công này' },
        { status: 403 }
      )
    }

    // Update assignment
    const updateData: any = {}

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      
      if (validatedData.status === 'COMPLETED' && assignment.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
      } else if (validatedData.status !== 'COMPLETED') {
        updateData.completedAt = null
      }
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null
    }

    const updatedAssignment = await prisma.incomingDocumentAssignment.update({
      where: { id: assignmentId },
      data: updateData,
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
            documentNumber: true,
          },
        },
      },
    })

    // Update document status if all assignments are completed
    if (validatedData.status === 'COMPLETED' || updatedAssignment.status === 'COMPLETED') {
      const allAssignments = await prisma.incomingDocumentAssignment.findMany({
        where: { documentId },
      })

      const allCompleted = allAssignments.every((a) => a.status === 'COMPLETED')
      if (allCompleted) {
        await prisma.incomingDocument.update({
          where: { id: documentId },
          data: { status: 'COMPLETED' },
        })
      }

      // Auto-activate Premium if user completed enough tasks
      if (updatedAssignment.status === 'COMPLETED' && assignment.status !== 'COMPLETED') {
        try {
          const { checkAndActivatePremium } = await import('@/lib/premium/auto-activate')
          await checkAndActivatePremium(assignment.assignedToId)
        } catch (error) {
          // Don't fail the request if premium activation fails
          console.error('Error auto-activating premium:', error)
        }
      }
    }

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật phân công' },
      { status: 500 }
    )
  }
}

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
            documentNumber: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Phân công không tồn tại' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin phân công' },
      { status: 500 }
    )
  }
}

