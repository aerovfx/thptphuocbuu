'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Upload, AlertCircle, CheckCircle } from 'lucide-react'

interface BrandVerificationFormProps {
  currentUser: any
}

export default function BrandVerificationForm({ currentUser }: BrandVerificationFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    emailDomain: '',
    businessLicense: '',
    logoUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Không thể tải lên logo')
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, logoUrl: data.url }))
    } catch (error: any) {
      alert(error.message || 'Không thể tải lên logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBusinessLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (PDF)
    if (file.type !== 'application/pdf') {
      alert('Vui lòng chọn file PDF')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'document')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Không thể tải lên giấy phép')
      }

      const data = await response.json()
      setFormData((prev) => ({ ...prev, businessLicense: data.url }))
    } catch (error: any) {
      alert(error.message || 'Không thể tải lên giấy phép')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên thương hiệu')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/brand/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert('Đã tạo thương hiệu thành công! Đang chờ xác minh...')
      router.push(`/dashboard/brand/${data.brand.id}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo thương hiệu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 size={32} className="text-bluelock-green" />
          <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
            Tạo thương hiệu
          </h1>
        </div>

        <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-6">
          Nâng cấp tài khoản Premium của bạn thành tài khoản thương hiệu để có badge xác minh và
          quản lý nhiều tài khoản liên kết.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-poppins">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Tên thương hiệu <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
              placeholder="Ví dụ: Công ty ABC"
              required
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
              placeholder="https://example.com"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Mô tả thương hiệu
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
              placeholder="Mô tả về thương hiệu của bạn..."
            />
          </div>

          {/* Email Domain */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Email domain (để xác minh)
            </label>
            <input
              type="text"
              name="emailDomain"
              value={formData.emailDomain}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
              placeholder="@company.com"
            />
            <p className="mt-1 text-xs text-bluelock-dark/60 dark:text-gray-400 font-poppins">
              Email domain của công ty để xác minh (ví dụ: @company.com)
            </p>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Logo thương hiệu
            </label>
            <div className="flex items-center space-x-4">
              {formData.logoUrl ? (
                <div className="relative">
                  <img
                    src={formData.logoUrl}
                    alt="Logo"
                    className="w-24 h-24 rounded-lg object-cover border border-bluelock-blue/30 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 flex items-center justify-center">
                  <Building2 size={32} className="text-bluelock-dark/40 dark:text-gray-600" />
                </div>
              )}
              <label className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors cursor-pointer flex items-center space-x-2">
                <Upload size={18} />
                <span>{uploadingLogo ? 'Đang tải...' : 'Tải lên logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-bluelock-dark/60 dark:text-gray-400 font-poppins">
              PNG, JPG hoặc SVG (tối đa 5MB)
            </p>
          </div>

          {/* Business License */}
          <div>
            <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
              Giấy phép đăng ký kinh doanh
            </label>
            <label className="block px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg font-poppins cursor-pointer hover:bg-bluelock-light-2 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-2">
                <Upload size={18} className="text-bluelock-green" />
                <span className="text-bluelock-dark dark:text-white">
                  {formData.businessLicense ? 'Đã tải lên' : 'Tải lên file PDF'}
                </span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleBusinessLicenseUpload}
                className="hidden"
              />
            </label>
            {formData.businessLicense && (
              <div className="mt-2 flex items-center space-x-2 text-green-500">
                <CheckCircle size={16} />
                <span className="text-sm font-poppins">Đã tải lên thành công</span>
              </div>
            )}
            <p className="mt-1 text-xs text-bluelock-dark/60 dark:text-gray-400 font-poppins">
              File PDF giấy phép đăng ký kinh doanh (tối đa 10MB)
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors shadow-bluelock-glow dark:shadow-none"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo thương hiệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

