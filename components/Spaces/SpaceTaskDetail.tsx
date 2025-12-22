'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Download,
  Eye,
  UserPlus,
  MessageSquare,
  RefreshCw,
  Edit,
  Trash2,
  Tag,
  Image as ImageIcon,
  Paperclip,
  CheckSquare,
  Send,
  X,
  Upload,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Avatar from '@/components/Common/Avatar'
import TaskDetailModal from './TaskDetailModal'

interface SpaceTask {
  id: string
  title: string
  description: string | null
  column: string
  priority: string | null
  dueDate: string | null
  images: string | null
  attachments: string | null
  checklist: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
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

interface SpaceTaskDetailProps {
  task: SpaceTask
  currentUser: any
  spaceId?: string
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

export default function SpaceTaskDetail({ task: initialTask, currentUser, spaceId: propSpaceId }: SpaceTaskDetailProps) {
  const router = useRouter()
  const params = useParams()
  const [task, setTask] = useState<SpaceTask>(initialTask)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Get spaceId from various sources with fallback
  const spaceId: string = (() => {
    if (task.space?.id) return task.space.id
    if (propSpaceId) return propSpaceId
    if (params?.id && typeof params.id === 'string') return params.id
    // Fallback - this should not happen in normal usage
    return ''
  })()

  // Show error if spaceId is not available
  if (!spaceId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-poppins">Không thể xác định Space ID. Vui lòng tải lại trang.</span>
        </div>
      </div>
    )
  }

  // Parse data safely
  const parseJSON = (jsonString: string | null): any[] => {
    if (!jsonString) return []
    try {
      const parsed = JSON.parse(jsonString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const tagsArray = useMemo(() => {
    return parseJSON(task.tags)
  }, [task.tags])

  const images = useMemo(() => {
    return parseJSON(task.images) as string[]
  }, [task.images])

  const attachments = useMemo(() => {
    return parseJSON(task.attachments) as any[]
  }, [task.attachments])

  const checklist = useMemo(() => {
    return parseJSON(task.checklist) as Array<{ id: string; text: string; completed: boolean }>
  }, [task.checklist])

  // Format dates consistently
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const isDeadlineOverdue = (deadline: string | null | undefined): boolean => {
    if (!deadline) return false
    try {
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) return false
      return deadlineDate < new Date()
    } catch {
      return false
    }
  }

  const StatusIcon = statusLabels[task.column]?.icon || Clock
  const statusInfo = statusLabels[task.column] || statusLabels.todo
  const priorityInfo = task.priority
    ? priorityLabels[task.priority] || priorityLabels.NORMAL
    : null

  const canEdit =
    currentUser.user.role === 'ADMIN' ||
    currentUser.user.role === 'SUPER_ADMIN' ||
    task.createdBy.id === currentUser.user.id

  const canManage =
    currentUser.user.role === 'ADMIN' ||
    currentUser.user.role === 'SUPER_ADMIN' ||
    task.createdBy.id === currentUser.user.id

  // Refresh task data
  const refreshTask = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`)
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu công việc')
      }
      const data = await response.json()
      setTask(data)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu')
      console.error('Error refreshing task:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!canManage) return

    try {
      setLoading(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: newStatus,
        }),
      })

      if (response.ok) {
        await refreshTask()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Đã xảy ra lỗi khi cập nhật trạng thái')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!canManage) return

    if (!confirm('Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push(`/dashboard/spaces/${spaceId}/tasks`)
      } else {
        const data = await response.json()
        setError(data.error || 'Đã xảy ra lỗi khi xóa công việc')
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xóa công việc')
      console.error('Error deleting task:', err)
    } finally {
      setLoading(false)
    }
  }

  const completedChecklist = checklist.filter((item) => item.completed).length
  const totalChecklist = checklist.length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-poppins">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <h1 className="text-2xl font-bold text-white font-poppins">{task.title}</h1>
              {loading && <RefreshCw className="animate-spin text-gray-400" size={20} />}
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.color} font-poppins flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => canManage && setShowDetailModal(true)}
                title={canManage ? 'Click để xem chi tiết và chỉnh sửa' : ''}
              >
                <StatusIcon size={16} />
                <span>{statusInfo.label}</span>
              </span>
              {priorityInfo && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${priorityInfo.color} font-poppins`}
                >
                  {priorityInfo.label}
                </span>
              )}
            </div>
            {/* Tags */}
            {tagsArray.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mt-3" suppressHydrationWarning>
                {tagsArray.map((tag: string, index: number) => (
                  <span
                    key={`tag-${index}-${tag}`}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 font-poppins"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                <button
                  onClick={() => setShowDetailModal(true)}
                  disabled={loading}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Chỉnh sửa"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 bg-gray-800 hover:bg-red-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400 font-poppins">Người tạo</p>
              <div className="flex items-center space-x-2">
                <Avatar
                  src={task.createdBy.avatar}
                  name={`${task.createdBy.firstName} ${task.createdBy.lastName}`}
                  size="sm"
                />
                <p className="text-white font-poppins">
                  {task.createdBy.firstName} {task.createdBy.lastName}
                </p>
              </div>
            </div>
          </div>
          {task.assignedTo && (
            <div className="flex items-center space-x-3">
              <UserPlus className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-400 font-poppins">Người được giao</p>
                <div className="flex items-center space-x-2">
                  <Avatar
                    src={task.assignedTo.avatar}
                    name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                    size="sm"
                  />
                  <p className="text-white font-poppins">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </p>
                </div>
              </div>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center space-x-3">
              <Calendar className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-400 font-poppins">Hạn chót</p>
                <p
                  className={`font-poppins ${
                    isDeadlineOverdue(task.dueDate) ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {formatDate(task.dueDate)}
                  {isDeadlineOverdue(task.dueDate) && (
                    <span className="ml-2 text-xs">(Quá hạn)</span>
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-3">
            <Clock className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400 font-poppins">Ngày tạo</p>
              <p className="text-white font-poppins">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-3">
            Mô tả
          </h2>
          <p className="text-gray-700 dark:text-gray-300 font-poppins whitespace-pre-line">
            {task.description}
          </p>
        </div>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-3">
            Checklist ({completedChecklist}/{totalChecklist})
          </h2>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span
                  className={`flex-1 text-sm font-poppins ${
                    item.completed
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-3">
            Hình ảnh ({images.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <a
                  href={image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg"
                >
                  <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-3">
            Tệp đính kèm ({attachments.length})
          </h2>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white font-poppins">
                  {attachment.name || `File ${index + 1}`}
                </span>
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400 ml-auto" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {tagsArray.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800" suppressHydrationWarning>
          <p className="text-sm text-gray-400 font-poppins mb-3">Tags</p>
          <div className="flex items-center flex-wrap gap-2">
            {tagsArray.map((tag: string, index: number) => (
              <span
                key={`tag-section-${index}-${tag}`}
                className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 font-poppins"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showDetailModal && (
        <TaskDetailModal
          task={task}
          spaceId={spaceId}
          canManage={canManage}
          onClose={() => setShowDetailModal(false)}
          onUpdate={() => {
            refreshTask()
            setShowDetailModal(false)
          }}
        />
      )}
    </div>
  )
}

