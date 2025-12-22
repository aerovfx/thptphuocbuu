import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - AI summarization
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

    const text =
      document.ocrText ||
      document.versions[0]?.ocrText ||
      document.content ||
      document.title

    // TODO: Implement actual AI summarization
    // In production, this would:
    // 1. Send text to LLM with summarization prompt
    // 2. Generate concise summary (2-3 sentences)
    // 3. Update document.summary field

    // Mock summary (in production, use LLM)
    const summary = text.length > 200 
      ? text.substring(0, 200) + '...'
      : text

    await prisma.incomingDocument.update({
      where: { id },
      data: {
        summary,
      },
    })

    await prisma.documentAI.create({
      data: {
        documentId: id,
        aiType: 'SUMMARIZE',
        result: JSON.stringify({ summary }),
        confidence: 0.9,
        model: 'mock-ai-model',
      },
    })

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('Error summarizing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tóm tắt văn bản' },
      { status: 500 }
    )
  }
}

