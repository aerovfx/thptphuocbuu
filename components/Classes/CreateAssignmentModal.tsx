'use client'

import { useState } from 'react'
import { X, Calendar } from 'lucide-react'

interface CreateAssignmentModalProps {
  classId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAssignmentModal({
  classId,
  onClose,
  onSuccess,
}: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          classId,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Không thể tạo bài học')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  // Set default due date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDueDate = tomorrow.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-poppins">Tạo bài học mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded font-poppins">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
              Tiêu đề bài học *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              placeholder="Ví dụ: Bài tập về nhà tuần 1"
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
              placeholder="Mô tả chi tiết về bài học..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                Hạn nộp *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate || defaultDueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxScore" className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                Điểm tối đa *
              </label>
              <input
                id="maxScore"
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 100 })}
                required
                min={1}
                max={1000}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 font-poppins transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-poppins font-semibold transition-colors"
            >
              {loading ? 'Đang tạo...' : 'Tạo bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

