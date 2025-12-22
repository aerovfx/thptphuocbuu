'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Avatar from '../Common/Avatar'
import { Plus, CheckCircle2, Circle, Clock, Edit2, Trash2, X, Check, List, Eye, MessageSquare, Image as ImageIcon, Paperclip } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface ProgressLog {
  id: string
  progress: number
  milestone: string | null
  description: string | null
  checklist: string | null
  order: number
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface TrelloScrumBoardProps {
  spaceId: string
  currentProgress: number
  canManage: boolean
}

type ProgressStatus = 'todo' | 'in-progress' | 'done'

interface ProgressCard {
  id: string
  progress: number
  milestone: string | null
  description: string | null
  checklist: ChecklistItem[]
  order: number
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  status: ProgressStatus
}

function SortableCard({
  card,
  onEdit,
  onDelete,
  canManage,
}: {
  card: ProgressCard
  onEdit: (card: ProgressCard) => void
  onDelete: (cardId: string) => void
  canManage: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      default:
        return <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
    }
  }

  const getStatusColor = (status: ProgressStatus) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'in-progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const completedChecklistItems = card.checklist.filter((item) => item.completed).length
  const totalChecklistItems = card.checklist.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-2 p-3 cursor-pointer hover:shadow-md transition-all duration-200 relative group"
      {...attributes}
      {...listeners}
    >
      {/* Card Image Placeholder (if needed) */}
      {false && (
        <div className="mb-2 rounded bg-gray-100 dark:bg-gray-700 h-32 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Card Title/Milestone */}
      {card.milestone && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins mb-2 line-clamp-2">
          {card.milestone}
        </h3>
      )}

      {/* Card Description */}
      {card.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins mb-2 line-clamp-3">
          {card.description}
        </p>
      )}

      {/* Progress Badge */}
      <div className="flex items-center space-x-2 mb-2">
        <div className={`px-2 py-0.5 rounded text-xs font-semibold font-poppins ${
          card.progress === 100 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : card.progress > 0
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
        }`}>
          {card.progress}%
        </div>
        {getStatusIcon(card.status)}
      </div>

      {/* Checklist Progress */}
      {card.checklist.length > 0 && (
        <div className="mb-2 flex items-center space-x-1">
          <List className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-poppins">
            {completedChecklistItems}/{totalChecklistItems}
          </span>
        </div>
      )}

      {/* Card Footer with Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {/* Comments Count */}
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs font-poppins">0</span>
          </div>
          {/* Views Count */}
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs font-poppins">0</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {canManage && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(card)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Chỉnh sửa"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(card.id)
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              </button>
            </>
          )}
          <Avatar
            src={card.createdBy.avatar}
            name={`${card.createdBy.firstName} ${card.createdBy.lastName}`}
            size="xs"
          />
        </div>
      </div>
    </div>
  )
}

