import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Trigger OCR processing for a document
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const { id } = params

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const document = await prisma.incomingDocument.findUnique({
      where: { id },
      include: {
        versions: {
          include: {
            ocrExtracts: true,
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
    const ocrResult = latestVersion?.ocrExtracts?.[0]

    return NextResponse.json({
      ocrText: document.ocrText || ocrResult?.text || null,
      ocrConfidence: document.ocrConfidence || ocrResult?.confidence || null,
      hasOCR: !!document.ocrText || !!ocrResult,
    })
  } catch (error: any) {
    console.error('Error fetching OCR results:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy kết quả OCR' },
      { status: 500 }
    )
  }
}

