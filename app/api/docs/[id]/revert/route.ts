import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const revertSchema = z.object({
  revisionId: z.string().min(1, 'Revision ID là bắt buộc'),
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

    // Check if user is owner or editor
    const document = await prisma.collaborativeDocument.findUnique({
      where: { id: documentId },
      include: {
        permissions: {
          where: {
            userId: session.user.id,
            role: { in: ['OWNER', 'EDITOR'] },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Tài liệu không tồn tại' }, { status: 404 })
    }

    if (document.ownerId !== session.user.id && document.permissions.length === 0) {
      return NextResponse.json(
        { error: 'Chỉ chủ sở hữu hoặc người chỉnh sửa mới có thể khôi phục phiên bản' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = revertSchema.parse(body)

    // Get the revision
    const revision = await prisma.documentRevision.findUnique({
      where: { id: validatedData.revisionId },
    })

    if (!revision || revision.documentId !== documentId) {
      return NextResponse.json({ error: 'Phiên bản không tồn tại' }, { status: 404 })
    }

    if (!revision.snapshot) {
      return NextResponse.json(
        { error: 'Phiên bản này không có snapshot để khôi phục' },
        { status: 400 }
      )
    }

    // Restore document to this revision
    const updatedDocument = await prisma.collaborativeDocument.update({
      where: { id: documentId },
      data: {
        content: revision.snapshot,
        lastEditedAt: new Date(),
        lastEditedBy: session.user.id,
      },
    })

    // Create a new revision for this revert action
    await prisma.documentRevision.create({
      data: {
        documentId,
        snapshot: revision.snapshot,
        userId: session.user.id,
        description: `Khôi phục về phiên bản từ ${revision.createdAt.toLocaleString('vi-VN')}`,
      },
    })

    return NextResponse.json({
      document: updatedDocument,
      message: 'Đã khôi phục phiên bản thành công',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error reverting document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi khôi phục phiên bản' },
      { status: 500 }
    )
  }
}

