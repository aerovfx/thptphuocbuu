import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Avoid FK violations (friendships_user1Id_fkey) when session token id is stale/missing.
    const currentUserId = await resolveCurrentUserId(session)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
        { status: 401 }
      )
    }

    const { id: targetUserId } = await params

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Bạn không thể theo dõi chính mình' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    // Check if already following (one-way: user1Id follows user2Id)
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        user1Id: currentUserId,
        user2Id: targetUserId,
      },
    })

    if (existingFriendship) {
      return NextResponse.json({ error: 'Đã theo dõi người dùng này' }, { status: 400 })
    }

    // Check if there's a pending friend request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
      },
    })

    if (existingRequest) {
      // If there's a request from target user, accept it
      if (existingRequest.senderId === targetUserId) {
        await prisma.friendRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'ACCEPTED' },
        })

        // Create friendship: receiver (session.user.id) follows sender (targetUserId)
        // One-way model: user1Id follows user2Id
        // When User A sends request to User B and User B accepts:
        // User B (acceptor) should follow User A (requester)
        // This matches the endpoint semantics: POST /api/users/A/follow means "I want to follow A"
        // So: session.user.id (acceptor) follows targetUserId (requester)
        await prisma.friendship.create({
          data: {
            user1Id: currentUserId, // The acceptor follows
            user2Id: targetUserId, // The requester is being followed
          },
        })

        return NextResponse.json({ message: 'Đã chấp nhận yêu cầu và theo dõi' })
      } else {
        return NextResponse.json({ error: 'Đã gửi yêu cầu theo dõi' }, { status: 400 })
      }
    }

    // Create friendship directly (no approval needed for follow)
    await prisma.friendship.create({
      data: {
        user1Id: currentUserId,
        user2Id: targetUserId,
      },
    })

    return NextResponse.json({ message: 'Đã theo dõi thành công' })
  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi theo dõi' },
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

    const currentUserId = await resolveCurrentUserId(session)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
        { status: 401 }
      )
    }

    const { id: targetUserId } = await params

    // Find and delete friendship (one-way: user1Id follows user2Id)
    const friendship = await prisma.friendship.findFirst({
      where: {
        user1Id: currentUserId,
        user2Id: targetUserId,
      },
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Chưa theo dõi người dùng này' }, { status: 404 })
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    })

    return NextResponse.json({ message: 'Đã hủy theo dõi thành công' })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi hủy theo dõi' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = await resolveCurrentUserId(session)
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
        { status: 401 }
      )
    }

    const { id: targetUserId } = await params

    // Check if current user is following target user (one-way: user1Id follows user2Id)
    const friendship = await prisma.friendship.findFirst({
      where: {
        user1Id: currentUserId,
        user2Id: targetUserId,
      },
    })

    return NextResponse.json({ isFollowing: !!friendship })
  } catch (error) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi kiểm tra trạng thái theo dõi' },
      { status: 500 }
    )
  }
}

