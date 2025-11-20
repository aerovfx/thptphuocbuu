'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Sparkles,
  Brain,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'

interface IncomingDocument {
  id: string
  title: string
  sender: string | null
  type: string
  status: string
  priority: string
  receivedDate: string
  deadline: string | null
  fileName: string
  fileUrl: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  assignments: Array<{
    id: string
    assignedTo: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
    }
    status: string
  }>
  _count: {
    approvals: number
    assignments: number
  }
}

interface IncomingDocumentsListProps {
  initialDocuments: IncomingDocument[]
  currentUser: any
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-purple-500/20 text-purple-400', icon: CheckCircle },
  ARCHIVED: { label: 'Lưu trữ', color: 'bg-gray-500/20 text-gray-400', icon: FileText },
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Khẩn', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  HIGH: { label: 'Cao', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  NORMAL: { label: 'Bình thường', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  LOW: { label: 'Thấp', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
}

const typeLabels: Record<string, string> = {
  DIRECTIVE: 'Chỉ đạo',
  RECORD: 'Hồ sơ',
  REPORT: 'Tờ trình',
  REQUEST: 'Đề nghị',
  OTHER: 'Khác',
}

export default function IncomingDocumentsList({
  initialDocuments,
  currentUser,
}: IncomingDocumentsListProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchType, setSearchType] = useState<'text' | 'semantic' | 'hybrid'>('text')
  const [isSearching, setIsSearching] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const canUpload = currentUser.user.role === 'ADMIN' || currentUser.user.role === 'TEACHER'

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to initial documents if search is empty
      setDocuments(initialDocuments)
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        searchType,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      })

      const response = await fetch(`/api/dms/documents/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      } else {
        console.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    // If search query exists, documents are already filtered by API
    if (searchQuery.trim()) {
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || doc.priority === priorityFilter
      const matchesType = typeFilter === 'all' || doc.type === typeFilter
      return matchesStatus && matchesPriority && matchesType
    }

    // Otherwise, filter locally
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.sender && doc.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || doc.priority === priorityFilter
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-poppins mb-2">Văn bản đến</h1>
          <p className="text-gray-400 font-poppins">
            Quản lý và xử lý các văn bản được gửi đến trường
          </p>
        </div>
        {canUpload && (
          <Link
            href="/dashboard/dms/incoming/upload"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Tải lên văn bản</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm văn bản (Enter để tìm)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setDocuments(initialDocuments)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Search Type Selector */}
            <div className="relative">
              <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'text' | 'semantic' | 'hybrid')}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
              >
                <option value="text">Tìm kiếm văn bản</option>
                <option value="semantic">Tìm kiếm ngữ nghĩa</option>
                <option value="hybrid">Tìm kiếm kết hợp</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Tìm kiếm</span>
                </>
              )}
            </button>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(statusLabels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
              >
                <option value="all">Tất cả mức độ</option>
                {Object.entries(priorityLabels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
              >
                <option value="all">Tất cả loại</option>
                {Object.entries(typeLabels).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white font-poppins transition-colors flex items-center justify-center space-x-2"
            >
              <Filter size={18} />
              <span>Bộ lọc nâng cao</span>
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-sm text-gray-400 font-poppins">
                  <p className="mb-2">Tính năng đang được phát triển:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Lọc theo ngày nhận</li>
                    <li>Lọc theo người phân công</li>
                    <li>Lọc theo người tạo</li>
                    <li>Lọc theo deadline</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-800">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-400 text-lg font-poppins">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Không tìm thấy văn bản nào'
              : 'Chưa có văn bản đến nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const StatusIcon = statusLabels[doc.status]?.icon || FileText
            const statusInfo = statusLabels[doc.status] || { label: doc.status, color: 'bg-gray-500/20 text-gray-400' }
            const priorityInfo = priorityLabels[doc.priority] || { label: doc.priority, color: 'bg-gray-500/20 text-gray-400' }

            return (
              <div
                key={doc.id}
                onClick={() => router.push(`/dashboard/dms/incoming/${doc.id}`)}
                className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-white font-poppins">{doc.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}>
                        <StatusIcon size={14} />
                        <span>{statusInfo.label}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityInfo.color} font-poppins`}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-400 font-poppins">
                        <span className="font-medium">Người gửi:</span>
                        <span>{doc.sender || 'Chưa xác định'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 font-poppins">
                        <span className="font-medium">Loại:</span>
                        <span>{typeLabels[doc.type] || doc.type}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 font-poppins">
                        <span className="font-medium">Ngày nhận:</span>
                        <span>
                          {formatDistanceToNow(new Date(doc.receivedDate), { addSuffix: true })}
                        </span>
                      </div>
                      {doc.deadline && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400 font-poppins">
                          <span className="font-medium">Hạn xử lý:</span>
                          <span className={new Date(doc.deadline) < new Date() ? 'text-red-400' : ''}>
                            {formatDistanceToNow(new Date(doc.deadline), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Assignments */}
                    {doc.assignments.length > 0 && (
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-sm text-gray-400 font-poppins">Phân công:</span>
                        <div className="flex items-center space-x-2">
                          {doc.assignments.slice(0, 3).map((assignment) => (
                            <div key={assignment.id} className="flex items-center space-x-1">
                              <Avatar
                                src={assignment.assignedTo.avatar}
                                name={`${assignment.assignedTo.firstName} ${assignment.assignedTo.lastName}`}
                                size="sm"
                              />
                              <span className="text-sm text-gray-400 font-poppins">
                                {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                              </span>
                            </div>
                          ))}
                          {doc.assignments.length > 3 && (
                            <span className="text-sm text-gray-500 font-poppins">
                              +{doc.assignments.length - 3} người khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Created By */}
                    <div className="flex items-center space-x-2">
                      <Avatar
                        src={doc.createdBy.avatar}
                        name={`${doc.createdBy.firstName} ${doc.createdBy.lastName}`}
                        size="sm"
                      />
                      <span className="text-sm text-gray-500 font-poppins">
                        Tạo bởi {doc.createdBy.firstName} {doc.createdBy.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      <FileText size={24} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

