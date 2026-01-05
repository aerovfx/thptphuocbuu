import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateImage, validateVideo, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation'
import { uploadFileFromFormData } from '@/lib/storage'
import { hasPremiumOrAdminAccess } from '@/lib/premium-check'

export const runtime = 'nodejs'

// Allow longer execution time for large video uploads
export const maxDuration = 300 // 5 minutes timeout

// Increase body size limit for video uploads (100MB for premium, 50MB for normal users)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Check if user has premium or admin access
    const isPremium = hasPremiumOrAdminAccess(session.user)

    // Validate file type and size
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const validation = isImage ? validateImage(file) : validateVideo(file, isPremium)
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Upload to Google Cloud Storage
    // Videos are no longer trimmed - we allow unlimited duration based on file size limits
    let result:
      | { url: string; publicUrl: string; path: string; size: number; mimeType: string }
      | (ReturnType<typeof uploadFileFromFormData> extends Promise<infer R> ? R : never)

    if (!isImage) {
      // For videos, upload directly without trimming
      result = await uploadFileFromFormData(file, 'posts', {
        public: true,
        cacheControl: 'public, max-age=31536000',
      })

      return NextResponse.json(
        {
          url: result.publicUrl,
          type: 'video',
          size: result.size,
          mimeType: result.mimeType,
          isPremium,
        },
        { status: 200 }
      )
    }

    // Images: upload as-is
    result = await uploadFileFromFormData(file, 'posts', {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })

    return NextResponse.json(
      {
        url: result.publicUrl, // Use public URL from GCS
        type: isImage ? 'image' : 'video',
        size: result.size,
        mimeType: result.mimeType,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải lên media' },
      { status: 500 }
    )
  }
}

