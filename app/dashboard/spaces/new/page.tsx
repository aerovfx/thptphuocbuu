'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import SharedLayout from '@/components/Layout/SharedLayout'

interface Space {
  id: string
  name: string
  code: string
}

export default function NewSpacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'TO_CHUYEN_MON',
    visibility: 'INTERNAL',
    parentId: '',
    icon: '',
    color: '#6366F1',
    order: 0,
    startDate: '',
    endDate: '',
    progress: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch spaces for parent selection
  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data)
      }
    } catch (error) {
      console.error('Error fetching spaces:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setErrors({ name: 'Tên space là bắt buộc' })
        setLoading(false)
        return
      }
      if (!formData.code.trim()) {
        setErrors({ code: 'Mã space là bắt buộc' })
        setLoading(false)
        return
      }

      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        visibility: formData.visibility,
        order: formData.order,
      }

      if (formData.description.trim()) {
        payload.description = formData.description.trim()
      }
      if (formData.parentId) {
        payload.parentId = formData.parentId
      }
      if (formData.icon.trim()) {
        payload.icon = formData.icon.trim()
      }
      if (formData.color) {
        payload.color = formData.color
      }
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString()
      }
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString()
      }
      if (formData.progress !== undefined) {
        payload.progress = formData.progress
      }

      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (response.ok) {
        router.push(`/dashboard/spaces/${responseData.id}`)
      } else {
        const errorMessage = responseData.error || 'Có lỗi xảy ra khi tạo space'
        const errorDetails = responseData.details ? ` (${responseData.details})` : ''
        setErrors({ submit: `${errorMessage}${errorDetails}` })
        console.error('API Error:', responseData)
      }
    } catch (error) {
      console.error('Error creating space:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi tạo space' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SharedLayout title="Tạo Space Mới">
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/spaces')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-6">
            Tạo Space Mới
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Tên space <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Ví dụ: School Hub, Ban Giám Hiệu..."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 font-poppins">{errors.name}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mã space <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Ví dụ: SCHOOL_HUB, BGH_SPACE..."
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500 font-poppins">{errors.code}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Mã phải là duy nhất và không có khoảng trắng
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả về space..."
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Loại <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SCHOOL_HUB">School Hub</option>
                <option value="BGH_SPACE">Ban Giám Hiệu</option>
                <option value="BAN_TT">Ban Truyền Thông</option>
                <option value="TO_CHUYEN_MON">Tổ Chuyên Môn</option>
                <option value="TO_HANH_CHINH">Tổ Hành chính</option>
                <option value="BAO_VE">Bảo vệ</option>
                <option value="LAO_CONG">Lao công</option>
                <option value="LOP">Lớp học</option>
                <option value="DOAN_DANG">Đoàn/Đảng bộ</option>
                <option value="TAI_CHINH">Ban Tài chính</option>
                <option value="Y_TE">Ban Y tế</option>
                <option value="PUBLIC_NEWS">Public News</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Quyền truy cập <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Công khai</option>
                <option value="INTERNAL">Nội bộ</option>
                <option value="PRIVATE">Riêng tư</option>
              </select>
            </div>

            {/* Parent Space */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Space cha (tùy chọn)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Không có space cha --</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Icon and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Icon
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🏢, 📚, 🎨..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Màu sắc
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#6366F1"
                  />
                </div>
              </div>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            {/* Timeline & Progress */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-4">
                Thời gian hoạt động & Tiến độ
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Tiến độ hiện tại (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                  Tiến độ từ 0 đến 100%
                </p>
              </div>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-poppins">{errors.submit}</p>
              </div>
            )}

            {/* Submit button */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/spaces')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Tạo Space</span>
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

