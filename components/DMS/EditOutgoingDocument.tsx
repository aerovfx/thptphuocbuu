'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import DOMPurify from 'dompurify'

// Dynamically import GoogleDocsEditor to avoid SSR issues
const GoogleDocsEditor = dynamic(() => import('./GoogleDocsEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
    </div>
  ),
})

interface EditOutgoingDocumentProps {
  document: {
    id: string
    title: string
    content: string
    recipient?: string | null
    priority: string
    sendDate?: Date | string | null
    template?: string | null
    status: string
  }
  currentUser: any
}

export default function EditOutgoingDocument({ document: initialDocument, currentUser }: EditOutgoingDocumentProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialDocument.title)
  const [content, setContent] = useState(initialDocument.content)
  const [recipient, setRecipient] = useState(initialDocument.recipient || '')
  const [priority, setPriority] = useState(initialDocument.priority)
  const [sendDate, setSendDate] = useState(
    initialDocument.sendDate
      ? new Date(initialDocument.sendDate).toISOString().slice(0, 16)
      : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Only render on client-side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleManualSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (!title.trim()) {
        setError('Vui lòng nhập tiêu đề')
        setIsSaving(false)
        return
      }

      // Validate content: check if it's empty or only contains whitespace/empty HTML tags
      const sanitizedContent = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } })
      const isContentEmpty = !sanitizedContent.trim() || sanitizedContent === '<p></p>' || sanitizedContent === '<h1></h1>'

      if (isContentEmpty) {
        setError('Vui lòng nhập nội dung văn bản')
        setIsSaving(false)
        return
      }

      const response = await fetch(`/api/dms/outgoing/${initialDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          recipient: recipient || undefined,
          priority,
          sendDate: sendDate ? new Date(sendDate).toISOString() : undefined,
          template: initialDocument.template || undefined,
          status: 'PENDING',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi cập nhật văn bản')
      }

      router.push(`/dashboard/dms/outgoing/${initialDocument.id}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật văn bản')
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render on server-side to avoid hydration mismatch
  if (!isMounted || typeof window === 'undefined') {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400 shadow-lg">
          <AlertCircle size={20} />
          <span className="font-poppins">{error}</span>
        </div>
      )}

      <GoogleDocsEditor
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onSave={handleManualSave}
        placeholder="Bắt đầu soạn thảo văn bản..."
      />

      {/* Metadata Panel - Slide in from right */}
      {showMetadata && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                Thông tin văn bản
              </h2>
              <button
                onClick={() => setShowMetadata(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Người nhận
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                  placeholder="Nhập người nhận"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                >
                  <option value="NORMAL">Bình thường</option>
                  <option value="HIGH">Cao</option>
                  <option value="URGENT">Khẩn</option>
                  <option value="LOW">Thấp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                  Ngày gửi
                </label>
                <input
                  type="datetime-local"
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Metadata Button */}
      <button
        onClick={() => setShowMetadata(!showMetadata)}
        className="fixed bottom-6 right-6 z-30 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg font-poppins"
      >
        {showMetadata ? 'Ẩn thông tin' : 'Thông tin văn bản'}
      </button>
    </div>
  )
}
