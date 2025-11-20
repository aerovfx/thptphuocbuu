/**
 * Feed Broadcast Service
 * 
 * Helper functions để broadcast feed updates qua WebSocket
 */

import { wsManager } from '@/lib/websocket-manager'

/**
 * Broadcast feed update to user(s)
 */
export async function broadcastFeedUpdate(
  userId: string | null,
  updateType: 'new_post' | 'new_like' | 'new_comment' | 'new_repost',
  data: any
) {
  const message = {
    type: updateType,
    timestamp: new Date().toISOString(),
    data,
  }

  if (userId) {
    wsManager.broadcastToUser(userId, message)
  } else {
    wsManager.broadcastToAll(message)
  }
}

