import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.any().optional(),
})

async function checkPermission(
  documentId: string,
  userId: string,
  requiredRole?: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER'
) {
  const document = await prisma.collaborativeDocument.findUnique({
    where: { id: documentId },
    include: {
      permissions: {
        where: { userId },
      },
    },
  })

  if (!document) {
    return { allowed: false, reason: 'Document not found' }
  }

  // Owner has all permissions
  if (document.ownerId === userId) {
    return { allowed: true, role: 'OWNER' as const }
  }

  const permission = document.permissions[0]
  if (!permission) {
    return { allowed: false, reason: 'No permission' }
  }

  if (!requiredRole) {
    return { allowed: true, role: permission.role }
  }

  const roleHierarchy = {
    VIEWER: 0,
    COMMENTER: 1,
    EDITOR: 2,
    OWNER: 3,
  }

  const userRoleLevel = roleHierarchy[permission.role]
  const requiredRoleLevel = roleHierarchy[requiredRole]

  if (userRoleLevel >= requiredRoleLevel) {
    return { allowed: true, role: permission.role }
  }

  return { allowed: false, reason: 'Insufficient permissions' }
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

    const permission = await checkPermission(id, session.user.id)
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const document = await prisma.collaborativeDocument.findUnique({
      where: { id },
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
        _count: {
          select: {
            revisions: true,
            comments: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    return NextResponse.json({ document, userRole: permission.role })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy tài liệu' },
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

    const { id } = await params

    const permission = await checkPermission(id, session.user.id, 'EDITOR')
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || 'Không có quyền chỉnh sửa' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateDocumentSchema.parse(body)

    const document = await prisma.collaborativeDocument.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
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
      },
    })

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật tài liệu' },
      { status: 500 }
    )
  }
}

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

    const permission = await checkPermission(id, session.user.id, 'OWNER')
    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu mới có thể xóa tài liệu' },
        { status: 403 }
      )
    }

    await prisma.collaborativeDocument.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa tài liệu thành công' })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa tài liệu' },
      { status: 500 }
    )
  }
}

