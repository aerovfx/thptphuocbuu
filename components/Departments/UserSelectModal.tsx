'use client'

import { useState, useEffect } from 'react'
import { X, Search, User, Loader2 } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
  role: string
}

interface UserSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (user: User) => void
  excludeUserIds?: string[]
  title?: string
}

export default function UserSelectModal({
  isOpen,
  onClose,
  onSelect,
  excludeUserIds = [],
  title = 'Chọn người dùng',
}: UserSelectModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const usersList = Array.isArray(data) ? data : (data.users || [])
        // Filter out excluded users
        const filtered = usersList.filter((user: User) => !excludeUserIds.includes(user.id))
        setUsers(filtered)
        setFilteredUsers(filtered)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400 font-poppins">
                {searchTerm ? 'Không tìm thấy người dùng nào' : 'Không có người dùng nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelect(user)
                    onClose()
                  }}
                  className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                >
                  <Avatar
                    src={user.avatar}
                    name={`${user.firstName} ${user.lastName}`}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white font-poppins">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins truncate">
                      {user.email}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded font-poppins">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-poppins font-semibold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

