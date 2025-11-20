import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { validateDocument } from '@/lib/file-validation'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ giáo viên và quản trị viên mới có thể tải lên văn bản' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Validate file
    const validation = validateDocument(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents')
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

    // Save to database
    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        fileName: originalName,
        fileUrl: `/uploads/documents/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        type: type as any,
        category: category || null,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải lên văn bản' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let documents
    if (session.user.role === 'ADMIN' || session.user.role === 'TEACHER') {
      documents = await prisma.document.findMany({
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      documents = await prisma.document.findMany({
        where: {
          OR: [
            { access: { some: { userId: session.user.id } } },
            { access: { none: {} } }, // Public documents
          ],
        },
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

