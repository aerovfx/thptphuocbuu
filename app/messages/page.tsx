import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MessagesPage from '@/components/Messages/MessagesPage'

async function getConversations(userId: string) {
  try {
    // Check if conversation model exists
    if (!prisma.conversation) {
      console.error('Conversation model not found in Prisma Client')
      return []
    }

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

    // Transform conversations to include other user info
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
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
}

export default async function MessagesPageWrapper() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const conversations = await getConversations(session.user.id)

  return <MessagesPage conversations={conversations} currentUser={session} />
}

