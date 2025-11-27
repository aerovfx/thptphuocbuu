'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[] // Suggested tags
  maxTags?: number
  className?: string
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Nhập tag và nhấn Enter',
  suggestions = [],
  maxTags,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion) &&
      inputValue.length > 0
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0)
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag when backspace on empty input
      removeTag(tags.length - 1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      if (maxTags && tags.length >= maxTags) {
        return
      }
      onChange([...tags, tag])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    onChange(newTags)
  }

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 min-h-[42px] bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        {/* Tags */}
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 dark:bg-blue-600 text-white rounded-full text-sm font-poppins"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white placeholder-gray-500 font-poppins"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-700 text-white font-poppins transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Plus size={16} className="text-gray-400" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && tags.length >= maxTags && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-poppins">
          Đã đạt giới hạn {maxTags} tags
        </p>
      )}
    </div>
  )
}

