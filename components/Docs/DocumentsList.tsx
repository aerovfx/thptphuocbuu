'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Search, Clock, User, MoreVertical } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Document {
  id: string
  title: string
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  }
  updatedAt: string
  lastEditedAt: string | null
  lastEditedBy: string | null
  _count: {
    revisions: number
    comments: number
  }
  permissions: Array<{
    role: string
  }>
}

interface DocumentsListProps {
  currentUser: any
}

export default function DocumentsList({ currentUser }: DocumentsListProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/docs')
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert('Vui lòng nhập tiêu đề')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      router.push(`/dashboard/docs/${data.id}`)
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi khi tạo tài liệu')
    } finally {
      setIsCreating(false)
      setShowCreateModal(false)
      setNewDocTitle('')
    }
  }

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Chủ sở hữu'
      case 'EDITOR':
        return 'Chỉnh sửa'
      case 'COMMENTER':
        return 'Bình luận'
      case 'VIEWER':
        return 'Xem'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bluelock-green mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins mb-2">
            Tài liệu cộng tác
          </h1>
          <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins">
            Tạo và cộng tác trên tài liệu giống Google Docs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Tạo tài liệu</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-bluelock-light-2 dark:bg-gray-900 rounded-lg border border-bluelock-blue/30 dark:border-gray-800">
          <FileText size={48} className="mx-auto mb-4 text-bluelock-dark/40 dark:text-gray-600" />
          <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-4">
            {searchQuery ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu nào'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Tạo tài liệu đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/dashboard/docs/${doc.id}`)}
              className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-4 border border-bluelock-blue/30 dark:border-gray-800 hover:border-bluelock-green dark:hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText size={20} className="text-bluelock-green" />
                  <h3 className="font-semibold text-bluelock-dark dark:text-white font-poppins truncate flex-1">
                    {doc.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // TODO: Show menu
                  }}
                  className="p-1 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded"
                >
                  <MoreVertical size={16} className="text-bluelock-dark/60 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Avatar
                  src={doc.owner.avatar}
                  name={`${doc.owner.firstName} ${doc.owner.lastName}`}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-bluelock-dark dark:text-white font-poppins truncate">
                    {doc.owner.firstName} {doc.owner.lastName}
                  </p>
                  {doc.permissions[0] && (
                    <p className="text-xs text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      {getRoleLabel(doc.permissions[0].role)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>
                    {doc.lastEditedAt
                      ? formatDistanceToNow(new Date(doc.lastEditedAt), {
                          addSuffix: true,
                          locale: vi,
                        })
                      : formatDistanceToNow(new Date(doc.updatedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  {doc._count.comments > 0 && (
                    <span>{doc._count.comments} bình luận</span>
                  )}
                  {doc._count.revisions > 0 && (
                    <span>{doc._count.revisions} phiên bản</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-bluelock-blue/30 dark:border-gray-800">
            <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins mb-4">
              Tạo tài liệu mới
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateDocument()
                    }
                  }}
                  className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
                  placeholder="Nhập tiêu đề tài liệu"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewDocTitle('')
                }}
                className="px-4 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={isCreating || !newDocTitle.trim()}
                className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

