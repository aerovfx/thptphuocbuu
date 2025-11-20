import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { suggestDraft } from '@/lib/ai-service'
import { z } from 'zod'

const suggestDraftSchema = z.object({
  type: z.string(),
  recipient: z.string().optional(),
  purpose: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = suggestDraftSchema.parse(body)

    // Call AI service to suggest draft
    const draft = await suggestDraft(
      validatedData.type,
      validatedData.recipient || '',
      validatedData.purpose || ''
    )

    return NextResponse.json({
      draft,
      template: 'NĐ 30/2020', // Default template
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error suggesting draft:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo bản nháp' },
      { status: 500 }
    )
  }
}

