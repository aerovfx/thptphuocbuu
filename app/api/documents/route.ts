import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFileFromFormData } from '@/lib/storage'
import { validateDocument } from '@/lib/file-validation'
import { authenticateRequest } from '@/lib/jwt-auth'

export async function POST(request: NextRequest) {
  try {
    // Try JWT authentication first (for mobile app)
    const jwtUser = await authenticateRequest(request)
    const session = !jwtUser ? await getServerSession(authOptions) : null

    if (!jwtUser && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = jwtUser || session!.user
    const userRole = currentUser.role
    const userId = currentUser.id

    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
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
        uploadedById: userId,
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

export async function GET(request: NextRequest) {
  try {
    // Try JWT authentication first (for mobile app)
    const jwtUser = await authenticateRequest(request)
    const session = !jwtUser ? await getServerSession(authOptions) : null

    if (!jwtUser && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = jwtUser || session!.user
    const userRole = currentUser.role
    const userId = currentUser.id

    let documents
    if (userRole === 'ADMIN' || userRole === 'BGH' || userRole === 'TEACHER') {
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
            { access: { some: { userId: userId } } },
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

