'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, User, Check } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface User {
  id: string
  firstName: string
  lastName: string
  avatar?: string | null
  email: string
}

interface ComposeMessageModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export default function ComposeMessageModal({
  isOpen,
  onClose,
  currentUserId,
}: ComposeMessageModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (isOpen && searchQuery.trim()) {
      searchUsers()
    } else {
      setUsers([])
    }
  }, [searchQuery, isOpen])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        // Filter out current user
        const filteredUsers = data.users.filter((user: User) => user.id !== currentUserId)
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
  }

  const handleStartConversation = () => {
    if (selectedUser) {
      router.push(`/messages/${selectedUser.id}`)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tin nhắn mới</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người dùng"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedUser.avatar}
                  name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  size="md"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{selectedUser.email.split('@')[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 && searchQuery.trim() ? (
            <div className="p-8 text-center">
              <User className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500 dark:text-gray-400">Không tìm thấy người dùng</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <Avatar
                    src={user.avatar}
                    name={`${user.firstName} ${user.lastName}`}
                    userId={user.id}
                    clickable={true}
                    size="md"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.email.split('@')[0]}
                    </p>
                  </div>
                  {selectedUser?.id === user.id && (
                    <Check size={20} className="text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedUser && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleStartConversation}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full transition-colors"
            >
              Trò chuyện
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

