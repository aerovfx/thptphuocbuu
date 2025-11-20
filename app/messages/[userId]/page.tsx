import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MessagesPage from '@/components/Messages/MessagesPage'

async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
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

  const transformedConversations = conversations.map((conv) => {
    const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
    const unreadCount = conv.user1Id === userId ? conv.user1UnreadCount : conv.user2UnreadCount

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

  return transformedConversations
}

async function getConversationWithUser(currentUserId: string, targetUserId: string) {
  try {
    // First, verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        email: true,
      },
    })

    if (!targetUser) {
      return null
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId },
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
        lastMessage: {
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
      // No conversation exists yet, but user exists - create a placeholder conversation object
      return {
        conversation: {
          id: '',
          user: targetUser,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
        },
        otherUser: targetUser,
        messages: [],
      }
    }

    const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1

    return {
      conversation: {
        id: conversation.id,
        user: otherUser,
        lastMessage: conversation.lastMessage
          ? {
              content: conversation.lastMessage.content,
              createdAt: conversation.lastMessage.createdAt,
              senderId: conversation.lastMessage.senderId,
            }
          : null,
        lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt) : (conversation.updatedAt ? new Date(conversation.updatedAt) : null),
        unreadCount:
          conversation.user1Id === currentUserId
            ? conversation.user1UnreadCount
            : conversation.user2UnreadCount,
      },
      otherUser,
      messages: conversation.messages.reverse(),
    }
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return null
  }
}

export default async function MessagesWithUserPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const { userId } = await params

  if (userId === session.user.id) {
    redirect('/messages')
  }

  const [conversations, conversationData] = await Promise.all([
    getConversations(session.user.id),
    getConversationWithUser(session.user.id, userId),
  ])

  return (
    <MessagesPage
      conversations={conversations}
      currentUser={session}
      initialConversation={conversationData?.conversation || null}
      initialMessages={conversationData?.messages || []}
    />
  )
}

