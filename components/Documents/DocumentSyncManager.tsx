'use client'

import { useState, useEffect } from 'react'
// Simple button component
const Button = ({ children, onClick, disabled, className = '', variant = 'default' }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'outline'
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = variant === 'outline'
    ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  )
}
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface DocumentSyncStats {
  total: number
  synced: number
  errors: number
  skipped: number
}

interface DocumentSyncManagerProps {
  documentId: string
  documentType: 'INCOMING' | 'OUTGOING'
  onSyncComplete?: () => void
}

export default function DocumentSyncManager({
  documentId,
  documentType,
  onSyncComplete,
}: DocumentSyncManagerProps) {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [stats, setStats] = useState<DocumentSyncStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/documents/sync/auto', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          documentType,
          createdById: documentId, // Sẽ được lấy từ document thực tế
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi đồng bộ')
      }

      setSuccess(true)
      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đồng bộ')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSync = async () => {
    setSyncing(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/documents/sync/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType,
          limit: 100,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi đồng bộ hàng loạt')
      }

      setStats(data.stats)
      setSuccess(true)
      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi đồng bộ hàng loạt')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Đồng bộ văn bản
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Đồng bộ văn bản với Spaces và Tổ chuyên môn
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && !stats && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-600 dark:text-green-400">
            Đồng bộ thành công!
          </p>
        </div>
      )}

      {stats && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Kết quả đồng bộ hàng loạt
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đã đồng bộ</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.synced}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lỗi</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.errors}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đã bỏ qua</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.skipped}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSync}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang đồng bộ...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Đồng bộ văn bản này</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleBulkSync}
          disabled={syncing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang đồng bộ hàng loạt...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Đồng bộ hàng loạt</span>
            </>
          )}
        </Button>
      </div>

      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-semibold mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Văn bản sẽ tự động được đồng bộ với Space "Văn bản"</li>
              <li>Văn bản sẽ được gán vào các Tổ chuyên môn của người tạo</li>
              <li>Văn bản sẽ được gán vào Spaces của các Tổ chuyên môn liên quan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

