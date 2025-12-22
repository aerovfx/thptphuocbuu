import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  order: z.number().int().optional(),
  duration: z.number().int().nullable().optional(),
})

// GET - Get lesson details
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

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            class: {
              select: {
                id: true,
                teacherId: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Check access - only teacher of the class or admin can view
    if (session.user.role !== 'ADMIN' && lesson.chapter.class.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update lesson
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get lesson to check permissions
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            class: {
              select: {
                id: true,
                teacherId: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Only teacher of the class or admin can update
    if (session.user.role !== 'ADMIN' && lesson.chapter.class.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateLessonSchema.parse(body)

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
        ...(validatedData.duration !== undefined && { duration: validatedData.duration }),
      },
    })

    return NextResponse.json(updatedLesson)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete lesson
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get lesson to check permissions
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        chapter: {
          include: {
            class: {
              select: {
                id: true,
                teacherId: true,
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Only teacher of the class or admin can delete
    if (session.user.role !== 'ADMIN' && lesson.chapter.class.teacherId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.lesson.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

