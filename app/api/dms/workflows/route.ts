import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workflowSchema = z.object({
  name: z.string().min(1),
  documentId: z.string(),
  documentType: z.enum(['incoming', 'outgoing']),
  steps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    assigneeId: z.string(),
    dueDate: z.string().datetime().optional(),
  })),
  autoAssign: z.boolean().optional().default(false),
})

// POST - Create workflow for a document
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and TEACHER can create workflows
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Không có quyền tạo luồng phê duyệt' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = workflowSchema.parse(body)

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: validatedData.name,
        incomingDocumentId: validatedData.documentType === 'incoming' ? validatedData.documentId : null,
        outgoingDocumentId: validatedData.documentType === 'outgoing' ? validatedData.documentId : null,
        steps: JSON.stringify(validatedData.steps),
        currentStep: 0,
        status: 'PENDING',
        autoAssigned: validatedData.autoAssign,
        assignedToId: validatedData.autoAssign && validatedData.steps[0]?.assigneeId 
          ? validatedData.steps[0].assigneeId 
          : null,
      },
    })

    // Create tasks for each step
    const tasks = await Promise.all(
      validatedData.steps.map((step) =>
        prisma.task.create({
          data: {
            workflowId: workflow.id,
            stepNumber: step.stepNumber,
            title: step.title,
            assigneeId: step.assigneeId,
            dueDate: step.dueDate ? new Date(step.dueDate) : null,
            status: step.stepNumber === 0 ? 'PENDING' : 'PENDING',
          },
        })
      )
    )

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_WORKFLOW',
        incomingDocumentId: validatedData.documentType === 'incoming' ? validatedData.documentId : null,
        outgoingDocumentId: validatedData.documentType === 'outgoing' ? validatedData.documentId : null,
        workflowId: workflow.id,
        payload: JSON.stringify({
          workflowName: validatedData.name,
          stepsCount: validatedData.steps.length,
        }),
      },
    })

    return NextResponse.json({
      workflow,
      tasks,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo luồng phê duyệt' },
      { status: 500 }
    )
  }
}

// GET - Get workflows
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const documentType = searchParams.get('documentType') // 'incoming' | 'outgoing'
    const status = searchParams.get('status')

    const where: any = {}
    if (documentId && documentType === 'incoming') {
      where.incomingDocumentId = documentId
    }
    if (documentId && documentType === 'outgoing') {
      where.outgoingDocumentId = documentId
    }
    if (status) {
      where.status = status
    }

    // Role-based filtering
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      where.OR = [
        { assignedToId: session.user.id },
        { tasks: { some: { assigneeId: session.user.id } } },
      ]
    }

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error: any) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách luồng phê duyệt' },
      { status: 500 }
    )
  }
}


