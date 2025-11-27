'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Avatar from '../Common/Avatar'
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'

interface ProgressLog {
  id: string
  progress: number
  milestone: string | null
  description: string | null
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface ScrumProgressBoardProps {
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
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  status: ProgressStatus
}

export default function ScrumProgressBoard({
  spaceId,
  currentProgress,
  canManage,
}: ScrumProgressBoardProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newProgress, setNewProgress] = useState(currentProgress)
  const [newMilestone, setNewMilestone] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      }
    } catch (error) {
      console.error('Error fetching progress logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newProgress < 0 || newProgress > 100) {
      alert('Tiến độ phải từ 0 đến 100')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/spaces/${spaceId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress,
          milestone: newMilestone || null,
          description: null,
        }),
      })

      if (response.ok) {
        await fetchProgressLogs()
        setShowForm(false)
        setNewMilestone('')
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật tiến độ')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      alert('Đã xảy ra lỗi khi cập nhật tiến độ')
    } finally {
      setSubmitting(false)
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

  // Categorize progress logs into columns
  const categorizeLogs = (logs: ProgressLog[]): ProgressCard[] => {
    return logs.map((log) => {
      let status: ProgressStatus = 'todo'
      if (log.progress === 100) {
        status = 'done'
      } else if (log.progress > 0) {
        status = 'in-progress'
      }
      return { ...log, status }
    })
  }

  const cards = categorizeLogs(progressLogs)
  const todoCards = cards.filter((c) => c.status === 'todo')
  const inProgressCards = cards.filter((c) => c.status === 'in-progress')
  const doneCards = cards.filter((c) => c.status === 'done')

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

  const ProgressCard = ({ card }: { card: ProgressCard }) => (
    <div
      className={`p-4 rounded-lg border ${getStatusColor(card.status)} mb-3 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon(card.status)}
          <span className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
            {card.progress}%
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
          {formatDistanceToNow(new Date(card.createdAt), { addSuffix: true, locale: vi })}
        </span>
      </div>
      
      {card.milestone && (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
          {card.milestone}
        </p>
      )}
      
      <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 font-poppins">
        <Avatar
          src={card.createdBy.avatar}
          name={`${card.createdBy.firstName} ${card.createdBy.lastName}`}
          size="xs"
        />
        <span>
          {card.createdBy.firstName} {card.createdBy.lastName}
        </span>
        <span>•</span>
        <span>{formatDate(card.createdAt)}</span>
      </div>
    </div>
  )

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
          {canManage && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
            >
              <Plus className="w-4 h-4" />
              <span>Cập nhật tiến độ</span>
            </button>
          )}
        </div>
      </div>

      {/* Update Form */}
      {showForm && canManage && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Tiến độ (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-poppins"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mốc tiến độ (tùy chọn)
              </label>
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Ví dụ: hoàn thành 3 giai đoạn"
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
                  setShowForm(false)
                  setNewMilestone('')
                  setNewProgress(currentProgress)
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-poppins"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scrum Board */}
      <div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* To Do Column */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white font-poppins">
                  Chưa bắt đầu
                </h4>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-poppins">
                  {todoCards.length}
                </span>
              </div>
              <div className="space-y-2">
                {todoCards.map((card) => (
                  <ProgressCard key={card.id} card={card} />
                ))}
                {todoCards.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-4">
                    Không có mục nào
                  </p>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white font-poppins">
                  Đang thực hiện
                </h4>
                <span className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-poppins">
                  {inProgressCards.length}
                </span>
              </div>
              <div className="space-y-2">
                {inProgressCards.map((card) => (
                  <ProgressCard key={card.id} card={card} />
                ))}
                {inProgressCards.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-4">
                    Không có mục nào
                  </p>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white font-poppins">
                  Hoàn thành
                </h4>
                <span className="px-2 py-1 bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded text-xs font-poppins">
                  {doneCards.length}
                </span>
              </div>
              <div className="space-y-2">
                {doneCards.map((card) => (
                  <ProgressCard key={card.id} card={card} />
                ))}
                {doneCards.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-4">
                    Không có mục nào
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

