'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckSquare, Plus } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  order: number
}

interface PlanGeneratorProps {
  documentId: string
  documentContent?: string
  documentTitle?: string
  onPlanGenerated: (items: ChecklistItem[]) => void
  onClose: () => void
}

export default function PlanGenerator({
  documentId,
  documentContent,
  documentTitle,
  onPlanGenerated,
  onClose,
}: PlanGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<ChecklistItem[]>([])
  const [error, setError] = useState('')

  const generatePlan = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dms/incoming/${documentId}/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: documentTitle,
          content: documentContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Không thể tạo kế hoạch')
      }

      const data = await response.json()
      const items: ChecklistItem[] = data.items.map((item: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        text: item.text || item,
        completed: false,
        order: index,
      }))

      setGeneratedItems(items)
    } catch (err: any) {
      console.error('Error generating plan:', err)
      setError(err.message || 'Đã xảy ra lỗi khi tạo kế hoạch')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (generatedItems.length > 0) {
      onPlanGenerated(generatedItems)
      onClose()
    }
  }

  const handleAddCustom = () => {
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: '',
      completed: false,
      order: generatedItems.length,
    }
    setGeneratedItems([...generatedItems, newItem])
  }

  const handleUpdateItem = (id: string, text: string) => {
    setGeneratedItems(
      generatedItems.map((item) => (item.id === id ? { ...item, text } : item))
    )
  }

  const handleRemoveItem = (id: string) => {
    setGeneratedItems(generatedItems.filter((item) => item.id !== id))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">
              Tạo kế hoạch từ văn bản
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400 font-poppins">{error}</p>
            </div>
          )}

          {!generatedItems.length && !loading && (
            <div className="text-center py-8">
              <Sparkles className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 font-poppins mb-6">
                Sử dụng AI để tự động tạo kế hoạch thực hiện từ nội dung văn bản
              </p>
              <button
                onClick={generatePlan}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2 mx-auto"
              >
                <Sparkles size={18} />
                <span>Tạo kế hoạch tự động</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="mx-auto animate-spin text-blue-500 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400 font-poppins">
                Đang phân tích văn bản và tạo kế hoạch...
              </p>
            </div>
          )}

          {generatedItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                  Các bước thực hiện
                </h3>
                <button
                  onClick={handleAddCustom}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-poppins font-semibold flex items-center space-x-2"
                >
                  <Plus size={14} />
                  <span>Thêm bước</span>
                </button>
              </div>

              <div className="space-y-2">
                {generatedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-poppins w-8">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateItem(item.id, e.target.value)}
                      placeholder="Nhập bước thực hiện..."
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedItems.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-poppins font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins font-semibold transition-colors flex items-center space-x-2"
            >
              <CheckSquare size={18} />
              <span>Áp dụng kế hoạch</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

