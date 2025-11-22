'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import SharedLayout from '@/components/Layout/SharedLayout'

const documentTypes = [
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'POLICY', label: 'Chính sách' },
  { value: 'REPORT', label: 'Báo cáo' },
  { value: 'FORM', label: 'Biểu mẫu' },
  { value: 'OTHER', label: 'Khác' },
]

export default function UploadDocumentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'OTHER',
    category: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      return 'Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX'
    }

    if (file.size > maxSize) {
      return 'Kích thước file tối đa 10MB'
    }

    return null
  }

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setFile(selectedFile)
    // Auto-fill title from filename if empty
    if (!formData.title) {
      const fileName = selectedFile.name
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
      setFormData({ ...formData, title: nameWithoutExt })
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
    setError('')

    if (!file) {
      setError('Vui lòng chọn file')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('type', formData.type)
      formDataToSend.append('category', formData.category)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Đã xảy ra lỗi')
        return
      }

      router.push('/dashboard/documents')
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Văn bản', posts: '856' },
  ]

  return (
    <SharedLayout
      title="Tải lên văn bản"
    >
      <div className="p-6">
        <div className="mb-8">
          <Link
            href="/dashboard/documents"
            className="text-blue-500 hover:text-blue-400 flex items-center space-x-2 mb-4 font-poppins"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </Link>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              Tiêu đề văn bản *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              placeholder="Nhập tiêu đề văn bản"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-poppins"
              placeholder="Mô tả về văn bản..."
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              Loại văn bản *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value} className="bg-gray-800">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              Danh mục
            </label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              placeholder="Ví dụ: Học tập, Hành chính..."
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              File văn bản *
            </label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                  : file
                  ? 'border-gray-700 hover:border-gray-600'
                  : 'border-gray-700 hover:border-blue-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('file')?.click()}
            >
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="text-blue-500" size={24} />
                      <span className="text-white font-poppins">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                          setError('')
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-poppins">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className="flex text-sm text-gray-400 justify-center items-center">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 font-poppins"
                      >
                        <span>Chọn file</span>
                        <input
                          id="file"
                          name="file"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          required
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                        />
                      </label>
                      <p className="pl-1 font-poppins">hoặc kéo thả file vào đây</p>
                    </div>
                    <p className="text-xs text-gray-500 font-poppins">
                      PDF, DOC, DOCX, XLS, XLSX (tối đa 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Link
              href="/dashboard/documents"
              className="px-6 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 font-poppins transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={loading || !file}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-poppins font-semibold transition-colors"
            >
              <Upload size={18} />
              <span>{loading ? 'Đang tải lên...' : 'Tải lên'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </SharedLayout>
  )
}

