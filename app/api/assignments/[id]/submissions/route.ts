import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submissionSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống'),
  fileUrl: z.string().url().optional().nullable(),
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

    const { id: assignmentId } = await params

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            enrollments: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Bài học không tồn tại' }, { status: 404 })
    }

    // Check if user is enrolled in the class
    const isEnrolled = assignment.class.enrollments.length > 0
    const isAdmin = session.user.role === 'ADMIN'

    if (!isEnrolled && !isAdmin) {
      return NextResponse.json(
        { error: 'Bạn không có quyền nộp bài cho bài học này' },
        { status: 403 }
      )
    }

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Bạn đã nộp bài rồi. Vui lòng sử dụng chức năng cập nhật.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = submissionSchema.parse(body)

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: session.user.id,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating submission:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi nộp bài' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = await params

    // Find existing submission
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: session.user.id,
        },
      },
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài nộp. Vui lòng tạo bài nộp mới.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = submissionSchema.parse(body)

    // Update submission
    const submission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        content: validatedData.content,
        fileUrl: validatedData.fileUrl || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(submission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating submission:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật bài nộp' },
      { status: 500 }
    )
  }
}

