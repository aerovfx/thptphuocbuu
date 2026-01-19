'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { InlineHelp } from '@/components/Common/Tooltip'
import { helpTexts } from '@/lib/tooltip-help-texts'
import TagInput from '@/components/Common/TagInput'

interface UploadIncomingDocumentProps {
  currentUser: any
}

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

export default function UploadIncomingDocument({ currentUser }: UploadIncomingDocumentProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [sender, setSender] = useState('')
  const [type, setType] = useState('OTHER')
  const [priority, setPriority] = useState('NORMAL')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [showSenderDropdown, setShowSenderDropdown] = useState(false)

  // Suggested tags based on common document categories
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

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      return 'Chỉ chấp nhận file PDF, DOC, DOCX, JPG, PNG'
    }

    if (file.size > maxSize) {
      return 'Kích thước file tối đa 50MB'
    }

    return null
  }

  const extractContentFromFile = async (selectedFile: File) => {
    try {
      setExtracting(true)
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/dms/extract-content', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success && data.preview) {
        // Auto-fill notes with extracted content
        if (!notes) {
          setNotes(data.preview)
        } else {
          // Append if notes already has content
          setNotes((prev) => (prev ? `${prev}\n\n---\n${data.preview}` : data.preview))
        }
      }
    } catch (error) {
      console.error('Error extracting content:', error)
      // Don't show error to user, just silently fail
    } finally {
      setExtracting(false)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setFile(selectedFile)

    // Auto-fill title from filename if empty
    if (!title) {
      const fileName = selectedFile.name
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
      setTitle(nameWithoutExt)
    }

    // Extract content from file (skip for large files to avoid timeouts/request size limits)
    if (selectedFile.size <= 10 * 1024 * 1024) {
      await extractContentFromFile(selectedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Vui lòng chọn file')
      return
    }

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      if (sender) formData.append('sender', sender)
      if (type) formData.append('type', type)
      if (priority) formData.append('priority', priority)
      if (deadline) formData.append('deadline', new Date(deadline).toISOString())
      if (notes) formData.append('notes', notes)
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags))

      // Cloud Run has request size limits; for large files we upload directly to GCS using a signed URL
      // and only send metadata + public URL to the backend.
      const DIRECT_UPLOAD_THRESHOLD = 50 * 1024 * 1024 // 50MB (Temporarily increased to bypass signed-url requirement)
      if (file.size > DIRECT_UPLOAD_THRESHOLD) {
        // 1) Get signed upload URL
        const signedRes = await fetch('/api/uploads/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: 'dms/incoming',
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          }),
        })
        const signedData = await signedRes.json()
        if (!signedRes.ok) {
          throw new Error(signedData.error || 'Không thể tạo upload URL')
        }

        // 2) Upload directly to GCS
        const putRes = await fetch(signedData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        })
        if (!putRes.ok) {
          throw new Error('Tải file lên lưu trữ thất bại. Vui lòng thử lại.')
        }

        // 3) Send metadata to backend to create document record
        formData.append('fileUrl', signedData.publicUrl)
        formData.append('fileName', file.name)
        formData.append('fileSize', String(file.size))
        formData.append('mimeType', file.type || 'application/octet-stream')
      } else {
        // Small files: upload via backend
        formData.append('file', file)
      }

      const response = await fetch('/api/dms/incoming', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi tải lên văn bản')
      }

      // Redirect to document detail page
      router.push(`/dashboard/dms/incoming/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải lên văn bản')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-6 font-poppins">Thông tin văn bản</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-poppins">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <InlineHelp
              label="File văn bản"
              helpText={helpTexts.fileUpload.content}
              className="mb-2"
            />
            <span className="text-red-400 ml-2">*</span>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all cursor-pointer ${isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                  : file
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-700 hover:border-blue-500'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('file-input')?.click()}
            >
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="text-blue-500" size={24} />
                    <span className="text-white font-poppins">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setError(null)
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className={`mx-auto ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} size={48} />
                    <div className="flex text-sm text-gray-400 justify-center items-center">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400">
                        <span className="font-poppins">Chọn file</span>
                        <input
                          id="file-input"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1 font-poppins">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs text-gray-500 font-poppins">
                      PDF, DOC, DOCX, JPG, PNG (tối đa 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <InlineHelp
              label="Tiêu đề"
              helpText={helpTexts.title.content}
              className="mb-2"
            />
            <span className="text-red-400 ml-2">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
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
            <div className="relative">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  onFocus={() => setShowSenderDropdown(true)}
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Nhập người/nơi gửi văn bản hoặc chọn từ danh sách"
                  list="sender-list"
                />
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setSender(e.target.value)
                      setShowSenderDropdown(false)
                    }
                  }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  onBlur={() => setTimeout(() => setShowSenderDropdown(false), 200)}
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
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InlineHelp
                label="Loại văn bản"
                helpText={helpTexts.documentType.content}
                className="mb-2"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              >
                <option value="URGENT">Khẩn</option>
                <option value="HIGH">Cao</option>
                <option value="NORMAL">Bình thường</option>
                <option value="LOW">Thấp</option>
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
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>

          {/* Notes */}
          <div>
            <InlineHelp
              label="Ghi chú / Mô tả"
              helpText={helpTexts.notes.content}
              className="mb-2"
            />
            {extracting && (
              <div className="mb-2 text-sm text-blue-400 font-poppins flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Đang trích xuất nội dung từ file...</span>
              </div>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              placeholder="Nội dung sẽ được tự động trích xuất từ file. Bạn có thể chỉnh sửa nếu cần."
            />
            {notes && (
              <p className="mt-1 text-xs text-gray-500 font-poppins">
                Nội dung đã được trích xuất tự động từ file. Vui lòng kiểm tra và chỉnh sửa nếu cần.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              {uploading ? 'Đang tải lên...' : 'Tải lên văn bản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

