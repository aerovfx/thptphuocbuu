'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, FileText, MessageSquare, Plus, Bell, Activity } from 'lucide-react'
import SharedLayout from '../Layout/SharedLayout'
import RightSidebar from '../Layout/RightSidebar'

interface StatCard {
  title: string
  value: number
  iconName: string // Changed from icon to iconName
  href: string
  color: string
}

const iconMap: Record<string, any> = {
  BookOpen,
  Users,
  FileText,
  MessageSquare,
}

interface DashboardContentProps {
  statCards: StatCard[]
  trendingTopics: Array<{ category: string; name: string; posts: string }>
  currentUser: any
}

export default function DashboardContent({
  statCards,
  trendingTopics,
  currentUser,
}: DashboardContentProps) {
  const router = useRouter()
  const [activeCard, setActiveCard] = useState<string | null>(null)

  const handleStatCardClick = (href: string, title: string) => {
    setActiveCard(title)
    router.push(href)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-class':
        router.push('/dashboard/classes/new')
        break
      case 'upload-document':
        router.push('/dashboard/documents/upload')
        break
      case 'create-post':
        router.push('/dashboard/social')
        // Scroll to create post section
        setTimeout(() => {
          const createPostElement = document.querySelector('[data-create-post]')
          if (createPostElement) {
            createPostElement.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
        break
      case 'view-notifications':
        router.push('/notifications')
        break
      default:
        break
    }
  }

  return (
    <SharedLayout
      title={`Chào mừng, ${currentUser.user.name}!`}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={currentUser} />}
    >
      <div className="p-6">
        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          {currentUser.user.role === 'TEACHER' && (
            <>
              <button
                onClick={() => handleQuickAction('create-class')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Plus size={18} />
                <span>Tạo lớp học</span>
              </button>
              <button
                onClick={() => handleQuickAction('upload-document')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
              >
                <Plus size={18} />
                <span>Tải lên văn bản</span>
              </button>
            </>
          )}
          <button
            onClick={() => handleQuickAction('create-post')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
          >
            <Plus size={18} />
            <span>Tạo bài viết</span>
          </button>
          <button
            onClick={() => handleQuickAction('view-notifications')}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors border border-gray-700"
          >
            <Bell size={18} />
            <span>Thông báo</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.title}
              onClick={() => handleStatCardClick(stat.href, stat.title)}
              onMouseEnter={() => setActiveCard(stat.title)}
              onMouseLeave={() => setActiveCard(null)}
              className={`bg-gray-900 rounded-lg p-6 border transition-all cursor-pointer text-left ${
                activeCard === stat.title
                  ? 'bg-gray-800 border-blue-500 scale-105'
                  : 'border-gray-800 hover:bg-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1 font-poppins">{stat.title}</p>
                  <p className="text-3xl font-bold text-white font-poppins">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg transition-transform ${
                  activeCard === stat.title ? 'scale-110' : ''
                }`}>
                  {(() => {
                    const IconComponent = iconMap[stat.iconName]
                    return IconComponent ? <IconComponent className="text-white" size={24} /> : null
                  })()}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Activity and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-poppins flex items-center space-x-2">
                <Activity size={24} />
                <span>Hoạt động gần đây</span>
              </h2>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-500 hover:text-blue-400 text-sm font-poppins"
              >
                Xem tất cả
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-400 text-sm font-poppins">
                Chức năng này sẽ hiển thị các hoạt động gần đây của bạn
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-poppins flex items-center space-x-2">
                <Bell size={24} />
                <span>Thông báo</span>
              </h2>
              <button
                onClick={() => handleQuickAction('view-notifications')}
                className="text-blue-500 hover:text-blue-400 text-sm font-poppins"
              >
                Xem tất cả
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-400 text-sm font-poppins">Không có thông báo mới</p>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

