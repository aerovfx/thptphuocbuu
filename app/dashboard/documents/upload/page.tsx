'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
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
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} />}
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
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-lg hover:border-blue-500 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-500" />
                <div className="flex text-sm text-gray-400">
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
                    />
                  </label>
                  <p className="pl-1 font-poppins">hoặc kéo thả file vào đây</p>
                </div>
                <p className="text-xs text-gray-500 font-poppins">
                  {file ? file.name : 'PDF, DOC, DOCX, XLS, XLSX (tối đa 10MB)'}
                </p>
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

