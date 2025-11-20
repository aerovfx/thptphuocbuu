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
  Send,
  Edit,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'

interface OutgoingDocument {
  id: string
  title: string
  content: string
  recipient: string | null
  documentNumber: string | null
  status: string
  priority: string
  createdAt: string
  sendDate: string | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  _count: {
    approvals: number
    signatures: number
  }
}

interface OutgoingDocumentsListProps {
  initialDocuments: OutgoingDocument[]
  currentUser: any
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  PROCESSING: { label: 'Đang phê duyệt', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  COMPLETED: { label: 'Đã gửi', color: 'bg-purple-500/20 text-purple-400', icon: Send },
  ARCHIVED: { label: 'Lưu trữ', color: 'bg-gray-500/20 text-gray-400', icon: FileText },
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Khẩn', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  HIGH: { label: 'Cao', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  NORMAL: { label: 'Bình thường', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  LOW: { label: 'Thấp', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
}

export default function OutgoingDocumentsList({
  initialDocuments,
  currentUser,
}: OutgoingDocumentsListProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const canCreate = currentUser.user.role === 'ADMIN' || currentUser.user.role === 'TEACHER'

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.recipient && doc.recipient.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || doc.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white mb-2 font-poppins">
            Văn bản đi
          </h1>
          <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins">
            Quản lý và gửi các văn bản từ trường
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/dms/outgoing/create"
            className="bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors shadow-bluelock-glow dark:shadow-none"
          >
            <Plus size={20} />
            <span>Tạo văn bản đi</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-4 mb-6 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bluelock-dark/60 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bluelock-dark/60 dark:text-gray-500" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins appearance-none transition-colors duration-300"
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
            <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bluelock-dark/60 dark:text-gray-500" size={20} />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins appearance-none transition-colors duration-300"
            >
              <option value="all">Tất cả mức độ</option>
              {Object.entries(priorityLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-12 text-center border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          <FileText className="mx-auto text-bluelock-dark/40 dark:text-gray-400 mb-4" size={48} />
          <p className="text-bluelock-dark/60 dark:text-gray-400 text-lg font-poppins">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Không tìm thấy văn bản nào'
              : 'Chưa có văn bản đi nào'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const StatusIcon = statusLabels[doc.status]?.icon || FileText
            const statusInfo = statusLabels[doc.status] || {
              label: doc.status,
              color: 'bg-gray-500/20 text-gray-400',
            }
            const priorityInfo = priorityLabels[doc.priority] || {
              label: doc.priority,
              color: 'bg-gray-500/20 text-gray-400',
            }

            return (
              <div
                key={doc.id}
                onClick={() => router.push(`/dashboard/dms/outgoing/${doc.id}`)}
                className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 hover:border-bluelock-green dark:hover:border-blue-500 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-bluelock-dark dark:text-white font-poppins">
                        {doc.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}
                      >
                        <StatusIcon size={14} />
                        <span>{statusInfo.label}</span>
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityInfo.color} font-poppins`}
                      >
                        {priorityInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {doc.documentNumber && (
                        <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                          <span className="font-medium">Số văn bản:</span>
                          <span>{doc.documentNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        <span className="font-medium">Người nhận:</span>
                        <span>{doc.recipient || 'Chưa xác định'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        <span className="font-medium">Ngày tạo:</span>
                        <span>
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {doc.sendDate && (
                        <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                          <span className="font-medium">Ngày gửi:</span>
                          <span>
                            {formatDistanceToNow(new Date(doc.sendDate), { addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-4">
                      <span>Phê duyệt: {doc._count.approvals}</span>
                      <span>Ký số: {doc._count.signatures}</span>
                    </div>

                    {/* Preview */}
                    <p className="text-bluelock-dark/70 dark:text-gray-300 text-sm line-clamp-2 font-poppins mb-4">
                      {doc.content.substring(0, 150)}...
                    </p>

                    {/* Created By */}
                    <div className="flex items-center space-x-2">
                      <Avatar
                        src={doc.createdBy.avatar}
                        name={`${doc.createdBy.firstName} ${doc.createdBy.lastName}`}
                        size="sm"
                      />
                      <span className="text-sm text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                        Tạo bởi {doc.createdBy.firstName} {doc.createdBy.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {doc.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/dms/outgoing/${doc.id}/edit`)
                        }}
                        className="p-2 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit size={20} className="text-bluelock-green dark:text-blue-500" />
                      </button>
                    )}
                    <FileText
                      size={24}
                      className="text-bluelock-green dark:text-blue-500"
                    />
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

