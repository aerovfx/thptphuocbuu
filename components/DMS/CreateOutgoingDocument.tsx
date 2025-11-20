'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertCircle, Sparkles } from 'lucide-react'
import { InlineHelp, HelpIcon } from '@/components/Common/Tooltip'
import { helpTexts } from '@/lib/tooltip-help-texts'

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
  const [template, setTemplate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAISuggest, setShowAISuggest] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề')
      return
    }

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung văn bản')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/dms/outgoing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          recipient: recipient || undefined,
          priority,
          sendDate: sendDate ? new Date(sendDate).toISOString() : undefined,
          template: template || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi tạo văn bản')
      }

      // Redirect to document detail page
      router.push(`/dashboard/dms/outgoing/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tạo văn bản')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAISuggest = async () => {
    if (!title && !recipient) {
      setError('Vui lòng nhập ít nhất tiêu đề hoặc người nhận để AI gợi ý')
      return
    }

    setShowAISuggest(true)
    try {
      const response = await fetch('/api/ai/suggest-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'OUTGOING',
          recipient,
          purpose: title,
        }),
      })

      const data = await response.json()

      if (response.ok && data.draft) {
        setContent(data.draft)
        setTemplate(data.template || '')
      }
    } catch (err) {
      console.error('Error getting AI suggestion:', err)
    } finally {
      setShowAISuggest(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-bluelock-dark dark:text-white font-poppins">
            Thông tin văn bản đi
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAISuggest}
              disabled={showAISuggest}
              className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2 shadow-bluelock-glow dark:shadow-none disabled:opacity-50"
            >
              <Sparkles size={18} />
              <span>{showAISuggest ? 'Đang tạo...' : 'AI Gợi ý'}</span>
            </button>
            <HelpIcon
              content={helpTexts.aiDraft.content}
              className="text-bluelock-dark dark:text-gray-300"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-poppins">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <InlineHelp
              label="Tiêu đề"
              helpText={helpTexts.title.content}
              className="mb-2 text-bluelock-dark dark:text-gray-300"
            />
            <span className="text-red-400 ml-2">*</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
              placeholder="Nhập tiêu đề văn bản"
              required
            />
          </div>

          {/* Content */}
          <div>
            <InlineHelp
              label="Nội dung"
              helpText={helpTexts.content.content}
              className="mb-2 text-bluelock-dark dark:text-gray-300"
            />
            <span className="text-red-400 ml-2">*</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
              placeholder="Nhập nội dung văn bản..."
              required
            />
          </div>

          {/* Recipient and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <InlineHelp
                label="Người/nơi nhận"
                helpText={helpTexts.recipient.content}
                className="mb-2 text-bluelock-dark dark:text-gray-300"
              />
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
                placeholder="Nhập người/nơi nhận"
              />
            </div>

            <div>
              <InlineHelp
                label="Mức độ ưu tiên"
                helpText={helpTexts.priority.content}
                className="mb-2 text-bluelock-dark dark:text-gray-300"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
              >
                <option value="URGENT">Khẩn</option>
                <option value="HIGH">Cao</option>
                <option value="NORMAL">Bình thường</option>
                <option value="LOW">Thấp</option>
              </select>
            </div>
          </div>

          {/* Send Date */}
          <div>
            <InlineHelp
              label="Ngày gửi dự kiến"
              helpText={helpTexts.sendDate.content}
              className="mb-2 text-bluelock-dark dark:text-gray-300"
            />
            <input
              type="datetime-local"
              value={sendDate}
              onChange={(e) => setSendDate(e.target.value)}
              className="w-full px-4 py-2 bg-bluelock-light dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
            />
          </div>

          {/* Template (hidden, auto-filled by AI) */}
          {template && (
            <div>
              <label className="block text-sm font-medium text-bluelock-dark dark:text-gray-300 mb-2 font-poppins">
                Mẫu sử dụng
              </label>
              <input
                type="text"
                value={template}
                readOnly
                className="w-full px-4 py-2 bg-bluelock-light-3 dark:bg-gray-800 border border-bluelock-blue/30 dark:border-gray-700 rounded-lg text-bluelock-dark/60 dark:text-gray-400 font-poppins"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors shadow-bluelock-glow dark:shadow-none"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo văn bản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

