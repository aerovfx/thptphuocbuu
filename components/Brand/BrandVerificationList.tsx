'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  User,
  Users,
  Award,
} from 'lucide-react'
import Avatar from '@/components/Common/Avatar'

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  website: string | null
  description: string | null
  emailDomain: string | null
  businessLicense: string | null
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date | string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  }
  _count: {
    members: number
    badges: number
  }
}

interface BrandVerificationListProps {
  pendingBrands: Brand[]
  allBrands: Brand[]
  currentUser: any
}

export default function BrandVerificationList({
  pendingBrands,
  allBrands,
  currentUser,
}: BrandVerificationListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const handleVerify = async (brandId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Bạn có chắc chắn muốn ${status === 'APPROVED' ? 'xác minh' : 'từ chối'} thương hiệu này?`)) {
      return
    }

    setProcessingId(brandId)
    try {
      const response = await fetch(`/api/brand/verify/${brandId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert(`Đã ${status === 'APPROVED' ? 'xác minh' : 'từ chối'} thương hiệu thành công`)
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={20} className="text-green-500" />
      case 'REJECTED':
        return <XCircle size={20} className="text-red-500" />
      default:
        return <Clock size={20} className="text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã xác minh'
      case 'REJECTED':
        return 'Đã từ chối'
      default:
        return 'Đang chờ xác minh'
    }
  }

  const brandsToShow = activeTab === 'pending' ? pendingBrands : allBrands

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins mb-2">
          Quản lý thương hiệu
        </h1>
        <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins">
          Xác minh và quản lý các thương hiệu đăng ký
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-bluelock-blue/30 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors relative ${
            activeTab === 'pending'
              ? 'text-bluelock-green dark:text-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Chờ xác minh
          {pendingBrands.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
              {pendingBrands.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors ${
            activeTab === 'all'
              ? 'text-bluelock-green dark:text-blue-500 border-b-2 border-bluelock-green dark:border-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Tất cả ({allBrands.length})
        </button>
      </div>

      {/* Brand List */}
      <div className="space-y-4">
        {brandsToShow.length === 0 ? (
          <div className="text-center py-12 text-bluelock-dark/60 dark:text-gray-400 font-poppins">
            <Building2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>Không có thương hiệu nào</p>
          </div>
        ) : (
          brandsToShow.map((brand) => (
            <div
              key={brand.id}
              className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Logo */}
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-16 h-16 rounded-lg object-cover border border-bluelock-blue/30 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-bluelock-green flex items-center justify-center">
                      <Building2 size={32} className="text-white" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins">
                        {brand.name}
                      </h3>
                      {getStatusIcon(brand.verificationStatus)}
                    </div>
                    <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-2">
                      {getStatusLabel(brand.verificationStatus)}
                    </p>
                    {brand.description && (
                      <p className="text-bluelock-dark dark:text-white font-poppins mb-3">
                        {brand.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        <User size={16} />
                        <span>
                          {brand.createdBy.firstName} {brand.createdBy.lastName}
                        </span>
                      </div>
                      {brand.website && (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-bluelock-green hover:underline font-poppins"
                        >
                          <ExternalLink size={16} />
                          <span>{brand.website}</span>
                        </a>
                      )}
                      {brand.emailDomain && (
                        <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                          <span>Email domain: {brand.emailDomain}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        <Users size={16} />
                        <span>{brand._count.members} thành viên</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        <Award size={16} />
                        <span>{brand._count.badges} badge</span>
                      </div>
                    </div>

                    {/* Business License */}
                    {brand.businessLicense && (
                      <div className="mt-4">
                        <a
                          href={brand.businessLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-sm text-bluelock-green hover:underline font-poppins"
                        >
                          <Eye size={16} />
                          <span>Xem giấy phép đăng ký kinh doanh</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {brand.verificationStatus === 'PENDING' && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleVerify(brand.id, 'APPROVED')}
                      disabled={processingId === brand.id}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle size={18} />
                      <span>Xác minh</span>
                    </button>
                    <button
                      onClick={() => handleVerify(brand.id, 'REJECTED')}
                      disabled={processingId === brand.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
                    >
                      <XCircle size={18} />
                      <span>Từ chối</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

