'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, TrendingUp, CheckCircle2, Circle, Plus, Edit2 } from 'lucide-react'
import { format, formatDistanceToNow, isBefore, isAfter, differenceInDays } from 'date-fns'
import { vi } from 'date-fns/locale'

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

interface SpaceProgressTrackerProps {
  spaceId: string
  currentProgress: number
  startDate: string | null
  endDate: string | null
  canManage: boolean
}

export default function SpaceProgressTracker({
  spaceId,
  currentProgress,
  startDate,
  endDate,
  canManage,
}: SpaceProgressTrackerProps) {
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProgress, setNewProgress] = useState(currentProgress)
  const [newMilestone, setNewMilestone] = useState('')
  const [newDescription, setNewDescription] = useState('')
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

  const handleAddProgress = async () => {
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
          description: newDescription || null,
        }),
      })

      if (response.ok) {
        await fetchProgressLogs()
        setShowAddForm(false)
        setNewMilestone('')
        setNewDescription('')
        setNewProgress(currentProgress)
      } else {
        const data = await response.json()
        alert(data.error || 'Đã xảy ra lỗi khi cập nhật tiến độ')
      }
    } catch (error) {
      console.error('Error adding progress:', error)
      alert('Đã xảy ra lỗi khi cập nhật tiến độ')
    } finally {
      setSubmitting(false)
    }
  }

  // Tính toán thời gian còn lại
  const getTimeRemaining = () => {
    if (!endDate) return null

    const end = new Date(endDate)
    const now = new Date()

    if (isBefore(now, end)) {
      const days = differenceInDays(end, now)
      return {
        status: 'remaining',
        text: `Còn ${days} ngày`,
        days,
      }
    } else {
      return {
        status: 'overdue',
        text: `Đã quá hạn ${differenceInDays(now, end)} ngày`,
        days: -differenceInDays(now, end),
      }
    }
  }

  // Tính toán tiến độ dự kiến
  const getExpectedProgress = () => {
    if (!startDate || !endDate) return null

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    const totalDays = differenceInDays(end, start)
    const elapsedDays = differenceInDays(now, start)

    if (totalDays <= 0) return 100

    const expected = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
    return Math.round(expected)
  }

  const timeRemaining = getTimeRemaining()
  const expectedProgress = getExpectedProgress()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Theo dõi tiến độ</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mt-1">
            Theo dõi tiến độ hoạt động của space
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
          >
            <Plus className="w-4 h-4" />
            <span>Cập nhật tiến độ</span>
          </button>
        )}
      </div>

      {/* Timeline Info */}
      {(startDate || endDate) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {startDate && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Ngày bắt đầu</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
                  {format(new Date(startDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          )}

          {endDate && (
            <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Ngày kết thúc</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
                  {format(new Date(endDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          )}

          {timeRemaining && (
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                timeRemaining.status === 'overdue'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <Clock
                className={`w-5 h-5 ${
                  timeRemaining.status === 'overdue'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Thời gian còn lại</p>
                <p
                  className={`text-sm font-semibold font-poppins ${
                    timeRemaining.status === 'overdue'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {timeRemaining.text}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins">
            Tiến độ hiện tại
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
            {currentProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
        {expectedProgress !== null && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
              Tiến độ dự kiến: {expectedProgress}%
            </span>
            {currentProgress < expectedProgress && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-poppins">
                ⚠️ Chậm tiến độ
              </span>
            )}
            {currentProgress >= expectedProgress && (
              <span className="text-xs text-green-600 dark:text-green-400 font-poppins">
                ✓ Đúng tiến độ
              </span>
            )}
          </div>
        )}
      </div>

      {/* Add Progress Form */}
      {showAddForm && canManage && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins mb-4">
            Cập nhật tiến độ
          </h4>
          <div className="space-y-4">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
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
                placeholder="Ví dụ: Hoàn thành giai đoạn 1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins mb-2">
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Mô tả chi tiết về tiến độ..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddProgress}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewMilestone('')
                  setNewDescription('')
                  setNewProgress(currentProgress)
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-poppins"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Logs Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins mb-4">
          Lịch sử cập nhật
        </h4>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : progressLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-poppins">
            Chưa có lịch sử cập nhật tiến độ
          </div>
        ) : (
          <div className="space-y-4">
            {progressLogs.map((log, index) => (
              <div
                key={log.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0">
                  {index === 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                        {log.progress}%
                      </span>
                      {log.milestone && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium font-poppins">
                          {log.milestone}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-2">
                      {log.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                    <span>
                      Cập nhật bởi: {log.createdBy.firstName} {log.createdBy.lastName}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

