import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Storage } from '@google-cloud/storage'
import { validateImage, validateVideo, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '@/lib/file-validation'
import { hasPremiumOrAdminAccess } from '@/lib/premium-check'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute for generating signed URL

// Initialize Storage with explicit project ID
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || 'gen-lang-client-0753799782',
})
const bucketName = process.env.GCS_BUCKET_NAME || 'gen-lang-client-0753799782_cloudbuild'

/**
 * Generate signed URL for direct upload to Google Cloud Storage
 * This bypasses Cloud Run's 32MB request body limit
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileType, fileSize } = body

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, fileSize' },
        { status: 400 }
      )
    }

    // Check if user has premium access
    const isPremium = hasPremiumOrAdminAccess(session.user)

    // Validate file type and size
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Loại file không được hỗ trợ. Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP) và video (MP4, WebM, OGG, MOV, AVI)' },
        { status: 400 }
      )
    }

    // Validate file size
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
    const MAX_VIDEO_SIZE_NORMAL = 50 * 1024 * 1024 // 50MB
    const MAX_VIDEO_SIZE_PREMIUM = 100 * 1024 * 1024 // 100MB

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `Hình ảnh quá lớn. Dung lượng tối đa là ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    if (isVideo) {
      const maxSize = isPremium ? MAX_VIDEO_SIZE_PREMIUM : MAX_VIDEO_SIZE_NORMAL
      if (fileSize > maxSize) {
        return NextResponse.json(
          { error: `Video quá lớn. Dung lượng tối đa là ${maxSize / (1024 * 1024)}MB ${isPremium ? '(Premium)' : '(người dùng thường)'}` },
          { status: 400 }
        )
      }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = fileName.split('.').pop()
    const uniqueFileName = `${timestamp}-${randomString}.${extension}`
    const filePath = `posts/${uniqueFileName}`

    // Generate signed URL for upload
    const bucket = storage.bucket(bucketName)
    const file = bucket.file(filePath)

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    })

    // Public URL that will be available after upload
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`

    return NextResponse.json({
      signedUrl,
      publicUrl,
      filePath,
      expiresIn: 15 * 60, // 15 minutes in seconds
    })
  } catch (error: any) {
    console.error('Error generating signed URL:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      {
        error: 'Đã xảy ra lỗi khi tạo URL tải lên',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
