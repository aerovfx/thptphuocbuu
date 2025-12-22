import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Trigger OCR processing for a document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and TEACHER can trigger OCR
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Không có quyền thực hiện OCR' },
        { status: 403 }
      )
    }

    const document = await prisma.incomingDocument.findUnique({
      where: { id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // TODO: Implement actual OCR processing
    // For now, return a mock response
    // In production, this would:
    // 1. Download file from fileUrl
    // 2. Send to OCR service (Tesseract/Google Vision/Azure)
    // 3. Extract text
    // 4. Create DocumentVersion and OCRExtract records
    // 5. Trigger AI processing (classification, extraction)

    return NextResponse.json({
      message: 'OCR processing started',
      documentId: id,
      status: 'processing',
    })
  } catch (error: any) {
    console.error('Error triggering OCR:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý OCR' },
      { status: 500 }
    )
  }
}

// GET - Get OCR results for a document
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await prisma.incomingDocument.findUnique({
      where: { id },
      include: {
        versions: {
          select: {
            ocrText: true,
          },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    const latestVersion = document.versions[0]

    return NextResponse.json({
      ocrText: document.ocrText || latestVersion?.ocrText || null,
      ocrConfidence: document.ocrConfidence || null,
      hasOCR: !!document.ocrText || !!latestVersion?.ocrText,
    })
  } catch (error: any) {
    console.error('Error fetching OCR results:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy kết quả OCR' },
      { status: 500 }
    )
  }
}

