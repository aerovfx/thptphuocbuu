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
  Lock,
  Crown,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'
import { hasPremiumOrAdminAccess } from '@/lib/premium-check'

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
  tags?: string | null // JSON array string
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
  const hasAIAccess = hasPremiumOrAdminAccess(currentUser.user)

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

            {/* Search Type Selector - Only for Premium/Admin */}
            {hasAIAccess ? (
              <div className="relative">
                <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'text' | 'semantic' | 'hybrid')}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
                >
                  <option value="text">Tìm kiếm văn bản</option>
                  <option value="semantic">Tìm kiếm ngữ nghĩa (AI)</option>
                  <option value="hybrid">Tìm kiếm kết hợp (AI)</option>
                </select>
              </div>
            ) : (
              <Link
                href="/dashboard/premium"
                className="relative flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/30 transition-colors font-poppins"
                title="Nâng cấp Premium để sử dụng AI"
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm">Nâng cấp Premium</span>
              </Link>
            )}

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

            // Calculate progress based on status
            const getProgress = (status: string) => {
              switch (status) {
                case 'PENDING': return 0
                case 'PROCESSING': return 33
                case 'APPROVED': return 66
                case 'COMPLETED': return 100
                case 'REJECTED': return 0
                case 'ARCHIVED': return 100
                default: return 0
              }
            }

            const progress = getProgress(doc.status)
            const primaryAssignee = doc.assignments.length > 0 ? doc.assignments[0].assignedTo : null

            return (
              <div
                key={doc.id}
                onClick={() => router.push(`/dashboard/dms/incoming/${doc.id}`)}
                className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status and Priority Tags */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}>
                        <StatusIcon size={12} />
                        <span>{statusInfo.label}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityInfo.color} font-poppins`}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-white font-poppins mb-2 line-clamp-1">
                      {doc.title}
                    </h3>

                    {/* Metadata - Compact */}
                    <div className="space-y-1 mb-3">
                      {doc.sender && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400 font-poppins">
                          <span>{doc.sender}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 font-poppins">
                        <span>Nhận: {new Date(doc.receivedDate).toLocaleDateString('vi-VN')}</span>
                        {doc.deadline && (
                          <span className={new Date(doc.deadline) < new Date() ? 'text-red-400' : ''}>
                            Hạn: {new Date(doc.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      {/* Tags */}
                      {doc.tags && (() => {
                        try {
                          const tagsArray = typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags
                          if (Array.isArray(tagsArray) && tagsArray.length > 0) {
                            return (
                              <div className="flex items-center flex-wrap gap-1.5 mt-2">
                                {tagsArray.slice(0, 3).map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 font-poppins"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {tagsArray.length > 3 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400 font-poppins">
                                    +{tagsArray.length - 3}
                                  </span>
                                )}
                              </div>
                            )
                          }
                        } catch (e) {
                          // Invalid JSON, ignore
                        }
                        return null
                      })()}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 font-poppins">Tiến độ</span>
                        <span className="text-xs font-semibold text-white font-poppins">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            progress === 100 ? 'bg-green-500' :
                            progress >= 66 ? 'bg-blue-500' :
                            progress >= 33 ? 'bg-yellow-500' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Avatar and Actions */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {/* Primary Assignee Avatar */}
                    {primaryAssignee ? (
                      <div className="relative group">
                        <Avatar
                          src={primaryAssignee.avatar}
                          name={`${primaryAssignee.firstName} ${primaryAssignee.lastName}`}
                          size="md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400">?</span>
                      </div>
                    )}

                    {/* Action Icons */}
                    <div className="flex items-center space-x-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Xem"
                      >
                        <FileText size={18} />
                      </a>
                    </div>
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

