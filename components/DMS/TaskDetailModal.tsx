'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  User,
  Tag,
  CheckSquare,
  Users,
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Save,
  Trash2,
  Circle,
  Sparkles,
} from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Checklist from './Checklist'
import PlanGenerator from './PlanGenerator'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  order: number
}

interface Task {
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
  checklistItems?: ChecklistItem[] | string | null
}

interface TaskDetailModalProps {
  task: Task
  onClose: () => void
  onUpdate?: (taskId: string, updates: any) => Promise<void>
  onDeadlineChange?: (taskId: string, deadline: Date | null) => Promise<void>
  currentUser: any
  documentId: string
}

export default function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  onDeadlineChange,
  currentUser,
  documentId,
}: TaskDetailModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [deadline, setDeadline] = useState(task.deadline || '')
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showPlanGenerator, setShowPlanGenerator] = useState(false)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
    if (!task.checklistItems) return []
    try {
      const parsed = typeof task.checklistItems === 'string'
        ? JSON.parse(task.checklistItems)
        : task.checklistItems
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Error parsing checklistItems:', e)
      return []
    }
  })

  useEffect(() => {
    // Update checklistItems when task changes
    if (task.checklistItems) {
      try {
        const parsed = typeof task.checklistItems === 'string'
          ? JSON.parse(task.checklistItems)
          : task.checklistItems
        setChecklistItems(Array.isArray(parsed) ? parsed : [])
      } catch (e) {
        console.error('Error parsing checklistItems:', e)
        setChecklistItems([])
      }
    } else {
      setChecklistItems([])
    }
  }, [task.checklistItems])

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setDeadline(task.deadline || '')
    // Reset panel states when task changes
    setShowChecklist(false)
    setShowLabels(false)
    setShowDatePicker(false)
    setShowMembers(false)
  }, [task])

  const handleSaveTitle = async () => {
    if (title.trim() && title !== task.title && onUpdate) {
      setSaving(true)
      try {
        await onUpdate(task.id, { status: task.status, notes: title })
        setIsEditingTitle(false)
      } catch (error) {
        console.error('Error updating title:', error)
        alert('Không thể cập nhật tiêu đề')
      } finally {
        setSaving(false)
      }
    } else {
      setIsEditingTitle(false)
    }
  }

  const handleSaveDescription = async () => {
    if (description !== task.description && onUpdate) {
      setSaving(true)
      try {
        await onUpdate(task.id, { status: task.status, notes: description })
        setIsEditingDescription(false)
      } catch (error) {
        console.error('Error updating description:', error)
        alert('Không thể cập nhật mô tả')
      } finally {
        setSaving(false)
      }
    } else {
      setIsEditingDescription(false)
    }
  }

  const handleDeadlineChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDeadline = e.target.value
    setDeadline(newDeadline)
    if (onDeadlineChange) {
      try {
        await onDeadlineChange(task.id, newDeadline ? new Date(newDeadline) : null)
      } catch (error) {
        console.error('Error updating deadline:', error)
      }
    }
  }

  const handleChecklistUpdate = async (items: ChecklistItem[]) => {
    const previousItems = [...checklistItems]
    setChecklistItems(items)
    
    try {
      const response = await fetch(
        `/api/dms/incoming/${documentId}/assign/${task.id}/checklist`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Không thể cập nhật checklist')
      }
      
      // Refresh task data after successful update to get latest checklistItems
      if (onUpdate) {
        try {
          await onUpdate(task.id, { status: task.status })
        } catch (updateError) {
          console.error('Error refreshing task after checklist update:', updateError)
          // Don't throw here, checklist was saved successfully
        }
      }
    } catch (error: any) {
      console.error('Error updating checklist:', error)
      alert(error.message || 'Không thể cập nhật checklist')
      // Revert on error
      setChecklistItems(previousItems)
    }
  }

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return

    // TODO: Implement comment API
    console.log('Comment:', comment)
    setComment('')
  }

  const handlePlanGenerated = async (items: ChecklistItem[]) => {
    // Merge with existing items
    const mergedItems = [...checklistItems, ...items]
    await handleChecklistUpdate(mergedItems)
    setShowPlanGenerator(false)
  }

  const getStatusColor = () => {
    switch (task.status) {
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'PROCESSING':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'COMPLETED':
        return CheckCircle2
      case 'PROCESSING':
        return Clock
      default:
        return Circle
    }
  }

  const StatusIcon = getStatusIcon()

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveTitle()
                    } else if (e.key === 'Escape') {
                      setTitle(task.title)
                      setIsEditingTitle(false)
                    }
                  }}
                  className="text-xl font-bold text-gray-900 dark:text-white font-poppins flex-1 border-none outline-none bg-transparent"
                  autoFocus
                />
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2
                  className="text-xl font-bold text-gray-900 dark:text-white font-poppins cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {task.title}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-poppins">
              trong <span className="font-semibold">{task.document.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`px-3 py-1.5 rounded text-sm font-poppins font-semibold flex items-center space-x-2 transition-colors ${
                  showLabels
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Tag size={14} />
                <span>Nhãn</span>
              </button>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-3 py-1.5 rounded text-sm font-poppins font-semibold flex items-center space-x-2 transition-colors ${
                  showDatePicker
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Calendar size={14} />
                <span>Ngày</span>
              </button>
              <button
                onClick={() => setShowChecklist(!showChecklist)}
                className={`px-3 py-1.5 rounded text-sm font-poppins font-semibold flex items-center space-x-2 transition-colors ${
                  showChecklist
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <CheckSquare size={14} />
                <span>Checklist</span>
                {checklistItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded text-xs">
                    {checklistItems.filter((i) => i.completed).length}/{checklistItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`px-3 py-1.5 rounded text-sm font-poppins font-semibold flex items-center space-x-2 transition-colors ${
                  showMembers
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Users size={14} />
                <span>Thành viên</span>
              </button>
            </div>

            {/* Labels Panel */}
            {showLabels && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Nhãn</h4>
                  <button
                    onClick={() => setShowLabels(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-poppins">
                      Khẩn cấp
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-poppins">
                      Quan trọng
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-poppins">
                      Theo dõi
                    </span>
                  </div>
                  <button className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-poppins flex items-center space-x-2">
                    <Plus size={14} />
                    <span>Thêm nhãn</span>
                  </button>
                </div>
              </div>
            )}

            {/* Date Picker Panel */}
            {showDatePicker && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Ngày hết hạn</h4>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={deadline ? (() => {
                    try {
                      const date = new Date(deadline)
                      if (isNaN(date.getTime())) return ''
                      return date.toISOString().slice(0, 16)
                    } catch (e) {
                      return ''
                    }
                  })() : ''}
                  onChange={handleDeadlineChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-900 font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Checklist Panel */}
            {showChecklist && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckSquare size={18} className="text-gray-500 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Checklist</h3>
                    {checklistItems.length > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400 font-poppins font-semibold">
                        {checklistItems.filter((i) => i.completed).length}/{checklistItems.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPlanGenerator(true)}
                    className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-poppins font-semibold flex items-center space-x-2 transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Tạo kế hoạch từ văn bản</span>
                  </button>
                </div>
                <Checklist
                  assignmentId={task.id}
                  initialItems={checklistItems}
                  onUpdate={handleChecklistUpdate}
                />
              </div>
            )}

            {/* Members Panel */}
            {showMembers && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Thành viên</h4>
                  <button
                    onClick={() => setShowMembers(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <Avatar
                      src={task.assignedTo.avatar}
                      name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                        {task.assignedTo.email}
                      </p>
                    </div>
                  </div>
                  <button className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-poppins flex items-center justify-center space-x-2">
                    <Plus size={14} />
                    <span>Thêm thành viên</span>
                  </button>
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center space-x-2 ${getStatusColor()} font-poppins`}>
                <StatusIcon size={16} />
                <span>
                  {task.status === 'COMPLETED'
                    ? 'Hoàn thành'
                    : task.status === 'PROCESSING'
                    ? 'Đang làm'
                    : 'Cần làm'}
                </span>
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Mô tả</h3>
              </div>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Thêm mô tả chi tiết hơn..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 font-poppins min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDescription}
                      disabled={saving}
                      className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-poppins font-semibold transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      <Save size={14} />
                      <span>Lưu</span>
                    </button>
                    <button
                      onClick={() => {
                        setDescription(task.description || '')
                        setIsEditingDescription(false)
                      }}
                      className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-poppins font-semibold transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 min-h-[60px] transition-colors"
                >
                  {description ? (
                    <p className="text-gray-900 dark:text-white font-poppins whitespace-pre-wrap">{description}</p>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 font-poppins italic">
                      Thêm mô tả chi tiết hơn...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Deadline - Only show if date picker is not open */}
            {!showDatePicker && deadline && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Ngày hết hạn</h3>
                </div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-white font-poppins">
                    {(() => {
                      try {
                        const deadlineDate = new Date(deadline)
                        if (isNaN(deadlineDate.getTime())) {
                          return 'Ngày không hợp lệ'
                        }
                        return deadlineDate.toLocaleDateString('vi-VN', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      } catch (e) {
                        return 'Ngày không hợp lệ'
                      }
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Assigned Member - Only show if members panel is not open */}
            {!showMembers && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Users size={16} className="text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Thành viên</h3>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar
                    src={task.assignedTo.avatar}
                    name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                    size="md"
                  />
                  <div>
                    <p className="text-gray-900 dark:text-white font-poppins font-semibold">
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">{task.assignedTo.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Reference */}
            {task.document.title && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 font-poppins">Văn bản liên quan</h3>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-900 dark:text-white font-poppins font-semibold">{task.document.title}</p>
                  {task.document.documentNumber && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mt-1">
                      Số: {task.document.documentNumber}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Activity */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-800 px-4 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Hoạt động</h3>
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-poppins">
                Hiển thị chi tiết
              </button>
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
              {/* Comment Input */}
              <div className="mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 font-poppins text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleCommentSubmit}
                  disabled={!comment.trim()}
                  className="mt-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-poppins font-semibold transition-colors"
                >
                  Lưu
                </button>
              </div>

              {/* Activity Items */}
              <div className="space-y-3">
                {/* Created Activity */}
                <div className="flex items-start space-x-3">
                  <Avatar
                    src={currentUser?.user?.image}
                    name={currentUser?.user?.name || 'User'}
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white font-poppins">
                      <span className="font-semibold">
                        {currentUser?.user?.name || 'Người dùng'}
                      </span>{' '}
                      đã tạo nhiệm vụ này
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
                      {task.createdAt ? (() => {
                        try {
                          const date = new Date(task.createdAt)
                          if (isNaN(date.getTime())) return 'Không xác định'
                          return formatDistanceToNow(date, {
                            addSuffix: true,
                            locale: vi,
                          })
                        } catch (e) {
                          return 'Không xác định'
                        }
                      })() : 'Không xác định'}
                    </p>
                  </div>
                </div>

                {/* Completed Activity */}
                {task.completedAt && (
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={task.assignedTo.avatar}
                      name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white font-poppins">
                        <span className="font-semibold">
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </span>{' '}
                        đã hoàn thành nhiệm vụ này
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
                        {task.completedAt ? (() => {
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
                        })() : 'Không xác định'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Generator Modal */}
      {showPlanGenerator && (
        <PlanGenerator
          documentId={documentId}
          documentContent={task.description || task.notes || ''}
          documentTitle={task.document.title}
          onPlanGenerated={handlePlanGenerated}
          onClose={() => setShowPlanGenerator(false)}
        />
      )}
    </div>
  )
}