export default function TrelloScrumBoard({
  spaceId,
  currentProgress,
  canManage,
}: TrelloScrumBoardProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState<string | null>(null) // 'todo' | 'in-progress' | 'done' | null
  const [editingCard, setEditingCard] = useState<ProgressCard | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newMilestone, setNewMilestone] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newChecklist, setNewChecklist] = useState<ChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchProgressLogs()
  }, [spaceId])

  const fetchProgressLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/spaces/${spaceId}/progress`)
      if (response.ok) {
        const data = await response.json()
        setProgressLogs(data.logs || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching progress logs:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching progress logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseChecklist = (checklistString: string | null): ChecklistItem[] => {
    if (!checklistString) return []
    try {
      const parsed = JSON.parse(checklistString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const categorizeLogs = (logs: ProgressLog[]): ProgressCard[] => {
    return logs.map((log) => {
      let status: ProgressStatus = 'todo'
      if (log.progress === 100) {
        status = 'done'
      } else if (log.progress > 0) {
        status = 'in-progress'
      }
      return {
        ...log,
        status,
        checklist: parseChecklist(log.checklist),
        createdBy: log.createdBy || {
          id: 'unknown',
          firstName: 'Unknown',
          lastName: 'User',
          avatar: null,
        },
      }
    })
  }

  const cards = categorizeLogs(progressLogs)
  const [todoCards, setTodoCards] = useState(cards.filter((c) => c.status === 'todo'))
  const [inProgressCards, setInProgressCards] = useState(cards.filter((c) => c.status === 'in-progress'))
  const [doneCards, setDoneCards] = useState(cards.filter((c) => c.status === 'done'))

  useEffect(() => {
    const categorized = categorizeLogs(progressLogs)
    setTodoCards(categorized.filter((c) => c.status === 'todo'))
    setInProgressCards(categorized.filter((c) => c.status === 'in-progress'))
    setDoneCards(categorized.filter((c) => c.status === 'done'))
  }, [progressLogs])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the card being dragged
    const activeCard = cards.find((c) => c.id === activeId)
    if (!activeCard) return

    // Determine target status based on droppable area
    let targetStatus: ProgressStatus = activeCard.status
    if (overId === 'todo-column') targetStatus = 'todo'
    else if (overId === 'in-progress-column') targetStatus = 'in-progress'
    else if (overId === 'done-column') targetStatus = 'done'
    else {
      // Dropped on another card
      const overCard = cards.find((c) => c.id === overId)
      if (overCard) {
        targetStatus = overCard.status
      }
    }

    // Calculate new progress based on status
    let newProgress = activeCard.progress
    if (targetStatus === 'todo') newProgress = 0
    else if (targetStatus === 'done') newProgress = 100
    else if (targetStatus === 'in-progress' && activeCard.progress === 0) newProgress = 50

    // Update card status and progress
    try {
      const response = await fetch(`/api/spaces/${spaceId}/progress/${activeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress,
        }),
      })

      if (response.ok) {
        await fetchProgressLogs()
        window.location.reload() // Refresh to update current progress
      }
    } catch (error) {
      console.error('Error updating card:', error)
    }
  }

  const handleAddTask = async (status: ProgressStatus) => {
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề công việc')
      return
    }

    // Determine progress based on status
    let progress = 0
    if (status === 'done') progress = 100
    else if (status === 'in-progress') progress = 50

    try {
      setSubmitting(true)
      const checklistJson = newChecklist.length > 0 ? JSON.stringify(newChecklist) : null

      const response = await fetch(`/api/spaces/${spaceId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress,
          milestone: newTitle.trim(),
          description: newDescription.trim() || null,
          checklist: checklistJson,
        }),
      })

      if (response.ok) {
        await fetchProgressLogs()
        setShowAddForm(null)
        setNewTitle('')
        setNewMilestone('')
        setNewDescription('')
        setNewChecklist([])
        setNewChecklistItem('')
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi thêm công việc')
      }
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Đã xảy ra lỗi khi thêm công việc')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCard) return

    try {
      setSubmitting(true)
      const checklistJson = newChecklist.length > 0 ? JSON.stringify(newChecklist) : null

      const response = await fetch(`/api/spaces/${spaceId}/progress/${editingCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: editingCard.progress,
          milestone: newMilestone.trim() || null,
          description: newDescription.trim() || null,
          checklist: checklistJson,
        }),
      })

      if (response.ok) {
        await fetchProgressLogs()
        setEditingCard(null)
        setNewMilestone('')
        setNewDescription('')
        setNewChecklist([])
        setNewChecklistItem('')
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật công việc')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Đã xảy ra lỗi khi cập nhật công việc')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (card: ProgressCard) => {
    setEditingCard(card)
    setNewMilestone(card.milestone || '')
    setNewDescription(card.description || '')
    setNewChecklist(card.checklist)
  }

  const handleDelete = async (cardId: string) => {
    if (!confirm('Bạn có chắc muốn xóa progress log này?')) return

    try {
      const response = await fetch(`/api/spaces/${spaceId}/progress/${cardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProgressLogs()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi xóa')
      }
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('Đã xảy ra lỗi khi xóa')
    }
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false,
    }
    setNewChecklist([...newChecklist, newItem])
    setNewChecklistItem('')
  }

  const toggleChecklistItem = (itemId: string) => {
    setNewChecklist(
      newChecklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const removeChecklistItem = (itemId: string) => {
    setNewChecklist(newChecklist.filter((item) => item.id !== itemId))
  }

  const Column = ({
    id,
    title,
    icon,
    cards,
    color,
    status,
  }: {
    id: string
    title: string
    icon: React.ReactNode
    cards: ProgressCard[]
    color: string
    status: ProgressStatus
  }) => {
    const isAdding = showAddForm === status

    return (
      <div
        id={id}
        className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 min-h-[400px] w-[280px] flex-shrink-0"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {icon}
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 font-poppins uppercase tracking-wide">
              {title}
            </h4>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold font-poppins bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {cards.length}
          </span>
        </div>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canManage={canManage}
              />
            ))}
            {isAdding && canManage && (
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddTask(status)
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Tiêu đề công việc..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
                    required
                    autoFocus
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Mô tả (tùy chọn)..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={submitting || !newTitle.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins disabled:opacity-50"
                    >
                      {submitting ? 'Đang thêm...' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(null)
                        setNewTitle('')
                        setNewDescription('')
                        setNewChecklist([])
                        setNewChecklistItem('')
                      }}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-poppins"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}
            {!isAdding && canManage && (
              <button
                onClick={() => {
                  setShowAddForm(status)
                  setNewTitle('')
                  setNewDescription('')
                  setNewChecklist([])
                  setNewChecklistItem('')
                }}
                className="w-full p-3 text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors font-poppins text-sm"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Thêm công việc
              </button>
            )}
            {cards.length === 0 && !isAdding && (
              <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-4">
                Không có mục nào
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
          Theo dõi tiến độ
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
          Theo dõi tiến độ hoạt động của space
        </p>
      </div>

      {/* Current Progress */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">
              Tiến độ hiện tại
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
              {currentProgress}%
            </p>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingCard && canManage && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
              Chỉnh sửa công việc
            </h3>
            <button
              onClick={() => {
                setEditingCard(null)
                setNewMilestone('')
                setNewDescription('')
                setNewChecklist([])
                setNewChecklistItem('')
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Tiêu đề công việc *
              </label>
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Nhập tiêu đề công việc..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả chi tiết về công việc..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Checklist
              </label>
              <div className="space-y-2 mb-2">
                {newChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(item.id)}
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
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addChecklistItem()
                    }
                  }}
                  placeholder="Thêm checklist item..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Cập nhật'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCard(null)
                  setNewMilestone('')
                  setNewDescription('')
                  setNewChecklist([])
                  setNewChecklistItem('')
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-poppins"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scrum Board - Trello Style */}
      <div className="flex space-x-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-4">
          Lịch sử cập nhật
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : progressLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-poppins">
            Chưa có lịch sử cập nhật
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Column
                id="todo-column"
                title="Chưa bắt đầu"
                icon={<Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />}
                cards={todoCards}
                color="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                status="todo"
              />
              <Column
                id="in-progress-column"
                title="Đang thực hiện"
                icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                cards={inProgressCards}
                color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                status="in-progress"
              />
              <Column
                id="done-column"
                title="Hoàn thành"
                icon={<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
                cards={doneCards}
                color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                status="done"
              />
            </div>
            <DragOverlay>
              {activeId ? (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg opacity-90">
                  <span className="text-sm font-poppins">Đang kéo...</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}

