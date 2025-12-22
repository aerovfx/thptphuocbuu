'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Download, Eye, Inbox, Send, User, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import DocumentListDashboard from './DocumentListDashboard'
import AISearchBar from './AISearchBar'

interface User {
  id: string
  role: string
  firstName: string
  lastName: string
}

interface Document {
  id: string
  title: string
  description?: string | null
  type: string
  fileSize: number
  fileUrl: string
  createdAt: string
  uploadedBy: {
    firstName: string
    lastName: string
  }
}

interface IncomingDocument {
  id: string
  title: string
  documentNumber: string | null
  type: string
  status: string
  priority: string
  sender: string | null
  receivedDate: string
  deadline: string | null
  summary: string | null
  ocrConfidence: number | null
  aiCategory: string | null
  aiConfidence: number | null
  assignments: Array<{
    id: string
    assignedTo: {
      id: string
      firstName: string
      lastName: string
    }
    status: string
    deadline: string | null
  }>
  createdAt: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface OutgoingDocument {
  id: string
  title: string
  documentNumber: string | null
  status: string
  priority: string
  recipient: string | null
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

interface UploaderUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar: string | null
}

interface DocumentsTabsProps {
  documents: Document[]
  incomingDocuments: IncomingDocument[]
  outgoingDocuments: OutgoingDocument[]
  currentUser: User
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const documentTypeLabels: Record<string, string> = {
  ANNOUNCEMENT: 'Thông báo',
  POLICY: 'Chính sách',
  REPORT: 'Báo cáo',
  FORM: 'Biểu mẫu',
  OTHER: 'Khác',
}

export default function DocumentsTabs({
  documents,
  incomingDocuments,
  outgoingDocuments,
  currentUser,
}: DocumentsTabsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing'>('all')
  const [uploaders, setUploaders] = useState<UploaderUser[]>([])
  const [selectedUploaderId, setSelectedUploaderId] = useState<string | null>(null)
  const [loadingUploaders, setLoadingUploaders] = useState(false)

  const canUpload = currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER'

  // Fetch uploaders on mount
  useEffect(() => {
    async function fetchUploaders() {
      setLoadingUploaders(true)
      try {
        const response = await fetch('/api/users/documents-uploaders')
        if (response.ok) {
          const data = await response.json()
          setUploaders(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch uploaders:', error)
      } finally {
        setLoadingUploaders(false)
      }
    }
    fetchUploaders()
  }, [])

  // Filter documents by uploader
  const getFilteredDocuments = () => {
    let filteredIncoming = [...incomingDocuments]
    let filteredOutgoing = [...outgoingDocuments]

    if (selectedUploaderId) {
      filteredIncoming = incomingDocuments.filter(
        (doc) => doc.createdBy?.id === selectedUploaderId
      )
      filteredOutgoing = outgoingDocuments.filter(
        (doc) => doc.createdBy?.id === selectedUploaderId
      )
    }

    return { filteredIncoming, filteredOutgoing }
  }

  const { filteredIncoming, filteredOutgoing } = getFilteredDocuments()

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      BGH: 'Ban Giám Hiệu',
      TAI_CHINH: 'Kế toán',
      ADMIN: 'Quản trị viên',
      SUPER_ADMIN: 'IT Quản trị',
      TEACHER: 'Giáo viên',
    }
    return roleLabels[role] || ''
  }

  const handleDocumentClick = (documentId: string, type: 'incoming' | 'outgoing' | 'document') => {
    if (type === 'incoming') {
      window.location.href = `/dashboard/dms/incoming/${documentId}`
    } else if (type === 'outgoing') {
      window.location.href = `/dashboard/dms/outgoing/${documentId}`
    } else if (type === 'document') {
      window.location.href = `/dashboard/documents/${documentId}`
    }
  }

  return (
    <div className="p-6">
      {/* Header với tabs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white font-poppins">Quản lý văn bản</h1>
          {canUpload && (
            <div className="flex gap-2">
              <Link
                href="/dashboard/dms/incoming/upload"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Inbox size={18} />
                <span>Upload văn bản đến</span>
              </Link>
              <Link
                href="/dashboard/dms/outgoing/create"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Send size={18} />
                <span>Tạo văn bản đi</span>
              </Link>
            </div>
          )}
        </div>

        {/* AI Search Bar */}
        <div className="mb-6">
          <AISearchBar
            placeholder="Tìm kiếm văn bản bằng AI (tên, nội dung, người gửi...)"
            onResultClick={(result) => handleDocumentClick(result.id, result.type === 'incoming' ? 'incoming' : 'outgoing')}
            currentUser={currentUser}
          />
        </div>

        {/* Filter by Uploader */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300 font-poppins flex items-center gap-2">
              <User size={16} />
              <span>Lọc theo người đăng:</span>
            </label>
            <div className="flex-1 max-w-xs">
              <select
                value={selectedUploaderId || ''}
                onChange={(e) => setSelectedUploaderId(e.target.value || null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins text-sm"
              >
                <option value="">Tất cả người đăng</option>
                {uploaders.map((user) => {
                  const roleLabel = getRoleLabel(user.role)
                  return (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}{roleLabel ? ` (${roleLabel})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            {selectedUploaderId && (
              <button
                onClick={() => setSelectedUploaderId(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Xóa bộ lọc"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="border-b border-gray-800">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-poppins transition-colors`}
            >
              <div className="flex items-center gap-2">
                <FileText size={18} />
                <span>Tất cả</span>
                <span className="bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {selectedUploaderId 
                    ? filteredIncoming.length + filteredOutgoing.length
                    : incomingDocuments.length + outgoingDocuments.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`${
                activeTab === 'incoming'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-poppins transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Inbox size={18} />
                <span>Văn bản đến</span>
                <span className="bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {selectedUploaderId ? filteredIncoming.length : incomingDocuments.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`${
                activeTab === 'outgoing'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-poppins transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Send size={18} />
                <span>Văn bản đi</span>
                <span className="bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {selectedUploaderId ? filteredOutgoing.length : outgoingDocuments.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Incoming Documents Section */}
            {(selectedUploaderId ? filteredIncoming : incomingDocuments).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center gap-2">
                  <Inbox size={20} />
                  Văn bản đến ({selectedUploaderId ? filteredIncoming.length : incomingDocuments.length})
                </h2>
                <DocumentListDashboard
                  initialDocuments={(selectedUploaderId ? filteredIncoming : incomingDocuments).map((doc) => ({
                    id: doc.id,
                    documentNumber: doc.documentNumber,
                    title: doc.title,
                    type: doc.type,
                    status: doc.status,
                    priority: doc.priority,
                    sender: doc.sender,
                    receivedDate: doc.receivedDate,
                    deadline: doc.deadline,
                    summary: doc.summary,
                    ocrConfidence: doc.ocrConfidence,
                    aiCategory: doc.aiCategory,
                    aiConfidence: doc.aiConfidence,
                    assignments: (doc.assignments || []).map((a) => ({
                      ...a,
                      assignedTo: {
                        ...a.assignedTo,
                        avatar: null,
                      },
                    })),
                    createdAt: doc.createdAt,
                  }))}
                  onDocumentClick={(id) => handleDocumentClick(id, 'incoming')}
                />
              </div>
            )}

            {/* Outgoing Documents Section */}
            {(selectedUploaderId ? filteredOutgoing : outgoingDocuments).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center gap-2">
                  <Send size={20} />
                  Văn bản đi ({selectedUploaderId ? filteredOutgoing.length : outgoingDocuments.length})
                </h2>
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {(selectedUploaderId ? filteredOutgoing : outgoingDocuments).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => handleDocumentClick(doc.id, 'outgoing')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                {doc.status}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                {doc.priority}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">{doc.title}</h3>
                            {doc.documentNumber && (
                              <p className="text-sm text-gray-400 mb-2">Số: {doc.documentNumber}</p>
                            )}
                            {doc.recipient && (
                              <p className="text-sm text-gray-400 mb-2">Người nhận: {doc.recipient}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Tạo bởi: {doc.createdBy.firstName} {doc.createdBy.lastName} •{' '}
                              {formatDistanceToNow(new Date(doc.createdAt), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(selectedUploaderId 
              ? filteredIncoming.length === 0 && filteredOutgoing.length === 0
              : incomingDocuments.length === 0 && outgoingDocuments.length === 0) && (
                <div className="bg-gray-900 rounded-lg p-12 text-center">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-400 text-lg font-poppins">Chưa có văn bản nào</p>
                </div>
              )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <DocumentListDashboard
            initialDocuments={(selectedUploaderId ? filteredIncoming : incomingDocuments).map((doc) => ({
              id: doc.id,
              documentNumber: doc.documentNumber,
              title: doc.title,
              type: doc.type,
              status: doc.status,
              priority: doc.priority,
              sender: doc.sender,
              receivedDate: doc.receivedDate,
              deadline: doc.deadline,
              summary: doc.summary,
              ocrConfidence: doc.ocrConfidence,
              aiCategory: doc.aiCategory,
              aiConfidence: doc.aiConfidence,
              assignments: (doc.assignments || []).map((a) => ({
                ...a,
                assignedTo: {
                  ...a.assignedTo,
                  avatar: null,
                },
              })),
              createdAt: doc.createdAt,
            }))}
            onDocumentClick={(id) => handleDocumentClick(id, 'incoming')}
          />
        )}

        {activeTab === 'outgoing' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            {(selectedUploaderId ? filteredOutgoing : outgoingDocuments).length === 0 ? (
              <div className="p-12 text-center">
                <Send className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-400 text-lg font-poppins">
                  {selectedUploaderId ? 'Không có văn bản đi nào từ người này' : 'Chưa có văn bản đi nào'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {(selectedUploaderId ? filteredOutgoing : outgoingDocuments).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => handleDocumentClick(doc.id, 'outgoing')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            {doc.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                            {doc.priority}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">{doc.title}</h3>
                        {doc.documentNumber && (
                          <p className="text-sm text-gray-400 mb-2">Số: {doc.documentNumber}</p>
                        )}
                        {doc.recipient && (
                          <p className="text-sm text-gray-400 mb-2">Người nhận: {doc.recipient}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Tạo bởi: {doc.createdBy.firstName} {doc.createdBy.lastName} •{' '}
                          {formatDistanceToNow(new Date(doc.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

