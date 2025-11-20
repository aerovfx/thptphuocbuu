'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Download, Eye, Inbox, Send, Folder } from 'lucide-react'
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
    firstName: string
    lastName: string
  }
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
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing' | 'general'>('all')

  const canUpload = currentUser.role === 'ADMIN' || currentUser.role === 'TEACHER'

  const handleDocumentClick = (documentId: string, type: 'incoming' | 'outgoing') => {
    if (type === 'incoming') {
      window.location.href = `/dashboard/dms/incoming/${documentId}`
    } else {
      window.location.href = `/dashboard/dms/outgoing/${documentId}`
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
              <Link
                href="/dashboard/documents/upload"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Plus size={18} />
                <span>Tải lên tài liệu</span>
              </Link>
            </div>
          )}
        </div>

        {/* AI Search Bar */}
        <div className="mb-6">
          <AISearchBar
            placeholder="Tìm kiếm văn bản bằng AI (tên, nội dung, người gửi...)"
            onResultClick={(result) => handleDocumentClick(result.id, result.type === 'incoming' ? 'incoming' : 'outgoing')}
          />
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
                  {documents.length + incomingDocuments.length + outgoingDocuments.length}
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
                  {incomingDocuments.length}
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
                  {outgoingDocuments.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm font-poppins transition-colors`}
            >
              <div className="flex items-center gap-2">
                <Folder size={18} />
                <span>Tài liệu chung</span>
                <span className="bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {documents.length}
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
            {incomingDocuments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center gap-2">
                  <Inbox size={20} />
                  Văn bản đến ({incomingDocuments.length})
                </h2>
                <DocumentListDashboard
                  initialDocuments={incomingDocuments.map((doc) => ({
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
                    assignments: doc.assignments,
                    createdAt: doc.createdAt,
                  }))}
                  onDocumentClick={(id) => handleDocumentClick(id, 'incoming')}
                />
              </div>
            )}

            {/* Outgoing Documents Section */}
            {outgoingDocuments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center gap-2">
                  <Send size={20} />
                  Văn bản đi ({outgoingDocuments.length})
                </h2>
                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                  <div className="divide-y divide-gray-800">
                    {outgoingDocuments.map((doc) => (
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

            {/* General Documents Section */}
            {documents.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins flex items-center gap-2">
                  <Folder size={20} />
                  Tài liệu chung ({documents.length})
                </h2>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Tên văn bản
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Loại
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Người tải lên
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Kích thước
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Ngày tải lên
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="text-blue-500 mr-2" size={20} />
                              <div>
                                <div className="text-sm font-medium text-white font-poppins">
                                  {doc.title}
                                </div>
                                {doc.description && (
                                  <div className="text-sm text-gray-500 font-poppins">
                                    {doc.description.substring(0, 50)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-400 font-poppins">
                              {documentTypeLabels[doc.type] || doc.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                            {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                            {formatFileSize(doc.fileSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                            {formatDistanceToNow(new Date(doc.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="text-blue-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10"
                                title="Xem tài liệu"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = doc.fileUrl;
                                  link.download = doc.title || 'document';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="text-blue-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10"
                                title="Tải xuống"
                              >
                                <Download size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {incomingDocuments.length === 0 &&
              outgoingDocuments.length === 0 &&
              documents.length === 0 && (
                <div className="bg-gray-900 rounded-lg p-12 text-center">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-400 text-lg font-poppins">Chưa có văn bản nào</p>
                </div>
              )}
          </div>
        )}

        {activeTab === 'incoming' && (
          <DocumentListDashboard
            initialDocuments={incomingDocuments.map((doc) => ({
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
              assignments: doc.assignments,
              createdAt: doc.createdAt,
            }))}
            onDocumentClick={(id) => handleDocumentClick(id, 'incoming')}
          />
        )}

        {activeTab === 'outgoing' && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            {outgoingDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <Send className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-400 text-lg font-poppins">Chưa có văn bản đi nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {outgoingDocuments.map((doc) => (
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

        {activeTab === 'general' && (
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            {documents.length === 0 ? (
              <div className="p-12 text-center">
                <Folder className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-400 text-lg font-poppins">Chưa có tài liệu nào</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Tên văn bản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Người tải lên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Kích thước
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Ngày tải lên
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-800">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="text-blue-500 mr-2" size={20} />
                          <div>
                            <div className="text-sm font-medium text-white font-poppins">{doc.title}</div>
                            {doc.description && (
                              <div className="text-sm text-gray-500 font-poppins">
                                {doc.description.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-400 font-poppins">
                          {documentTypeLabels[doc.type] || doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                        {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="text-blue-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10"
                            title="Xem tài liệu"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = doc.fileUrl;
                              link.download = doc.title || 'document';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="text-blue-500 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10"
                            title="Tải xuống"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

