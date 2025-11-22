import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * API endpoint to send an outgoing document after signing
 * Updates document status to COMPLETED and sets sendDate
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document
    const document = await prisma.outgoingDocument.findUnique({
      where: { id },
      include: {
        signatures: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check permission - only creator or ADMIN can send
    if (session.user.role !== 'ADMIN' && document.createdById !== session.user.id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền gửi văn bản này' },
        { status: 403 }
      )
    }

    // Check if already sent
    if (document.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Văn bản đã được gửi' },
        { status: 400 }
      )
    }

    // Check if document is approved
    if (document.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Văn bản phải được phê duyệt trước khi gửi' },
        { status: 400 }
      )
    }

    // Check if document has been signed
    if (!document.signedFileUrl && document.signatures.length === 0) {
      return NextResponse.json(
        { error: 'Văn bản phải được ký số trước khi gửi' },
        { status: 400 }
      )
    }

    // Update document status to COMPLETED and set sendDate
    const updatedDocument = await prisma.outgoingDocument.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        sendDate: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        signatures: {
          include: {
            signedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    // TODO: Send notifications/emails to recipients
    // TODO: Update workflow status

    return NextResponse.json({
      message: 'Đã gửi văn bản thành công',
      document: updatedDocument,
    })
  } catch (error: any) {
    console.error('Error sending document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gửi văn bản', details: error.message },
      { status: 500 }
    )
  }
}

