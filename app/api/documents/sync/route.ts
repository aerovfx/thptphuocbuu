import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncDocumentToSpacesAndDepartments, autoSyncDocument } from '@/lib/document-sync'
import { z } from 'zod'

const syncDocumentSchema = z.object({
  documentId: z.string(),
  documentType: z.enum(['INCOMING', 'OUTGOING']),
  spaceIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  removeFromSpaces: z.array(z.string()).optional(),
  removeFromDepartments: z.array(z.string()).optional(),
})

/**
 * POST /api/documents/sync
 * Đồng bộ văn bản với spaces và departments
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN, BGH, và TEACHER mới có thể đồng bộ
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TEACHER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền đồng bộ văn bản' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = syncDocumentSchema.parse(body)

    await syncDocumentToSpacesAndDepartments({
      documentId: validatedData.documentId,
      documentType: validatedData.documentType,
      spaceIds: validatedData.spaceIds || [],
      departmentIds: validatedData.departmentIds || [],
      removeFromSpaces: validatedData.removeFromSpaces || [],
      removeFromDepartments: validatedData.removeFromDepartments || [],
    })

    return NextResponse.json({ success: true, message: 'Đồng bộ thành công' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error syncing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đồng bộ văn bản' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents/sync/auto
 * Tự động đồng bộ văn bản (dùng lại logic autoSync)
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'BGH', 'TEACHER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền đồng bộ văn bản' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { documentId, documentType, createdById, targetSpaces } = body

    if (!documentId || !documentType || !createdById) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const result = await autoSyncDocument(
      documentId,
      documentType,
      createdById,
      targetSpaces || null
    )

    return NextResponse.json({
      success: true,
      message: 'Đồng bộ tự động thành công',
      result,
    })
  } catch (error) {
    console.error('Error auto-syncing document:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đồng bộ tự động văn bản' },
      { status: 500 }
    )
  }
}

