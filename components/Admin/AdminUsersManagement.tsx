'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Key,
  Ban,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Common/Avatar'
import ProtectedButton from './ProtectedButton'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  avatar: string | null
  lastLogin: string | null
  createdAt: string
  userRoles?: Array<{
    role: {
      id: string
      name: string
      description: string | null
    }
  }>
}

interface AdminUsersManagementProps {
  currentUser: any
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
  PARENT: 'Phụ huynh',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  TEACHER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  STUDENT: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  PARENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  SUSPENDED: 'Không hoạt động',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  SUSPENDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
}

export default function AdminUsersManagement({ currentUser }: AdminUsersManagementProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || 'ALL')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'ALL')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterRole !== 'ALL') params.set('role', filterRole)
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      params.set('page', page.toString())
      params.set('pageSize', '20')

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok) {
        // Handle both response formats: { data: [...] } or direct array
        const usersList = Array.isArray(data) ? data : (data.data || [])
        setUsers(usersList)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || usersList.length)
      } else {
        console.error('Error fetching users:', data.error || 'Unknown error')
        setUsers([])
        setTotal(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterRole, filterStatus, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1)
  }

  const handleFilterChange = (type: 'role' | 'status', value: string) => {
    if (type === 'role') {
      setFilterRole(value)
    } else {
      setFilterStatus(value)
    }
    setPage(1)
  }

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):')
    if (!newPassword || newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Đặt lại mật khẩu thành công')
        setShowActionsMenu(null)
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Đã xảy ra lỗi khi đặt lại mật khẩu')
    }
  }

  const handleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const reason = prompt(`Lý do ${newStatus === 'SUSPENDED' ? 'vô hiệu hóa' : 'kích hoạt'} (tùy chọn):`)

    try {
      // If the account was previously hard-soft-deleted, use restore for better recovery.
      if (currentStatus === 'DELETED') {
        await handleRestore(userId)
        return
      }

      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message || 'Cập nhật trạng thái thành công')
        setShowActionsMenu(null)
        fetchUsers()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      alert('Đã xảy ra lỗi khi cập nhật trạng thái')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (response.ok) {
        alert('Xóa người dùng thành công')
        setShowActionsMenu(null)
        fetchUsers()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Đã xảy ra lỗi khi xóa người dùng')
    }
  }

  const handleRestore = async (userId: string) => {
    if (!confirm('Phục hồi người dùng này?')) return
    try {
      const response = await fetch(`/api/admin/users/${userId}/restore`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        const extra = data.needsPasswordReset
          ? '\n\nLưu ý: tài khoản đã bị xoá mật khẩu, hãy dùng “Đặt lại mật khẩu” để người dùng đăng nhập lại.'
          : ''
        const warn = data.warning ? `\n\n${data.warning}` : ''
        alert((data.message || 'Đã phục hồi người dùng') + warn + extra)
        setShowActionsMenu(null)
        fetchUsers()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error restoring user:', error)
      alert('Đã xảy ra lỗi khi phục hồi người dùng')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Tổng cộng: {total} người dùng
          </p>
        </div>
        <Link
          href="/dashboard/users/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>Tạo người dùng</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterRole}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="STUDENT">Học sinh</option>
              <option value="PARENT">Phụ huynh</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="SUSPENDED">Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 font-poppins">Đang tải...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Users className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 dark:text-gray-500 text-lg font-poppins">
            Không tìm thấy người dùng nào
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Đăng nhập cuối
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={user.avatar}
                            name={`${user.firstName} ${user.lastName}`}
                            size="md"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white font-poppins">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full font-poppins ${roleColors[user.role] || ''}`}>
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full font-poppins ${statusColors[user.status] || ''}`}>
                          {statusLabels[user.status] || user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('vi-VN')
                          : 'Chưa đăng nhập'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          {showActionsMenu === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <Link
                                href={`/users/${user.id}`}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                                onClick={() => setShowActionsMenu(null)}
                              >
                                <Eye size={16} className="inline mr-2" />
                                Xem chi tiết
                              </Link>
                              <Link
                                href={`/dashboard/admin/users/${user.id}/edit`}
                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                                onClick={() => setShowActionsMenu(null)}
                              >
                                <Edit size={16} className="inline mr-2" />
                                Chỉnh sửa
                              </Link>
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                              >
                                <Key size={16} className="inline mr-2" />
                                Đặt lại mật khẩu
                              </button>
                              <button
                                onClick={() => handleSuspend(user.id, user.status)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                              >
                                {user.status === 'ACTIVE' ? (
                                  <>
                                    <Ban size={16} className="inline mr-2" />
                                    Vô hiệu hóa
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={16} className="inline mr-2" />
                                    Kích hoạt
                                  </>
                                )}
                              </button>
                              {/* Restore button for SUSPENDED users (if they have metadata indicating they were deleted) */}
                              {user.status === 'SUSPENDED' && (
                                <button
                                  onClick={() => handleRestore(user.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                                >
                                  <RotateCcw size={16} className="inline mr-2" />
                                  Phục hồi
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-poppins">
                Trang {page} / {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 font-poppins"
                >
                  Trước
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 font-poppins"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

