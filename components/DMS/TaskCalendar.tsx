'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, CheckCircle2 } from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'

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
}

interface TaskCalendarProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDeadlineChange?: (taskId: string, newDeadline: Date) => void
}

export default function TaskCalendar({ tasks, onTaskClick, onDeadlineChange }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (task.deadline) {
        const dateKey = format(new Date(task.deadline), 'yyyy-MM-dd')
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(task)
      }
    })
    return grouped
  }, [tasks])

  const tasksWithoutDeadline = useMemo(() => {
    return tasks.filter((task) => !task.deadline)
  }, [tasks])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasksByDate[dateKey] || []
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'PROCESSING':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
      default:
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
    }
  }

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && !tasks.find((t) => t.deadline === deadline)?.completedAt
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-white font-poppins min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold text-sm transition-colors"
        >
          Hôm nay
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-800 border-b border-gray-700">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-400 font-poppins">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayTasks = getTasksForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-r border-b border-gray-800 p-2 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-900/50' : 'bg-gray-900'
                } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isCurrentDay ? 'bg-blue-500/10' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                {/* Day Number */}
                <div
                  className={`text-sm font-semibold mb-1 font-poppins ${
                    isCurrentDay
                      ? 'text-blue-400'
                      : isCurrentMonth
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => {
                    const overdue = task.deadline ? isOverdue(task.deadline) : false
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick?.(task)
                        }}
                        className={`text-xs p-1.5 rounded border cursor-pointer hover:opacity-80 transition-opacity font-poppins ${getStatusColor(
                          task.status
                        )} ${overdue ? 'ring-1 ring-red-500' : ''}`}
                        title={task.title}
                      >
                        <div className="truncate font-semibold">{task.title}</div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <Avatar
                            src={task.assignedTo.avatar}
                            name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                            size="xs"
                          />
                          {task.status === 'COMPLETED' && (
                            <CheckCircle2 size={10} className="text-green-400" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 font-poppins px-1">
                      +{dayTasks.length - 3} nhiệm vụ
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tasks without deadline */}
      {tasksWithoutDeadline.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="text-gray-400" size={18} />
            <h4 className="font-semibold text-white font-poppins">
              Nhiệm vụ chưa có deadline ({tasksWithoutDeadline.length})
            </h4>
          </div>
          <div className="space-y-2">
            {tasksWithoutDeadline.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className={`p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                  task.status
                )}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm font-poppins">{task.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar
                        src={task.assignedTo.avatar}
                        name={`${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                        size="sm"
                      />
                      <span className="text-xs text-gray-400 font-poppins">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const newDeadline = new Date()
                      newDeadline.setHours(17, 0, 0, 0) // Set to 5 PM today
                      onDeadlineChange?.(task.id, newDeadline)
                    }}
                    className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-poppins transition-colors"
                  >
                    Đặt deadline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center space-x-4 text-sm font-poppins">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/50"></div>
          <span className="text-gray-400">Chờ xử lý</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/50"></div>
          <span className="text-gray-400">Đang làm</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50"></div>
          <span className="text-gray-400">Hoàn thành</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded ring-1 ring-red-500"></div>
          <span className="text-gray-400">Quá hạn</span>
        </div>
      </div>
    </div>
  )
}

