import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  sender: z.string().optional().nullable(),
  type: z.enum(['DIRECTIVE', 'RECORD', 'REPORT', 'REQUEST', 'OTHER']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'NORMAL', 'LOW']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'ARCHIVED']).optional(),
  deadline: z.string().optional().nullable(), // Accept any string, we'll validate and parse it
  tags: z.string().optional().nullable(), // JSON array string
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let id: string
    try {
      const resolvedParams = await params
      id = resolvedParams.id
      if (!id) {
        return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
      }
    } catch (paramsError: any) {
      console.error('Error resolving params:', paramsError)
      return NextResponse.json(
        { error: 'Lỗi khi xử lý tham số', details: paramsError.message },
        { status: 400 }
      )
    }

    let document
    try {
      document = await prisma.incomingDocument.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
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
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: { level: 'asc' },
          },
          aiResults: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    } catch (prismaError: any) {
      console.error('Prisma error:', prismaError)
      console.error('Prisma error code:', prismaError?.code)
      console.error('Prisma error message:', prismaError?.message)
      
      // Check if it's a known Prisma error
      if (prismaError?.code === 'P2025') {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
      
      return NextResponse.json(
        { 
          error: 'Lỗi khi truy vấn database',
          details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined
        },
        { status: 500 }
      )
    }

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check access permission
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      const hasAccess = document.assignments.some(
        (assignment) => assignment.assignedToId === session.user.id
      )
      if (!hasAccess) {
        return NextResponse.json({ error: 'Bạn không có quyền xem văn bản này' }, { status: 403 })
      }
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error('Error fetching incoming document:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    
    // Return more detailed error in development
    const errorMessage = error?.message || 'Đã xảy ra lỗi khi lấy thông tin văn bản'
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { 
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        }
      : undefined

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if document exists
    const existingDoc = await prisma.incomingDocument.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Check permission - ADMIN, BGH, or creator can update
    const isAdmin = session.user.role === 'ADMIN'
    const isBGH = session.user.role === 'BGH'
    const isOwner = existingDoc.createdById === session.user.id
    
    if (!isAdmin && !isBGH && !isOwner) {
      return NextResponse.json(
        { error: 'Bạn không có quyền cập nhật văn bản này' },
        { status: 403 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      console.error('Error parsing JSON:', jsonError)
      return NextResponse.json(
        { error: 'Dữ liệu JSON không hợp lệ', details: jsonError.message },
        { status: 400 }
      )
    }

    let validatedData
    try {
      validatedData = updateSchema.parse(body)
    } catch (validationError: any) {
      console.error('Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Dữ liệu không hợp lệ', 
            details: validationError.errors,
            received: body, // Include received data for debugging
          },
          { status: 400 }
        )
      }
      throw validationError
    }

    const updateData: any = {}
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.sender !== undefined) updateData.sender = validatedData.sender
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.priority) updateData.priority = validatedData.priority
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.deadline !== undefined) {
      if (validatedData.deadline && validatedData.deadline !== null) {
        try {
          const deadlineDate = new Date(validatedData.deadline)
          if (isNaN(deadlineDate.getTime())) {
            // Invalid date, set to null
            updateData.deadline = null
          } else {
            updateData.deadline = deadlineDate
          }
        } catch (e) {
          updateData.deadline = null
        }
      } else {
        updateData.deadline = null
      }
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes || null
    }
    // Parse and validate tags
    if (validatedData.tags !== undefined) {
      try {
        if (validatedData.tags) {
          const parsed = JSON.parse(validatedData.tags)
          if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
            updateData.tags = validatedData.tags
          } else {
            updateData.tags = null
          }
        } else {
          updateData.tags = null
        }
      } catch (e) {
        // Invalid JSON, set to null
        updateData.tags = null
      }
    }

    let document
    try {
      document = await prisma.incomingDocument.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
    } catch (prismaError: any) {
      console.error('Prisma update error:', prismaError)
      console.error('Prisma error code:', prismaError?.code)
      console.error('Prisma error message:', prismaError?.message)
      console.error('Update data:', updateData)
      
      // Check if it's a known Prisma error
      if (prismaError?.code === 'P2025') {
        return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
      }
      
      return NextResponse.json(
        { 
          error: 'Lỗi khi cập nhật database',
          details: process.env.NODE_ENV === 'development' ? prismaError?.message : undefined,
          updateData: process.env.NODE_ENV === 'development' ? updateData : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(document)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating incoming document:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    
    return NextResponse.json(
      { 
        error: 'Đã xảy ra lỗi khi cập nhật văn bản',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document to check ownership
    const document = await prisma.incomingDocument.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Văn bản không tồn tại' }, { status: 404 })
    }

    // Only allow ADMIN or user who created the document to delete
    // BGH cannot delete documents created by others
    const isAdmin = session.user.role === 'ADMIN'
    const isOwner = document.createdById === session.user.id
    const isBGH = session.user.role === 'BGH'

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể xóa văn bản do chính bạn tạo' },
        { status: 403 }
      )
    }

    // BGH cannot delete documents created by others
    if (isBGH && !isOwner) {
      return NextResponse.json(
        { error: 'Ban Giám Hiệu không được xóa văn bản của người khác' },
        { status: 403 }
      )
    }

    await prisma.incomingDocument.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Văn bản đã được xóa thành công' })
  } catch (error) {
    console.error('Error deleting incoming document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa văn bản' },
      { status: 500 }
    )
  }
}

