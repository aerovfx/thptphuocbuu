import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  content: z.any().optional(), // JSON content
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createDocumentSchema.parse(body)

    const document = await prisma.collaborativeDocument.create({
      data: {
        title: validatedData.title,
        content: validatedData.content || null,
        ownerId: session.user.id,
        lastEditedAt: new Date(),
        lastEditedBy: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        permissions: {
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
        },
      },
    })

    // Create owner permission
    await prisma.documentPermission.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        role: 'OWNER',
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
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo tài liệu' },
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
    const userId = searchParams.get('userId')

    // Get documents where user is owner or has permission
    const documents = await prisma.collaborativeDocument.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          {
            permissions: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        permissions: {
          where: {
            userId: session.user.id,
          },
          take: 1,
        },
        _count: {
          select: {
            revisions: true,
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách tài liệu' },
      { status: 500 }
    )
  }
}

