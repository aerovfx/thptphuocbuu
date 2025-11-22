'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Eye,
  X,
} from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  targetType: string | null
  targetId: string | null
  details: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date | string
  actor: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

interface AdminAuditLogsProps {
  currentUser: any
}

export default function AdminAuditLogs({ currentUser }: AdminAuditLogsProps) {
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    actorId: searchParams.get('actorId') || '',
    action: searchParams.get('action') || '',
    targetType: searchParams.get('targetType') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.actorId) params.set('actorId', filters.actorId)
      if (filters.action) params.set('action', filters.action)
      if (filters.targetType) params.set('targetType', filters.targetType)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      params.set('page', page.toString())
      params.set('pageSize', '50')

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d)
  }

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'user.create': 'Tạo người dùng',
      'user.update': 'Cập nhật người dùng',
      'user.delete': 'Xóa người dùng',
      'user.reset_password': 'Đặt lại mật khẩu',
      'user.suspended': 'Tạm dừng người dùng',
      'user.active': 'Kích hoạt người dùng',
      'user.assign_roles': 'Gán vai trò',
      'role.create': 'Tạo vai trò',
      'role.update': 'Cập nhật vai trò',
      'role.delete': 'Xóa vai trò',
      'role.update_permissions': 'Cập nhật quyền',
      'module.create': 'Tạo module',
      'module.update': 'Cập nhật module',
      'module.delete': 'Xóa module',
      'module.enable': 'Bật module',
      'module.disable': 'Tắt module',
      'module.update_config': 'Cập nhật cấu hình',
    }
    return actionMap[action] || action
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
          Audit Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-poppins">
          Lịch sử hoạt động của admin - Tổng cộng: {total} bản ghi
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
              Action
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="Ví dụ: user.create"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
              Target Type
            </label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            >
              <option value="">Tất cả</option>
              <option value="user">User</option>
              <option value="role">Role</option>
              <option value="module">Module</option>
              <option value="permission">Permission</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-poppins"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 font-poppins">Đang tải...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <FileText className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 dark:text-gray-500 text-lg font-poppins">
            Không tìm thấy audit log nào
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
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Target
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-poppins">
                          {log.actor.firstName} {log.actor.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                          {log.actor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 font-poppins">
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-poppins">
                        {log.targetType && log.targetId ? (
                          <span>
                            {log.targetType}: {log.targetId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-poppins"
                        >
                          <Eye size={18} className="inline" />
                        </button>
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
                Chi tiết Audit Log
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                  Action
                </label>
                <p className="text-gray-900 dark:text-white font-poppins">{getActionLabel(selectedLog.action)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                  Admin
                </label>
                <p className="text-gray-900 dark:text-white font-poppins">
                  {selectedLog.actor.firstName} {selectedLog.actor.lastName} ({selectedLog.actor.email})
                </p>
              </div>
              {selectedLog.targetType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                    Target
                  </label>
                  <p className="text-gray-900 dark:text-white font-poppins">
                    {selectedLog.targetType}: {selectedLog.targetId}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                  Thời gian
                </label>
                <p className="text-gray-900 dark:text-white font-poppins">{formatDate(selectedLog.createdAt)}</p>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                    IP Address
                  </label>
                  <p className="text-gray-900 dark:text-white font-poppins">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                    User Agent
                  </label>
                  <p className="text-gray-900 dark:text-white font-poppins text-sm">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-poppins">
                    Chi tiết
                  </label>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-900 dark:text-white">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

