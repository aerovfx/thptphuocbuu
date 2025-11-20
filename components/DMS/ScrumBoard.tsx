'use client'

import { useState, useEffect } from 'react'
import { Plus, Calendar, User, Clock, AlertCircle, CheckCircle2, Circle, Loader2, LayoutGrid, CalendarDays, X } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import TaskCalendar from './TaskCalendar'
import TaskCard from './TaskCard'
import TaskDetailModal from './TaskDetailModal'

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
  checklistItems?: ChecklistItem[] | null
}

interface ScrumBoardProps {
  documentId: string
  currentUser: any
  onTaskUpdate?: () => void
  onAssignClick?: () => void
}

const columns = [
  { id: 'PENDING', title: 'Cần làm', color: 'bg-yellow-500/10 border-yellow-500/30' },
  { id: 'PROCESSING', title: 'Đang làm', color: 'bg-blue-500/10 border-blue-500/30' },
  { id: 'COMPLETED', title: 'Hoàn thành', color: 'bg-green-500/10 border-green-500/30' },
]

export default function ScrumBoard({ documentId, currentUser, onTaskUpdate, onAssignClick }: ScrumBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [targetColumn, setTargetColumn] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showAddCard, setShowAddCard] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [documentId])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/assign`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Handle both array and object response
      const assignments = Array.isArray(data) ? data : []
      setTasks(assignments.map((assignment: any) => {
        // Parse checklistItems if it exists
        let checklistItems: ChecklistItem[] | null = null
        if (assignment.checklistItems) {
          try {
            checklistItems = typeof assignment.checklistItems === 'string'
              ? JSON.parse(assignment.checklistItems)
              : assignment.checklistItems
            // Ensure it's an array
            if (!Array.isArray(checklistItems)) {
              checklistItems = null
            }
          } catch (e) {
            console.error('Error parsing checklistItems:', e)
            checklistItems = null
          }
        }

        return {
          id: assignment.id,
          title: assignment.notes || `Nhiệm vụ từ ${assignment.document?.title || 'văn bản'}`,
          description: assignment.notes,
          assignedTo: assignment.assignedTo,
          document: {
            id: assignment.document?.id || documentId,
            title: assignment.document?.title || '',
            documentNumber: assignment.document?.documentNumber,
          },
          deadline: assignment.deadline,
          status: assignment.status,
          notes: assignment.notes,
          createdAt: assignment.createdAt,
          completedAt: assignment.completedAt,
          checklistItems: checklistItems || undefined,
        }
      }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // Set empty array on error to prevent crashes
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setTargetColumn(columnId)
  }

  const handleDragLeave = () => {
    setTargetColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setTargetColumn(null)

    if (!draggedTask) return

    const task = tasks.find((t) => t.id === draggedTask)
    if (!task || task.status === targetStatus) {
      setDraggedTask(null)
      return
    }

    // Optimistic update
    const updatedTasks = tasks.map((t) =>
      t.id === draggedTask
        ? {
            ...t,
            status: targetStatus as 'PENDING' | 'PROCESSING' | 'COMPLETED',
            completedAt: targetStatus === 'COMPLETED' ? new Date().toISOString() : t.completedAt,
          }
        : t
    )
    setTasks(updatedTasks)

    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/assign/${draggedTask}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: targetStatus }),
      })

      if (!response.ok) {
        // Revert on error
        await fetchTasks()
        throw new Error('Không thể cập nhật trạng thái')
      }

      await fetchTasks()
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error updating task status:', error)
      await fetchTasks()
    } finally {
      setDraggedTask(null)
    }
  }

  const handleDeadlineChange = async (taskId: string, newDeadline: Date | null) => {
    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/assign/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deadline: newDeadline ? newDeadline.toISOString() : null }),
      })

      if (!response.ok) {
        throw new Error('Không thể cập nhật deadline')
      }

      await fetchTasks()
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error updating deadline:', error)
      alert('Không thể cập nhật deadline')
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/assign/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Không thể cập nhật nhiệm vụ')
      }

      // Re-fetch the task to get latest data including checklistItems
      const taskResponse = await fetch(`/api/dms/incoming/${documentId}/assign/${taskId}`)
      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        // Parse checklistItems
        let checklistItems: ChecklistItem[] | null = null
        if (taskData.checklistItems) {
          try {
            checklistItems = typeof taskData.checklistItems === 'string'
              ? JSON.parse(taskData.checklistItems)
              : taskData.checklistItems
            if (!Array.isArray(checklistItems)) {
              checklistItems = null
            }
          } catch (e) {
            checklistItems = null
          }
        }
        
        const updatedTask: Task = {
          id: taskData.id,
          title: taskData.notes || `Nhiệm vụ từ ${taskData.document?.title || 'văn bản'}`,
          description: taskData.notes,
          assignedTo: taskData.assignedTo,
          document: {
            id: taskData.document?.id || documentId,
            title: taskData.document?.title || '',
            documentNumber: taskData.document?.documentNumber,
          },
          deadline: taskData.deadline,
          status: taskData.status,
          notes: taskData.notes,
          createdAt: taskData.createdAt,
          completedAt: taskData.completedAt,
          checklistItems: checklistItems || undefined,
        }
        
        // Update selectedTask if it's the one being updated
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(updatedTask)
        }
        
        // Update tasks list
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t))
      }
      
      await fetchTasks()
      onTaskUpdate?.()
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return CheckCircle2
      case 'PROCESSING':
        return Loader2
      default:
        return Circle
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Trello Style */}
      <div className="bg-white dark:bg-gray-900 rounded-t-lg border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
              Quản lý nhiệm vụ
            </h2>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm font-poppins">
                {tasks.length}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-poppins">nhiệm vụ</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-md text-sm font-poppins font-semibold transition-colors flex items-center space-x-2 ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={16} />
                <span>Board</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-sm font-poppins font-semibold transition-colors flex items-center space-x-2 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays size={16} />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <TaskCalendar
          tasks={tasks}
          onTaskClick={(task) => setSelectedTask(task)}
          onDeadlineChange={handleDeadlineChange}
        />
      )}

      {/* Board View - Trello Style */}
      {viewMode === 'board' && (
        <>
          {/* Board Container */}
          <div className="bg-gray-100 dark:bg-gray-950 min-h-[600px] p-4 overflow-x-auto">
            <div className="flex space-x-4 min-w-max">
              {columns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.id)
                const StatusIcon = getStatusIcon(column.id)

                return (
                  <div
                    key={column.id}
                    className="flex-shrink-0 w-80"
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {/* Column Header - Trello Style */}
                    <div className="bg-white dark:bg-gray-800 rounded-t-lg px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <StatusIcon
                            size={18}
                            className={
                              column.id === 'COMPLETED'
                                ? 'text-green-500'
                                : column.id === 'PROCESSING'
                                ? 'text-blue-500'
                                : 'text-yellow-500'
                            }
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm font-poppins uppercase tracking-wide">
                            {column.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400 font-poppins font-semibold">
                            {columnTasks.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div
                      className={`bg-gray-50 dark:bg-gray-900 rounded-b-lg p-3 min-h-[500px] transition-colors ${
                        targetColumn === column.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {/* Tasks List */}
                      <div className="space-y-2">
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => setSelectedTask(task)}
                            onDragStart={(e) => {
                              handleDragStart(task.id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            isDragging={draggedTask === task.id}
                          />
                        ))}
                      </div>

                      {/* Add Card Button - Trello Style */}
                      {showAddCard === column.id ? (
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              if (onAssignClick) {
                                onAssignClick()
                              }
                              setShowAddCard(null)
                            }}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-poppins font-semibold transition-colors border border-gray-200 dark:border-gray-700"
                          >
                            Phân công nhiệm vụ mới
                          </button>
                          <button
                            onClick={() => setShowAddCard(null)}
                            className="mt-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddCard(column.id)}
                          className="w-full mt-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-sm font-poppins transition-colors flex items-center space-x-2"
                        >
                          <Plus size={16} />
                          <span>Thêm thẻ</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </>
      )}

      {/* Task Detail Modal - Trello Style */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDeadlineChange={handleDeadlineChange}
          currentUser={currentUser}
          documentId={documentId}
        />
      )}
    </div>
  )
}

