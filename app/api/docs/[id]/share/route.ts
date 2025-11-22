import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shareDocumentSchema = z.object({
  userId: z.string().min(1, 'User ID là bắt buộc'),
  role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR']),
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

    // Check if user is owner
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu mới có thể chia sẻ tài liệu' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = shareDocumentSchema.parse(body)

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    // Check if permission already exists
    const existingPermission = await prisma.documentPermission.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: validatedData.userId,
        },
      },
    })

    if (existingPermission) {
      // Update existing permission
      const permission = await prisma.documentPermission.update({
        where: { id: existingPermission.id },
        data: {
          role: validatedData.role,
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

      return NextResponse.json({ permission })
    }

    // Create new permission
    const permission = await prisma.documentPermission.create({
      data: {
        documentId,
        userId: validatedData.userId,
        role: validatedData.role,
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

    return NextResponse.json({ permission }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error sharing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi chia sẻ tài liệu' },
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

    // Check if user is owner
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu mới có thể xem danh sách quyền' },
        { status: 403 }
      )
    }

    const permissions = await prisma.documentPermission.findMany({
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
      orderBy: [
        { role: 'desc' }, // OWNER first, then EDITOR, etc.
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách quyền' },
      { status: 500 }
    )
  }
}

