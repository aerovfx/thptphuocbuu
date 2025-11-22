'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import GoogleDocsEditor to avoid SSR issues
const GoogleDocsEditor = dynamic(() => import('./GoogleDocsEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500 dark:text-gray-400">Đang tải trình soạn thảo...</div>
    </div>
  ),
})

interface CreateOutgoingDocumentProps {
  currentUser: any
}

export default function CreateOutgoingDocument({ currentUser }: CreateOutgoingDocumentProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipient, setRecipient] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [sendDate, setSendDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [showMetadata, setShowMetadata] = useState(false)

  const handleManualSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      if (!title.trim()) {
        setError('Vui lòng nhập tiêu đề')
        setIsSaving(false)
        return
      }

      // Extract text from HTML to check if content is empty
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      
      if (!textContent.trim()) {
        setError('Vui lòng nhập nội dung văn bản')
        setIsSaving(false)
        return
      }

      const method = documentId ? 'PUT' : 'POST'
      const url = documentId ? `/api/dms/outgoing/${documentId}` : '/api/dms/outgoing'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          recipient: recipient || undefined,
          priority,
          sendDate: sendDate ? new Date(sendDate).toISOString() : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi lưu văn bản')
      }

      setDocumentId(data.id)
      router.push(`/dashboard/dms/outgoing/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi lưu văn bản')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleManualSave()
  }

  // Auto-detect title from first sentence
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    
    // Auto-detect title from first sentence if title is empty
    if (!title && newContent.trim()) {
      // Extract text from HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = newContent
      const text = tempDiv.textContent || tempDiv.innerText || ''
      const firstSentence = text.trim().split(/[.!?]+/)[0]
      if (firstSentence && firstSentence.length > 0 && firstSentence.length < 100) {
        setTitle(firstSentence)
      }
    }
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
        onContentChange={handleContentChange}
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
