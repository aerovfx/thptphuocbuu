import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Văn bản được công khai — không yêu cầu đăng nhập để xem chi tiết
    // Vẫn lấy session nếu có để hiển thị thêm thông tin cho user đã đăng nhập
    const session = await getServerSession(authOptions)

    const { id } = await params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        signatures: {
          include: {
            signedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
        access: {
          select: {
            id: true,
            userId: true,
            role: true,
            canView: true,
            canDownload: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Văn bản công khai: tất cả đều có thể xem, không giới hạn quyền đọc

    return NextResponse.json({
      ...document,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      signatures: document.signatures.map((sig) => ({
        ...sig,
        timestamp: sig.timestamp?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

