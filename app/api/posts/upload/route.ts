import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateImage, validateVideo, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation'

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

    // Validate file type and size
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const validation = isImage ? validateImage(file) : validateVideo(file)
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Note: Video duration validation (0-5s) should be done client-side
    // Server-side validation only checks file size and type

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'posts')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.split('.').pop()
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/posts/${fileName}`

    return NextResponse.json(
      {
        url: fileUrl,
        type: isImage ? 'image' : 'video',
        size: file.size,
        mimeType: file.type,
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

