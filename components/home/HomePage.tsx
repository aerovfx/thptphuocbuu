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
import ThemeToggle from '../Common/ThemeToggle'
import UserMenu from '../Common/UserMenu'
import Logo from '../Common/Logo'
import { useState, useEffect, useRef } from 'react'

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

  const handleCreatePost = () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    // Scroll to create post section or navigate to social page
    const createPostElement = document.querySelector('[data-create-post]')
    if (createPostElement) {
      createPostElement.scrollIntoView({ behavior: 'smooth' })
      // Focus on textarea if available
      setTimeout(() => {
        const textarea = createPostElement.querySelector('textarea')
        if (textarea) {
          textarea.focus()
        }
      }, 300)
    } else {
      // Navigate to social page if not on homepage
      router.push('/dashboard/social')
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    const input = form?.querySelector('input') || (e.target as HTMLInputElement)
    const query = input?.value?.trim()
    
    if (query) {
      router.push(`/explore?q=${encodeURIComponent(query)}`)
    } else {
      router.push('/explore')
    }
  }

  const handleTrendingTopicClick = (topicName: string) => {
    router.push(`/explore?q=${encodeURIComponent(topicName)}&tab=latest`)
  }

  const handleShowMoreTrending = () => {
    router.push('/explore?tab=top')
  }

  const handlePremiumSubscribe = () => {
    if (!currentUser) {
      router.push('/login?redirect=/premium')
      return
    }
    // TODO: Navigate to premium subscription page
    alert('Tính năng đăng ký Premium đang được phát triển')
  }

  const handleTrendingTopicMenu = (e: React.MouseEvent, topicName: string) => {
    e.stopPropagation()
    // TODO: Show menu with options: "Not interested", "This trend is harmful", etc.
    console.log('Menu for topic:', topicName)
  }

  const handleUserProfileClick = () => {
    if (currentUser?.user?.id) {
      router.push(`/users/${currentUser.user.id}`)
    } else {
      router.push('/login')
    }
  }

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowUserMenu(!showUserMenu)
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
        <div className="fixed top-4 right-4 bg-bluelock-green dark:bg-blue-500 text-black dark:text-white px-6 py-3 rounded-lg shadow-bluelock-glow dark:shadow-lg z-50 flex items-center space-x-2 font-poppins transition-colors duration-300">
          <MessageSquare size={20} />
          <span>Vui lòng đăng nhập để {showLoginPrompt ? 'tương tác' : 'tiếp tục'}</span>
          <button
            onClick={() => router.push('/login')}
            className="ml-4 bg-black dark:bg-white text-bluelock-green dark:text-blue-500 px-4 py-1 rounded font-medium hover:bg-bluelock-dark-2 dark:hover:bg-gray-200 font-poppins transition-colors duration-300"
          >
            Đăng nhập
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 transition-colors duration-300">
          <div className="p-4">
            <div className="mb-8 px-4">
              <Logo size={40} className="cursor-pointer" />
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
              <button
                onClick={handleCreatePost}
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
              <div className="mt-auto pt-4 relative" ref={userMenuRef}>
                <div
                  onClick={handleUserProfileClick}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUserMenu(e)
                    }}
                    className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors hidden xl:block"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl shadow-xl border border-bluelock-blue/30 dark:border-gray-800 overflow-hidden z-50">
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-6 w-4 h-4 bg-bluelock-light-2 dark:bg-gray-900 border-r border-b border-bluelock-blue/30 dark:border-gray-800 transform rotate-45"></div>
                    <UserMenu
                      user={currentUser.user || {}}
                      onClose={() => setShowUserMenu(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen transition-colors duration-300">
          <div className="sticky top-0 bg-bluelock-light/80 dark:bg-black/80 backdrop-blur-sm border-b border-bluelock-blue/30 dark:border-gray-800 z-10 transition-colors duration-300">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold font-poppins text-bluelock-dark dark:text-white">Trang chủ</h1>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {/* Create Post Section - Only for logged in users */}
            {currentUser && (
              <div className="p-4 border-b border-bluelock-blue/30 dark:border-gray-800" data-create-post>
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
            <form onSubmit={handleSearch} className="bg-bluelock-light-2 dark:bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3 transition-colors duration-300">
              <Search size={20} className="text-bluelock-dark dark:text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e)
                  }
                }}
                className="bg-transparent border-none outline-none text-bluelock-dark dark:text-white flex-1 placeholder:text-bluelock-dark/50 dark:placeholder:text-gray-500 font-poppins"
              />
            </form>

            {/* Premium Subscription */}
            <div className="bg-gradient-to-br from-bluelock-green/20 to-bluelock-purple/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl p-4 border border-bluelock-green/30 dark:border-blue-500/20 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">Đăng ký gói Premium</h2>
              <p className="text-bluelock-dark/70 dark:text-gray-400 text-sm mb-4 font-poppins">
                Đăng ký để mở khóa các tính năng mới và nếu đủ điều kiện, bạn sẽ được nhận một khoản chia sẻ doanh thu cho người sáng tạo nội dung.
              </p>
              <button
                onClick={handlePremiumSubscribe}
                className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black font-bold px-4 py-2 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
              >
                Đăng ký
              </button>
            </div>

            {/* Trending Topics */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl overflow-hidden transition-colors duration-300">
              <h2 className="text-xl font-bold p-4 font-poppins text-bluelock-dark dark:text-white">Những điều đang diễn ra</h2>
              <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={index}
                    onClick={() => handleTrendingTopicClick(topic.name)}
                    className="hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 px-4 py-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-bluelock-dark/60 dark:text-gray-500 text-xs mb-1 font-poppins">{topic.category}</p>
                        <p className="font-bold text-bluelock-dark dark:text-white font-poppins">{topic.name}</p>
                        <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">{topic.posts} bài đăng</p>
                      </div>
                      <button
                        onClick={(e) => handleTrendingTopicMenu(e, topic.name)}
                        className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors ml-2"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleShowMoreTrending}
                className="w-full px-4 py-3 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 text-left transition-colors font-poppins"
              >
                Hiển thị thêm
              </button>
            </div>

            {/* Who to Follow */}
            {!currentUser && (
              <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl overflow-hidden transition-colors duration-300">
                <h2 className="text-xl font-bold p-4 font-poppins text-bluelock-dark dark:text-white">Bạn có thể thích</h2>
                <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                  <div
                    onClick={() => router.push('/explore?tab=people')}
                    className="px-4 py-3 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar name="Người dùng mẫu" size="md" />
                        <div>
                          <p className="font-semibold font-poppins text-bluelock-dark dark:text-white">Người dùng mẫu</p>
                          <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">@user</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push('/login')
                        }}
                        className="bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black px-4 py-2 rounded-full font-semibold transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                      >
                        Theo dõi
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/explore?tab=people')}
                  className="w-full px-4 py-3 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 text-left transition-colors font-poppins"
                >
                  Hiển thị thêm
                </button>
              </div>
            )}

            {/* Login Prompt for Guests */}
            {!currentUser && (
              <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
                <h2 className="text-xl font-bold mb-2 text-bluelock-dark dark:text-white font-poppins">Bạn chưa đăng nhập</h2>
                <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm mb-4 font-poppins">
                  Đăng nhập để tương tác với bài viết, bình luận và tạo bài đăng mới.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-2 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full border border-bluelock-blue dark:border-gray-700 hover:bg-bluelock-light-2 dark:hover:bg-gray-800 text-bluelock-dark dark:text-white font-bold py-2 px-4 rounded-full transition-colors font-poppins"
                  >
                    Đăng ký
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      <ThemeToggle />
    </div>
  )
}

