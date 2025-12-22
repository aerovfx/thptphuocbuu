import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileFromFormData } from '@/lib/storage'
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

    // Upload to Google Cloud Storage
    const result = await uploadFileFromFormData(file, 'documents', {
      public: true,
      cacheControl: 'public, max-age=31536000',
    })

    // Save to database
    const document = await prisma.document.create({
      data: {
        title,
        description: description || null,
        fileName: file.name,
        fileUrl: result.publicUrl,
        fileSize: result.size,
        mimeType: result.mimeType,
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
    if (session.user.role === 'ADMIN' || session.user.role === 'BGH' || session.user.role === 'TEACHER') {
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

