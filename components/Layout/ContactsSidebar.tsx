'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '../Common/Avatar'
import { MessageCircle } from 'lucide-react'

interface RankedContact {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
  role?: string
  isOnline: boolean
  score: number
  scoreBreakdown?: {
    message: number
    recency: number
    duration: number
    type: number
    mutual: number
  }
  lastInteraction?: Date
}

export default function ContactsSidebar() {
  const router = useRouter()
  const [contacts, setContacts] = useState<RankedContact[]>([])
  const [loading, setLoading] = useState(true)

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/users/ranked')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to fetch ranked contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()

    // Auto-refresh every 30 seconds for online status updates
    const interval = setInterval(fetchContacts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleContactClick = (userId: string) => {
    router.push(`/messages/${userId}`)
  }

  const handleMessageClick = (userId: string) => {
    router.push(`/messages/${userId}`)
  }

  if (loading) {
    return (
      <aside className="fixed right-4 top-24 z-40 flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
      </aside>
    )
  }

  if (contacts.length === 0) {
    return null
  }

  return (
    <aside className="fixed right-4 top-24 z-40 flex flex-col items-center space-y-3">
      {contacts.slice(0, 8).map((contact) => (
        <div
          key={contact.id}
          className="relative group"
        >
          <button
            onClick={() => handleContactClick(contact.id)}
            className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-bluelock-green dark:border-blue-500 hover:border-bluelock-green-bright dark:hover:border-blue-400 transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg"
            title={`${contact.name}${contact.isOnline ? ' (Online)' : ''} - Score: ${contact.score}`}
          >
            <Avatar
              src={contact.avatar}
              name={contact.name}
              size="md"
            />

            {/* Online status indicator */}
            {contact.isOnline && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 z-10"
                title="Online"
              />
            )}
          </button>

          {/* Message button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMessageClick(contact.id)
            }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg z-20"
            title={`Nhắn tin cho ${contact.name}`}
          >
            <MessageCircle size={12} className="text-white" />
          </button>

          {/* Tooltip with score breakdown */}
          <div className="absolute left-full ml-2 top-0 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap z-30">
            <div className="font-semibold mb-1">{contact.name}</div>
            <div className="text-gray-400">Score: {contact.score}</div>
            {contact.isOnline && (
              <div className="text-green-400 flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Online
              </div>
            )}
          </div>
        </div>
      ))}
    </aside>
  )
}

