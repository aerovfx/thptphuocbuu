'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '../Common/Avatar'
import { MessageCircle } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  avatar?: string | null
  role?: string
}

export default function ContactsSidebar() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch('/api/users/recent-contacts')
        if (response.ok) {
          const data = await response.json()
          setContacts(data.contacts || [])
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  const handleContactClick = (userId: string) => {
    // Click vào avatar sẽ mở chat với user đó
    router.push(`/messages/${userId}`)
  }

  const handleMessageClick = (userId: string) => {
    // Icon message cũng mở chat
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
            title={contact.name}
          >
            <Avatar
              src={contact.avatar}
              name={contact.name}
              size="md"
            />
          </button>
          {/* Message button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMessageClick(contact.id)
            }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            title={`Nhắn tin cho ${contact.name}`}
          >
            <MessageCircle size={12} className="text-white" />
          </button>
        </div>
      ))}
    </aside>
  )
}

