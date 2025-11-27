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

export default function EditSpacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    isActive: true,
    startDate: '',
    endDate: '',
    progress: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get space ID from params
  useEffect(() => {
    params.then((p) => {
      setSpaceId(p.id)
    })
  }, [params])

  // Fetch space data and available spaces
  useEffect(() => {
    if (spaceId) {
      fetchSpaceData()
      fetchSpaces()
    }
  }, [spaceId])

  const fetchSpaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/spaces/${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          name: data.name || '',
          code: data.code || '',
          description: data.description || '',
          type: data.type || 'TO_CHUYEN_MON',
          visibility: data.visibility || 'INTERNAL',
          parentId: data.parentId || '',
          icon: data.icon || '',
          color: data.color || '#6366F1',
          order: data.order || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
          startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '',
          progress: data.progress || 0,
        })
      } else {
        setErrors({ submit: 'Không thể tải thông tin space' })
      }
    } catch (error) {
      console.error('Error fetching space:', error)
      setErrors({ submit: 'Đã xảy ra lỗi khi tải thông tin space' })
    } finally {
      setLoading(false)
    }
  }

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        // Filter out current space and its children to avoid circular reference
        setSpaces(data.filter((s: Space) => s.id !== spaceId))
      }
    } catch (error) {
      console.error('Error fetching spaces:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setErrors({ name: 'Tên space là bắt buộc' })
        setSaving(false)
        return
      }

      if (!spaceId) {
        setErrors({ submit: 'Không tìm thấy ID của space' })
        setSaving(false)
        return
      }

      const payload: any = {
        name: formData.name.trim(),
        visibility: formData.visibility,
        order: formData.order,
        isActive: formData.isActive,
      }

      // Only include optional fields if they have values, or explicitly set to null
      if (formData.description.trim()) {
        payload.description = formData.description.trim()
      } else {
        payload.description = null
      }

      if (formData.parentId) {
        payload.parentId = formData.parentId
      } else {
        payload.parentId = null
      }

      // Icon and color can be null
      if (formData.icon && formData.icon.trim()) {
        payload.icon = formData.icon.trim()
      } else {
        payload.icon = null
      }

      if (formData.color && formData.color.trim()) {
        payload.color = formData.color.trim()
      } else {
        payload.color = null
      }

      // Timeline & Progress
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString()
      } else {
        payload.startDate = null
      }

      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString()
      } else {
        payload.endDate = null
      }

      if (formData.progress !== undefined) {
        payload.progress = formData.progress
      }

      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      let responseData: any = {}

      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text()
          if (text && text.trim()) {
            responseData = JSON.parse(text)
          } else {
            responseData = { error: 'Response rỗng từ server' }
          }
        } catch (parseError: any) {
          console.error('Error parsing JSON response:', parseError)
          responseData = { 
            error: 'Không thể đọc phản hồi từ server',
            parseError: parseError.message 
          }
        }
      } else {
        // Not JSON response
        const text = await response.text()
        responseData = { 
          error: `Server trả về response không phải JSON (${contentType || 'unknown'})`,
          rawResponse: text.substring(0, 200) // First 200 chars
        }
      }

      if (response.ok) {
        router.push(`/dashboard/spaces/${spaceId}`)
      } else {
        // Build error message
        let errorMessage = responseData.error || `Có lỗi xảy ra khi cập nhật space`
        
        // Add status code if no error message
        if (!responseData.error) {
          errorMessage += ` (HTTP ${response.status})`
        }
        
        // Add details if available
        let errorDetails = ''
        if (responseData.details) {
          if (Array.isArray(responseData.details)) {
            errorDetails = ` - ${JSON.stringify(responseData.details)}`
          } else if (typeof responseData.details === 'string') {
            errorDetails = ` - ${responseData.details}`
          } else {
            errorDetails = ` - ${JSON.stringify(responseData.details)}`
          }
        }
        
        setErrors({ submit: `${errorMessage}${errorDetails}` })
        
        // Enhanced logging
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          responseData: responseData,
          payload: payload,
        })
      }
    } catch (error) {
      console.error('Error updating space:', error)
      setErrors({ submit: 'Có lỗi xảy ra khi cập nhật space' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SharedLayout title="Chỉnh sửa Space">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Chỉnh sửa Space">
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/spaces/${spaceId}`)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-6">
            Chỉnh sửa Space
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

            {/* Code (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mã space
              </label>
              <input
                type="text"
                value={formData.code}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-poppins cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Mã space không thể thay đổi
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

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-poppins">
                  Space đang hoạt động
                </span>
              </label>
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
                onClick={() => router.push(`/dashboard/spaces/${spaceId}`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 transition-colors"
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

