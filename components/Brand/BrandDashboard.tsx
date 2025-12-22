'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Crown,
  Shield,
  User,
} from 'lucide-react'
import Avatar from '@/components/Common/Avatar'

interface Brand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  website: string | null
  description: string | null
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  members: BrandMember[]
  badges: BrandBadge[]
}

interface BrandMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  }
}

interface BrandBadge {
  id: string
  userId: string
  badgeType: 'GOLD' | 'SILVER' | 'BLUE'
  badgeIconUrl: string | null
  isActive: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
  }
}

interface BrandDashboardProps {
  brandId: string
  currentUser: any
}

export default function BrandDashboard({ brandId, currentUser }: BrandDashboardProps) {
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'badges' | 'analytics'>('overview')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  useEffect(() => {
    fetchBrand()
  }, [brandId])

  useEffect(() => {
    if (activeTab !== 'analytics') return
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, brandId])

  const fetchBrand = async () => {
    try {
      const response = await fetch(`/api/brand/${brandId}`)
      if (!response.ok) throw new Error('Failed to fetch brand')
      const data = await response.json()
      setBrand(data.brand)
    } catch (error) {
      console.error('Error fetching brand:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true)
    try {
      const response = await fetch(`/api/brand/${brandId}/analytics`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch analytics')
      setAnalytics(data)
    } catch (e) {
      console.error('Error fetching brand analytics:', e)
      setAnalytics(null)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      alert('Vui lòng nhập email')
      return
    }

    try {
      // First, find user by email
      const userResponse = await fetch(`/api/users/search?email=${inviteEmail}`)
      if (!userResponse.ok) {
        throw new Error('Không tìm thấy người dùng với email này')
      }

      const userData = await userResponse.json()
      if (!userData.user) {
        throw new Error('Không tìm thấy người dùng với email này')
      }

      // Invite member
      const response = await fetch(`/api/brand/${brandId}/invite-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          role: inviteRole,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert('Đã mời thành viên thành công')
      setShowInviteModal(false)
      setInviteEmail('')
      fetchBrand()
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return

    try {
      const response = await fetch(`/api/brand/${brandId}/member/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert('Đã xóa thành viên thành công')
      fetchBrand()
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi')
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

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'GOLD':
        return 'bg-yellow-500 text-yellow-900'
      case 'SILVER':
        return 'bg-gray-400 text-gray-900'
      case 'BLUE':
        return 'bg-blue-500 text-blue-900'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown size={16} className="text-yellow-500" />
      case 'ADMIN':
        return <Shield size={16} className="text-blue-500" />
      default:
        return <User size={16} className="text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bluelock-green mx-auto"></div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Không tìm thấy thương hiệu</p>
      </div>
    )
  }

  const currentUserMembership = brand.members.find((m) => m.userId === currentUser?.user?.id)
  const canManage = currentUserMembership?.role === 'OWNER' || currentUserMembership?.role === 'ADMIN'
  const linkedCount = brand.members.filter((m) => m.role !== 'OWNER').length
  const maxLinkedAccounts = 5
  const canInviteMore = canManage && linkedCount < maxLinkedAccounts

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 mb-6 border border-bluelock-blue/30 dark:border-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.name} className="w-20 h-20 rounded-lg object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-bluelock-green flex items-center justify-center">
                <Building2 size={40} className="text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                  {brand.name}
                </h1>
                {getStatusIcon(brand.verificationStatus)}
              </div>
              <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                {getStatusLabel(brand.verificationStatus)}
              </p>
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-bluelock-green hover:underline font-poppins"
                >
                  {brand.website}
                </a>
              )}
            </div>
          </div>
        </div>
        {brand.description && (
          <p className="mt-4 text-bluelock-dark dark:text-white font-poppins">{brand.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-bluelock-blue/30 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'text-bluelock-green dark:text-blue-500 border-b-2 border-bluelock-green dark:border-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors ${
            activeTab === 'members'
              ? 'text-bluelock-green dark:text-blue-500 border-b-2 border-bluelock-green dark:border-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Thành viên ({brand.members.length})
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors ${
            activeTab === 'badges'
              ? 'text-bluelock-green dark:text-blue-500 border-b-2 border-bluelock-green dark:border-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Badge ({brand.badges.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-poppins font-semibold transition-colors ${
            activeTab === 'analytics'
              ? 'text-bluelock-green dark:text-blue-500 border-b-2 border-bluelock-green dark:border-blue-500'
              : 'text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users size={20} className="text-bluelock-green" />
                  <span className="font-poppins font-semibold text-bluelock-dark dark:text-white">
                    Thành viên
                  </span>
                </div>
                <p className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                  {brand.members.length}
                </p>
              </div>
              <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award size={20} className="text-bluelock-green" />
                  <span className="font-poppins font-semibold text-bluelock-dark dark:text-white">
                    Badge
                  </span>
                </div>
                <p className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                  {brand.badges.length}
                </p>
              </div>
              <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 size={20} className="text-bluelock-green" />
                  <span className="font-poppins font-semibold text-bluelock-dark dark:text-white">
                    Trạng thái
                  </span>
                </div>
                <p className="text-sm font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  {getStatusLabel(brand.verificationStatus)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            {canManage && (
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={!canInviteMore}
                className="mb-4 px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
                title={!canInviteMore ? `Đã đạt giới hạn tài khoản liên kết (${maxLinkedAccounts})` : undefined}
              >
                <Plus size={18} />
                <span>Mời thành viên ({linkedCount}/{maxLinkedAccounts})</span>
              </button>
            )}
            <div className="space-y-2">
              {brand.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={member.user.avatar}
                      name={`${member.user.firstName} ${member.user.lastName}`}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-bluelock-dark dark:text-white font-poppins">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        {getRoleIcon(member.role)}
                      </div>
                      <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-poppins text-bluelock-dark/60 dark:text-gray-400">
                      {member.role === 'OWNER'
                        ? 'Chủ sở hữu'
                        : member.role === 'ADMIN'
                        ? 'Quản trị viên'
                        : 'Thành viên'}
                    </span>
                    {canManage &&
                      member.userId !== currentUser?.user?.id &&
                      member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {brand.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={badge.user.avatar}
                      name={`${badge.user.firstName} ${badge.user.lastName}`}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-bluelock-dark dark:text-white font-poppins">
                          {badge.user.firstName} {badge.user.lastName}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-poppins font-semibold ${getBadgeColor(
                            badge.badgeType
                          )}`}
                        >
                          {badge.badgeType}
                        </span>
                      </div>
                      <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                        {badge.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award size={20} className="text-bluelock-green" />
                <span className="font-poppins font-semibold text-bluelock-dark dark:text-white">
                  Analytics cơ bản
                </span>
              </div>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-bluelock-light dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 rounded-lg transition-colors font-poppins"
              >
                Làm mới
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bluelock-green mx-auto"></div>
              </div>
            ) : !analytics ? (
              <div className="text-center text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                Không có dữ liệu analytics
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      Bài đăng
                    </div>
                    <div className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                      {analytics.totals?.posts ?? 0}
                    </div>
                    <div className="text-xs text-bluelock-dark/60 dark:text-gray-500 font-poppins mt-1">
                      30 ngày: {analytics.last30Days?.posts ?? 0}
                    </div>
                  </div>
                  <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      Lượt thích
                    </div>
                    <div className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                      {analytics.totals?.likes ?? 0}
                    </div>
                    <div className="text-xs text-bluelock-dark/60 dark:text-gray-500 font-poppins mt-1">
                      30 ngày: {analytics.last30Days?.likes ?? 0}
                    </div>
                  </div>
                  <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      Bình luận
                    </div>
                    <div className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                      {analytics.totals?.comments ?? 0}
                    </div>
                    <div className="text-xs text-bluelock-dark/60 dark:text-gray-500 font-poppins mt-1">
                      30 ngày: {analytics.last30Days?.comments ?? 0}
                    </div>
                  </div>
                  <div className="bg-bluelock-light dark:bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                      Followers
                    </div>
                    <div className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins">
                      {analytics.totals?.followers ?? 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-bluelock-dark dark:text-white font-poppins">
                    Theo tài khoản
                  </div>
                  {(analytics.perMember || []).map((m: any) => {
                    const user = brand.members.find((bm) => bm.userId === m.userId)?.user
                    return (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between p-4 bg-bluelock-light dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <Avatar
                            src={user?.avatar || null}
                            name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-bluelock-dark dark:text-white font-poppins truncate">
                              {user ? `${user.firstName} ${user.lastName}` : m.userId}
                            </div>
                            <div className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins truncate">
                              {user?.email || ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-bluelock-dark/70 dark:text-gray-300 font-poppins">
                          <span>Bài: {m.posts}</span>
                          <span>Like: {m.likes}</span>
                          <span>Cmt: {m.comments}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-bluelock-blue/30 dark:border-gray-800">
            <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins mb-4">
              Mời thành viên
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                  Vai trò
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                  className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins"
                >
                  <option value="MEMBER">Thành viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleInviteMember}
                className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                Mời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

