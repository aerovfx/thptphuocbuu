import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { autoSyncDocument } from '@/lib/document-sync'
import { uploadFileFromFormData } from '@/lib/storage'
import { z } from 'zod'
import { validateDocument, validateImage, MAX_DOCUMENT_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/file-validation'

const incomingDocumentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  sender: z.string().optional(),
  type: z.enum(['DIRECTIVE', 'RECORD', 'REPORT', 'REQUEST', 'OTHER']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  deadline: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  tags: z.string().optional(), // JSON array string
  // Optional: allow direct-to-GCS uploads by passing a public URL instead of a file
  fileUrl: z.string().url().optional(),
  fileName: z.string().min(1).optional(),
  fileSize: z.preprocess((v) => (v == null ? undefined : Number(v)), z.number().int().positive().optional()),
  mimeType: z.string().min(1).optional(),
})

async function resolveCurrentUserId(session: any): Promise<string | null> {
  const id = session?.user?.id
  const email = session?.user?.email

  if (typeof id === 'string' && id.trim()) {
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (exists) return id
  }

  if (typeof email === 'string' && email.trim()) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id || null
  }

  return null
}

function validateIncomingFileMetadata(params: { mimeType: string; fileSize: number }) {
  const { mimeType, fileSize } = params

  const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType)
  if (isImage) {
    if (fileSize > MAX_IMAGE_SIZE) {
      return { valid: false, error: `Hình ảnh quá lớn. Dung lượng tối đa là ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` }
    }
    return { valid: true as const }
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Loại file không được hỗ trợ. Chỉ chấp nhận văn bản (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV) hoặc ảnh (JPEG, PNG, GIF, WebP)' }
  }
  if (fileSize > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: `Văn bản quá lớn. Dung lượng tối đa là ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB` }
  }
  return { valid: true as const }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN và TEACHER mới có thể upload văn bản đến
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên và giáo viên mới có thể tải lên văn bản đến' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    const title = formData.get('title') as string
    const sender = formData.get('sender') as string | null
    const type = formData.get('type') as string | null
    const priority = formData.get('priority') as string | null
    const deadline = formData.get('deadline') as string | null
    const notes = formData.get('notes') as string | null
    const tags = formData.get('tags') as string | null

    // Direct-to-GCS metadata (when client uploads large file directly and only sends URL here)
    const fileUrl = (formData.get('fileUrl') as string | null) || null
    const fileName = (formData.get('fileName') as string | null) || null
    const fileSizeRaw = formData.get('fileSize')
    const fileSize = fileSizeRaw != null ? Number(fileSizeRaw) : null
    const mimeType = (formData.get('mimeType') as string | null) || null

    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Convert empty strings to undefined for optional fields
    const dataToValidate = {
      title: (title || '').trim(),
      sender: sender && sender.trim() ? sender.trim() : undefined,
      type: type && type.trim() && ['DIRECTIVE', 'RECORD', 'REPORT', 'REQUEST', 'OTHER'].includes(type.trim()) 
        ? type.trim() 
        : undefined,
      priority: priority && ['URGENT', 'HIGH', 'NORMAL', 'LOW'].includes(priority) ? priority : 'NORMAL',
      deadline: deadline && deadline.trim() ? deadline.trim() : undefined,
      notes: notes && notes.trim() ? notes.trim() : undefined,
      tags: tags && tags.trim() ? tags.trim() : undefined,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize ?? undefined,
      mimeType: mimeType || undefined,
    }

    // Validate input
    let validatedData
    try {
      validatedData = incomingDocumentSchema.parse(dataToValidate)
    } catch (validationError) {
      console.error('Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Dữ liệu không hợp lệ', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }

    // Parse tags JSON
    let tagsJson: string | null = null
    if (tags && tags.trim()) {
      try {
        const tagsArray = JSON.parse(tags)
        if (Array.isArray(tagsArray)) {
          tagsJson = tags
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Resolve user id safely to avoid FK violations if token id is stale after DB reset/migration
    const currentUserId = await resolveCurrentUserId(session)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
        { status: 401 }
      )
    }

    // Upload to Google Cloud Storage:
    // - small files: upload via server (FormData)
    // - large files: already uploaded directly to GCS, only public URL is provided
    let storedUrl: string
    let storedSize: number
    let storedMimeType: string
    let storedFileName: string

    if (file) {
      // Validate file (allow both documents and images)
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const validation = isImage ? validateImage(file) : validateDocument(file)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const result = await uploadFileFromFormData(file, 'dms/incoming', {
        public: true,
        cacheControl: 'public, max-age=31536000',
      })
      storedUrl = result.publicUrl
      storedSize = result.size
      storedMimeType = result.mimeType
      storedFileName = file.name
    } else {
      // Direct upload path
      if (!fileUrl || !fileName || !mimeType || !fileSize) {
        return NextResponse.json(
          { error: 'Thiếu thông tin file (fileUrl/fileName/mimeType/fileSize)' },
          { status: 400 }
        )
      }

      // Ensure URL is to our GCS bucket to avoid arbitrary URL injection
      const bucketName = process.env.GCS_BUCKET_NAME || 'thptphuocbuu360'
      const allowedPrefix = `https://storage.googleapis.com/${bucketName}/`
      if (!fileUrl.startsWith(allowedPrefix)) {
        return NextResponse.json(
          { error: 'File URL không hợp lệ' },
          { status: 400 }
        )
      }

      const metaValidation = validateIncomingFileMetadata({ mimeType, fileSize })
      if (!metaValidation.valid) {
        return NextResponse.json({ error: metaValidation.error }, { status: 400 })
      }

      storedUrl = fileUrl
      storedSize = fileSize
      storedMimeType = mimeType
      storedFileName = fileName
    }

    // Create document in database
    const document = await prisma.incomingDocument.create({
      data: {
        title: validatedData.title,
        sender: validatedData.sender || null,
        type: (validatedData.type as any) || 'OTHER',
        priority: validatedData.priority,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        fileName: storedFileName,
        fileUrl: storedUrl,
        fileSize: storedSize,
        mimeType: storedMimeType,
        originalFileUrl: storedUrl, // Will be updated after OCR if needed
        status: 'PENDING',
        createdById: currentUserId,
        tags: tagsJson || null,
      },
    })

    // Auto-sync với spaces và departments của người tạo
    try {
      await autoSyncDocument(document.id, 'INCOMING', session.user.id, null)
    } catch (syncError) {
      console.error('Error auto-syncing document:', syncError)
      // Không throw error, chỉ log vì document đã được tạo thành công
    }

    // TODO: Trigger OCR processing in background
    // await processOCR(document.id)

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating incoming document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo văn bản đến' },
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Tham số phân trang không hợp lệ' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }
    if (priority) {
      where.priority = priority
    }

    // Search filter (SQLite doesn't support case-insensitive mode)
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        { sender: { contains: search } },
        { documentNumber: { contains: search } },
      ]
    }

    // Role-based filtering
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      // Students and parents can only see documents assigned to them
      const assignmentFilter = {
        some: {
          assignedToId: session.user.id,
        },
      }
      
      // If there's already an OR clause from search, we need to combine them
      if (where.OR) {
        where.AND = [
          { assignments: assignmentFilter },
          { OR: where.OR },
        ]
        delete where.OR
      } else {
        where.assignments = assignmentFilter
      }
    }

    const [documents, total] = await Promise.all([
      prisma.incomingDocument.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          assignments: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              approvals: true,
              assignments: true,
            },
          },
        },
        orderBy: { receivedDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.incomingDocument.count({ where }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching incoming documents:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách văn bản đến' },
      { status: 500 }
    )
  }
}

