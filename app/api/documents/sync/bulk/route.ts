import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { autoSyncDocument } from '@/lib/document-sync'

/**
 * POST /api/documents/sync/bulk
 * Đồng bộ hàng loạt tất cả văn bản từ DMS vào spaces và departments
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Chỉ ADMIN và SUPER_ADMIN mới có thể đồng bộ hàng loạt
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể đồng bộ hàng loạt' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { documentType, limit = 100 } = body

    let documents: Array<{ id: string; createdById: string | null; targetSpaces: string | null }> = []

    if (documentType === 'INCOMING') {
      documents = await prisma.incomingDocument.findMany({
        select: {
          id: true,
          createdById: true,
          targetSpaces: true,
        },
        take: limit,
      })
    } else if (documentType === 'OUTGOING') {
      documents = await prisma.outgoingDocument.findMany({
        select: {
          id: true,
          createdById: true,
          targetSpaces: true,
        },
        take: limit,
      })
    } else {
      // Đồng bộ cả hai loại
      const [incoming, outgoing] = await Promise.all([
        prisma.incomingDocument.findMany({
          select: {
            id: true,
            createdById: true,
            targetSpaces: true,
          },
          take: limit,
        }),
        prisma.outgoingDocument.findMany({
          select: {
            id: true,
            createdById: true,
            targetSpaces: true,
          },
          take: limit,
        }),
      ])

      documents = [
        ...incoming.map((d) => ({ ...d, documentType: 'INCOMING' as const })),
        ...outgoing.map((d) => ({ ...d, documentType: 'OUTGOING' as const })),
      ]
    }

    let synced = 0
    let errors = 0
    const errorDetails: Array<{ documentId: string; error: string }> = []

    for (const doc of documents) {
      try {
        if (!doc.createdById) {
          continue
        }

        const docType = (doc as any).documentType || documentType || 'INCOMING'
        
        // Kiểm tra xem đã được đồng bộ chưa
        const existingSync = await prisma.spaceDocument.findFirst({
          where: {
            documentId: doc.id,
            documentType: docType,
          },
        })

        if (!existingSync) {
          await autoSyncDocument(
            doc.id,
            docType,
            doc.createdById,
            doc.targetSpaces || null
          )
          synced++
        }
      } catch (error: any) {
        errors++
        errorDetails.push({
          documentId: doc.id,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã đồng bộ ${synced} văn bản`,
      stats: {
        total: documents.length,
        synced,
        errors,
        skipped: documents.length - synced - errors,
      },
      errors: errorDetails.length > 0 ? errorDetails : undefined,
    })
  } catch (error) {
    console.error('Error bulk syncing documents:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đồng bộ hàng loạt' },
      { status: 500 }
    )
  }
}

