'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  User,
  Calendar,
  Tag,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Avatar from '@/components/Common/Avatar'

interface SpaceTask {
  id: string
  title: string
  description: string | null
  column: string
  priority: string | null
  dueDate: string | null
  tags: string | null
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  } | null
  commentsCount: number
  space: {
    id: string
    name: string
  }
}

interface SpaceTasksListProps {
  spaceId: string
  spaceName: string
  initialTasks: SpaceTask[]
  canManage: boolean
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  todo: { label: 'Cần làm', color: 'bg-gray-500/20 text-gray-400', icon: Clock },
  'in-progress': { label: 'Đang làm', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  review: { label: 'Đang xem xét', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
  done: { label: 'Hoàn thành', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Khẩn cấp', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  HIGH: { label: 'Cao', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  NORMAL: { label: 'Bình thường', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  LOW: { label: 'Thấp', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
}

export default function SpaceTasksList({
  spaceId,
  spaceName,
  initialTasks,
  canManage,
}: SpaceTasksListProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<SpaceTask[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return []
    try {
      const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags
      return Array.isArray(tagsArray) ? tagsArray : []
    } catch {
      return []
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const isOverdue = (dueDate: string | null | undefined): boolean => {
    if (!dueDate) return false
    try {
      const deadlineDate = new Date(dueDate)
      if (isNaN(deadlineDate.getTime())) return false
      return deadlineDate < new Date()
    } catch {
      return false
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      if (!matchesSearch) return false
    }

    // Status filter
    if (filterStatus !== 'all' && task.column !== filterStatus) {
      return false
    }

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false
    }

    // Assignee filter
    if (filterAssignee !== 'all' && task.assignedTo?.id !== filterAssignee) {
      return false
    }

    return true
  })

  const StatusIcon = (status: string) => {
    const statusInfo = statusLabels[status] || statusLabels.todo
    const Icon = statusInfo.icon
    return <Icon size={16} />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
              Quản lý công việc - {spaceName}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
              Tổng cộng {filteredTasks.length} công việc
            </p>
          </div>
          {canManage && (
            <Link
              href={`/dashboard/spaces/${spaceId}/tasks/new`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
            >
              <Plus size={20} />
              <span>Tạo công việc</span>
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="todo">Cần làm</option>
            <option value="in-progress">Đang làm</option>
            <option value="review">Đang xem xét</option>
            <option value="done">Hoàn thành</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
          >
            <option value="all">Tất cả độ ưu tiên</option>
            <option value="URGENT">Khẩn cấp</option>
            <option value="HIGH">Cao</option>
            <option value="NORMAL">Bình thường</option>
            <option value="LOW">Thấp</option>
          </select>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
          >
            <option value="all">Tất cả người được giao</option>
            {Array.from(new Set(tasks.map((t) => t.assignedTo?.id).filter(Boolean))).map((userId) => {
              const task = tasks.find((t) => t.assignedTo?.id === userId)
              return task?.assignedTo ? (
                <option key={userId} value={userId}>
                  {task.assignedTo.firstName} {task.assignedTo.lastName}
                </option>
              ) : null
            })}
            <option value="unassigned">Chưa giao</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-poppins">
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all'
                ? 'Không tìm thấy công việc nào phù hợp với bộ lọc'
                : 'Chưa có công việc nào'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusInfo = statusLabels[task.column] || statusLabels.todo
            const priorityInfo = task.priority
              ? priorityLabels[task.priority] || priorityLabels.NORMAL
              : null
            const tags = parseTags(task.tags)

            return (
              <Link
                key={task.id}
                href={`/dashboard/spaces/${spaceId}/tasks/${task.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1`}
                      >
                        {StatusIcon(task.column)}
                        <span>{statusInfo.label}</span>
                      </span>
                      {priorityInfo && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${priorityInfo.color} font-poppins`}
                        >
                          {priorityInfo.label}
                        </span>
                      )}
                      {isOverdue(task.dueDate) && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-poppins flex items-center space-x-1">
                          <AlertCircle size={12} />
                          <span>Quá hạn</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-2">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {tags.length > 0 && (
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        {tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-poppins"
                          >
                            #{tag}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                            +{tags.length - 3} nữa
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 font-poppins">
                      <div className="flex items-center space-x-2">
                        <User size={14} />
                        <span>
                          {task.assignedTo
                            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                            : 'Chưa giao'}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} />
                          <span className={isOverdue(task.dueDate) ? 'text-red-500' : ''}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span>
                          {formatDistanceToNow(new Date(task.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                      {task.commentsCount > 0 && (
                        <div className="flex items-center space-x-1">
                          <span>{task.commentsCount}</span>
                          <span>bình luận</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {task.assignedTo && (
                      <Avatar
                        src={task.assignedTo.avatar}
                        name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                        size="sm"
                      />
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

