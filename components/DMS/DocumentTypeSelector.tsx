'use client'

import { useState, useEffect } from 'react'
import { getAllDocumentTypes, getDocumentTypesByGroup, type DocumentTypeInfo } from '@/lib/document-type-classifier'
import { HelpIcon, InlineHelp } from '@/components/Common/Tooltip'

interface DocumentTypeSelectorProps {
  value?: string
  onChange: (code: string) => void
  group?: string
  showHelp?: boolean
  className?: string
  label?: string
  required?: boolean
}

export default function DocumentTypeSelector({
  value,
  onChange,
  group,
  showHelp = true,
  className = '',
  label = 'Loại văn bản',
  required = false,
}: DocumentTypeSelectorProps) {
  const [types, setTypes] = useState<DocumentTypeInfo[]>([])
  const [selectedType, setSelectedType] = useState<DocumentTypeInfo | null>(null)

  useEffect(() => {
    const documentTypes = group
      ? getDocumentTypesByGroup(group)
      : getAllDocumentTypes()
    setTypes(documentTypes)

    if (value) {
      const type = documentTypes.find((t) => t.code === value)
      setSelectedType(type || null)
    }
  }, [value, group])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    onChange(code)
    const type = types.find((t) => t.code === code)
    setSelectedType(type || null)
  }

  const helpText = (
    <div className="space-y-2">
      <p className="font-semibold mb-2">Các loại văn bản chính:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li><strong>CV</strong> - Công văn (phổ biến nhất)</li>
        <li><strong>QĐ</strong> - Quyết định</li>
        <li><strong>TB</strong> - Thông báo</li>
        <li><strong>BC</strong> - Báo cáo</li>
        <li><strong>TT</strong> - Tờ trình</li>
        <li><strong>KH</strong> - Kế hoạch</li>
      </ul>
      {selectedType && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs">
            <strong>{selectedType.name}</strong>: {selectedType.description || 'Không có mô tả'}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {showHelp ? (
          <InlineHelp
            label={label}
            helpText={helpText}
            position="top"
            className="text-sm font-medium text-gray-300"
          />
        ) : (
          <label className="text-sm font-medium text-gray-300 font-poppins">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
      </div>

      <div className="relative">
        <select
          value={value || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins appearance-none cursor-pointer"
          required={required}
        >
          <option value="">-- Chọn loại văn bản --</option>
          {types.map((type) => (
            <option key={type.code} value={type.code}>
              {type.code} - {type.name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {selectedType && selectedType.description && (
        <p className="text-xs text-gray-400 font-poppins">{selectedType.description}</p>
      )}
    </div>
  )
}

