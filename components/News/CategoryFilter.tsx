'use client'

import { Hash } from 'lucide-react'

interface Category {
  id: string
  label: string
  icon: any
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (categoryId: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-4 scrollbar-hide">
      {categories.map((category) => {
        const Icon = category.icon
        const isSelected = selectedCategory === category.id

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full font-poppins whitespace-nowrap transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'
            }`}
          >
            <Icon size={18} />
            <span>{category.label}</span>
          </button>
        )
      })}
    </div>
  )
}

