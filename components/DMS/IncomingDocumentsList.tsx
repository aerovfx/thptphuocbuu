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
  FileCheck,
  FileClock,
  FileX,
  FileArchive,
  Inbox,
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

// Thumbnail cho loại văn bản dựa theo documentTypeCode hoặc type
const docTypeThumbnail: Record<string, { label: string; bg: string; text: string }> = {
  CV:  { label: 'CV',  bg: 'bg-blue-600',    text: 'text-white' },
  QD:  { label: 'QĐ',  bg: 'bg-orange-500',  text: 'text-white' },
  TB:  { label: 'TB',  bg: 'bg-green-600',   text: 'text-white' },
  KH:  { label: 'KH',  bg: 'bg-purple-600',  text: 'text-white' },
  BC:  { label: 'BC',  bg: 'bg-cyan-600',    text: 'text-white' },
  BB:  { label: 'BB',  bg: 'bg-yellow-600',  text: 'text-white' },
  HD:  { label: 'HĐ',  bg: 'bg-red-600',     text: 'text-white' },
  CT:  { label: 'CT',  bg: 'bg-pink-600',    text: 'text-white' },
  DX:  { label: 'ĐX',  bg: 'bg-teal-600',   text: 'text-white' },
  TT:  { label: 'TT',  bg: 'bg-indigo-600',  text: 'text-white' },
  NQ:  { label: 'NQ',  bg: 'bg-rose-600',    text: 'text-white' },
  DIRECTIVE: { label: 'CĐ', bg: 'bg-orange-600', text: 'text-white' },
  REPORT:    { label: 'BC', bg: 'bg-cyan-600',   text: 'text-white' },
  REQUEST:   { label: 'ĐN', bg: 'bg-teal-600',  text: 'text-white' },
  RECORD:    { label: 'HS', bg: 'bg-gray-600',   text: 'text-white' },
}

function getDocThumbnail(doc: IncomingDocument) {
  const code = (doc as any).documentTypeCode || doc.type
  return docTypeThumbnail[code] || { label: 'VB', bg: 'bg-gray-600', text: 'text-white' }
}

function getFileExt(fileUrl?: string | null): string | null {
  if (!fileUrl) return null
  const match = fileUrl.split('?')[0].split('.').pop()?.toUpperCase()
  if (!match || match.length > 5) return null
  return match
}

const fileExtColor: Record<string, string> = {
  PDF:  'bg-red-500',
  DOC:  'bg-blue-500',
  DOCX: 'bg-blue-500',
  XLS:  'bg-green-600',
  XLSX: 'bg-green-600',
  PPT:  'bg-orange-500',
  PPTX: 'bg-orange-500',
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
                className="bg-gray-900 rounded-xl border border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex items-stretch gap-0">
                  {/* LEFT — Document type thumbnail */}
                  {(() => {
                    const thumb = getDocThumbnail(doc)
                    const ext = getFileExt((doc as any).fileUrl)
                    return (
                      <div className={`${thumb.bg} w-16 flex-shrink-0 flex flex-col items-center justify-center gap-1 relative`}>
                        <span className={`text-xl font-black ${thumb.text} tracking-tight leading-none`}>
                          {thumb.label}
                        </span>
                        {ext && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${fileExtColor[ext] || 'bg-gray-600'} text-white`}>
                            {ext}
                          </span>
                        )}
                        {/* Decorative dots */}
                        <div className="absolute bottom-2 flex gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                          <div className="w-1 h-1 rounded-full bg-white/20" />
                        </div>
                      </div>
                    )
                  })()}

                  {/* CENTER — Content */}
                  <div className="flex-1 min-w-0 p-3">
                    {/* Status + Priority */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}>
                        <StatusIcon size={11} />
                        <span>{statusInfo.label}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${priorityInfo.color} font-poppins`}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    {/* Title — marquee khi dài */}
                    <div className="overflow-hidden mb-1">
                      <h3
                        className="text-sm font-semibold text-white font-poppins whitespace-nowrap"
                        style={{
                          display: 'inline-block',
                          animation: doc.title.length > 50 ? 'marquee 10s linear infinite' : undefined,
                        }}
                      >
                        {doc.title}
                      </h3>
                    </div>

                    {/* Summary preview nếu có */}
                    {(doc as any).summary && (
                      <p className="text-xs text-gray-400 font-poppins line-clamp-2 mb-2 leading-relaxed">
                        {(doc as any).summary}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-poppins mb-2">
                      {doc.sender && <span className="text-gray-400 truncate max-w-[120px]">{doc.sender}</span>}
                      <span>Nhận: {new Date(doc.receivedDate).toLocaleDateString('vi-VN')}</span>
                      {doc.deadline && (
                        <span className={new Date(doc.deadline) < new Date() ? 'text-red-400 font-medium' : ''}>
                          Hạn: {new Date(doc.deadline).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${
                            progress === 100 ? 'bg-green-500' :
                            progress >= 66 ? 'bg-blue-500' :
                            progress >= 33 ? 'bg-yellow-500' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 w-7 text-right">{progress}%</span>
                    </div>
                  </div>

                  {/* RIGHT — Avatar + Actions */}
                  <div className="flex flex-col items-center justify-between gap-2 p-3 flex-shrink-0">
                    {/* Primary Assignee Avatar */}
                    {primaryAssignee ? (
                      <div className="relative group">
                        <Avatar
                          src={primaryAssignee.avatar}
                          name={`${primaryAssignee.firstName} ${primaryAssignee.lastName}`}
                          size="md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-gray-900" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <Inbox size={16} className="text-gray-500" />
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

