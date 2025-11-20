'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, AlertCircle, FileText } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'

interface ApprovalFormProps {
  approval: any
  document: any
  documentType: 'INCOMING' | 'OUTGOING' | 'WORK_ITEM'
  currentUser: any
}

export default function ApprovalForm({
  approval,
  document,
  documentType,
  currentUser,
}: ApprovalFormProps) {
  const router = useRouter()
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!action) {
      setError('Vui lòng chọn hành động')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/workflow/approval/${approval.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          comment: comment || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      // Redirect to document detail
      if (documentType === 'OUTGOING') {
        router.push(`/dashboard/dms/outgoing/${document.id}`)
      } else if (documentType === 'INCOMING') {
        router.push(`/dashboard/dms/incoming/${document.id}`)
      } else {
        router.push(`/dashboard/dms/workflow/${document.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xử lý phê duyệt')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Document Info */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 mb-6 transition-colors duration-300">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="text-bluelock-green dark:text-blue-500" size={24} />
          <div>
            <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins">
              {document.title}
            </h2>
            <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
              Cấp phê duyệt: {approval.level}
            </p>
          </div>
        </div>
        <div className="p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg">
          <p className="text-bluelock-dark dark:text-white whitespace-pre-wrap font-poppins">
            {document.content || document.description || 'Không có nội dung'}
          </p>
        </div>
      </div>

      {/* Approval Form */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-bluelock-dark dark:text-white mb-4 font-poppins">
          Quyết định phê duyệt
        </h3>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-poppins">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setAction('approve')}
            disabled={isSubmitting}
            className={`p-4 rounded-lg border-2 transition-all font-poppins font-semibold ${
              action === 'approve'
                ? 'border-green-500 bg-green-500/20 text-green-400'
                : 'border-bluelock-blue/30 dark:border-gray-700 bg-bluelock-light dark:bg-gray-800 text-bluelock-dark dark:text-white hover:border-green-500'
            } disabled:opacity-50`}
          >
            <CheckCircle size={24} className="mx-auto mb-2" />
            <span>Phê duyệt</span>
          </button>
          <button
            onClick={() => setAction('reject')}
            disabled={isSubmitting}
            className={`p-4 rounded-lg border-2 transition-all font-poppins font-semibold ${
              action === 'reject'
                ? 'border-red-500 bg-red-500/20 text-red-400'
                : 'border-bluelock-blue/30 dark:border-gray-700 bg-bluelock-light dark:bg-gray-800 text-bluelock-dark dark:text-white hover:border-red-500'
            } disabled:opacity-50`}
          >
            <XCircle size={24} className="mx-auto mb-2" />
            <span>Từ chối</span>
          </button>
          <button
            onClick={() => setAction('return')}
            disabled={isSubmitting}
            className={`p-4 rounded-lg border-2 transition-all font-poppins font-semibold ${
              action === 'return'
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                : 'border-bluelock-blue/30 dark:border-gray-700 bg-bluelock-light dark:bg-gray-800 text-bluelock-dark dark:text-white hover:border-yellow-500'
            } disabled:opacity-50`}
          >
            <ArrowLeft size={24} className="mx-auto mb-2" />
            <span>Trả lại</span>
          </button>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
            Ý kiến phê duyệt {action === 'reject' || action === 'return' ? <span className="text-red-400">*</span> : ''}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
            placeholder="Nhập ý kiến của bạn (bắt buộc nếu từ chối hoặc trả lại)"
            required={action === 'reject' || action === 'return'}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || isSubmitting || ((action === 'reject' || action === 'return') && !comment.trim())}
            className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors shadow-bluelock-glow dark:shadow-none"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

