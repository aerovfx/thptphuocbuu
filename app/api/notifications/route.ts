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

    const userId = session.user.id

    // Get recent posts that user might be interested in
    const recentPosts = await prisma.post.findMany({
      where: {
        authorId: {
          not: userId,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get pending approvals for DMS
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING',
      },
      include: {
        outgoingDocument: {
          select: {
            id: true,
            title: true,
          },
        },
        incomingDocument: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      posts: recentPosts,
      approvals: pendingApprovals,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông báo' },
      { status: 500 }
    )
  }
}

