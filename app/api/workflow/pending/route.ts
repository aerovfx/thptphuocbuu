import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get pending approvals for current user
    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where: {
          approverId: session.user.id,
          status: 'PENDING',
        },
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          incomingDocument: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          outgoingDocument: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
          workItem: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: [
          { deadline: 'asc' },
          { createdAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.approval.count({
        where: {
          approverId: session.user.id,
          status: 'PENDING',
        },
      }),
    ])

    return NextResponse.json({
      approvals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách phê duyệt chờ xử lý' },
      { status: 500 }
    )
  }
}

