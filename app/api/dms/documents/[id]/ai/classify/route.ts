import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - AI classification and auto-routing
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

    // Only ADMIN and TEACHER can trigger AI classification
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Không có quyền thực hiện phân loại AI' },
        { status: 403 }
      )
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

    const text = document.ocrText || document.versions[0]?.ocrText || document.title

    // TODO: Implement actual AI classification
    // In production, this would:
    // 1. Send text to LLM (OpenAI/Anthropic/Gemini) with classification prompt
    // 2. Extract: document type, priority, urgency, suggested assignee
    // 3. Update document with AI results
    // 4. Auto-create workflow and tasks if enabled

    // Mock AI classification result
    const aiResult = {
      category: document.type || 'OTHER',
      confidence: 0.85,
      priority: document.priority || 'NORMAL',
      urgency: 'NORMAL',
      suggestedAssignee: null,
      extractedFields: {
        documentNumber: document.documentNumber,
        sender: document.sender,
        receivedDate: document.receivedDate,
      },
    }

    // Update document with AI results
    await prisma.incomingDocument.update({
      where: { id },
      data: {
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        aiExtractedData: JSON.stringify(aiResult.extractedFields),
      },
    })

    // Save AI result
    await prisma.documentAI.create({
      data: {
        documentId: id,
        aiType: 'CLASSIFY',
        result: JSON.stringify(aiResult),
        confidence: aiResult.confidence,
        model: 'mock-ai-model',
      },
    })

    return NextResponse.json({
      success: true,
      result: aiResult,
    })
  } catch (error: any) {
    console.error('Error classifying document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi phân loại văn bản' },
      { status: 500 }
    )
  }
}

