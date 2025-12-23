/**
 * Online Status Tracking System
 * 
 * Simple activity-based online status tracking:
 * - User is "online" if last activity within 5 minutes
 * - Updates on every API call via middleware
 * - Cached in User model for performance
 */

import { prisma } from './prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Online threshold: 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

/**
 * Update user's last activity timestamp
 */
export async function updateUserActivity(userId: string): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastActivityAt: new Date(),
                isOnline: true,
            },
        })
    } catch (error) {
        console.error('[OnlineStatus] Failed to update user activity:', error)
    }
}

/**
 * Check if a user is currently online
 * Based on last activity within threshold
 */
export async function isUserOnline(userId: string): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastActivityAt: true },
        })

        if (!user || !user.lastActivityAt) {
            return false
        }

        const now = new Date()
        const timeSince = now.getTime() - user.lastActivityAt.getTime()

        return timeSince < ONLINE_THRESHOLD_MS
    } catch (error) {
        console.error('[OnlineStatus] Failed to check user online status:', error)
        return false
    }
}

/**
 * Get online status for multiple users (batch operation)
 */
export async function getUsersOnlineStatus(userIds: string[]): Promise<Map<string, boolean>> {
    const statusMap = new Map<string, boolean>()

    if (userIds.length === 0) {
        return statusMap
    }

    try {
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, lastActivityAt: true },
        })

        const now = new Date()
        const threshold = now.getTime() - ONLINE_THRESHOLD_MS

        for (const user of users) {
            const isOnline = user.lastActivityAt
                ? user.lastActivityAt.getTime() > threshold
                : false
            statusMap.set(user.id, isOnline)
        }

        // Set false for users not found
        for (const userId of userIds) {
            if (!statusMap.has(userId)) {
                statusMap.set(userId, false)
            }
        }
    } catch (error) {
        console.error('[OnlineStatus] Failed to get users online status:', error)
        // Return all false on error
        for (const userId of userIds) {
            statusMap.set(userId, false)
        }
    }

    return statusMap
}

/**
 * Middleware wrapper to track user activity
 * 
 * Wraps API route handlers to automatically update lastActivityAt
 * 
 * @example
 * ```typescript
 * export const GET = trackActivity(async (request: NextRequest) => {
 *   // Activity automatically tracked
 *   return NextResponse.json({ data: 'something' })
 * })
 * ```
 */
export function trackActivity(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: any) => {
        // Execute handler first
        const response = await handler(request, context)

        // Update activity asynchronously (don't block response)
        getServerSession(authOptions).then(async (session) => {
            if (session?.user?.id) {
                // Fire and forget - don't await
                updateUserActivity(session.user.id).catch(err => {
                    console.error('[OnlineStatus] Activity tracking failed:', err)
                })
            }
        }).catch(() => {
            // Ignore session errors
        })

        return response
    }
}

/**
 * Background job to mark inactive users as offline
 * Should be run periodically (e.g., every 5-10 minutes)
 */
export async function markInactiveUsersOffline(): Promise<number> {
    try {
        const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS)

        const result = await prisma.user.updateMany({
            where: {
                isOnline: true,
                lastActivityAt: {
                    lt: threshold,
                },
            },
            data: {
                isOnline: false,
            },
        })

        return result.count
    } catch (error) {
        console.error('[OnlineStatus] Failed to mark inactive users offline:', error)
        return 0
    }
}

/**
 * Get count of currently online users
 */
export async function getOnlineUserCount(): Promise<number> {
    try {
        const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS)

        return await prisma.user.count({
            where: {
                lastActivityAt: {
                    gte: threshold,
                },
            },
        })
    } catch (error) {
        console.error('[OnlineStatus] Failed to get online user count:', error)
        return 0
    }
}
