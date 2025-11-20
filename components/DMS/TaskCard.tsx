'use client'

import { useState } from 'react'
import { Calendar, User, Paperclip, CheckCircle2, Clock, AlertCircle, MoreVertical } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description?: string | null
    assignedTo: {
      id: string
      firstName: string
      lastName: string
      avatar?: string | null
      email: string
    }
    document: {
      id: string
      title: string
      documentNumber?: string | null
    }
    deadline?: string | null
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED'
    notes?: string | null
    createdAt: string
    completedAt?: string | null
  }
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  isDragging?: boolean
}

export default function TaskCard({ task, onClick, onDragStart, isDragging }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null
    try {
      const now = new Date()
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) return null
      const diffTime = deadlineDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (e) {
      return null
    }
  }

  const daysUntilDeadline = getDaysUntilDeadline(task.deadline || null)
  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0 && task.status !== 'COMPLETED'
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0

  const getStatusColor = () => {
    if (task.status === 'COMPLETED') return 'border-l-green-500'
    if (task.status === 'PROCESSING') return 'border-l-blue-500'
    return 'border-l-yellow-500'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-all mb-2 group ${
        getStatusColor()
      } ${isDragging ? 'opacity-50 rotate-2' : ''}`}
    >
      {/* Card Header */}
      <div className="p-3">
        {/* Title */}
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 font-poppins">
          {task.title}
        </h4>

        {/* Document Reference */}
        {task.document.title && (
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 font-poppins truncate flex items-center space-x-1">
            <Paperclip size={12} />
            <span>{task.document.title}</span>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 font-poppins">
            {task.description}
          </p>
        )}

        {/* Tags/Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {isOverdue && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs font-poppins font-semibold flex items-center space-x-1">
              <AlertCircle size={10} />
              <span>Quá hạn</span>
            </span>
          )}
          {isUrgent && !isOverdue && (
            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-xs font-poppins">
              Khẩn cấp
            </span>
          )}
          {task.status === 'COMPLETED' && (
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs font-poppins flex items-center space-x-1">
              <CheckCircle2 size={10} />
              <span>Hoàn thành</span>
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Deadline */}
          {task.deadline && (
            <div
              className={`flex items-center space-x-1 text-xs font-poppins ${
                isOverdue
                  ? 'text-red-600 dark:text-red-400'
                  : isUrgent
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Calendar size={12} />
              <span>
                {(() => {
                  try {
                    const date = new Date(task.deadline)
                    if (isNaN(date.getTime())) return 'N/A'
                    return date.toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                    })
                  } catch (e) {
                    return 'N/A'
                  }
                })()}
              </span>
              {daysUntilDeadline !== null && !isOverdue && (
                <span className="ml-1">
                  ({daysUntilDeadline > 0 ? `${daysUntilDeadline}d` : 'Hôm nay'})
                </span>
              )}
            </div>
          )}

          {/* Assigned User */}
          <div className="flex items-center space-x-1">
            <Avatar
              src={task.assignedTo.avatar}
              name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
              size="xs"
            />
          </div>
        </div>

        {/* Completed Time */}
        {task.completedAt && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 font-poppins">
              <CheckCircle2 size={12} />
              <span>
                Hoàn thành{' '}
                {(() => {
                  try {
                    const date = new Date(task.completedAt)
                    if (isNaN(date.getTime())) return 'Không xác định'
                    return formatDistanceToNow(date, {
                      addSuffix: true,
                      locale: vi,
                    })
                  } catch (e) {
                    return 'Không xác định'
                  }
                })()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

