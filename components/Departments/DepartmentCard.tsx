'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, BookOpen, User, ChevronRight } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface DepartmentCardProps {
  department: {
    id: string
    name: string
    code: string
    description?: string | null
    type: string
    subject?: string | null
    icon?: string | null
    color?: string | null
    leader?: {
      id: string
      firstName: string
      lastName: string
      avatar?: string | null
    } | null
    space?: { name: string } | null
    _count?: {
      members: number
      documents: number
    }
  }
  onClick?: () => void
}

export default function DepartmentCard({ department, onClick }: DepartmentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
        isHovered
          ? 'border-green-500 shadow-lg scale-[1.02]'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      <div
        className="h-2 w-full"
        style={{ backgroundColor: department.color || '#10B981' }}
      ></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: department.color || '#10B981' }}
            >
              {department.icon ? (
                <span className="text-xl">{department.icon}</span>
              ) : (
                <BookOpen size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">
                {department.name}
              </h3>
              {department.subject && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                  {department.subject}
                </p>
              )}
            </div>
          </div>
        </div>

        {department.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-4 line-clamp-2">
            {department.description}
          </p>
        )}

        {department.leader && (
          <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Avatar
              src={department.leader.avatar}
              name={`${department.leader.firstName} ${department.leader.lastName}`}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Trưởng tổ</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white font-poppins truncate">
                {department.leader.firstName} {department.leader.lastName}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 font-poppins">
            {department._count?.members !== undefined && (
              <div className="flex items-center space-x-1">
                <Users size={16} />
                <span>{department._count.members}</span>
              </div>
            )}
            {department._count?.documents !== undefined && (
              <div className="flex items-center space-x-1">
                <BookOpen size={16} />
                <span>{department._count.documents}</span>
              </div>
            )}
          </div>
          <ChevronRight
            size={16}
            className="text-green-600 dark:text-green-400"
          />
        </div>
      </div>
    </div>
  )
}

