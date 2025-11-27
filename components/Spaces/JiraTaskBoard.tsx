'use client'

import { useState, useEffect } from 'react'
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 ${getBorderColor()} p-3 mb-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer group`}
      onClick={() => onSelect(task)}
      {...attributes}
      {...listeners}
    >
      {/* Priority indicator */}
      {task.priority && (
        <div className="flex items-center justify-between mb-2">
          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
          {canManage && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              >
                <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="mb-2 rounded overflow-hidden">
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

      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white font-poppins text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Checklist Progress */}
      {totalChecklist > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <CheckSquare className="w-3 h-3" />
              <span className="font-poppins">{completedChecklist}/{totalChecklist}</span>
            </div>
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
              />
            </div>
          </div>
          {/* Show first 2 checklist items */}
          {checklist.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
              <input
                type="checkbox"
                checked={item.completed}
                disabled
                className="w-3 h-3 rounded border-gray-300 dark:border-gray-600"
              />
              <span
                className={`font-poppins ${
                  item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                }`}
              >
                {item.text}
              </span>
            </div>
          ))}
          {checklist.length > 2 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
              +{checklist.length - 2} mục khác
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-poppins"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Calendar className="w-3 h-3" />
          <span className="font-poppins">
            {new Date(task.dueDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            {(() => {
              const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return daysUntilDue >= 0 ? ` (${daysUntilDue}d)` : ` (quá hạn)`
            })()}
          </span>
        </div>
      )}

      {/* Footer with icons */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
          {totalChecklist > 0 && (
            <div className="flex items-center space-x-1">
              <CheckSquare className="w-3 h-3" />
              <span className="font-poppins">{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
          {task.commentsCount > 0 && (
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-3 h-3" />
              <span className="font-poppins">{task.commentsCount}</span>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip className="w-3 h-3" />
              <span className="font-poppins">{attachments.length}</span>
            </div>
          )}
          {images.length > 0 && (
            <div className="flex items-center space-x-1">
              <Image className="w-3 h-3" />
              <span className="font-poppins">{images.length}</span>
            </div>
          )}
        </div>
        {task.assignedTo && (
          <Avatar
            src={task.assignedTo.avatar}
            name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
            size="xs"
          />
        )}
      </div>
    </div>
  )
}

export default function JiraTaskBoard({ spaceId, canManage }: JiraTaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [groupedTasks, setGroupedTasks] = useState<{ [key: string]: Task[] }>({})
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchTasks()
  }, [spaceId, searchQuery, filterPriority, filterAssignee])

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

    // Determine target column
    let targetColumn = activeTask.column
    if (overId.startsWith('column-')) {
      targetColumn = overId.replace('column-', '')
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) {
        targetColumn = overTask.column
      }
    }

    if (targetColumn === activeTask.column) return

    // Update task column
    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${activeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          column: targetColumn,
        }),
      })

      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
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

    const getColumnIcon = () => {
      switch (column.icon) {
        case 'circle':
          return <Circle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
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
        id={`column-${column.id}`}
        className={`${column.color} rounded-lg p-4 border border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getColumnIcon()}
            <h3 className="font-semibold text-gray-900 dark:text-white font-poppins">
              {column.name}
            </h3>
          </div>
          <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-poppins text-gray-600 dark:text-gray-400">
            {columnTasks.length}
          </span>
        </div>

        <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex-1 space-y-2">
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
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddTask(column.id)
                  }}
                  className="space-y-2"
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
                  setShowAddForm(column.id)
                  setNewTitle('')
                  setNewDescription('')
                }}
                className="w-full p-3 text-left text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors font-poppins text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thẻ</span>
              </button>
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto">
          {columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg opacity-90">
              <span className="text-sm font-poppins">Đang kéo...</span>
            </div>
          ) : null}
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

