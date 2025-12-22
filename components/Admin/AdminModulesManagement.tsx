'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Save,
  X,
  Code,
  Shield,
  Users,
  UserCheck,
  UserX,
  Crown,
  CheckSquare,
  Square,
} from 'lucide-react'

interface Module {
  id: string
  key: string
  name: string
  description: string | null
  enabled: boolean
  config: string | null
  version: string
  createdAt: string
  updatedAt: string
}

interface AdminModulesManagementProps {
  currentUser: any
}

export default function AdminModulesManagement({ currentUser }: AdminModulesManagementProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingConfig, setEditingConfig] = useState<Module | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<Module | null>(null)
  const [modulePermissions, setModulePermissions] = useState<any[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([])
  const [availableRoles, setAvailableRoles] = useState<any[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string | null>>({})
  const [syncing, setSyncing] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyForm, setApplyForm] = useState({
    selectedModuleIds: [] as string[],
    criteriaType: 'PREMIUM_PLAN' as 'PREMIUM_PLAN' | 'ROLE' | 'MANUAL' | 'ALL',
    premiumPlans: [] as string[],
    roles: [] as string[],
    userIds: [] as string[],
    action: 'GRANT' as 'GRANT' | 'REVOKE',
    reason: '',
  })
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')

  // Form states
  const [moduleForm, setModuleForm] = useState({
    key: '',
    name: '',
    description: '',
    enabled: false,
    config: '',
    version: '1.0.0',
  })
  const [configText, setConfigText] = useState('')

  const fetchModules = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/modules')
      if (response.ok) {
        const data = await response.json()
        setModules(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSyncModules = async (silent: boolean = false) => {
    if (!silent && !confirm('Bạn có chắc chắn muốn đồng bộ modules từ code? Các module mới sẽ được tạo, module cũ sẽ được cập nhật.')) {
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/admin/modules/sync', {
        method: 'POST',
      })

      const data = await response.json()
      if (response.ok) {
        if (!silent) {
          alert(`Đồng bộ thành công: ${data.synced} modules${data.errors > 0 ? `, ${data.errors} lỗi` : ''}`)
        }
        fetchModules()
      } else {
        if (!silent) {
          alert(data.error || 'Đã xảy ra lỗi khi đồng bộ')
        }
      }
    } catch (error) {
      console.error('Error syncing modules:', error)
      alert('Đã xảy ra lỗi khi đồng bộ modules')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchModules()
  }, [fetchModules])

  // Auto-sync modules on mount if database is empty
  useEffect(() => {
    if (mounted && modules.length === 0 && !loading && !syncing) {
      // Auto-sync modules from code if database is empty
      handleSyncModules(true) // Silent sync on mount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, modules.length, loading])

  const handleCreateModule = async () => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...moduleForm,
          config: moduleForm.config || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Tạo module thành công')
        setShowCreateModule(false)
        setModuleForm({
          key: '',
          name: '',
          description: '',
          enabled: false,
          config: '',
          version: '1.0.0',
        })
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error creating module:', error)
      alert('Đã xảy ra lỗi khi tạo module')
    }
  }

  const handleUpdateModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: moduleForm.name,
          description: moduleForm.description,
          version: moduleForm.version,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Cập nhật module thành công')
        setEditingModule(null)
        setModuleForm({
          key: '',
          name: '',
          description: '',
          enabled: false,
          config: '',
          version: '1.0.0',
        })
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error updating module:', error)
      alert('Đã xảy ra lỗi khi cập nhật module')
    }
  }

  const handleToggleModule = async (moduleId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/enable`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !currentEnabled,
          reason: `Module ${!currentEnabled ? 'enabled' : 'disabled'} by admin`,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message || 'Cập nhật trạng thái thành công')
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error toggling module:', error)
      alert('Đã xảy ra lỗi khi cập nhật trạng thái')
    }
  }

  const handleUpdateConfig = async (moduleId: string) => {
    // Validate JSON
    try {
      JSON.parse(configText)
    } catch {
      alert('Config phải là JSON hợp lệ')
      return
    }

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configText }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Cập nhật cấu hình thành công')
        setEditingConfig(null)
        setConfigText('')
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('Đã xảy ra lỗi khi cập nhật cấu hình')
    }
  }

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa module này?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (response.ok) {
        alert('Xóa module thành công')
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('Đã xảy ra lỗi khi xóa module')
    }
  }

  const openEditModal = (module: Module) => {
    setEditingModule(module)
    setModuleForm({
      key: module.key,
      name: module.name,
      description: module.description || '',
      enabled: module.enabled,
      config: module.config || '',
      version: module.version,
    })
  }

  const openConfigModal = (module: Module) => {
    setEditingConfig(module)
    setConfigText(module.config || '{}')
  }

  const openPermissionsModal = async (module: Module) => {
    setEditingPermissions(module)
    try {
      const response = await fetch(`/api/admin/modules/${module.id}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setModulePermissions(data.modulePermissions || [])
        setAvailablePermissions(data.availablePermissions || [])
        setAvailableRoles(data.availableRoles || [])
        
        // Initialize selected permissions
        const selected: Record<string, string | null> = {}
        if (data.modulePermissions && Array.isArray(data.modulePermissions)) {
          data.modulePermissions.forEach((mp: any) => {
            selected[mp.permissionId] = mp.roleId || null
          })
        }
        setSelectedPermissions(selected)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error fetching module permissions:', response.status, errorData)
        alert(errorData.error || 'Đã xảy ra lỗi khi tải phân quyền')
      }
    } catch (error) {
      console.error('Error fetching module permissions:', error)
      alert('Đã xảy ra lỗi khi tải phân quyền')
    }
  }

  const handleSavePermissions = async () => {
    if (!editingPermissions) return

    try {
      const permissions = Object.entries(selectedPermissions).map(([permissionId, roleId]) => ({
        permissionId,
        roleId: roleId || null,
      }))

      const response = await fetch(`/api/admin/modules/${editingPermissions.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      })

      const data = await response.json()
      if (response.ok) {
        alert('Cập nhật phân quyền thành công')
        setEditingPermissions(null)
        setSelectedPermissions({})
        fetchModules()
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error saving permissions:', error)
      alert('Đã xảy ra lỗi khi lưu phân quyền')
    }
  }

  // Fetch users for manual selection
  useEffect(() => {
    if (showApplyModal && applyForm.criteriaType === 'MANUAL') {
      const fetchUsers = async () => {
        try {
          const response = await fetch('/api/users/search?limit=100')
          if (response.ok) {
            const data = await response.json()
            setAvailableUsers(data.users || [])
          }
        } catch (error) {
          console.error('Error fetching users:', error)
        }
      }
      fetchUsers()
    }
  }, [showApplyModal, applyForm.criteriaType])

  const handleApplyModules = async () => {
    if (applyForm.selectedModuleIds.length === 0) {
      alert('Vui lòng chọn ít nhất một module')
      return
    }

    // Validate criteria
    if (applyForm.criteriaType === 'PREMIUM_PLAN' && applyForm.premiumPlans.length === 0) {
      alert('Vui lòng chọn ít nhất một gói premium')
      return
    }
    if (applyForm.criteriaType === 'ROLE' && applyForm.roles.length === 0) {
      alert('Vui lòng chọn ít nhất một role')
      return
    }
    if (applyForm.criteriaType === 'MANUAL' && applyForm.userIds.length === 0) {
      alert('Vui lòng chọn ít nhất một user')
      return
    }

    setApplying(true)
    try {
      const response = await fetch('/api/admin/modules/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleIds: applyForm.selectedModuleIds,
          criteria: {
            type: applyForm.criteriaType,
            premiumPlans: applyForm.criteriaType === 'PREMIUM_PLAN' ? applyForm.premiumPlans : undefined,
            roles: applyForm.criteriaType === 'ROLE' ? applyForm.roles : undefined,
            userIds: applyForm.criteriaType === 'MANUAL' ? applyForm.userIds : undefined,
          },
          action: applyForm.action,
          reason: applyForm.reason || undefined,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(
          `${data.message}\n` +
          `- Modules: ${data.affectedModules}\n` +
          `- Users: ${data.affectedUsers}\n` +
          `- Tổng cộng: ${data.affectedCount} quyền truy cập`
        )
        setShowApplyModal(false)
        setApplyForm({
          selectedModuleIds: [],
          criteriaType: 'PREMIUM_PLAN',
          premiumPlans: [],
          roles: [],
          userIds: [],
          action: 'GRANT',
          reason: '',
        })
      } else {
        alert(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error) {
      console.error('Error applying modules:', error)
      alert('Đã xảy ra lỗi khi áp dụng modules')
    } finally {
      setApplying(false)
    }
  }

  const toggleModuleSelection = (moduleId: string) => {
    setApplyForm((prev) => ({
      ...prev,
      selectedModuleIds: prev.selectedModuleIds.includes(moduleId)
        ? prev.selectedModuleIds.filter((id) => id !== moduleId)
        : [...prev.selectedModuleIds, moduleId],
    }))
  }

  const togglePremiumPlan = (plan: string) => {
    setApplyForm((prev) => ({
      ...prev,
      premiumPlans: prev.premiumPlans.includes(plan)
        ? prev.premiumPlans.filter((p) => p !== plan)
        : [...prev.premiumPlans, plan],
    }))
  }

  const toggleRole = (role: string) => {
    setApplyForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }))
  }

  const toggleUser = (userId: string) => {
    setApplyForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }))
  }

  const filteredUsers = availableUsers.filter((user) =>
    userSearchTerm === '' ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
            Quản lý modules
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Bật/tắt và cấu hình các module trong hệ thống
          </p>
        </div>
        {mounted && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSyncModules(false)}
              disabled={syncing}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Đang đồng bộ...</span>
                </>
              ) : (
                <>
                  <Settings size={20} />
                  <span>Đồng bộ modules</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowApplyModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
            >
              <UserCheck size={20} />
              <span>Áp dụng cho users</span>
            </button>
            <button
              onClick={() => setShowCreateModule(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
            >
              <Plus size={20} />
              <span>Tạo module</span>
            </button>
          </div>
        )}
      </div>

      {/* Modules Grid */}
      {loading || syncing ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 font-poppins">
            {syncing ? 'Đang đồng bộ modules...' : 'Đang tải...'}
          </div>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Settings className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 dark:text-gray-500 text-lg font-poppins mb-4">
            Chưa có module nào trong database
          </p>
          <button
            onClick={() => handleSyncModules(false)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors mx-auto"
          >
            <Settings size={20} />
            <span>Đồng bộ modules từ code</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-1">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                    {module.key}
                  </p>
                  {module.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-2">
                      {module.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleModule(module.id, module.enabled)}
                    className={`p-2 rounded-lg ${
                      module.enabled
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                    title={module.enabled ? 'Tắt module' : 'Bật module'}
                  >
                    {module.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-poppins mb-4">
                <div className="flex flex-col">
                  <span>Version: {module.version}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Key: {module.key}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`px-2 py-1 rounded-full mb-1 ${
                      module.enabled
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {module.enabled ? 'Đang bật' : 'Đang tắt'}
                  </span>
                  {module.config && (() => {
                    try {
                      const config = JSON.parse(module.config)
                      const roles = config.roles || []
                      if (roles.length > 0) {
                        return (
                          <div className="flex flex-col items-end mt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                              {roles.length} roles
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                              {roles.slice(0, 3).map((role: string) => (
                                <span
                                  key={role}
                                  className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px]"
                                >
                                  {role}
                                </span>
                              ))}
                              {roles.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-[10px]">
                                  +{roles.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      }
                    } catch {
                      return null
                    }
                    return null
                  })()}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(module)}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-poppins font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <Edit size={16} />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={() => openConfigModal(module)}
                  className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-poppins font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <Code size={16} />
                  <span>Config</span>
                </button>
                <button
                  onClick={() => openPermissionsModal(module)}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-poppins font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <Shield size={16} />
                  <span>Phân quyền</span>
                </button>
                <button
                  onClick={() => handleDeleteModule(module.id)}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-poppins font-semibold transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Module Modal */}
      {showCreateModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Tạo module mới
              </h2>
              <button
                onClick={() => {
                  setShowCreateModule(false)
                  setModuleForm({
                    key: '',
                    name: '',
                    description: '',
                    enabled: false,
                    config: '',
                    version: '1.0.0',
                  })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Key (unique) *
                </label>
                <input
                  type="text"
                  value={moduleForm.key}
                  onChange={(e) => setModuleForm({ ...moduleForm, key: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ví dụ: user_mgmt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Tên module *
                </label>
                <input
                  type="text"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Ví dụ: User Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Mô tả
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Mô tả module..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                    Version
                  </label>
                  <input
                    type="text"
                    value={moduleForm.version}
                    onChange={(e) => setModuleForm({ ...moduleForm, version: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                    placeholder="1.0.0"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={moduleForm.enabled}
                      onChange={(e) => setModuleForm({ ...moduleForm, enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-poppins">
                      Bật ngay sau khi tạo
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Config (JSON)
                </label>
                <textarea
                  value={moduleForm.config}
                  onChange={(e) => setModuleForm({ ...moduleForm, config: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowCreateModule(false)
                    setModuleForm({
                      key: '',
                      name: '',
                      description: '',
                      enabled: false,
                      config: '',
                      version: '1.0.0',
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateModule}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Chỉnh sửa module
              </h2>
              <button
                onClick={() => {
                  setEditingModule(null)
                  setModuleForm({
                    key: '',
                    name: '',
                    description: '',
                    enabled: false,
                    config: '',
                    version: '1.0.0',
                  })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Key (không thể thay đổi)
                </label>
                <input
                  type="text"
                  value={moduleForm.key}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 font-poppins cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Tên module *
                </label>
                <input
                  type="text"
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Mô tả
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Version
                </label>
                <input
                  type="text"
                  value={moduleForm.version}
                  onChange={(e) => setModuleForm({ ...moduleForm, version: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingModule(null)
                    setModuleForm({
                      key: '',
                      name: '',
                      description: '',
                      enabled: false,
                      config: '',
                      version: '1.0.0',
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUpdateModule(editingModule.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Cấu hình: {editingConfig.name}
              </h2>
              <button
                onClick={() => {
                  setEditingConfig(null)
                  setConfigText('')
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Config (JSON)
                </label>
                <textarea
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingConfig(null)
                    setConfigText('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUpdateConfig(editingConfig.id)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2"
                >
                  <Save size={18} />
                  <span>Lưu config</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Phân quyền: {editingPermissions.name}
              </h2>
              <button
                onClick={() => {
                  setEditingPermissions(null)
                  setSelectedPermissions({})
                  setModulePermissions([])
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-4">
                Chọn quyền và vai trò cho module này. Để trống role nếu áp dụng cho tất cả roles.
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white font-poppins">
                        {permission.resource}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {permission.action} {permission.description && `- ${permission.description}`}
                      </div>
                    </div>
                    <select
                      value={selectedPermissions[permission.id] || ''}
                      onChange={(e) => {
                        setSelectedPermissions({
                          ...selectedPermissions,
                          [permission.id]: e.target.value || null,
                        })
                      }}
                      className="ml-4 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                    >
                      <option value="">Tất cả roles</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {availablePermissions.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-poppins">
                  Chưa có permission nào. Vui lòng tạo permissions trước.
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setEditingPermissions(null)
                    setSelectedPermissions({})
                    setModulePermissions([])
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2"
                >
                  <Save size={18} />
                  <span>Lưu phân quyền</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modules Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Áp dụng modules cho users
              </h2>
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  setApplyForm({
                    selectedModuleIds: [],
                    criteriaType: 'PREMIUM_PLAN',
                    premiumPlans: [],
                    roles: [],
                    userIds: [],
                    action: 'GRANT',
                    reason: '',
                  })
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Select Modules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  1. Chọn modules *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {modules
                    .filter((m) => m.enabled)
                    .map((module) => (
                      <label
                        key={module.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={applyForm.selectedModuleIds.includes(module.id)}
                          onChange={() => toggleModuleSelection(module.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white font-poppins">
                          {module.name}
                        </span>
                      </label>
                    ))}
                </div>
                {modules.filter((m) => m.enabled).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Không có module nào được bật
                  </p>
                )}
              </div>

              {/* Step 2: Select Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  2. Hành động *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="GRANT"
                      checked={applyForm.action === 'GRANT'}
                      onChange={(e) => setApplyForm({ ...applyForm, action: e.target.value as 'GRANT' | 'REVOKE' })}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <UserCheck size={18} className="text-green-600" />
                    <span className="text-sm text-gray-900 dark:text-white font-poppins">Cấp quyền</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="REVOKE"
                      checked={applyForm.action === 'REVOKE'}
                      onChange={(e) => setApplyForm({ ...applyForm, action: e.target.value as 'GRANT' | 'REVOKE' })}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <UserX size={18} className="text-red-600" />
                    <span className="text-sm text-gray-900 dark:text-white font-poppins">Thu hồi quyền</span>
                  </label>
                </div>
              </div>

              {/* Step 3: Select Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  3. Tiêu chí áp dụng *
                </label>
                <select
                  value={applyForm.criteriaType}
                  onChange={(e) =>
                    setApplyForm({
                      ...applyForm,
                      criteriaType: e.target.value as 'PREMIUM_PLAN' | 'ROLE' | 'MANUAL' | 'ALL',
                      premiumPlans: [],
                      roles: [],
                      userIds: [],
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="PREMIUM_PLAN">Theo gói Premium</option>
                  <option value="ROLE">Theo Role</option>
                  <option value="MANUAL">Chọn thủ công</option>
                  <option value="ALL">Tất cả users</option>
                </select>

                {/* Premium Plans */}
                {applyForm.criteriaType === 'PREMIUM_PLAN' && (
                  <div className="mt-3 space-y-2">
                    {['STANDARD', 'PRO', 'ENTERPRISE'].map((plan) => (
                      <label
                        key={plan}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={applyForm.premiumPlans.includes(plan)}
                          onChange={() => togglePremiumPlan(plan)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Crown size={16} className="text-yellow-500" />
                        <span className="text-sm text-gray-900 dark:text-white font-poppins">{plan}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Roles */}
                {applyForm.criteriaType === 'ROLE' && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {['ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN', 'BGH'].map((role) => (
                      <label
                        key={role}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={applyForm.roles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white font-poppins">{role}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Manual User Selection */}
                {applyForm.criteriaType === 'MANUAL' && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Tìm kiếm user..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                    />
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={applyForm.userIds.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 dark:text-white font-poppins">
                            {user.firstName} {user.lastName} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Users */}
                {applyForm.criteriaType === 'ALL' && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-poppins">
                      ⚠️ Cảnh báo: Hành động này sẽ áp dụng cho TẤT CẢ users trong hệ thống
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4: Reason (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  4. Lý do (tùy chọn)
                </label>
                <input
                  type="text"
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Ví dụ: Mở khóa cho gói PRO"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowApplyModal(false)
                    setApplyForm({
                      selectedModuleIds: [],
                      criteriaType: 'PREMIUM_PLAN',
                      premiumPlans: [],
                      roles: [],
                      userIds: [],
                      action: 'GRANT',
                      reason: '',
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-poppins"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApplyModules}
                  disabled={applying}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-poppins font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {applying ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Đang áp dụng...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Áp dụng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

