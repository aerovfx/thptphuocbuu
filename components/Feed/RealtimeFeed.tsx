'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface FeedUpdate {
  type: 'new_post' | 'new_like' | 'new_comment' | 'new_repost'
  timestamp: string
  data: any
}

/**
 * RealtimeFeed Component
 * 
 * Sử dụng Server-Sent Events (SSE) hoặc polling để update feed real-time
 * WebSocket sẽ cần custom server setup
 */
export default function RealtimeFeed({
  onUpdate,
  userId,
}: {
  onUpdate: (update: FeedUpdate) => void
  userId?: string | null
}) {
  const { data: session } = useSession()
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId && !session?.user?.id) return

    const currentUserId = userId || session?.user?.id

    // Try Server-Sent Events first (if supported)
    try {
      const eventSource = new EventSource(
        `/api/feed/events?userId=${currentUserId}`
      )

      eventSource.onopen = () => {
        setConnected(true)
        console.log('Feed SSE connected')
      }

      eventSource.onmessage = (event) => {
        try {
          const update: FeedUpdate = JSON.parse(event.data)
          onUpdate(update)
        } catch (error) {
          console.error('Error parsing feed update:', error)
        }
      }

      eventSource.onerror = () => {
        setConnected(false)
        eventSource.close()
        // Fallback to polling
        if (currentUserId) {
          startPolling(currentUserId)
        }
      }

      eventSourceRef.current = eventSource

      return () => {
        eventSource.close()
      }
    } catch (error) {
      // SSE not supported, use polling
      console.log('SSE not supported, using polling')
      if (currentUserId) {
        startPolling(currentUserId)
      }
    }

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [userId, session?.user?.id, onUpdate])

  const startPolling = (currentUserId: string) => {
    // Poll for updates every 10 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/feed/updates?userId=${currentUserId}&lastUpdate=${Date.now()}`
        )
        if (response.ok) {
          const updates: FeedUpdate[] = await response.json()
          updates.forEach((update) => onUpdate(update))
        }
      } catch (error) {
        console.error('Error polling feed updates:', error)
      }
    }, 10000) // 10 seconds
  }

  return null // This component doesn't render anything
}

/**
 * Hook để sử dụng real-time feed updates
 */
export function useRealtimeFeed(onUpdate: (update: FeedUpdate) => void) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    const component = (
      <RealtimeFeed
        userId={session.user.id}
        onUpdate={(update) => {
          setIsConnected(true)
          onUpdate(update)
        }}
      />
    )

    // Note: This is a simplified implementation
    // In production, you'd render this component properly
  }, [session?.user?.id, onUpdate])

  return { isConnected }
}

