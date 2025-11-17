'use client'

import { useSession } from 'next-auth/react'
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
  MessageSquare,
  Heart,
  Share2,
  Hash,
  TrendingUp,
} from 'lucide-react'
import SocialFeed from '../Social/SocialFeed'
import CreatePost from '../Social/CreatePost'
import Avatar from '../Common/Avatar'
import { useState } from 'react'

interface Post {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

interface HomePageProps {
  initialPosts: Post[]
  session: any
}

export default function HomePage({ initialPosts, session }: HomePageProps) {
  const { data: sessionData } = useSession()
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const currentUser = sessionData || session

  const handleInteraction = (action: string) => {
    if (!currentUser) {
      setShowLoginPrompt(true)
      setTimeout(() => setShowLoginPrompt(false), 3000)
      router.push('/login')
      return false
    }
    return true
  }

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Gumayusi', posts: '26.7K' },
    { category: 'Doanh nghiệp & Tài chính - Nổi bật', name: 'Nvidia', posts: '24.6K' },
    { category: 'Chính trị - Nổi bật', name: 'Canada', posts: '192K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Built', posts: '259K' },
  ]

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed top-4 right-4 bg-bluelock-green text-black px-6 py-3 rounded-lg shadow-bluelock-glow z-50 flex items-center space-x-2 font-poppins">
          <MessageSquare size={20} />
          <span>Vui lòng đăng nhập để {showLoginPrompt ? 'tương tác' : 'tiếp tục'}</span>
          <button
            onClick={() => router.push('/login')}
            className="ml-4 bg-black text-bluelock-green px-4 py-1 rounded font-medium hover:bg-bluelock-dark-2 font-poppins"
          >
            Đăng nhập
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 transition-colors duration-300">
          <div className="p-4">
            <div className="text-xl font-bold mb-8 px-4 font-montserrat text-white">
              <span className="text-distressed">THPT Phước Bửu</span>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = false // You can implement active state
                const isDisabled = item.requireAuth && !currentUser

                return (
                  <Link
                    key={item.name}
                    href={isDisabled ? '/login' : item.href}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors font-poppins ${
                      isActive ? 'font-bold text-bluelock-green dark:text-white' : 'text-bluelock-dark dark:text-white'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <item.icon size={24} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {currentUser ? (
              <button className="w-full mt-4 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none">
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
                <div className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-gray-900 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={currentUser.user?.image}
                      name={currentUser.user?.name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 hidden xl:block">
                      <p className="font-semibold text-sm truncate font-poppins">
                        {currentUser.user?.name || 'User'}
                      </p>
                      <p className="text-gray-500 text-sm truncate font-poppins">
                        @{currentUser.user?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  </div>
                  <MoreHorizontal size={20} className="text-gray-500 hidden xl:block" />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-r border-gray-800 min-h-screen">
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 z-10">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold font-poppins">Trang chủ</h1>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {/* Create Post Section - Only for logged in users */}
            {currentUser && (
              <div className="p-4 border-b border-gray-800">
                <CreatePost />
              </div>
            )}

            {/* Posts Feed */}
            <div className="p-4">
              <SocialFeed
                initialPosts={initialPosts}
                currentUserId={currentUser?.user?.id || null}
                isGuest={!currentUser}
                onInteractionRequired={handleInteraction}
              />
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 p-6 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            {/* Search */}
            <div className="bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="bg-transparent border-none outline-none text-white flex-1"
              />
            </div>

            {/* Premium Subscription */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20">
              <h2 className="text-xl font-bold mb-2 font-poppins">Đăng ký gói Premium</h2>
              <p className="text-gray-400 text-sm mb-4 font-poppins">
                Đăng ký để mở khóa các tính năng mới và nếu đủ điều kiện, bạn sẽ được nhận một khoản chia sẻ doanh thu cho người sáng tạo nội dung.
              </p>
              <button className="w-full bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors font-poppins">
                Đăng ký
              </button>
            </div>

            {/* Trending Topics */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              <h2 className="text-xl font-bold p-4 font-poppins">Những điều đang diễn ra</h2>
              <div className="divide-y divide-gray-800">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="hover:bg-gray-800/50 px-4 py-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-500 text-xs mb-1 font-poppins">{topic.category}</p>
                        <p className="font-bold text-white font-poppins">{topic.name}</p>
                        <p className="text-gray-500 text-sm font-poppins">{topic.posts} bài đăng</p>
                      </div>
                      <button className="text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-full p-1 transition-colors ml-2">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full px-4 py-3 text-blue-500 hover:bg-gray-800/50 text-left transition-colors font-poppins">
                Hiển thị thêm
              </button>
            </div>

            {/* Who to Follow */}
            {!currentUser && (
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <h2 className="text-xl font-bold p-4 font-poppins">Bạn có thể thích</h2>
                <div className="divide-y divide-gray-800">
                  <div className="px-4 py-3 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar name="Người dùng mẫu" size="md" />
                        <div>
                          <p className="font-semibold font-poppins">Người dùng mẫu</p>
                          <p className="text-gray-500 text-sm font-poppins">@user</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/login')}
                        className="bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors font-poppins"
                      >
                        Theo dõi
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/register')}
                  className="w-full px-4 py-3 text-blue-500 hover:bg-gray-800/50 text-left transition-colors font-poppins"
                >
                  Hiển thị thêm
                </button>
              </div>
            )}

            {/* Login Prompt for Guests */}
            {!currentUser && (
              <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                <h2 className="text-xl font-bold mb-2">Bạn chưa đăng nhập</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Đăng nhập để tương tác với bài viết, bình luận và tạo bài đăng mới.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full border border-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-full transition-colors"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

