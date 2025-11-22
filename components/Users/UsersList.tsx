'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Users as UsersIcon, UserPlus, Eye, Edit, Trash2, Search, Filter, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import Avatar from '@/components/Common/Avatar'
import EditUserModal from './EditUserModal'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  avatar: string | null
  createdAt: Date | string
}

interface UsersListProps {
  users: User[]
  currentUserRole: string
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

export default function UsersList({ users: initialUsers, currentUserRole }: UsersListProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewing, setIsViewing] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState<string | null>(null)

  // Update users when initialUsers prop changes (after refresh)
  React.useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Filter users based on search and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'ALL' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleViewUser = useCallback((userId: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    if (isViewing === userId || isEditing === userId || isDeleting === userId) {
      return // Prevent double-clicks or actions during other operations
    }
    
    try {
      setIsViewing(userId)
      router.push(`/users/${userId}`)
    } catch (error) {
      console.error('Error navigating to user:', error)
      setIsViewing(null)
      alert('Không thể mở trang người dùng. Vui lòng thử lại.')
    } finally {
      // Reset after a short delay to allow navigation
      setTimeout(() => setIsViewing(null), 1000)
    }
  }, [router, isViewing, isEditing, isDeleting])

  const handleEditUser = useCallback((user: User, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    if (isEditing === user.id || isViewing === user.id || isDeleting === user.id) {
      return // Prevent double-clicks or actions during other operations
    }
    
    try {
      setIsEditing(user.id)
      setEditingUser(user)
      setIsEditModalOpen(true)
    } catch (error) {
      console.error('Error opening edit modal:', error)
      setIsEditing(null)
      setEditingUser(null)
      setIsEditModalOpen(false)
      alert('Không thể mở form chỉnh sửa. Vui lòng thử lại.')
    }
  }, [isEditing, isViewing, isDeleting])

  const handleEditSuccess = useCallback((updatedUser: User) => {
    try {
      // Update the user in the list, preserving avatar if updatedUser.avatar is null/undefined
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === updatedUser.id) {
            // Preserve avatar from existing user if updatedUser.avatar is null or undefined
            // Only update avatar if updatedUser has a non-null avatar value
            const updatedUserAvatar = (updatedUser as any).avatar
            const preservedAvatar = updatedUserAvatar !== null && updatedUserAvatar !== undefined
              ? updatedUserAvatar
              : u.avatar
            return { 
              ...u, 
              ...updatedUser, 
              avatar: preservedAvatar,
              createdAt: u.createdAt, // Preserve original createdAt format
            }
          }
          return u
        })
      )
      // Close modal and reset editing state
      setIsEditModalOpen(false)
      setEditingUser(null)
      setIsEditing(null)
      // Refresh server data
      router.refresh()
      console.log(`Đã cập nhật thông tin người dùng "${updatedUser.firstName} ${updatedUser.lastName}" thành công.`)
    } catch (error) {
      console.error('Error updating user list:', error)
      alert('Đã xảy ra lỗi khi cập nhật danh sách người dùng. Vui lòng tải lại trang.')
    }
  }, [router])

  const handleDeleteUser = useCallback(async (userId: string, userName: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    if (isDeleting === userId || isEditing === userId || isViewing === userId) {
      return // Prevent double-clicks or actions during other operations
    }

    // Confirm deletion with user
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa người dùng "${userName}"?\n\nHành động này không thể hoàn tác.`
    )
    
    if (!confirmed) {
      return
    }

    const userToDelete = users.find((u) => u.id === userId)
    if (!userToDelete) {
      alert('Không tìm thấy người dùng để xóa.')
      return
    }

    const previousUsers = [...users]

    setIsDeleting(userId)
    // Optimistically update UI
    setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId))

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMessage = data.error || data.message || `Lỗi ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Success - refresh server data
      router.refresh()
      
      // Show success message (optional, can be replaced with toast)
      console.log(`Đã xóa người dùng "${userName}" thành công.`)
    } catch (error: any) {
      // Rollback optimistic update on error
      setUsers(previousUsers)
      const errorMessage = error?.message || 'Đã xảy ra lỗi khi xóa người dùng. Vui lòng thử lại.'
      alert(errorMessage)
      console.error('Error deleting user:', error)
    } finally {
      setIsDeleting(null)
    }
  }, [users, isDeleting, isEditing, isViewing, router])

  const handleRowClick = useCallback((userId: string, e?: React.MouseEvent<HTMLTableRowElement>) => {
    // Don't navigate if clicking on action buttons
    if (e && (e.target as HTMLElement).closest('button, a')) {
      return
    }
    handleViewUser(userId)
  }, [handleViewUser])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      action()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
              aria-label="Tìm kiếm người dùng"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterRole}
              onChange={handleFilterChange}
              className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins appearance-none"
              aria-label="Lọc theo vai trò"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="STUDENT">Học sinh</option>
              <option value="PARENT">Phụ huynh</option>
            </select>
          </div>

          {/* Add User Button */}
          {currentUserRole === 'ADMIN' && (
            <Link
              href="/dashboard/users/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Thêm người dùng mới"
              onClick={(e) => {
                // Prevent navigation if any operation is in progress
                if (isDeleting || isEditing || isViewing) {
                  e.preventDefault()
                  alert('Vui lòng đợi các thao tác khác hoàn tất trước khi thêm người dùng mới.')
                }
              }}
            >
              <UserPlus size={20} />
              <span>Thêm người dùng</span>
            </Link>
          )}
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <UsersIcon className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 dark:text-gray-500 text-lg font-poppins">
            {searchTerm || filterRole !== 'ALL' ? 'Không tìm thấy người dùng nào' : 'Chưa có người dùng nào'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={(e) => handleRowClick(user.id, e)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleRowClick(user.id))}
                    tabIndex={0}
                    role="button"
                    aria-label={`Xem chi tiết người dùng ${user.firstName} ${user.lastName}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatar}
                          name={`${user.firstName} ${user.lastName}`}
                          size="sm"
                          userId={user.id}
                          clickable={true}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white font-poppins">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-poppins">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-poppins ${
                          roleColors[user.role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-poppins">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleViewUser(user.id, e)}
                          onKeyDown={(e) => handleKeyDown(e, () => handleViewUser(user.id))}
                          disabled={isViewing === user.id}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết người dùng ${user.firstName} ${user.lastName}`}
                        >
                          {isViewing === user.id ? (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                        {currentUserRole === 'ADMIN' && (
                          <>
                            <button
                              onClick={(e) => handleEditUser(user, e)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleEditUser(user))}
                              disabled={isEditing === user.id || isDeleting === user.id}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500"
                              title="Chỉnh sửa"
                              aria-label={`Chỉnh sửa người dùng ${user.firstName} ${user.lastName}`}
                            >
                              {isEditing === user.id ? (
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full"></span>
                              ) : (
                                <Edit size={18} />
                              )}
                            </button>
                            <button
                              onClick={(e) => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`, e)}
                              onKeyDown={(e) => handleKeyDown(e, () => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`))}
                              disabled={isDeleting === user.id || isEditing === user.id}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Xóa"
                              aria-label={`Xóa người dùng ${user.firstName} ${user.lastName}`}
                            >
                              {isDeleting === user.id ? (
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></span>
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
              Hiển thị {filteredUsers.length} / {users.length} người dùng
            </p>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingUser(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

