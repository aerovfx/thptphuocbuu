import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { feedCache } from '@/lib/cache'

/**
 * POST /api/feed/realtime
 * 
 * Invalidate cache khi có post mới hoặc engagement mới
 * WebSocket sẽ được handle ở separate endpoint
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, userId, postId } = body

    // Invalidate relevant caches
    switch (type) {
      case 'new_post':
        // Invalidate all feed caches
        await feedCache.invalidateAllFeeds()
        break

      case 'new_engagement':
        // Invalidate user's feed cache
        if (userId) {
          await feedCache.invalidateUserFeed(userId)
        }
        break

      case 'user_action':
        // Invalidate specific user's cache
        if (userId) {
          await feedCache.invalidateUserFeed(userId)
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

