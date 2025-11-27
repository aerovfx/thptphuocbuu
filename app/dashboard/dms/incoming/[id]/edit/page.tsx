'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import SharedLayout from '@/components/Layout/SharedLayout'
import TagInput from '@/components/Common/TagInput'
import { InlineHelp } from '@/components/Common/Tooltip'
import { helpTexts } from '@/lib/tooltip-help-texts'

// Danh sách người gửi mặc định
const DEFAULT_SENDERS = [
  'Sở Giáo dục và Đào tạo TP. Hồ Chí Minh',
  'Bộ Giáo dục và Đào tạo',
  'UBND TP. Hồ Chí Minh',
  'Sở Nội vụ TP. Hồ Chí Minh',
  'Phòng Giáo dục và Đào tạo Quận/Huyện',
  'Ban Giám hiệu',
  'Phòng Hành chính',
  'Phòng Tài chính',
  'Phòng Tổ chức',
]

// Suggested tags
const suggestedTags = [
  'Giáo dục',
  'Đào tạo',
  'Tuyển sinh',
  'Thi cử',
  'Học phí',
  'Học bổng',
  'Kỷ luật',
  'Khen thưởng',
  'Cơ sở vật chất',
  'Nhân sự',
  'Tài chính',
  'Hành chính',
  'Pháp chế',
  'An toàn',
  'Y tế',
  'Thể dục thể thao',
  'Hoạt động ngoại khóa',
  'Công khai',
  'Nội bộ',
  'Khẩn cấp',
]

export default function EditIncomingDocumentPage() {
  const router = useRouter()
  const params = useParams()
  const documentId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    sender: '',
    type: 'OTHER',
    priority: 'NORMAL',
    status: 'PENDING',
    deadline: '',
    tags: [] as string[],
    notes: '',
  })

  useEffect(() => {
    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!documentId) {
        throw new Error('ID văn bản không hợp lệ')
      }
      
      const response = await fetch(`/api/dms/incoming/${documentId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(errorData.error || `Lỗi ${response.status}: Không thể tải thông tin văn bản`)
      }

      const data = await response.json()
      
      // Parse tags if they exist
      let tags: string[] = []
      if (data.tags) {
        try {
          const parsed = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags
          if (Array.isArray(parsed)) {
            tags = parsed
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      setFormData({
        title: data.title || '',
        sender: data.sender || '',
        type: data.type || 'OTHER',
        priority: data.priority || 'NORMAL',
        status: data.status || 'PENDING',
        deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
        tags,
        notes: data.notes || '',
      })
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải thông tin văn bản')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      // Prepare payload with proper formatting
      const payload: any = {
        title: formData.title.trim(),
        sender: formData.sender.trim() || null,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        notes: formData.notes.trim() || null,
        tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : null,
      }

      // Handle deadline - convert datetime-local to ISO string
      if (formData.deadline) {
        try {
          // datetime-local format: YYYY-MM-DDTHH:mm
          // Convert to ISO string
          const deadlineDate = new Date(formData.deadline)
          if (!isNaN(deadlineDate.getTime())) {
            payload.deadline = deadlineDate.toISOString()
          } else {
            payload.deadline = null
          }
        } catch (e) {
          payload.deadline = null
        }
      } else {
        payload.deadline = null
      }

      const response = await fetch(`/api/dms/incoming/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi cập nhật văn bản')
      }

      // Redirect to document detail page
      router.push(`/dashboard/dms/incoming/${documentId}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật văn bản')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SharedLayout title="Chỉnh sửa văn bản">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Chỉnh sửa văn bản đến">
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/dms/incoming/${documentId}`)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-6">
            Chỉnh sửa văn bản đến
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <span className="font-poppins">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <InlineHelp
                label="Tiêu đề"
                helpText={helpTexts.title.content}
                className="mb-2"
              />
              <span className="text-red-500 ml-2">*</span>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="Nhập tiêu đề văn bản"
                required
              />
            </div>

            {/* Sender */}
            <div>
              <InlineHelp
                label="Người/nơi gửi"
                helpText={helpTexts.sender.content}
                className="mb-2"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Nhập người/nơi gửi văn bản hoặc chọn từ danh sách"
                  list="sender-list"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData({ ...formData, sender: e.target.value })
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="">Chọn người gửi...</option>
                  {DEFAULT_SENDERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <datalist id="sender-list">
                {DEFAULT_SENDERS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            {/* Type, Priority, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <InlineHelp
                  label="Loại văn bản"
                  helpText={helpTexts.documentType.content}
                  className="mb-2"
                />
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="DIRECTIVE">Chỉ đạo</option>
                  <option value="RECORD">Hồ sơ</option>
                  <option value="REPORT">Tờ trình</option>
                  <option value="REQUEST">Đề nghị</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <InlineHelp
                  label="Mức độ ưu tiên"
                  helpText={helpTexts.priority.content}
                  className="mb-2"
                />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="URGENT">Khẩn</option>
                  <option value="HIGH">Cao</option>
                  <option value="NORMAL">Bình thường</option>
                  <option value="LOW">Thấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <InlineHelp
                label="Hạn xử lý"
                helpText={helpTexts.deadline.content}
                className="mb-2"
              />
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              />
            </div>

            {/* Tags */}
            <div>
              <InlineHelp
                label="Tags"
                helpText="Thêm tags để dễ dàng tìm kiếm và phân loại văn bản"
                className="mb-2"
              />
              <TagInput
                tags={formData.tags}
                onChange={(tags) => setFormData({ ...formData, tags })}
                placeholder="Nhập tag và nhấn Enter"
                suggestions={suggestedTags}
                maxTags={10}
                className="font-poppins"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Nhấn Enter để thêm tag. Tags giúp tìm kiếm và phân loại văn bản dễ dàng hơn.
              </p>
            </div>

            {/* Notes */}
            <div>
              <InlineHelp
                label="Ghi chú"
                helpText={helpTexts.notes.content}
                className="mb-2"
              />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                placeholder="Nhập ghi chú (nếu có)"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/dms/incoming/${documentId}`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SharedLayout>
  )
}

