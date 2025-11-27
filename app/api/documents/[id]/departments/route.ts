import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncDocumentToSpacesAndDepartments, syncDocumentWithDepartmentSpace } from '@/lib/document-sync'
import { z } from 'zod'

const linkDepartmentsSchema = z.object({
  departmentIds: z.array(z.string()).min(1),
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
    const validatedData = linkDepartmentsSchema.parse(body)

    // Check if document exists and user has permission
    let document
    if (validatedData.documentType === 'OUTGOING') {
      document = await prisma.outgoingDocument.findUnique({
        where: { id },
      })
      if (!document) {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
      if (
        session.user.role !== 'ADMIN' &&
        session.user.role !== 'SUPER_ADMIN' &&
        session.user.role !== 'BGH' &&
        document.createdById !== session.user.id
      ) {
        return NextResponse.json(
          { error: 'Bạn không có quyền liên kết văn bản này với departments' },
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

    // Sync document with departments and their spaces
    const results = await Promise.all(
      validatedData.departmentIds.map((departmentId) =>
        syncDocumentWithDepartmentSpace(id, validatedData.documentType, departmentId)
      )
    )

    return NextResponse.json({
      message: 'Đã liên kết văn bản với departments thành công',
      results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error linking document to departments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi liên kết văn bản với departments' },
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

    const departmentDocuments = await prisma.departmentDocument.findMany({
      where: {
        documentId: id,
        documentType: documentType as 'OUTGOING' | 'INCOMING',
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            space: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(departmentDocuments)
  } catch (error) {
    console.error('Error fetching document departments:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách departments của văn bản' },
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

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType') || 'OUTGOING'
    const departmentId = searchParams.get('departmentId')

    const { id } = await params

    if (!departmentId) {
      return NextResponse.json(
        { error: 'departmentId là bắt buộc' },
        { status: 400 }
      )
    }

    await prisma.departmentDocument.deleteMany({
      where: {
        documentId: id,
        documentType: documentType as 'OUTGOING' | 'INCOMING',
        departmentId,
      },
    })

    return NextResponse.json({ message: 'Đã xóa liên kết văn bản với department' })
  } catch (error) {
    console.error('Error removing document from department:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa liên kết' },
      { status: 500 }
    )
  }
}

