'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Key,
  X,
  Check,
  Save,
  Search,
  Users,
  Filter,
  RefreshCw,
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string | null
  createdAt: string
  rolePermissions: Array<{
    permission: {
      id: string
      resource: string
      action: string
      description: string | null
    }
  }>
  _count: {
    userAssignments: number
  }
}

interface Permission {
  id: string
  resource: string
  action: string
  description: string | null
  _count: {
    rolePermissions: number
  }
}

interface AdminRolesManagementProps {
  currentUser: any
}

export default function AdminRolesManagement({ currentUser }: AdminRolesManagementProps) {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showCreatePermission, setShowCreatePermission] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'users'>('name')
  const [refreshing, setRefreshing] = useState(false)

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[],
  })
  const [permissionForm, setPermissionForm] = useState({
    resource: '',
    action: '',
    description: '',
  })

  const fetchRoles = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true)
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.data || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error fetching roles:', response.status, errorData)
        if (response.status === 403) {
          alert('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản admin.')
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      if (showLoading) setRefreshing(false)
    }
  }, [])

  const fetchPermissions = useCallback(async () => {
    try {
      console.log('[fetchPermissions] Starting fetch...')
      const response = await fetch('/api/admin/permissions')
      console.log('[fetchPermissions] Got response, status:', response.status)
      
      const text = await response.text()
      console.log('[fetchPermissions] Response text length:', text.length)
      console.log('[fetchPermissions] Response text (first 1000 chars):', text.substring(0, 1000))
      console.log('[fetchPermissions] Response text (full):', text)
      
      if (response.ok) {
        try {
          const data = JSON.parse(text)
          console.log('[fetchPermissions] Parsed data:', data)
          setPermissions(data.data || [])
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError)
          alert(`Error parsing response: ${parseError instanceof Error ? parseError.message : String(parseError)}\n\nResponse: ${text.substring(0, 200)}`)
        }
      } else {
        console.error('[fetchPermissions] Error response, status:', response.status)
        console.error('[fetchPermissions] Response text (raw):', text)
        console.error('[fetchPermissions] Response text length:', text?.length || 0)
        console.error('[fetchPermissions] Response text type:', typeof text)
        
        try {
          // Check if text is empty or just whitespace
          if (!text || text.trim().length === 0) {
            console.error('[fetchPermissions] Empty response body')
            alert(`Error ${response.status}: Server returned empty response\n\nThis usually means the server crashed or returned an invalid response.\n\nPlease check the server console for detailed error logs.`)
            return
          }
          
          // Check if text is just "{}"
          const trimmedText = text.trim()
          if (trimmedText === '{}') {
            console.error('[fetchPermissions] Response is empty object string "{}"')
            alert(`Error ${response.status}: Server returned empty object\n\nThis usually means the server crashed or returned an invalid response.\n\nPlease check the server console for detailed error logs.\n\nRaw response: ${text}`)
            return
          }
          
          console.log('[fetchPermissions] Attempting to parse JSON...')
          const errorData = JSON.parse(text)
          console.error('[fetchPermissions] Parsed error data:', errorData)
          console.error('[fetchPermissions] Error data type:', typeof errorData)
          console.error('[fetchPermissions] Error data keys:', Object.keys(errorData))
          console.error('[fetchPermissions] Error data stringified:', JSON.stringify(errorData, null, 2))
          
          if (!errorData || typeof errorData !== 'object') {
            console.error('[fetchPermissions] Error data is not an object:', errorData)
            alert(`Error ${response.status}: Invalid error response format\n\nParsed value: ${JSON.stringify(errorData)}\n\nRaw response: ${text.substring(0, 500)}`)
            return
          }
          
          if (Object.keys(errorData).length === 0) {
            console.error('[fetchPermissions] Error data is empty object')
            alert(`Error ${response.status}: Server returned empty object\n\nRaw response text: ${text.substring(0, 500)}\n\nPlease check the server console for detailed error logs.\n\nResponse headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`)
          } else {
            const errorMessage = errorData.error || errorData.message || 'Unknown error'
            const errorDetails = errorData.details || (Object.keys(errorData).length > 1 ? errorData : null)
            alert(`Error ${response.status}: ${errorMessage}${errorDetails ? `\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}` : ''}`)
          }
        } catch (parseError) {
          console.error('[fetchPermissions] Error parsing error response:', parseError)
          console.error('[fetchPermissions] Parse error type:', typeof parseError)
          console.error('[fetchPermissions] Parse error message:', parseError instanceof Error ? parseError.message : String(parseError))
          console.error('[fetchPermissions] Raw text that failed to parse:', text)
          alert(`Error ${response.status}: Failed to parse error response\n\nParse error: ${parseError instanceof Error ? parseError.message : String(parseError)}\n\nRaw response (first 500 chars): ${text.substring(0, 500)}${text.length > 500 ? '\n\n... (truncated)' : ''}`)
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      alert(`Network error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchRoles(), fetchPermissions()])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [fetchRoles, fetchPermissions])

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissionIds,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Tạo vai trò thành công')
        setShowCreateRole(false)
        setEditingRole(null)
        setRoleForm({ name: '', description: '', permissionIds: [] })
        fetchRoles()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      alert('Đã xảy ra lỗi khi tạo vai trò')
    }
  }

  const handleCreatePermission = async () => {
    try {
      console.log('[handleCreatePermission] Starting, form data:', permissionForm)
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionForm),
      })

      console.log('[handleCreatePermission] Response status:', response.status)
      const text = await response.text()
      console.log('[handleCreatePermission] Response text:', text.substring(0, 500))

      if (response.ok) {
        try {
          const data = JSON.parse(text)
          console.log('[handleCreatePermission] Success, data:', data)
          alert(data.message || 'Tạo quyền thành công')
          setShowCreatePermission(false)
          setPermissionForm({ resource: '', action: '', description: '' })
          fetchPermissions()
        } catch (parseError) {
          console.error('[handleCreatePermission] Error parsing success response:', parseError)
          alert('Tạo quyền thành công nhưng không thể parse response')
          setShowCreatePermission(false)
          setPermissionForm({ resource: '', action: '', description: '' })
          fetchPermissions()
        }
      } else {
        try {
          if (!text || text.trim().length === 0) {
            alert(`Error ${response.status}: Server returned empty response\n\nPlease check the server console for detailed error logs.`)
            return
          }
          
          if (text.trim() === '{}') {
            alert(`Error ${response.status}: Server returned empty object\n\nPlease check the server console for detailed error logs.`)
            return
          }
          
          const errorData = JSON.parse(text)
          console.error('[handleCreatePermission] Error data:', errorData)
          
          const errorMessage = errorData.error || errorData.message || 'Đã xảy ra lỗi'
          const errorDetails = errorData.details ? `\n\nDetails: ${JSON.stringify(errorData.details, null, 2)}` : ''
          alert(`Error ${response.status}: ${errorMessage}${errorDetails}`)
        } catch (parseError) {
          console.error('[handleCreatePermission] Error parsing error response:', parseError)
          alert(`Error ${response.status}: Failed to parse error response\n\nRaw response: ${text.substring(0, 500)}`)
        }
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      alert(`Network error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleUpdateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Cập nhật quyền thành công')
        setSelectedRole(null)
        fetchRoles()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error updating role permissions:', error)
      alert('Đã xảy ra lỗi khi cập nhật quyền')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (response.ok) {
        alert('Xóa vai trò thành công')
        fetchRoles()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Đã xảy ra lỗi khi xóa vai trò')
    }
  }

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  // Filter and sort roles
  const filteredAndSortedRoles = roles
    .filter((role) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query) ||
        false
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'users':
          return b._count.userAssignments - a._count.userAssignments
        default:
          return 0
      }
    })

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissionIds: role.rolePermissions.map((rp) => rp.permission.id),
    })
    setShowCreateRole(true)
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    try {
      const response = await fetch(`/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissions: roleForm.permissionIds,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Cập nhật vai trò thành công')
        setShowCreateRole(false)
        setEditingRole(null)
        setRoleForm({ name: '', description: '', permissionIds: [] })
        fetchRoles()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Đã xảy ra lỗi khi cập nhật vai trò')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
            Quản lý vai trò và quyền
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Quản lý RBAC (Role-Based Access Control)
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fetchRoles(true)}
            disabled={refreshing}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setShowCreatePermission(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Tạo quyền</span>
          </button>
          <button
            onClick={() => {
              setEditingRole(null)
              setRoleForm({ name: '', description: '', permissionIds: [] })
              setShowCreateRole(true)
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Tạo vai trò</span>
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'users')}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="createdAt">Sắp xếp theo ngày tạo</option>
              <option value="users">Sắp xếp theo số người dùng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-poppins">
                Vai trò ({filteredAndSortedRoles.length}{searchQuery && ` / ${roles.length}`})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
                Đang tải...
              </div>
            ) : filteredAndSortedRoles.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
                {searchQuery ? 'Không tìm thấy vai trò nào' : 'Chưa có vai trò nào'}
              </div>
            ) : (
              filteredAndSortedRoles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield size={18} className="text-blue-500 dark:text-blue-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
                          {role.name}
                        </h3>
                        {(role.name === 'ADMIN' || role.name === 'admin' || role.name === 'SUPER_ADMIN') && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded">
                            Quan trọng
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1 ml-6">
                          {role.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 font-poppins ml-6">
                        <span className="flex items-center space-x-1">
                          <Key size={14} />
                          <span>{role.rolePermissions.length} quyền</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users size={14} />
                          <span>{role._count.userAssignments} người dùng</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditRole(role)
                        }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Permissions for Selected Role */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-poppins">
              {selectedRole ? `Quyền của ${selectedRole.name}` : 'Chọn vai trò để xem quyền'}
            </h2>
          </div>
          {selectedRole && (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white font-poppins mb-2">
                    {resource}
                  </h3>
                  <div className="space-y-2">
                    {perms.map((perm) => {
                      const isSelected = selectedRole.rolePermissions.some(
                        (rp) => rp.permission.id === perm.id
                      )
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const currentIds = selectedRole.rolePermissions.map((rp) => rp.permission.id)
                              const newIds = e.target.checked
                                ? [...currentIds, perm.id]
                                : currentIds.filter((id) => id !== perm.id)
                              
                              // Update local state immediately
                              setSelectedRole({
                                ...selectedRole,
                                rolePermissions: e.target.checked
                                  ? [...selectedRole.rolePermissions, { permission: perm }]
                                  : selectedRole.rolePermissions.filter((rp) => rp.permission.id !== perm.id),
                              })
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-poppins">
                            {perm.action}
                          </span>
                          {perm.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                              - {perm.description}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  const permissionIds = selectedRole.rolePermissions.map((rp) => rp.permission.id)
                  handleUpdateRolePermissions(selectedRole.id, permissionIds)
                }}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Save size={18} />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateRole(false)
                  setEditingRole(null)
                  setRoleForm({ name: '', description: '', permissionIds: [] })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Tên vai trò *
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ví dụ: Content Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Mô tả
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Mô tả vai trò..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Quyền
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissionIds.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissionIds: [...roleForm.permissionIds, perm.id],
                            })
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissionIds: roleForm.permissionIds.filter((id) => id !== perm.id),
                            })
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-poppins">
                        {perm.resource}:{perm.action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowCreateRole(false)
                    setRoleForm({ name: '', description: '', permissionIds: [] })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold"
                >
                  {editingRole ? 'Cập nhật' : 'Tạo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Permission Modal */}
      {showCreatePermission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Tạo quyền mới
              </h2>
              <button
                onClick={() => {
                  setShowCreatePermission(false)
                  setPermissionForm({ resource: '', action: '', description: '' })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Resource *
                </label>
                <input
                  type="text"
                  value={permissionForm.resource}
                  onChange={(e) => setPermissionForm({ ...permissionForm, resource: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ví dụ: module:user"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Action *
                </label>
                <input
                  type="text"
                  value={permissionForm.action}
                  onChange={(e) => setPermissionForm({ ...permissionForm, action: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ví dụ: read, write, delete"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Mô tả
                </label>
                <textarea
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Mô tả quyền..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowCreatePermission(false)
                    setPermissionForm({ resource: '', action: '', description: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreatePermission}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

