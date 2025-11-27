'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Download,
  Eye,
  UserPlus,
  MessageSquare,
  RefreshCw,
  Edit,
  Trash2,
  File,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'
import AssignUserModal from './AssignUserModal'
import ScrumBoard from './ScrumBoard'
import PDFViewer from './PDFViewer'

interface IncomingDocumentDetailProps {
  document: any
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

export default function IncomingDocumentDetail({
  document: initialDocument,
  currentUser,
}: IncomingDocumentDetailProps) {
  const router = useRouter()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [document, setDocument] = useState(initialDocument)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPDFViewer, setShowPDFViewer] = useState(false)

  // Check if file is PDF
  const isPDF = document.fileUrl && (
    document.fileUrl.toLowerCase().endsWith('.pdf') ||
    document.mimeType === 'application/pdf'
  )

  // Parse tags safely - ensure consistent parsing
  const parseTags = (tags: any): string[] => {
    if (!tags) return []
    try {
      const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags
      return Array.isArray(tagsArray) ? tagsArray : []
    } catch {
      return []
    }
  }

  // Always use document.tags (which is initialized from initialDocument)
  // This ensures server and client render the same content
  const tagsArray = useMemo(() => {
    return parseTags(document.tags)
  }, [document.tags])
  
  // Format dates consistently
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const isDeadlineOverdue = (deadline: string | null | undefined): boolean => {
    if (!deadline) return false
    try {
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) return false
      return deadlineDate < new Date()
    } catch {
      return false
    }
  }

  const StatusIcon = statusLabels[document.status]?.icon || FileText
  const statusInfo = statusLabels[document.status] || {
    label: document.status,
    color: 'bg-gray-500/20 text-gray-400',
  }
  const priorityInfo = priorityLabels[document.priority] || {
    label: document.priority,
    color: 'bg-gray-500/20 text-gray-400',
  }

  const canAssign =
    (currentUser.user.role === 'ADMIN' || currentUser.user.role === 'TEACHER') &&
    document.status !== 'COMPLETED' &&
    document.status !== 'ARCHIVED'

  const canEdit = currentUser.user.role === 'ADMIN' || document.createdById === currentUser.user.id

  // Refresh document data
  const refreshDocument = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dms/incoming/${document.id}`)
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu văn bản')
      }
      const data = await response.json()
      setDocument(data)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu')
      console.error('Error refreshing document:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle assignment success
  const handleAssignmentSuccess = () => {
    refreshDocument()
  }

  // Handle file download
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      const link = window.document.createElement('a')
      link.href = document.fileUrl
      link.download = document.fileName || 'document'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (err) {
      console.error('Error downloading file:', err)
      alert('Không thể tải xuống file')
    }
  }

  // Handle file view
  const handleView = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open(document.fileUrl, '_blank', 'noopener,noreferrer')
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!canEdit) {
      alert('Bạn không có quyền cập nhật trạng thái')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn đổi trạng thái thành "${statusLabels[newStatus]?.label || newStatus}"?`)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dms/incoming/${document.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi cập nhật trạng thái')
      }

      // Refresh document data
      await refreshDocument()
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật trạng thái')
      console.error('Error updating status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!canEdit) {
      alert('Bạn không có quyền xóa văn bản này')
      return
    }

    if (!confirm('Bạn có chắc chắn muốn xóa văn bản này? Hành động này không thể hoàn tác.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dms/incoming/${document.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Đã xảy ra lỗi khi xóa văn bản')
      }

      // Redirect to documents list
      router.push('/dashboard/dms/incoming')
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa văn bản')
      console.error('Error deleting document:', err)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-poppins">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <h1 className="text-2xl font-bold text-white font-poppins">{document.title}</h1>
              {loading && (
                <RefreshCw className="animate-spin text-gray-400" size={20} />
              )}
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => canEdit && handleStatusUpdate(document.status)}
                title={canEdit ? 'Click để thay đổi trạng thái' : ''}
              >
                <StatusIcon size={16} />
                <span>{statusInfo.label}</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${priorityInfo.color} font-poppins`}
              >
                {priorityInfo.label}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/50 font-poppins">
                {typeLabels[document.type] || document.type}
              </span>
            </div>
            {/* Tags */}
            {tagsArray.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mt-3" suppressHydrationWarning>
                {tagsArray.map((tag: string, index: number) => (
                  <span
                    key={`tag-${index}-${tag}`}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 font-poppins"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isPDF && (
              <button
                onClick={() => setShowPDFViewer(true)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                title="Xem PDF"
              >
                <File size={20} />
              </button>
            )}
            <button
              onClick={handleView}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Xem file"
            >
              <Eye size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Tải xuống"
            >
              <Download size={20} />
            </button>
            <button
              onClick={refreshDocument}
              disabled={loading}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => router.push(`/dashboard/dms/incoming/${document.id}/edit`)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 bg-gray-800 hover:bg-red-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400 font-poppins">Người/nơi gửi</p>
              <p className="text-white font-poppins">{document.sender || 'Chưa xác định'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400 font-poppins">Ngày nhận</p>
              <p className="text-white font-poppins">
                {formatDate(document.receivedDate)}
              </p>
            </div>
          </div>
          {document.deadline && (
            <div className="flex items-center space-x-3">
              <Clock className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-400 font-poppins">Hạn xử lý</p>
                <p
                  className={`font-poppins ${
                    isDeadlineOverdue(document.deadline) ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {formatDate(document.deadline)}
                  {isDeadlineOverdue(document.deadline) && (
                    <span className="ml-2 text-xs">(Quá hạn)</span>
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400 font-poppins">Người tạo</p>
              <div className="flex items-center space-x-2">
                <Avatar
                  src={document.createdBy.avatar}
                  name={`${document.createdBy.firstName} ${document.createdBy.lastName}`}
                  size="sm"
                />
                <p className="text-white font-poppins">
                  {document.createdBy.firstName} {document.createdBy.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        {tagsArray.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-800" suppressHydrationWarning>
            <p className="text-sm text-gray-400 font-poppins mb-3">Tags</p>
            <div className="flex items-center flex-wrap gap-2">
              {tagsArray.map((tag: string, index: number) => (
                <span
                  key={`tag-section-${index}-${tag}`}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 font-poppins"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scrum Board */}
      {document.assignments.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-poppins flex items-center space-x-2">
              <UserPlus size={20} />
              <span>Quản lý nhiệm vụ (Scrum Board)</span>
            </h2>
            {canAssign && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold transition-colors text-sm"
              >
                Phân công thêm
              </button>
            )}
          </div>
          <ScrumBoard
            documentId={document.id}
            currentUser={currentUser}
            onTaskUpdate={refreshDocument}
            onAssignClick={() => setShowAssignModal(true)}
          />
        </div>
      )}

      {/* Assignments List (Fallback view) */}
      {document.assignments.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white font-poppins flex items-center space-x-2">
              <UserPlus size={20} />
              <span>Danh sách phân công</span>
            </h2>
          </div>
          <div className="space-y-3">
            {document.assignments.map((assignment: any) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={assignment.assignedTo.avatar}
                    name={`${assignment.assignedTo.firstName} ${assignment.assignedTo.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="text-white font-poppins font-semibold">
                      {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-gray-400 font-poppins">
                      {assignment.assignedTo.email} • {assignment.assignedTo.role}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      assignment.status === 'COMPLETED'
                        ? 'bg-green-500/20 text-green-400'
                        : assignment.status === 'PROCESSING'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    } font-poppins`}
                  >
                    {assignment.status === 'COMPLETED'
                      ? 'Hoàn thành'
                      : assignment.status === 'PROCESSING'
                      ? 'Đang xử lý'
                      : 'Chờ xử lý'}
                  </span>
                  {assignment.deadline && (
                    <p className="text-xs text-gray-500 mt-1 font-poppins">
                      Hạn: {formatDate(assignment.deadline)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Results */}
      {document.aiResults && document.aiResults.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-poppins">Kết quả AI</h2>
          <div className="space-y-4">
            {document.aiResults.map((aiResult: any) => (
              <div key={aiResult.id} className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-400 font-poppins">
                    {aiResult.aiType}
                  </span>
                  {aiResult.confidence && (
                    <span className="text-xs text-gray-400 font-poppins">
                      Độ tin cậy: {(aiResult.confidence * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <pre className="text-sm text-gray-300 font-poppins whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(aiResult.result), null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Content */}
      {document.ocrText && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-poppins">Nội dung OCR</h2>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-300 font-poppins whitespace-pre-wrap">{document.ocrText}</p>
            {document.ocrConfidence && (
              <p className="text-xs text-gray-500 mt-2 font-poppins">
                Độ tin cậy OCR: {(document.ocrConfidence * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      {document.summary && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-poppins">Tóm tắt AI</h2>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-300 font-poppins">{document.summary}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      {canAssign && document.assignments.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="text-center">
            <UserPlus className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-400 mb-4 font-poppins">Chưa có người được phân công</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Phân công xử lý
            </button>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      <AssignUserModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        documentId={document.id}
        onSuccess={handleAssignmentSuccess}
      />

      {/* PDF Viewer */}
      {isPDF && (
        <PDFViewer
          fileUrl={document.fileUrl}
          fileName={document.fileName}
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  )
}

