'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  Hash,
  Heart,
  MessageSquare,
  UserPlus,
  CheckCircle,
  FileText,
  Clock,
} from 'lucide-react'
import Avatar from '../Common/Avatar'
import ThemeToggle from '../Common/ThemeToggle'
import Logo from '../Common/Logo'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'approval' | 'assignment'
  title: string
  message: string
  createdAt: Date
  read: boolean
  link?: string
  actor?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  relatedItem?: {
    id: string
    title?: string
    content?: string
  }
}

interface NotificationsPageProps {
  notifications: {
    posts: any[]
    approvals: any[]
  }
  currentUser: any
}

export default function NotificationsPage({ notifications, currentUser }: NotificationsPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'mentions' | 'approvals'>('all')
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])

  // Transform data into notification format
  useEffect(() => {
    const transformed: Notification[] = []

    // Add post-related notifications (mock - in production these would come from a Notification model)
    notifications.posts.slice(0, 5).forEach((post) => {
      transformed.push({
        id: `post-${post.id}`,
        type: 'mention',
        title: 'Bài viết mới',
        message: `${post.author.firstName} ${post.author.lastName} đã đăng một bài viết`,
        createdAt: post.createdAt,
        read: false,
        link: `/dashboard/social`,
        actor: post.author,
        relatedItem: {
          id: post.id,
          content: post.content.substring(0, 100),
        },
      })
    })

    // Add approval notifications
    notifications.approvals.forEach((approval) => {
      const doc = approval.outgoingDocument || approval.incomingDocument
      transformed.push({
        id: `approval-${approval.id}`,
        type: 'approval',
        title: 'Cần phê duyệt',
        message: `Bạn có một văn bản cần phê duyệt: ${doc?.title || 'Văn bản'}`,
        createdAt: approval.createdAt,
        read: false,
        link: doc
          ? approval.outgoingDocumentId
            ? `/dashboard/dms/outgoing/${doc.id}`
            : `/dashboard/dms/incoming/${doc.id}`
          : undefined,
        relatedItem: {
          id: doc?.id || '',
          title: doc?.title,
        },
      })
    })

    // Sort by date
    transformed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setAllNotifications(transformed)
  }, [notifications])

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true, active: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'mentions', label: 'Đề cập' },
    { id: 'approvals', label: 'Phê duyệt' },
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={20} />
      case 'comment':
        return <MessageSquare className="text-blue-500" size={20} />
      case 'follow':
        return <UserPlus className="text-green-500" size={20} />
      case 'mention':
        return <Hash className="text-blue-500" size={20} />
      case 'approval':
        return <CheckCircle className="text-yellow-500" size={20} />
      case 'assignment':
        return <FileText className="text-purple-500" size={20} />
      default:
        return <Bell className="text-gray-500" size={20} />
    }
  }

  const filteredNotifications = allNotifications.filter((notif) => {
    if (activeTab === 'mentions') {
      return notif.type === 'mention'
    }
    if (activeTab === 'approvals') {
      return notif.type === 'approval'
    }
    return true
  })

  const unreadCount = allNotifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 transition-colors duration-300">
          <div className="p-4">
            <div className="mb-8 px-4 flex items-center">
              <Logo size={40} className="cursor-pointer" />
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = item.active || false
                const isDisabled = item.requireAuth && !currentUser

                return (
                  <Link
                    key={item.name}
                    href={isDisabled ? '/login' : item.href}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors font-poppins relative ${
                      isActive ? 'font-bold text-bluelock-green dark:text-white' : 'text-bluelock-dark dark:text-white'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <div className="relative">
                      <item.icon size={24} />
                      {item.name === 'Thông báo' && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {currentUser ? (
              <button
                onClick={() => router.push('/dashboard/social')}
                className="w-full mt-4 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
              >
                Đăng
              </button>
            ) : (
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full border border-bluelock-blue dark:border-gray-700 hover:bg-bluelock-light-2 dark:hover:bg-gray-900 text-bluelock-dark dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins"
                >
                  Đăng ký
                </button>
              </div>
            )}

            {/* User Profile Preview */}
            {currentUser && (
              <div className="mt-auto pt-4">
                <div
                  onClick={() => router.push(`/users/${currentUser.user?.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={currentUser.user?.image}
                      name={currentUser.user?.name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 hidden xl:block">
                      <p className="font-semibold text-sm truncate font-poppins text-bluelock-dark dark:text-white">
                        {currentUser.user?.name || 'User'}
                      </p>
                      <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm truncate font-poppins">
                        @{currentUser.user?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  </div>
                  <MoreHorizontal size={20} className="text-bluelock-dark/60 dark:text-gray-500 hidden xl:block" />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen transition-colors duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-bluelock-light/80 dark:bg-black/80 backdrop-blur-sm border-b border-bluelock-blue/30 dark:border-gray-800 z-10 transition-colors duration-300">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold font-poppins text-bluelock-dark dark:text-white">Thông báo</h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-4 text-center font-poppins font-semibold transition-colors duration-300 relative ${
                    activeTab === tab.id
                      ? 'text-bluelock-dark dark:text-white'
                      : 'text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-dark dark:hover:text-gray-400'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-bluelock-green dark:bg-blue-500"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="mx-auto text-bluelock-dark/40 dark:text-gray-400 mb-4" size={48} />
                <p className="text-bluelock-dark/60 dark:text-gray-500 text-lg font-poppins">
                  Không có thông báo nào
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => notification.link && router.push(notification.link)}
                  className={`px-4 py-4 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/30 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-bluelock-green/5 dark:bg-blue-500/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.actor ? (
                        <Avatar
                          src={notification.actor.avatar}
                          name={`${notification.actor.firstName} ${notification.actor.lastName}`}
                          size="md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-bluelock-green/20 dark:bg-blue-500/20 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {!notification.actor && (
                          <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        )}
                        <p className="text-bluelock-dark dark:text-white font-poppins font-semibold">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-bluelock-green dark:bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-bluelock-dark/70 dark:text-gray-300 text-sm font-poppins mb-1">
                        {notification.message}
                      </p>
                      {notification.relatedItem?.content && (
                        <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins line-clamp-2">
                          {notification.relatedItem.content}
                        </p>
                      )}
                      <p className="text-bluelock-dark/60 dark:text-gray-500 text-xs font-poppins mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // TODO: Mark as read or show menu
                      }}
                      className="flex-shrink-0 text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 p-6 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.currentTarget.querySelector('input') as HTMLInputElement
                if (input?.value.trim()) {
                  router.push(`/explore?q=${encodeURIComponent(input.value.trim())}`)
                }
              }}
              className="bg-bluelock-light-2 dark:bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3 transition-colors duration-300"
            >
              <Search size={20} className="text-bluelock-dark/60 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="bg-transparent border-none outline-none text-bluelock-dark dark:text-white flex-1 placeholder:text-bluelock-dark/50 dark:placeholder:text-gray-500 font-poppins"
              />
            </form>

            {/* Quick Actions */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-4 font-poppins text-bluelock-dark dark:text-white">
                Hành động nhanh
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard/dms/workflow/pending')}
                  className="w-full text-left px-4 py-2 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-lg transition-colors font-poppins text-bluelock-dark dark:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Clock size={18} />
                    <span>Phê duyệt chờ xử lý</span>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard/social')}
                  className="w-full text-left px-4 py-2 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-lg transition-colors font-poppins text-bluelock-dark dark:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={18} />
                    <span>Xem bài viết mới</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <ThemeToggle />
    </div>
  )
}

