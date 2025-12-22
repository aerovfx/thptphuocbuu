import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { createSignedUploadUrl } from '@/lib/storage'
import { MAX_DOCUMENT_SIZE } from '@/lib/file-validation'

const schema = z.object({
  folder: z.string().optional().default('uploads'),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
  // allow toggling public for future use; default true
  public: z.boolean().optional().default(true),
})

/**
 * POST /api/uploads/signed-url
 * Returns a signed PUT URL for direct upload to GCS.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    // Enforce 50MB max for a single upload (documents/business license).
    if (data.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { error: 'Kích thước file không được vượt quá 50MB' },
        { status: 400 }
      )
    }

    const { uploadUrl, publicUrl, path } = await createSignedUploadUrl({
      fileName: data.fileName,
      folder: data.folder,
      contentType: data.contentType,
    })

    return NextResponse.json({ uploadUrl, publicUrl, path }, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 })
    }
    console.error('Error creating signed upload url:', error)
    return NextResponse.json({ error: 'Không thể tạo upload URL' }, { status: 500 })
  }
}


