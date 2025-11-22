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

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }, [])

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/permissions')
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchRoles(), fetchPermissions()])
      setLoading(false)
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
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionForm),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Tạo quyền thành công')
        setShowCreatePermission(false)
        setPermissionForm({ resource: '', action: '', description: '' })
        fetchPermissions()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error creating permission:', error)
      alert('Đã xảy ra lỗi khi tạo quyền')
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            onClick={() => setShowCreatePermission(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Tạo quyền</span>
          </button>
          <button
            onClick={() => setShowCreateRole(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={20} />
            <span>Tạo vai trò</span>
          </button>
        </div>
      </div>

      {/* Roles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-poppins">
              Vai trò ({roles.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
                Đang tải...
              </div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
                Chưa có vai trò nào
              </div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
                        {role.name}
                      </h3>
                      {role.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">
                          {role.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                        <span>{role.rolePermissions.length} quyền</span>
                        <span>{role._count.userAssignments} người dùng</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteRole(role.id)
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
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
                Tạo vai trò mới
              </h2>
              <button
                onClick={() => {
                  setShowCreateRole(false)
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
                  onClick={handleCreateRole}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold"
                >
                  Tạo
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

