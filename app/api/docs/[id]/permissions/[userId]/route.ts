import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePermissionSchema = z.object({
  role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, userId: targetUserId } = await params

    // Check if user is owner
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu mới có thể cập nhật quyền' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updatePermissionSchema.parse(body)

    const permission = await prisma.documentPermission.update({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUserId,
        },
      },
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating permission:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật quyền' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId, userId: targetUserId } = await params

    // Check if user is owner
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu mới có thể xóa quyền' },
        { status: 403 }
      )
    }

    // Cannot remove owner's permission
    if (targetUserId === document.ownerId) {
      return NextResponse.json(
        { error: 'Không thể xóa quyền của chủ sở hữu' },
        { status: 400 }
      )
    }

    await prisma.documentPermission.delete({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUserId,
        },
      },
    })

    return NextResponse.json({ message: 'Đã xóa quyền thành công' })
  } catch (error) {
    console.error('Error deleting permission:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa quyền' },
      { status: 500 }
    )
  }
}

