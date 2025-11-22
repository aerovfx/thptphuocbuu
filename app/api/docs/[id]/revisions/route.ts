import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRevisionSchema = z.object({
  delta: z.any().optional(),
  snapshot: z.any().optional(),
  description: z.string().optional(),
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

    const { id: documentId } = await params

    // Check if user has permission to view document
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id && document.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createRevisionSchema.parse(body)

    const revision = await prisma.documentRevision.create({
      data: {
        documentId,
        delta: validatedData.delta || null,
        snapshot: validatedData.snapshot || null,
        userId: session.user.id,
        description: validatedData.description || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ revision }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating revision:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo phiên bản' },
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

    const { id: documentId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check permission
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id && document.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const revisions = await prisma.documentRevision.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ revisions })
  } catch (error) {
    console.error('Error fetching revisions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy lịch sử phiên bản' },
      { status: 500 }
    )
  }
}

