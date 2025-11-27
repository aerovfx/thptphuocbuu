'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Loader2, User, MessageSquare, FileCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface ProgressStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  assignee?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  completedAt?: string
  comment?: string
  deadline?: string
}

interface DocumentProgressTrackerProps {
  documentId: string
  documentType: 'INCOMING' | 'OUTGOING'
}

export default function DocumentProgressTracker({
  documentId,
  documentType,
}: DocumentProgressTrackerProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgress()
  }, [documentId, documentType])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/documents/${documentId}/progress?type=${documentType}`
      )
      if (!response.ok) {
        throw new Error('Không thể tải tiến trình')
      }
      const data = await response.json()
      setSteps(data.steps || [])
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải tiến trình')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'rejected':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p className="text-sm text-red-800 dark:text-red-200 font-poppins">{error}</p>
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
          Chưa có thông tin tiến trình
        </p>
      </div>
    )
  }

  // Calculate overall progress
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const progressPercentage = (completedSteps / steps.length) * 100

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
            Tiến trình xử lý
          </h4>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
            {completedSteps}/{steps.length} bước
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg p-3 ${getStatusColor(step.status)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">
                    {step.name}
                  </h5>
                  {step.deadline && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                      Hạn: {formatDistanceToNow(new Date(step.deadline), { addSuffix: true, locale: vi })}
                    </span>
                  )}
                </div>

                {step.assignee && (
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-poppins">
                      {step.assignee.firstName} {step.assignee.lastName}
                    </span>
                  </div>
                )}

                {step.comment && (
                  <div className="flex items-start space-x-2 mt-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins">
                      {step.comment}
                    </p>
                  </div>
                )}

                {step.completedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-poppins">
                    Hoàn thành: {formatDistanceToNow(new Date(step.completedAt), { addSuffix: true, locale: vi })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

