'use client'

import { useState, useEffect } from 'react'
import { X, Search, User, Calendar, FileText } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string | null
}

interface AssignUserModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onSuccess: () => void
}

export default function AssignUserModal({
  isOpen,
  onClose,
  documentId,
  onSuccess,
}: AssignUserModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    } else {
      // Reset form when modal closes
      setSearchQuery('')
      setSelectedUserId('')
      setDeadline('')
      setNotes('')
      setError(null)
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setSearching(true)
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (data.success && data.users) {
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) {
        fetchUsers()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedUserId) {
      setError('Vui lòng chọn người được phân công')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: selectedUserId,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi phân công')
      }

      // Success - close modal and refresh
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi phân công văn bản')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white font-poppins flex items-center space-x-2">
            <User size={24} />
            <span>Phân công xử lý</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
              <X size={20} />
              <span className="font-poppins">{error}</span>
            </div>
          )}

          {/* Search Users */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 font-poppins">
              Tìm kiếm người dùng
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              />
            </div>
          </div>

          {/* User List */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 font-poppins">
              Chọn người được phân công <span className="text-red-400">*</span>
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-800 rounded-lg">
              {searching ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400 mt-2 font-poppins">Đang tìm kiếm...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-400 font-poppins">Không tìm thấy người dùng</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-800 transition-colors ${
                        selectedUserId === user.id ? 'bg-blue-500/20' : ''
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
                        <p className="text-white font-poppins font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-400 font-poppins">
                          {user.email} • {user.role}
                        </p>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 font-poppins flex items-center space-x-2">
              <Calendar size={16} />
              <span>Hạn xử lý (tùy chọn)</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 font-poppins flex items-center space-x-2">
              <FileText size={16} />
              <span>Ghi chú (tùy chọn)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú phân công..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              {loading ? 'Đang xử lý...' : 'Phân công'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

