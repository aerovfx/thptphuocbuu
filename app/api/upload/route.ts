import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFileFromFormData } from '@/lib/storage'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' or 'document'

    if (!file) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Validate file type
    if (type === 'logo') {
      // Logo: only images
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Logo phải là file ảnh (PNG, JPG, SVG)' },
          { status: 400 }
        )
      }
      // Max 5MB for logo
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Kích thước logo không được vượt quá 5MB' },
          { status: 400 }
        )
      }
    } else if (type === 'document') {
      // Document: only PDF
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Giấy phép phải là file PDF' },
          { status: 400 }
        )
      }
      // Max 50MB for document
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Kích thước file không được vượt quá 50MB' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Loại file không hợp lệ. Phải là "logo" hoặc "document"' },
        { status: 400 }
      )
    }

    // Upload to Google Cloud Storage
    const result = await uploadFileFromFormData(file, `brands/${type}`, {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })

    return NextResponse.json({
      url: result.publicUrl,
      fileName: file.name,
      fileSize: result.size,
      mimeType: result.mimeType,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải lên file' },
      { status: 500 }
    )
  }
}

