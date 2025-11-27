'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import TagInput from '../Common/TagInput'

interface CreateSpaceTaskProps {
  spaceId: string
  spaceName: string
  currentUser: any
}

export default function CreateSpaceTask({
  spaceId,
  spaceName,
  currentUser,
}: CreateSpaceTaskProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    column: 'todo',
    priority: 'NORMAL',
    dueDate: '',
    assignedToId: '',
    tags: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/spaces/${spaceId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          column: formData.column,
          priority: formData.priority,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          assignedToId: formData.assignedToId || null,
          tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : null,
        }),
      })

      if (response.ok) {
        const task = await response.json()
        router.push(`/dashboard/spaces/${spaceId}/tasks/${task.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Đã xảy ra lỗi khi tạo công việc')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      setError('Đã xảy ra lỗi khi tạo công việc')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/spaces/${spaceId}/tasks`)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách công việc</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
          Tạo công việc mới
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">
          Space: {spaceName}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
          <X size={20} />
          <span className="font-poppins">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
              Tiêu đề công việc *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
              placeholder="Nhập tiêu đề công việc..."
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
              placeholder="Nhập mô tả chi tiết công việc..."
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Trạng thái
              </label>
              <select
                value={formData.column}
                onChange={(e) => setFormData({ ...formData, column: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
              >
                <option value="todo">Cần làm</option>
                <option value="in-progress">Đang làm</option>
                <option value="review">Đang xem xét</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Độ ưu tiên
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
              >
                <option value="LOW">Thấp</option>
                <option value="NORMAL">Bình thường</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
              Hạn chót
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
              Tags
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              maxTags={10}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/spaces/${spaceId}/tasks`)}
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-poppins"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins disabled:opacity-50"
          >
            <Save size={20} />
            <span>{loading ? 'Đang tạo...' : 'Tạo công việc'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

