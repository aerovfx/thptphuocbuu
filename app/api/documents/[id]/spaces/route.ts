import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const linkSpacesSchema = z.object({
  spaceIds: z.array(z.string()).min(1),
  documentType: z.enum(['OUTGOING', 'INCOMING']),
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

    const { id } = await params
    const body = await request.json()
    const validatedData = linkSpacesSchema.parse(body)

    // Check if document exists and user has permission
    let document
    if (validatedData.documentType === 'OUTGOING') {
      document = await prisma.outgoingDocument.findUnique({
        where: { id },
      })
      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
      // Check permission
      if (
        session.user.role !== 'ADMIN' &&
        session.user.role !== 'SUPER_ADMIN' &&
        session.user.role !== 'BGH' &&
        document.createdById !== session.user.id
      ) {
        return NextResponse.json(
          { error: 'Bạn không có quyền liên kết văn bản này với spaces' },
          { status: 403 }
        )
      }
    } else {
      document = await prisma.incomingDocument.findUnique({
        where: { id },
      })
      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
    }

    // Link document to spaces
    const spaceDocuments = await Promise.all(
      validatedData.spaceIds.map((spaceId) =>
        prisma.spaceDocument.upsert({
          where: {
            spaceId_documentId_documentType: {
              spaceId,
              documentId: id,
              documentType: validatedData.documentType,
            },
          },
          update: {},
          create: {
            spaceId,
            documentId: id,
            documentType: validatedData.documentType,
          },
        })
      )
    )

    return NextResponse.json({
      message: 'Đã liên kết văn bản với spaces thành công',
      spaceDocuments,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error linking document to spaces:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi liên kết văn bản với spaces' },
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

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType') || 'OUTGOING'

    const { id } = await params

    const spaceDocuments = await prisma.spaceDocument.findMany({
      where: {
        documentId: id,
        documentType: documentType as 'OUTGOING' | 'INCOMING',
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            visibility: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(spaceDocuments)
  } catch (error) {
    console.error('Error fetching document spaces:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách spaces của văn bản' },
      { status: 500 }
    )
  }
}

