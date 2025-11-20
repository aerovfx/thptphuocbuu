'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  BookmarkCheck,
  User,
  MoreHorizontal,
  Hash,
  Heart,
  MessageCircle,
  Share2,
  Trash2,
} from 'lucide-react'
import Avatar from '../Common/Avatar'
import ThemeToggle from '../Common/ThemeToggle'
import Logo from '../Common/Logo'
import UserMenu from '../Common/UserMenu'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import { useEffect, useRef } from 'react'

interface BookmarkedPost {
  id: string
  content: string
  createdAt: Date
  bookmarkedAt: Date
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

interface BookmarksPageProps {
  bookmarkedPosts: BookmarkedPost[]
  currentUser: any
}

export default function BookmarksPage({ bookmarkedPosts, currentUser }: BookmarksPageProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(bookmarkedPosts)
  const [removingPostId, setRemovingPostId] = useState<string | null>(null)
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

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true, active: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

  const handleRemoveBookmark = async (postId: string) => {
    if (removingPostId) return

    setRemovingPostId(postId)
    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId))
      } else {
        console.error('Failed to remove bookmark')
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
    } finally {
      setRemovingPostId(null)
    }
  }

  const handleAuthorClick = (authorId: string) => {
    router.push(`/users/${authorId}`)
  }

  const handlePostMenu = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation()
    // TODO: Show menu with options
    console.log('Post menu:', postId)
  }

  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/dashboard/social?post=${postId}`
    navigator.clipboard.writeText(postUrl).then(() => {
      console.log('Link copied to clipboard')
    })
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

  const handleUserProfileClick = () => {
    if (currentUser?.user?.id) {
      router.push(`/users/${currentUser.user.id}`)
    } else {
      router.push('/login')
    }
  }

  const handleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowUserMenu(!showUserMenu)
  }

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 transition-colors duration-300">
          <div className="p-4">
            <Link href="/" className="mb-8 px-4 block hover:opacity-80 transition-opacity">
              <Logo size={40} className="cursor-pointer" />
            </Link>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = item.active || false
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
              <h1 className="text-xl font-bold font-poppins text-bluelock-dark dark:text-white">Dấu trang</h1>
            </div>
          </div>

          <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
            {posts.length === 0 ? (
              <div className="p-12 text-center">
                <Bookmark className="mx-auto text-bluelock-dark/40 dark:text-gray-400 mb-4" size={64} />
                <h2 className="text-2xl font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">
                  Chưa có dấu trang nào
                </h2>
                <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                  Khi bạn đánh dấu bài viết, chúng sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="px-4 py-3 border-b border-bluelock-blue/30 dark:border-gray-800 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/30 transition-colors duration-300"
                >
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={post.author.avatar}
                      name={`${post.author.firstName} ${post.author.lastName}`}
                      size="md"
                      userId={post.author.id}
                      clickable={true}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3
                            onClick={() => handleAuthorClick(post.author.id)}
                            className="font-bold text-bluelock-dark dark:text-white hover:underline cursor-pointer font-poppins"
                          >
                            {post.author.firstName} {post.author.lastName}
                          </h3>
                          <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                            @{post.author.firstName.toLowerCase()}
                            {post.author.lastName.toLowerCase().replace(/\s+/g, '')}
                          </span>
                          <span className="text-bluelock-dark/60 dark:text-gray-500">·</span>
                          <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: vi,
                            })}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handlePostMenu(e, post.id)}
                          className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors duration-300"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>

                      <p className="text-bluelock-dark dark:text-white mb-3 whitespace-pre-wrap break-words font-poppins leading-relaxed">
                        {post.content}
                      </p>

                      <div className="flex items-center justify-between max-w-md mt-3">
                        <button
                          onClick={() => router.push(`/dashboard/social?post=${post.id}`)}
                          className="flex items-center space-x-1 text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 transition-colors group duration-300"
                        >
                          <div className="p-2 rounded-full group-hover:bg-bluelock-green/10 dark:group-hover:bg-blue-500/10 transition-colors">
                            <MessageCircle size={18.75} />
                          </div>
                          {post._count.comments > 0 && (
                            <span className="text-sm font-poppins">{post._count.comments}</span>
                          )}
                        </button>

                        <button
                          className="flex items-center space-x-1 text-bluelock-dark/60 dark:text-gray-500 hover:text-red-500 transition-colors group duration-300"
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                            <Heart size={18.75} />
                          </div>
                          {post._count.likes > 0 && (
                            <span className="text-sm font-poppins">{post._count.likes}</span>
                          )}
                        </button>

                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-1 text-bluelock-dark/60 dark:text-gray-500 hover:text-green-500 transition-colors group duration-300"
                        >
                          <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                            <Share2 size={18.75} />
                          </div>
                        </button>

                        <button
                          onClick={() => handleRemoveBookmark(post.id)}
                          disabled={removingPostId === post.id}
                          className="flex items-center space-x-1 text-bluelock-green dark:text-blue-500 hover:text-red-500 transition-colors group duration-300 disabled:opacity-50"
                          title="Xóa khỏi dấu trang"
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                            {removingPostId === post.id ? (
                              <Trash2 size={18.75} className="animate-pulse" />
                            ) : (
                              <BookmarkCheck size={18.75} fill="currentColor" />
                            )}
                          </div>
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-bluelock-dark/50 dark:text-gray-600 font-poppins">
                        Đã đánh dấu{' '}
                        {formatDistanceToNow(new Date(post.bookmarkedAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 p-6 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="bg-bluelock-light-2 dark:bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3 transition-colors duration-300">
              <Search size={20} className="text-bluelock-dark/60 dark:text-gray-500" />
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

            {/* Info */}
            <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
              <h2 className="text-lg font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">
                Dấu trang của bạn
              </h2>
              <p className="text-sm text-bluelock-dark/70 dark:text-gray-400 font-poppins">
                Lưu các bài viết bạn muốn đọc lại sau. Nhấn vào biểu tượng dấu trang trên bất kỳ bài viết nào để lưu.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <ThemeToggle />
    </div>
  )
}

