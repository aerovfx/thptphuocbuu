import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { moderateContent } from '@/lib/content-moderation'
import { withCsrfProtection } from '@/lib/csrf-middleware'
import { authenticateRequest } from '@/lib/jwt-auth'

const createMessageSchema = z.object({
  conversationId: z.string().optional(),
  receiverId: z.string(),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
  imageUrl: z.string().url().optional(),
})

// GET /api/messages - Get conversations list
export async function GET(request: NextRequest) {
  try {
    const jwtUser = await authenticateRequest(request)
    const session = !jwtUser ? await getServerSession(authOptions) : null

    if (!jwtUser && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = jwtUser?.id || session?.user?.id
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If userId provided, get conversation with that user
    if (userId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: userId },
            { user1Id: userId, user2Id: currentUserId },
          ],
        },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true,
            },
          },
          lastMessage: true,
          messages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      })

      if (!conversation) {
        return NextResponse.json({ conversation: null, messages: [] })
      }

      // Get the other user
      const otherUser =
        conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1

      return NextResponse.json({
        conversation: {
          id: conversation.id,
          otherUser,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount:
            conversation.user1Id === currentUserId
              ? conversation.user1UnreadCount
              : conversation.user2UnreadCount,
        },
        messages: conversation.messages.reverse(), // Reverse to show oldest first
      })
    }

    // Get all conversations for current user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        user2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        lastMessage: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Transform conversations to include other user info
    const transformedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === currentUserId ? conv.user2 : conv.user1
      const unreadCount =
        conv.user1Id === currentUserId ? conv.user1UnreadCount : conv.user2UnreadCount

      return {
        id: conv.id,
        user: otherUser,
        lastMessage: conv.lastMessage
          ? {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            senderId: conv.lastMessage.senderId,
          }
          : null,
        lastMessageAt: conv.lastMessageAt || conv.updatedAt,
        unreadCount,
      }
    })

    return NextResponse.json({ conversations: transformedConversations })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách tin nhắn' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const jwtUser = await authenticateRequest(request)
    const session = !jwtUser ? await getServerSession(authOptions) : null

    if (!jwtUser && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = jwtUser?.id || session?.user?.id
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Content moderation (server-side) - TODO: Update to new API
    // const moderation = await moderateContent(
    //   validatedData.content,
    //   session.user.role,
    //   'COMMENT',
    //   session.user.id
    // )
    // if (!moderation.allowed) {
    //   return NextResponse.json(
    //     {
    //       error: moderation.message || 'Tin nhắn có chứa từ ngữ không phù hợp',
    //       code: 'CONTENT_BLOCKED',
    //       details: moderation,
    //     },
    //     { status: 400 }
    //   )
    // }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: validatedData.receiverId },
          { user1Id: validatedData.receiverId, user2Id: currentUserId },
        ],
      },
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          user1Id: currentUserId,
          user2Id: validatedData.receiverId,
        },
      })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserId,
        content: validatedData.content,
        imageUrl: validatedData.imageUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Update conversation's last message and unread count
    const isUser1 = conversation.user1Id === currentUserId
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        user1UnreadCount: isUser1 ? conversation.user1UnreadCount : conversation.user1UnreadCount + 1,
        user2UnreadCount: isUser1 ? conversation.user2UnreadCount + 1 : conversation.user2UnreadCount,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message,
      conversation: {
        id: conversation.id,
      }
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: error.errors }, { status: 400 })
    }
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi gửi tin nhắn' }, { status: 500 })
  }
}

