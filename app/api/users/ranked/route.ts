/**
 * GET /api/users/ranked
 * 
 * Returns users ranked by:
 * 1. Online status (online users first)
 * 2. Interaction score (highest to lowest)
 * 
 * Used by ContactsSidebar to display smart user list
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreManager, UserInteractionData } from '@/lib/user-interaction-scoring'
import { getUsersOnlineStatus, updateUserActivity } from '@/lib/online-status'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Update current user's activity
        await updateUserActivity(session.user.id)

        // Get users the current user has interacted with via messages
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { user1Id: session.user.id },
                    { user2Id: session.user.id },
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
                        role: true,
                    },
                },
                user2: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                        role: true,
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 100, // Last 100 messages for scoring
                },
                lastMessage: true,
            },
            orderBy: {
                lastMessageAt: 'desc',
            },
            take: 50, // Top 50 conversations
        })

        // Calculate interaction data for each user
        const rankedUsers = await Promise.all(
            conversations.map(async (conv) => {
                // Get the other user in conversation
                const otherUser = conv.user1Id === session.user.id ? conv.user2 : conv.user1

                // Calculate interaction metrics
                const messages = conv.messages
                const sentMessages = messages.filter(m => m.senderId === session.user.id).length
                const receivedMessages = messages.filter(m => m.senderId === otherUser.id).length
                const totalMessages = messages.length

                // Calculate time metrics
                const firstMessageTime = messages[messages.length - 1]?.createdAt
                const lastMessageTime = conv.lastMessageAt
                const daysSinceFirst = firstMessageTime
                    ? (Date.now() - firstMessageTime.getTime()) / (1000 * 60 * 60 * 24)
                    : 1

                // Calculate messages in last 7 days
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                const messagesLast7Days = messages.filter(m => m.createdAt >= sevenDaysAgo).length

                // Calculate conversation metrics
                const conversationCount = 1 // For now, each conversation is 1
                // TODO: Group messages by conversation sessions for more accurate count

                // Calculate average response time (simplified)
                let totalResponseTime = 0
                let responseCount = 0
                for (let i = 1; i < messages.length; i++) {
                    if (messages[i].senderId !== messages[i - 1].senderId) {
                        const responseTime = messages[i - 1].createdAt.getTime() - messages[i].createdAt.getTime()
                        totalResponseTime += Math.abs(responseTime)
                        responseCount++
                    }
                }
                const averageResponseTimeMinutes = responseCount > 0
                    ? totalResponseTime / responseCount / (1000 * 60)
                    : 60 // Default 60 minutes if no data

                // Create interaction data
                const interactionData: UserInteractionData = {
                    userId: otherUser.id,
                    totalMessages,
                    messagesLast7Days,
                    lastInteractionTime: lastMessageTime,
                    daysSinceFirstInteraction: Math.max(daysSinceFirst, 1),
                    avgConversationMinutes: 10, // TODO: Calculate from message timestamps
                    conversationCount,
                    longestConversationMinutes: 20, // TODO: Calculate from message groups
                    sentMessages,
                    receivedMessages,
                    textMessages: totalMessages, // All messages are text for now
                    reactions: 0, // TODO: Add reactions when implemented
                    averageResponseTimeMinutes,
                    conversationsInitiated: sentMessages > receivedMessages ? 1 : 0,
                }

                // Calculate score
                const score = scoreManager.calculateTotalScore(interactionData)

                return {
                    id: otherUser.id,
                    name: `${otherUser.firstName} ${otherUser.lastName}`,
                    firstName: otherUser.firstName,
                    lastName: otherUser.lastName,
                    avatar: otherUser.avatar,
                    email: otherUser.email,
                    role: otherUser.role,
                    score: score.total,
                    scoreBreakdown: score.breakdown,
                    lastInteraction: lastMessageTime,
                }
            })
        )

        // Get online status for all users
        const userIds = rankedUsers.map(u => u.id)
        const onlineStatus = await getUsersOnlineStatus(userIds)

        // Add online status and sort
        const rankedWithStatus = rankedUsers.map(user => ({
            ...user,
            isOnline: onlineStatus.get(user.id) || false,
        }))

        // Sort: Online first, then by score
        rankedWithStatus.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1
            if (!a.isOnline && b.isOnline) return 1
            return b.score - a.score
        })

        return NextResponse.json({
            contacts: rankedWithStatus,
            count: rankedWithStatus.length,
        })

    } catch (error) {
        console.error('[API] Error fetching ranked users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch ranked users' },
            { status: 500 }
        )
    }
}
