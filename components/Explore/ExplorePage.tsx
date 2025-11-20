'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User,
  MoreHorizontal,
  ArrowLeft,
  Hash,
  Settings,
  Circle,
} from 'lucide-react'
import SocialFeed from '../Social/SocialFeed'
import Avatar from '../Common/Avatar'
import FollowButton from '../Common/FollowButton'
import ThemeToggle from '../Common/ThemeToggle'
import Logo from '../Common/Logo'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

interface TrendingTopic {
  category: string
  name: string
  posts: string
}

interface UserResult {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
  bio?: string | null
  role: string
}

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

interface ExplorePageProps {
  initialQuery: string
  initialTab: string
  trendingTopics: TrendingTopic[]
  users: UserResult[]
  posts: Post[]
  session: any
}

export default function ExplorePage({
  initialQuery,
  initialTab,
  trendingTopics,
  users,
  posts,
  session,
}: ExplorePageProps) {
  const { data: sessionData } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentUser = sessionData || session

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchFilter, setSearchFilter] = useState({
    people: 'anyone',
    location: 'anywhere',
  })

  const tabs = [
    { id: 'top', label: 'Hàng đầu' },
    { id: 'latest', label: 'Mới nhất' },
    { id: 'people', label: 'Mọi người' },
    { id: 'media', label: 'Phương tiện' },
    { id: 'lists', label: 'Danh sách' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeTab !== 'top') params.set('tab', activeTab)
    router.push(`/explore?${params.toString()}`)
    router.refresh()
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (tabId !== 'top') params.set('tab', tabId)
    router.push(`/explore?${params.toString()}`)
    router.refresh()
  }

  // Sync with URL params
  useEffect(() => {
    const urlQuery = searchParams?.get('q') || ''
    const urlTab = searchParams?.get('tab') || 'top'
    if (urlQuery !== query) setQuery(urlQuery)
    if (urlTab !== activeTab) setActiveTab(urlTab)
  }, [searchParams])

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

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
                const isActive = item.href === '/explore'
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
                    <span className="font-poppins">{item.name}</span>
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
                <div className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 cursor-pointer transition-colors">
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
            <div className="px-4 py-3 flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-bluelock-light-2 dark:hover:bg-gray-900 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-bluelock-dark dark:text-white" />
              </button>
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bluelock-dark/60 dark:text-gray-500"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm"
                    className="w-full bg-bluelock-light-2 dark:bg-gray-900 rounded-full pl-10 pr-4 py-2.5 text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bluelock-green dark:focus:ring-blue-500 font-poppins transition-colors duration-300"
                  />
                </div>
              </form>
              <button className="p-2 hover:bg-bluelock-light-2 dark:hover:bg-gray-900 rounded-full transition-colors">
                <Settings size={20} className="text-bluelock-dark/60 dark:text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-bluelock-blue/30 dark:border-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 px-4 py-3 text-center font-poppins transition-colors relative ${
                    activeTab === tab.id
                      ? 'font-bold text-bluelock-green dark:text-white'
                      : 'text-bluelock-dark/60 dark:text-gray-500 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/50'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-bluelock-green dark:bg-blue-500 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'people' ? (
              <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                {users.length > 0 ? (
                  <>
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="px-4 py-3 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Avatar
                              src={user.avatar}
                              name={`${user.firstName} ${user.lastName}`}
                              size="md"
                              userId={user.id}
                              clickable={true}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-bold text-bluelock-dark dark:text-white font-poppins">
                                  {user.firstName} {user.lastName}
                                </p>
                                {user.role === 'ADMIN' && (
                                  <span className="text-bluelock-green dark:text-blue-500">
                                    <svg
                                      viewBox="0 0 22 22"
                                      aria-label="Verified account"
                                      className="w-5 h-5 fill-current"
                                    >
                                      <g>
                                        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
                                      </g>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins mb-1">
                                @{user.email.split('@')[0]}
                              </p>
                              {user.bio && (
                                <p className="text-bluelock-dark dark:text-white text-sm mt-1 line-clamp-2 font-poppins">
                                  {user.bio}
                                </p>
                              )}
                            </div>
                          </div>
                          {currentUser && currentUser.user?.id !== user.id && (
                            <div className="ml-4">
                              <FollowButton
                                userId={user.id}
                                isFollowing={false}
                                variant="small"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length >= 10 && (
                      <div className="px-4 py-3">
                        <button className="text-bluelock-green dark:text-blue-500 hover:text-bluelock-green-bright dark:hover:text-blue-400 font-poppins transition-colors">
                          Xem tất cả
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                      {query ? 'Không tìm thấy người dùng nào' : 'Nhập từ khóa để tìm kiếm'}
                    </p>
                  </div>
                )}

                {/* Show related posts below people results */}
                {activeTab === 'people' && users.length > 0 && posts.length > 0 && (
                  <div className="mt-6 border-t border-bluelock-blue/30 dark:border-gray-800 pt-6">
                    <h3 className="text-lg font-bold text-bluelock-dark dark:text-white mb-4 px-4 font-poppins">
                      Bài viết liên quan
                    </h3>
                    <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                      {posts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className="px-4 py-4 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar
                              src={post.author.avatar}
                              name={`${post.author.firstName} ${post.author.lastName}`}
                              size="sm"
                              userId={post.author.id}
                              clickable={true}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-bold text-bluelock-dark dark:text-white text-sm font-poppins">
                                  {post.author.firstName} {post.author.lastName}
                                </p>
                                <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                                  @{post.author.firstName.toLowerCase()}
                                  {post.author.lastName.toLowerCase()}
                                </span>
                                <span className="text-bluelock-dark/60 dark:text-gray-500">·</span>
                                <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                                  {formatDistanceToNow(new Date(post.createdAt), {
                                    addSuffix: true,
                                    locale: vi,
                                  })}
                                </span>
                              </div>
                              <p className="text-bluelock-dark dark:text-white text-sm line-clamp-3 font-poppins">
                                {post.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {posts.length > 0 ? (
                  <SocialFeed
                    initialPosts={posts}
                    currentUserId={currentUser?.user?.id || null}
                    isGuest={!currentUser}
                  />
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                      {query ? 'Không tìm thấy bài viết nào' : 'Nhập từ khóa để tìm kiếm'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 p-6 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            {/* Search Filters */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 transition-colors duration-300">
              <h2 className="text-xl font-bold mb-4 font-poppins text-bluelock-dark dark:text-white">Bộ lọc tìm kiếm</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-bluelock-dark dark:text-white mb-2 font-poppins">Mọi người</h3>
                  <div className="space-y-2">
                    <label
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => setSearchFilter({ ...searchFilter, people: 'anyone' })}
                    >
                      <div className="relative">
                        <Circle
                          size={18}
                          className={searchFilter.people === 'anyone' ? 'text-bluelock-green dark:text-blue-500' : 'text-bluelock-dark/60 dark:text-gray-500'}
                        />
                        {searchFilter.people === 'anyone' && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-bluelock-green dark:bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-poppins text-bluelock-dark dark:text-white">Từ bất kỳ ai</span>
                    </label>
                    <label
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => setSearchFilter({ ...searchFilter, people: 'following' })}
                    >
                      <div className="relative">
                        <Circle
                          size={18}
                          className={searchFilter.people === 'following' ? 'text-bluelock-green dark:text-blue-500' : 'text-bluelock-dark/60 dark:text-gray-500'}
                        />
                        {searchFilter.people === 'following' && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-bluelock-green dark:bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-poppins text-bluelock-dark dark:text-white">Những người bạn theo dõi</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-bluelock-dark dark:text-white mb-2 font-poppins">Vị trí</h3>
                  <div className="space-y-2">
                    <label
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => setSearchFilter({ ...searchFilter, location: 'anywhere' })}
                    >
                      <div className="relative">
                        <Circle
                          size={18}
                          className={searchFilter.location === 'anywhere' ? 'text-bluelock-green dark:text-blue-500' : 'text-bluelock-dark/60 dark:text-gray-500'}
                        />
                        {searchFilter.location === 'anywhere' && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-bluelock-green dark:bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-poppins text-bluelock-dark dark:text-white">Mọi nơi</span>
                    </label>
                    <label
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => setSearchFilter({ ...searchFilter, location: 'nearby' })}
                    >
                      <div className="relative">
                        <Circle
                          size={18}
                          className={searchFilter.location === 'nearby' ? 'text-bluelock-green dark:text-blue-500' : 'text-bluelock-dark/60 dark:text-gray-500'}
                        />
                        {searchFilter.location === 'nearby' && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-bluelock-green dark:bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-poppins text-bluelock-dark dark:text-white">Gần bạn</span>
                    </label>
                  </div>
                </div>

                <button className="text-bluelock-green dark:text-blue-500 hover:text-bluelock-green-bright dark:hover:text-blue-400 text-sm font-poppins transition-colors">
                  Tìm kiếm nâng cao
                </button>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl overflow-hidden transition-colors duration-300">
              <h2 className="text-xl font-bold p-4 font-poppins text-bluelock-dark dark:text-white">Những điều đang diễn ra</h2>
              <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
                {trendingTopics.map((topic, index) => (
                  <Link
                    key={index}
                    href={`/explore?q=${encodeURIComponent(topic.name)}&tab=latest`}
                    className="hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 px-4 py-3 block transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-bluelock-dark/60 dark:text-gray-500 text-xs mb-1 font-poppins">{topic.category}</p>
                        <p className="font-bold text-bluelock-dark dark:text-white font-poppins">{topic.name}</p>
                        <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">{topic.posts} bài đăng</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors ml-2"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full px-4 py-3 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 text-left transition-colors font-poppins">
                Hiển thị thêm
              </button>
            </div>
          </div>
        </aside>
      </div>
      <ThemeToggle />
    </div>
  )
}

