'use client'

import { useState, useEffect, useRef } from 'react'
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
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Image, CheckSquare, MessageSquare, Paperclip, Edit2, Trash2, X, Eye, Search, Filter, Circle, RefreshCw, CheckCircle2, Calendar } from 'lucide-react'
import Avatar from '../Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import TaskDetailModal from './TaskDetailModal'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Attachment {
  name: string
  url: string
  type?: string
}

interface Task {
  id: string
  title: string
  description: string | null
  column: string
  order: number
  priority: string | null
  dueDate: string | null
  images: string | null // JSON array
  attachments: string | null // JSON array
  checklist: string | null // JSON array
  tags: string | null // JSON array
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
  createdAt: string
}

interface JiraTaskBoardProps {
  spaceId: string
  canManage: boolean
  spaceName?: string
}

const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'CẦN LÀM', icon: 'circle', color: 'bg-gray-50 dark:bg-gray-800' },
  { id: 'in-progress', name: 'ĐANG LÀM', icon: 'refresh', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'done', name: 'HOÀN THÀNH', icon: 'check', color: 'bg-green-50 dark:bg-green-900/20' },
]

function TaskCard({
  task,
  onEdit,
  onDelete,
  onSelect,
  canManage,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onSelect: (task: Task) => void
  canManage: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const parseJSON = (jsonString: string | null): any[] => {
    if (!jsonString) return []
    try {
      const parsed = JSON.parse(jsonString)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const images = parseJSON(task.images) as string[]
  const checklist = parseJSON(task.checklist) as ChecklistItem[]
  const attachments = parseJSON(task.attachments) as Attachment[]
  const tags = parseJSON(task.tags) as string[]

  const completedChecklist = checklist.filter((item) => item.completed).length
  const totalChecklist = checklist.length

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500'
      case 'HIGH':
        return 'bg-orange-500'
      case 'LOW':
        return 'bg-gray-400'
      default:
        return 'bg-blue-500'
    }
  }

  // Get border color based on column/priority
  const getBorderColor = () => {
    if (task.column === 'todo') return 'border-l-yellow-500 dark:border-l-yellow-400'
    if (task.column === 'in-progress') return 'border-l-blue-500 dark:border-l-blue-400'
    if (task.column === 'done') return 'border-l-green-500 dark:border-l-green-400'
    return 'border-l-gray-300 dark:border-l-gray-600'
  }

  // Calculate days until due date
  const getDaysUntilDue = (dueDate: string | null): number | null => {
    if (!dueDate) return null
    try {
      const due = new Date(dueDate)
      const now = new Date()
      const diffTime = due.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch {
      return null
    }
  }

  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return ''
    try {
      const date = new Date(dueDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${day}-${month}`
    } catch {
      return ''
    }
  }

  const daysUntilDue = getDaysUntilDue(task.dueDate)
  const dueDateFormatted = formatDueDate(task.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 relative group ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
      onClick={() => onSelect(task)}
      {...attributes}
      {...listeners}
    >
      {/* Card Image */}
      {images.length > 0 && (
        <div className="mb-2 rounded overflow-hidden -mx-3 -mt-3">
          <img
            src={images[0]}
            alt={task.title}
            className="w-full h-32 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Priority indicator (top right) */}
      {task.priority && (
        <div className="absolute top-4 right-4">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
        </div>
      )}

      {/* Edit/Delete buttons (on hover) */}
      {canManage && (
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
          </button>
        </div>
      )}

      {/* Title */}
      <h4 className="font-semibold text-white dark:text-white font-poppins text-base mb-3 line-clamp-2">
        {task.title}
      </h4>

      {/* Checklist Progress - Trello style */}
      {totalChecklist > 0 && (
        <div className="mb-3 flex items-center space-x-2">
          <CheckSquare className="w-4 h-4 text-gray-300 dark:text-gray-400" />
          <span className="text-sm text-white dark:text-gray-300 font-poppins font-medium">
            {completedChecklist}/{totalChecklist}
          </span>
        </div>
      )}

      {/* Due Date - Trello style */}
      {task.dueDate && (
        <div className="mb-3">
          <span className={`text-sm font-poppins px-3 py-1 rounded ${
            daysUntilDue !== null && daysUntilDue < 0
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              : daysUntilDue !== null && daysUntilDue <= 3
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
          }`}>
            {dueDateFormatted}
            {daysUntilDue !== null && daysUntilDue >= 0 && ` (${daysUntilDue}d)`}
            {daysUntilDue !== null && daysUntilDue < 0 && ' (quá hạn)'}
          </span>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-poppins"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer with icons - Trello style */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          {task.commentsCount > 0 && (
            <div className="flex items-center space-x-1.5 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-300">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-poppins text-white dark:text-gray-300">{task.commentsCount}</span>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="flex items-center space-x-1.5 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-300">
              <Paperclip className="w-4 h-4" />
              <span className="text-sm font-poppins text-white dark:text-gray-300">{attachments.length}</span>
            </div>
          )}
          {images.length > 0 && (
            <div className="flex items-center space-x-1.5 text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-300">
              <Image className="w-4 h-4" />
              <span className="text-sm font-poppins text-white dark:text-gray-300">{images.length}</span>
            </div>
          )}
        </div>
        {task.assignedTo && (
          <Avatar
            src={task.assignedTo.avatar}
            name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
            size="sm"
          />
        )}
      </div>
    </div>
  )
}

export default function JiraTaskBoard({ spaceId, canManage, spaceName }: JiraTaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [groupedTasks, setGroupedTasks] = useState<{ [key: string]: Task[] }>({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isComposing, setIsComposing] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [space, setSpace] = useState<{ name: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchTasks()
    if (!spaceName) {
      fetchSpace()
    }
  }, [spaceId, searchQuery, filterPriority, filterAssignee])

  const fetchSpace = async () => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setSpace({ name: data.name })
      }
    } catch (error) {
      console.error('Error fetching space:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
        setGroupedTasks(data.groupedTasks || {})
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Determine target column and order
    let targetColumn = activeTask.column
    let targetOrder = activeTask.order

    if (overId.startsWith('column-')) {
      // Dropped directly on column (empty area)
      targetColumn = overId.replace('column-', '')
      // Get max order in target column and add 1
      const targetColumnTasks = tasks.filter((t) => t.column === targetColumn && t.id !== activeId)
      targetOrder = targetColumnTasks.length > 0 
        ? Math.max(...targetColumnTasks.map((t) => t.order)) + 1 
        : 0
    } else {
      // Dropped on another task
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        targetColumn = overTask.column
        // Place after the task we dropped on
        targetOrder = overTask.order + 1
      }
    }

    // If column didn't change and order is the same, no update needed
    if (targetColumn === activeTask.column && targetOrder === activeTask.order) {
      return
    }

    // Optimistically update UI
    const updatedTasks = tasks.map((t) => {
      if (t.id === activeId) {
        return { ...t, column: targetColumn, order: targetOrder }
      }
      // If moving within same column, adjust orders
      if (targetColumn === activeTask.column && t.column === targetColumn && t.id !== activeId) {
        if (activeTask.order < targetOrder && t.order > activeTask.order && t.order <= targetOrder) {
          return { ...t, order: t.order - 1 }
        } else if (activeTask.order > targetOrder && t.order >= targetOrder && t.order < activeTask.order) {
          return { ...t, order: t.order + 1 }
        }
      }
      return t
    })
    setTasks(updatedTasks)

    // Update task in database
    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${activeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: targetColumn,
          order: targetOrder,
        }),
      })

      if (response.ok) {
        // Refresh to get correct order from server
        await fetchTasks()
      } else {
        // Revert on error
        await fetchTasks()
        const errorData = await response.json()
        console.error('Error updating task:', errorData)
      }
    } catch (error) {
      // Revert on error
      await fetchTasks()
      console.error('Error updating task:', error)
    }
  }

  const handleAddTask = async (columnId: string) => {
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề công việc')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          column: columnId,
        }),
      })

      if (response.ok) {
        await fetchTasks()
        setShowAddForm(null)
        setNewTitle('')
        setNewDescription('')
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi tạo công việc')
      }
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Đã xảy ra lỗi khi tạo công việc')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setNewTitle(task.title)
    setNewDescription(task.description || '')
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !newTitle.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      })

      if (response.ok) {
        await fetchTasks()
        setEditingTask(null)
        setNewTitle('')
        setNewDescription('')
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

  const handleDelete = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return

    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi xóa')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Đã xảy ra lỗi khi xóa')
    }
  }

  const Column = ({ column }: { column: typeof DEFAULT_COLUMNS[0] }) => {
    const columnTasks = groupedTasks[column.id] || []
    const isAdding = showAddForm === column.id

    // Make column droppable
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
      id: `column-${column.id}`,
    })

    const getColumnIcon = () => {
      switch (column.icon) {
        case 'circle':
          return <Circle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        case 'refresh':
          return <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400" />
        case 'check':
          return <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400" />
        default:
          return null
      }
    }

    return (
      <div
        ref={setDroppableRef}
        id={`column-${column.id}`}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 min-h-[500px] w-[320px] flex-shrink-0 flex flex-col transition-colors border border-gray-200 dark:border-gray-700 ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {getColumnIcon()}
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white font-poppins uppercase tracking-wide">
              {column.name}
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold font-poppins bg-gray-900 dark:bg-gray-700 text-white dark:text-gray-300 min-w-[24px] text-center">
            {columnTasks.length}
          </span>
        </div>

        <SortableContext 
          items={columnTasks.map((t) => t.id)} 
          strategy={verticalListSortingStrategy}
          disabled={isAdding}
        >
          <div className="flex-1 space-y-3 min-h-[200px]">
            {columnTasks.length === 0 && !isAdding ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                {canManage && (
                  <button
                    onClick={() => {
                      setShowAddForm(column.id)
                      setNewTitle('')
                      setNewDescription('')
                    }}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors font-poppins text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    <span>Thêm thẻ</span>
                  </button>
                )}
              </div>
            ) : (
              <>
            {columnTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSelect={setSelectedTask}
                canManage={canManage}
              />
            ))}
            {isAdding && canManage && (
                  <div 
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                        e.stopPropagation()
                    handleAddTask(column.id)
                  }}
                  className="space-y-2"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      onClick={(e) => e.stopPropagation()}
                >
                  <input
                        ref={titleInputRef}
                    type="text"
                    value={newTitle}
                        onChange={(e) => {
                          setNewTitle(e.target.value)
                        }}
                        onCompositionStart={() => {
                          setIsComposing(true)
                        }}
                        onCompositionUpdate={(e) => {
                          setNewTitle(e.currentTarget.value)
                        }}
                        onCompositionEnd={(e) => {
                          setNewTitle(e.currentTarget.value)
                          requestAnimationFrame(() => {
                            setIsComposing(false)
                          })
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                    placeholder="Tiêu đề công việc..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                  <textarea
                        ref={descriptionInputRef}
                    value={newDescription}
                        onChange={(e) => {
                          setNewDescription(e.target.value)
                        }}
                        onCompositionStart={() => {
                          setIsComposing(true)
                        }}
                        onCompositionUpdate={(e) => {
                          setNewDescription(e.currentTarget.value)
                        }}
                        onCompositionEnd={(e) => {
                          setNewDescription(e.currentTarget.value)
                          requestAnimationFrame(() => {
                            setIsComposing(false)
                          })
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                    placeholder="Mô tả (tùy chọn)..."
                    rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={submitting || !newTitle.trim()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-poppins disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Đang thêm...' : 'Thêm'}
                    </button>
                    <button
                      type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                        setShowAddForm(null)
                        setNewTitle('')
                        setNewDescription('')
                      }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm font-poppins transition-colors"
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
                  setShowAddForm(column.id)
                  setNewTitle('')
                  setNewDescription('')
                }}
                    className="w-full mt-2 p-2 text-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors font-poppins text-sm flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Thêm thẻ</span>
              </button>
                )}
              </>
            )}
          </div>
        </SortableContext>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  const displaySpaceName = spaceName || space?.name

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="mb-6">
        {displaySpaceName && (
          <div className="mb-2">
            <span className="text-base font-bold text-gray-900 dark:text-white font-poppins">
              {displaySpaceName}
            </span>
          </div>
        )}
        <div className="flex items-center space-x-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
            Quản lý nhiệm vụ
          </h2>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded-full text-sm font-poppins font-semibold">
              {tasks.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
              nhiệm vụ
            </span>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                Chỉnh sửa công việc
              </h3>
              <button
                onClick={() => {
                  setEditingTask(null)
                  setNewTitle('')
                  setNewDescription('')
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                  Mô tả
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null)
                    setNewTitle('')
                    setNewDescription('')
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-poppins"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (() => {
            const draggedTask = tasks.find((t) => t.id === activeId)
            if (!draggedTask) return null
            return (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-500 dark:border-blue-400 p-3 w-[260px] rotate-2">
                <h4 className="font-semibold text-gray-900 dark:text-white font-poppins text-sm mb-2 line-clamp-2">
                  {draggedTask.title}
                </h4>
                {draggedTask.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins line-clamp-2">
                    {draggedTask.description}
                  </p>
                )}
              </div>
            )
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          spaceId={spaceId}
          canManage={canManage}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchTasks()
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

