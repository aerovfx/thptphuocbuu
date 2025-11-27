'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Plus, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import DocumentProgressTracker from './DocumentProgressTracker'

interface SpaceDocument {
  id: string
  documentId: string
  documentType: 'INCOMING' | 'OUTGOING'
  assignedAt: string
  visibility: string
  relevanceScore?: number // Điểm phù hợp với space/tổ
  document: {
    id: string
    title: string
    status: string
    priority?: string
    createdAt: string
    updatedAt: string
    // IncomingDocument fields
    documentNumber?: string | null
    sender?: string | null
    receivedDate?: string
    deadline?: string | null
    type?: string
    // OutgoingDocument fields
    recipient?: string | null
    sendDate?: string | null
    createdBy?: {
      id: string
      firstName: string
      lastName: string
      avatar?: string | null
    }
  }
}

interface SpaceDocumentsListProps {
  spaceId: string
  canCreate: boolean
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Loader2 },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: CheckCircle2 },
  ARCHIVED: { label: 'Lưu trữ', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: FileText },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Khẩn cấp', color: 'bg-red-500' },
  HIGH: { label: 'Cao', color: 'bg-orange-500' },
  NORMAL: { label: 'Bình thường', color: 'bg-blue-500' },
  LOW: { label: 'Thấp', color: 'bg-gray-500' },
}

export default function SpaceDocumentsList({ spaceId, canCreate }: SpaceDocumentsListProps) {
  const [documents, setDocuments] = useState<SpaceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [spaceId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/spaces/${spaceId}/documents`)
      const data = await response.json()
      
      if (!response.ok) {
        const errorMessage = data.error || 'Không thể tải danh sách văn bản'
        const errorDetails = data.details ? ` (${data.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }
      
      setDocuments(data || [])
    } catch (err: any) {
      console.error('Error fetching documents:', err)
      setError(err.message || 'Đã xảy ra lỗi khi tải văn bản')
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      doc.document.title.toLowerCase().includes(query) ||
      doc.document.documentNumber?.toLowerCase().includes(query) ||
      doc.document.sender?.toLowerCase().includes(query) ||
      doc.document.recipient?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 font-poppins">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
            Văn bản trong Space
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
            {filteredDocuments.length} văn bản
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/documents/upload"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo văn bản</span>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm văn bản..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
        />
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-poppins">
            {searchQuery ? 'Không tìm thấy văn bản nào' : 'Chưa có văn bản nào trong space này'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((spaceDoc) => {
            const doc = spaceDoc.document
            const StatusIcon = statusConfig[doc.status]?.icon || FileText
            const statusInfo = statusConfig[doc.status] || { label: doc.status, color: 'bg-gray-100 text-gray-800', icon: FileText }
            const priorityInfo = doc.priority ? priorityConfig[doc.priority] : null

            // Hiển thị badge nếu có điểm phù hợp cao
            const isRelevant = spaceDoc.relevanceScore && spaceDoc.relevanceScore > 0

            return (
              <div
                key={spaceDoc.id}
                className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  isRelevant 
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelectedDocument(selectedDocument === doc.id ? null : doc.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1 flex items-center gap-2">
                        <Link
                          href={
                            spaceDoc.documentType === 'INCOMING'
                              ? `/dashboard/dms/incoming/${doc.id}`
                              : `/dashboard/dms/outgoing/${doc.id}`
                          }
                          className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-poppins"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.title}
                        </Link>
                        {isRelevant && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full flex items-center gap-1">
                            🏢 Phù hợp
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color} font-poppins flex items-center space-x-1`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.label}</span>
                      </span>
                      {priorityInfo && (
                        <span className={`px-2 py-1 rounded text-xs text-white font-medium font-poppins`} style={{ backgroundColor: priorityInfo.color.replace('bg-', '').replace('-500', '') }}>
                          {priorityInfo.label}
                        </span>
                      )}
                      {doc.documentNumber && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-poppins">
                          Số: {doc.documentNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 font-poppins space-y-1">
                      {spaceDoc.documentType === 'INCOMING' && doc.sender && (
                        <p>Người gửi: {doc.sender}</p>
                      )}
                      {spaceDoc.documentType === 'OUTGOING' && doc.recipient && (
                        <p>Người nhận: {doc.recipient}</p>
                      )}
                      {doc.createdBy && (
                        <p>
                          Người tạo: {doc.createdBy.firstName} {doc.createdBy.lastName}
                        </p>
                      )}
                      <p>
                        {spaceDoc.documentType === 'INCOMING' && doc.receivedDate
                          ? `Nhận ngày: ${formatDistanceToNow(new Date(doc.receivedDate), { addSuffix: true, locale: vi })}`
                          : `Tạo ${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: vi })}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Tracker - Expandable */}
                {selectedDocument === doc.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <DocumentProgressTracker
                      documentId={doc.id}
                      documentType={spaceDoc.documentType}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

