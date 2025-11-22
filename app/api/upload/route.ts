import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
      // Max 10MB for document
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Kích thước file không được vượt quá 10MB' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Loại file không hợp lệ. Phải là "logo" hoặc "document"' },
        { status: 400 }
      )
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'brands', type)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.split('.').pop()
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)
    const fileUrl = `/uploads/brands/${type}/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      url: fileUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải lên file' },
      { status: 500 }
    )
  }
}

