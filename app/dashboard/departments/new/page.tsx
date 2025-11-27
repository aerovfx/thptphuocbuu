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

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function NewDepartmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'TO_CHUYEN_MON',
    spaceId: '',
    leaderId: '',
    subject: '',
    icon: '',
    color: '#10B981',
    order: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch spaces and users on mount
  useEffect(() => {
    fetchSpaces()
    fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // API returns users array directly or wrapped in users property
        setUsers(Array.isArray(data) ? data : (data.users || []))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setErrors({ name: 'Tên tổ chuyên môn là bắt buộc' })
        setLoading(false)
        return
      }
      if (!formData.code.trim()) {
        setErrors({ code: 'Mã tổ chuyên môn là bắt buộc' })
        setLoading(false)
        return
      }

      const payload: any = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        type: formData.type,
        order: formData.order,
      }

      if (formData.description.trim()) {
        payload.description = formData.description.trim()
      }
      if (formData.spaceId) {
        payload.spaceId = formData.spaceId
      }
      if (formData.leaderId) {
        payload.leaderId = formData.leaderId
      }
      if (formData.subject.trim()) {
        payload.subject = formData.subject.trim()
      }
      if (formData.icon.trim()) {
        payload.icon = formData.icon.trim()
      }
      if (formData.color) {
        payload.color = formData.color
      }

      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const department = await response.json()
        router.push(`/dashboard/departments/${department.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Có lỗi xảy ra khi tạo tổ chuyên môn' })
      }
    } catch (error) {
      console.error('Error creating department:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi tạo tổ chuyên môn' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SharedLayout title="Tạo Tổ Chuyên Môn Mới">
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/departments')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-6">
            Tạo Tổ Chuyên Môn Mới
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Tên tổ chuyên môn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Ví dụ: Tổ Toán, Tổ Văn..."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 font-poppins">{errors.name}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mã tổ chuyên môn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                }`}
                placeholder="Ví dụ: TO_TOAN, TO_VAN..."
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mô tả về tổ chuyên môn..."
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="TO_CHUYEN_MON">Tổ Chuyên Môn</option>
                <option value="TO_HANH_CHINH">Tổ Hành chính</option>
                <option value="BAN_TT">Ban Truyền Thông</option>
                <option value="BAN_TAI_CHINH">Ban Tài chính</option>
                <option value="BAN_Y_TE">Ban Y tế</option>
                <option value="DOAN_DANG">Đoàn/Đảng bộ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            {/* Subject (for TO_CHUYEN_MON) */}
            {formData.type === 'TO_CHUYEN_MON' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Môn học
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ví dụ: Toán, Văn, Lý..."
                />
              </div>
            )}

            {/* Space */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Space (Không gian làm việc)
              </label>
              <select
                value={formData.spaceId}
                onChange={(e) => setFormData({ ...formData, spaceId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Chọn Space (tùy chọn) --</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name} ({space.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Leader */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Trưởng tổ
              </label>
              <select
                value={formData.leaderId}
                onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Chọn Trưởng tổ (tùy chọn) --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="📚, 🎨, 🎵..."
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
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="#10B981"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
              />
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
                onClick={() => router.push('/dashboard/departments')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Tạo Tổ</span>
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

