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
  const [showCreateModule, setShowCreateModule] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingConfig, setEditingConfig] = useState<Module | null>(null)

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

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

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
        <button
          onClick={() => setShowCreateModule(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-poppins font-semibold transition-colors"
        >
          <Plus size={20} />
          <span>Tạo module</span>
        </button>
      </div>

      {/* Modules Grid */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 font-poppins">Đang tải...</div>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Settings className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 dark:text-gray-500 text-lg font-poppins">
            Chưa có module nào
          </p>
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
                <span>Version: {module.version}</span>
                <span
                  className={`px-2 py-1 rounded-full ${
                    module.enabled
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {module.enabled ? 'Đang bật' : 'Đang tắt'}
                </span>
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
    </div>
  )
}

