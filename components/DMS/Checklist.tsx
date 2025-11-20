'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Plus, X, Trash2 } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  order: number
}

interface ChecklistProps {
  assignmentId: string
  initialItems?: ChecklistItem[]
  onUpdate?: (items: ChecklistItem[]) => Promise<void>
}

export default function Checklist({ assignmentId, initialItems = [], onUpdate }: ChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    return Array.isArray(initialItems) ? initialItems : []
  })
  const [newItemText, setNewItemText] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (Array.isArray(initialItems)) {
      setItems(initialItems)
    }
  }, [initialItems])

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      setIsAdding(false)
      return
    }

    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
      order: items.length,
    }

    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    setNewItemText('')
    setIsAdding(false)

    if (onUpdate) {
      setSaving(true)
      try {
        await onUpdate(updatedItems)
      } catch (error) {
        console.error('Error saving checklist:', error)
        // Revert on error
        setItems(items)
        alert('Không thể lưu checklist. Vui lòng thử lại.')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleToggleItem = async (itemId: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    const previousItems = [...items]
    setItems(updatedItems)

    if (onUpdate) {
      try {
        await onUpdate(updatedItems)
      } catch (error) {
        console.error('Error updating checklist item:', error)
        // Revert on error
        setItems(previousItems)
      }
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const previousItems = [...items]
    const updatedItems = items.filter((item) => item.id !== itemId)
    setItems(updatedItems)

    if (onUpdate) {
      try {
        await onUpdate(updatedItems)
      } catch (error) {
        console.error('Error deleting checklist item:', error)
        // Revert on error
        setItems(previousItems)
      }
    }
  }

  const handleUpdateItemText = async (itemId: string, newText: string) => {
    const previousItems = [...items]
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, text: newText } : item
    )
    setItems(updatedItems)

    if (onUpdate) {
      try {
        await onUpdate(updatedItems)
      } catch (error) {
        console.error('Error updating checklist item text:', error)
        // Revert on error
        setItems(previousItems)
      }
    }
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <CheckSquare size={18} className="text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-poppins">Checklist</h3>
        {totalCount > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">{progress}% hoàn thành</p>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-2 group p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <button
              onClick={() => handleToggleItem(item.id)}
              className={`flex-shrink-0 mt-0.5 ${
                item.completed
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              } transition-colors`}
            >
              {item.completed ? (
                <CheckSquare size={18} className="fill-current" />
              ) : (
                <CheckSquare size={18} />
              )}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
              onBlur={() => {
                if (!item.text.trim()) {
                  handleDeleteItem(item.id)
                }
              }}
              className={`flex-1 text-sm font-poppins bg-transparent border-none outline-none ${
                item.completed
                  ? 'text-gray-500 dark:text-gray-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}
            />
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Add New Item */}
        {isAdding ? (
          <div className="flex items-center space-x-2 p-2">
            <CheckSquare size={18} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem()
                } else if (e.key === 'Escape') {
                  setNewItemText('')
                  setIsAdding(false)
                }
              }}
              placeholder="Nhập mục checklist..."
              className="flex-1 text-sm font-poppins bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim() || saving}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded text-sm font-poppins font-semibold transition-colors"
            >
              {saving ? '...' : 'Thêm'}
            </button>
            <button
              onClick={() => {
                setNewItemText('')
                setIsAdding(false)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-poppins transition-colors w-full"
          >
            <Plus size={16} />
            <span>Thêm mục</span>
          </button>
        )}
      </div>
    </div>
  )
}

