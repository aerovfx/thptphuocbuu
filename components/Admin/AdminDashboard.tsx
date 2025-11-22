'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Shield,
  Settings,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

interface AdminDashboardProps {
  stats: {
    users: {
      total: number
      active: number
      suspended: number
    }
    roles: {
      total: number
    }
    modules: {
      total: number
      enabled: number
    }
    recentAuditLogs: Array<{
      id: string
      action: string
      targetType: string | null
      targetId: string | null
      details: any
      createdAt: Date | string
      actor: {
        id: string
        email: string
        firstName: string
        lastName: string
      }
    }>
  }
  currentUser: any
}

export default function AdminDashboard({ stats, currentUser }: AdminDashboardProps) {
  const router = useRouter()

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats.users.total,
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/admin/users',
    },
    {
      title: 'Người dùng hoạt động',
      value: stats.users.active,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/dashboard/admin/users?status=ACTIVE',
    },
    {
      title: 'Người dùng bị tạm dừng',
      value: stats.users.suspended,
      icon: XCircle,
      color: 'bg-red-500',
      link: '/dashboard/admin/users?status=SUSPENDED',
    },
    {
      title: 'Vai trò',
      value: stats.roles.total,
      icon: Shield,
      color: 'bg-purple-500',
      link: '/dashboard/admin/roles',
    },
    {
      title: 'Modules',
      value: stats.modules.total,
      icon: Settings,
      color: 'bg-yellow-500',
      link: '/dashboard/admin/modules',
    },
    {
      title: 'Modules đang bật',
      value: stats.modules.enabled,
      icon: Activity,
      color: 'bg-green-500',
      link: '/dashboard/admin/modules?enabled=true',
    },
  ]

  const quickActions = [
    {
      title: 'Quản lý người dùng',
      description: 'Tạo, sửa, xóa và quản lý người dùng',
      icon: Users,
      link: '/dashboard/admin/users',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Quản lý vai trò',
      description: 'Tạo và quản lý vai trò và quyền',
      icon: Shield,
      link: '/dashboard/admin/roles',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Quản lý modules',
      description: 'Bật/tắt và cấu hình modules',
      icon: Settings,
      link: '/dashboard/admin/modules',
      color: 'bg-yellow-500 hover:bg-yellow-600',
    },
    {
      title: 'Audit Logs',
      description: 'Xem lịch sử hoạt động của admin',
      icon: FileText,
      link: '/dashboard/admin/audit-logs',
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ]

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-poppins">
          Quản lý hệ thống và người dùng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link
              key={index}
              href={card.link}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-poppins mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                href={action.link}
                className={`${action.color} text-white rounded-lg p-6 hover:shadow-lg transition-all transform hover:scale-105`}
              >
                <Icon size={32} className="mb-3" />
                <h3 className="text-lg font-semibold font-poppins mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-white/80 font-poppins">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-poppins">
            Hoạt động gần đây
          </h2>
          <Link
            href="/dashboard/admin/audit-logs"
            className="text-blue-500 hover:text-blue-600 font-poppins text-sm"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {stats.recentAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
              Chưa có hoạt động nào
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white font-poppins">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                        Bởi: {log.actor.firstName} {log.actor.lastName} ({log.actor.email})
                      </p>
                      {log.targetType && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-poppins mt-1">
                          {log.targetType}: {log.targetId}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                      <Clock size={14} />
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

