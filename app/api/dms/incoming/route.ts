import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { z } from 'zod'
import { validateDocument } from '@/lib/file-validation'

const incomingDocumentSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  sender: z.string().optional(),
  type: z.enum(['DIRECTIVE', 'RECORD', 'REPORT', 'REQUEST', 'OTHER']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  deadline: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
})

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
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const sender = formData.get('sender') as string | null
    const type = formData.get('type') as string | null
    const priority = formData.get('priority') as string | null
    const deadline = formData.get('deadline') as string | null
    const notes = formData.get('notes') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File không được để trống' }, { status: 400 })
    }

    // Validate file
    const validation = validateDocument(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
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

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'dms', 'incoming')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileExtension = originalName.split('.').pop()
    const fileName = `${timestamp}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(uploadsDir, fileName)
    const fileUrl = `/uploads/dms/incoming/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document in database
    const document = await prisma.incomingDocument.create({
      data: {
        title: validatedData.title,
        sender: validatedData.sender || null,
        type: (validatedData.type as any) || 'OTHER',
        priority: validatedData.priority,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        fileName: originalName,
        fileUrl,
        fileSize: buffer.length,
        mimeType: file.type,
        originalFileUrl: fileUrl, // Will be updated after OCR if needed
        status: 'PENDING',
        createdById: session.user.id,
      },
    })

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

