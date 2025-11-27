'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Lock, Globe, Eye, Settings, ChevronRight } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface SpaceCardProps {
  space: {
    id: string
    name: string
    code: string
    description?: string | null
    type: string
    visibility: string
    icon?: string | null
    color?: string | null
    parent?: { name: string } | null
    _count?: {
      members: number
      departments: number
    }
  }
  onClick?: () => void
}

const visibilityIcons = {
  PUBLIC: Globe,
  INTERNAL: Eye,
  PRIVATE: Lock,
}

const visibilityLabels = {
  PUBLIC: 'Công khai',
  INTERNAL: 'Nội bộ',
  PRIVATE: 'Riêng tư',
}

export default function SpaceCard({ space, onClick }: SpaceCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const VisibilityIcon = visibilityIcons[space.visibility as keyof typeof visibilityIcons] || Eye

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        isHovered
          ? 'border-blue-500 shadow-lg scale-[1.02]'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div
        className="h-2 w-full"
        style={{ backgroundColor: space.color || '#6366F1' }}
      ></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: space.color || '#6366F1' }}
            >
              {space.icon ? (
                <span className="text-xl">{space.icon}</span>
              ) : (
                <Users size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">
                {space.name}
              </h3>
              {space.parent && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                  {space.parent.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <VisibilityIcon
              size={18}
              className={`${
                space.visibility === 'PUBLIC'
                  ? 'text-green-500'
                  : space.visibility === 'INTERNAL'
                  ? 'text-blue-500'
                  : 'text-gray-500'
              }`}
            />
          </div>
        </div>

        {space.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-4 line-clamp-2">
            {space.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 font-poppins">
            {space._count?.members !== undefined && (
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>{space._count.members}</span>
              </div>
            )}
            {space._count?.departments !== undefined && space._count.departments > 0 && (
              <div className="flex items-center space-x-1">
                <Settings size={16} />
                <span>{space._count.departments}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
            <span className="text-xs font-poppins font-medium">
              {visibilityLabels[space.visibility as keyof typeof visibilityLabels]}
            </span>
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

