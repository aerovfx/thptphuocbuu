'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Avatar from '../Common/Avatar'

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

interface SimpleProgressTrackerProps {
  spaceId: string
  currentProgress: number
  canManage: boolean
}

export default function SimpleProgressTracker({
  spaceId,
  currentProgress,
  canManage,
}: SimpleProgressTrackerProps) {
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
        // Update current progress in parent component
        window.location.reload() // Simple refresh to update parent
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

      {/* Update Progress Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins mb-4">
          Cập nhật tiến độ
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-2">
            Tiến độ hiện tại
          </p>
          <div className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
            {currentProgress}%
          </div>
        </div>

        {canManage && (
          <>
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-poppins"
              >
                Cập nhật tiến độ
              </button>
            ) : (
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
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
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-poppins"
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
            )}
          </>
        )}
      </div>

      {/* Progress History */}
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
          <div className="space-y-4">
            {progressLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                      {log.progress}%
                    </span>
                    {log.milestone && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                        {log.milestone}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 font-poppins">
                  <span>Cập nhật bởi:</span>
                  <Avatar
                    src={log.createdBy.avatar}
                    name={`${log.createdBy.firstName} ${log.createdBy.lastName}`}
                    size="sm"
                  />
                  <span>
                    {log.createdBy.firstName} {log.createdBy.lastName}
                  </span>
                  <span>•</span>
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

