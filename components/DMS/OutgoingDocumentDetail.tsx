'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  User,
  Calendar,
  Edit,
  Download,
  Eye,
  UserCheck,
  PenTool,
  File,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Avatar from '@/components/Common/Avatar'
import SubmitApprovalModal from './SubmitApprovalModal'
import PDFViewer from './PDFViewer'

interface OutgoingDocumentDetailProps {
  document: any
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

export default function OutgoingDocumentDetail({
  document,
  currentUser,
}: OutgoingDocumentDetailProps) {
  const router = useRouter()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState(false)

  // Check if file is PDF
  const isPDF = document.fileUrl && (
    document.fileUrl.toLowerCase().endsWith('.pdf') ||
    document.mimeType === 'application/pdf'
  )

  const handleSubmitApproval = async (approvers: Array<{ userId: string; level: number; deadline?: string }>) => {
    try {
      const response = await fetch(`/api/dms/outgoing/${document.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approvers }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error submitting for approval:', error)
      alert(error.message || 'Đã xảy ra lỗi')
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

  const canEdit = currentUser.user.role === 'ADMIN' || document.createdById === currentUser.user.id
  const canSubmit = canEdit && document.status === 'PENDING' && document.approvals.length === 0
  const canApprove = document.approvals.some(
    (approval: any) =>
      approval.approverId === currentUser.user.id && approval.status === 'PENDING'
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 mb-6 transition-colors duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white mb-3 font-poppins">
              {document.title}
            </h1>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}
              >
                <StatusIcon size={16} />
                <span>{statusInfo.label}</span>
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${priorityInfo.color} font-poppins`}
              >
                {priorityInfo.label}
              </span>
              {document.documentNumber && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-bluelock-blue/20 text-bluelock-blue dark:bg-blue-500/20 dark:text-blue-400 border border-bluelock-blue/50 dark:border-blue-500/50 font-poppins">
                  {document.documentNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {document.fileUrl && (
              <>
                {isPDF && (
                  <button
                    onClick={() => setShowPDFViewer(true)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                    title="Xem PDF"
                  >
                    <File size={20} />
                  </button>
                )}
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-bluelock-light-3 dark:bg-gray-800 hover:bg-bluelock-light dark:hover:bg-gray-700 rounded-lg text-bluelock-dark dark:text-gray-400 hover:text-bluelock-green dark:hover:text-white transition-colors"
                  title="Xem file"
                >
                  <Eye size={20} />
                </a>
                <a
                  href={document.fileUrl}
                  download
                  className="p-2 bg-bluelock-light-3 dark:bg-gray-800 hover:bg-bluelock-light dark:hover:bg-gray-700 rounded-lg text-bluelock-dark dark:text-gray-400 hover:text-bluelock-green dark:hover:text-white transition-colors"
                  title="Tải xuống"
                >
                  <Download size={20} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-bluelock-blue/30 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <User className="text-bluelock-dark/60 dark:text-gray-400" size={20} />
            <div>
              <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                Người/nơi nhận
              </p>
              <p className="text-bluelock-dark dark:text-white font-poppins">
                {document.recipient || 'Chưa xác định'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="text-bluelock-dark/60 dark:text-gray-400" size={20} />
            <div>
              <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                Ngày tạo
              </p>
              <p className="text-bluelock-dark dark:text-white font-poppins">
                {new Date(document.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          {document.sendDate && (
            <div className="flex items-center space-x-3">
              <Send className="text-bluelock-dark/60 dark:text-gray-400" size={20} />
              <div>
                <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                  Ngày gửi
                </p>
                <p className="text-bluelock-dark dark:text-white font-poppins">
                  {new Date(document.sendDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <User className="text-bluelock-dark/60 dark:text-gray-400" size={20} />
            <div>
              <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                Người tạo
              </p>
              <div className="flex items-center space-x-2">
                <Avatar
                  src={document.createdBy.avatar}
                  name={`${document.createdBy.firstName} ${document.createdBy.lastName}`}
                  size="sm"
                />
                <p className="text-bluelock-dark dark:text-white font-poppins">
                  {document.createdBy.firstName} {document.createdBy.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 mb-6 transition-colors duration-300">
        <h2 className="text-lg font-semibold text-bluelock-dark dark:text-white mb-4 font-poppins">
          Nội dung văn bản
        </h2>
        <div className="prose prose-invert max-w-none">
          <div className="text-bluelock-dark dark:text-white whitespace-pre-wrap font-poppins">
            {document.content}
          </div>
        </div>
      </div>

      {/* Approvals */}
      {document.approvals.length > 0 && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 mb-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bluelock-dark dark:text-white font-poppins flex items-center space-x-2">
              <UserCheck size={20} />
              <span>Luồng phê duyệt</span>
            </h2>
          </div>
          <div className="space-y-3">
            {document.approvals.map((approval: any) => (
              <div
                key={approval.id}
                className="flex items-center justify-between p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bluelock-blue/20 dark:bg-blue-500/20 text-bluelock-blue dark:text-blue-400 font-bold font-poppins">
                    {approval.level}
                  </div>
                  <Avatar
                    src={approval.approver.avatar}
                    name={`${approval.approver.firstName} ${approval.approver.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="text-bluelock-dark dark:text-white font-poppins font-semibold">
                      {approval.approver.firstName} {approval.approver.lastName}
                    </p>
                    <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      Cấp {approval.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      approval.status === 'APPROVED'
                        ? 'bg-green-500/20 text-green-400'
                        : approval.status === 'REJECTED'
                        ? 'bg-red-500/20 text-red-400'
                        : approval.status === 'RETURNED'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    } font-poppins`}
                  >
                    {approval.status === 'APPROVED'
                      ? 'Đã phê duyệt'
                      : approval.status === 'REJECTED'
                      ? 'Từ chối'
                      : approval.status === 'RETURNED'
                      ? 'Trả lại'
                      : 'Chờ phê duyệt'}
                  </span>
                  {approval.comment && (
                    <p className="text-xs text-bluelock-dark/60 dark:text-gray-500 mt-1 font-poppins">
                      {approval.comment}
                    </p>
                  )}
                  {approval.approvedAt && (
                    <p className="text-xs text-bluelock-dark/60 dark:text-gray-500 mt-1 font-poppins">
                      {formatDistanceToNow(new Date(approval.approvedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Signatures */}
      {document.signatures.length > 0 && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 mb-6 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-bluelock-dark dark:text-white mb-4 font-poppins flex items-center space-x-2">
            <PenTool size={20} />
            <span>Chữ ký số</span>
          </h2>
          <div className="space-y-3">
            {document.signatures.map((signature: any) => (
              <div
                key={signature.id}
                className="flex items-center justify-between p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={signature.signedByUser.avatar}
                    name={`${signature.signedByUser.firstName} ${signature.signedByUser.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="text-bluelock-dark dark:text-white font-poppins font-semibold">
                      {signature.signedByUser.firstName} {signature.signedByUser.lastName}
                    </p>
                    <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      {signature.provider}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      signature.isValid
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    } font-poppins`}
                  >
                    {signature.isValid ? 'Hợp lệ' : 'Không hợp lệ'}
                  </span>
                  {signature.timestamp && (
                    <p className="text-xs text-bluelock-dark/60 dark:text-gray-500 mt-1 font-poppins">
                      {formatDistanceToNow(new Date(signature.timestamp), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        {canEdit && document.status === 'PENDING' && (
          <button
            onClick={() => router.push(`/dashboard/dms/outgoing/${document.id}/edit`)}
            className="px-6 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
          >
            <Edit size={18} />
            <span>Chỉnh sửa</span>
          </button>
        )}
        {canSubmit && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2 shadow-bluelock-glow dark:shadow-none"
          >
            <Send size={18} />
            <span>Gửi phê duyệt</span>
          </button>
        )}
        {canApprove && (
          <button
            onClick={() => router.push(`/dashboard/dms/outgoing/${document.id}/approve`)}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
          >
            <CheckCircle size={18} />
            <span>Phê duyệt</span>
          </button>
        )}
      </div>

      {/* Submit Approval Modal */}
      <SubmitApprovalModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmitApproval}
        documentId={document.id}
        currentUser={currentUser}
      />

      {/* PDF Viewer */}
      {isPDF && (
        <PDFViewer
          fileUrl={document.fileUrl}
          fileName={document.title}
          isOpen={showPDFViewer}
          onClose={() => setShowPDFViewer(false)}
        />
      )}
    </div>
  )
}

