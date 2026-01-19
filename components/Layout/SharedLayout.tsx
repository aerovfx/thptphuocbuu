'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
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
  BookOpen,
  FileText,
  MessageSquare,
  Settings,
  Users,
  LayoutDashboard,
  Crown,
  Shield,
  Building2,
  Briefcase,
  Calendar,
  GraduationCap,
  Image,
} from 'lucide-react'
import Avatar from '../Common/Avatar'
import ThemeToggle from '../Common/ThemeToggle'
import Logo from '../Common/Logo'
import UserMenu from '../Common/UserMenu'
import ContactsSidebar from './ContactsSidebar'
import { ReactNode, useState, useEffect, useRef } from 'react'

interface SharedLayoutProps {
  children: ReactNode
  rightSidebar?: ReactNode
  showCreatePost?: boolean
  title?: string
}

export default function SharedLayout({
  children,
  rightSidebar,
  showCreatePost = false,
  title,
}: SharedLayoutProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [clientPathname, setClientPathname] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)

  // Ensure client-side only rendering to avoid hydration mismatch
  // Use two separate effects to ensure proper timing
  useEffect(() => {
    // First, set mounted after initial render
    setMounted(true)
  }, [])

  useEffect(() => {
    // Then, set clientPathname only after mounted is true
    if (mounted) {
      setClientPathname(pathname)
    }
  }, [mounted, pathname])

  // Only use session after mount and when status is not loading to avoid hydration mismatch
  // On server, status is typically 'loading', so we treat as no session
  const currentUser = mounted && status !== 'loading' ? session : null
  const isAuthenticated = mounted && status === 'authenticated'

  // Use clientPathname instead of pathname to avoid hydration mismatch
  // Only use clientPathname after component has fully mounted AND clientPathname is set
  // This ensures server and client initial render are identical
  const effectivePathname = mounted && clientPathname ? clientPathname : null

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

  useEffect(() => {
    if (!mounted) return
    setAvatarSrc(currentUser?.user?.image || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser?.user?.image])

  const handlePickAvatar = () => {
    if (!currentUser?.user?.id) return
    fileInputRef.current?.click()
  }

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.user?.id) return

    // Reset input so selecting the same file again still triggers change
    e.target.value = ''

    if (!file.type.startsWith('image/')) {
      alert('Avatar phải là file hình ảnh')
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Kích thước avatar không được vượt quá 5MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/users/${currentUser.user.id}/avatar`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Không thể cập nhật avatar')

      const nextUrl = data?.url || data?.avatar || null
      setAvatarSrc(nextUrl)

      try {
        await update?.()
      } catch {
        // ignore
      }

      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Đã xảy ra lỗi')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const navigation: Array<{
    name: string
    href: string
    icon: any
    requireAuth?: boolean
    studentHidden?: boolean
  }> = [
      { name: 'Trang chủ', href: '/', icon: Home },
      { name: 'Giới thiệu', href: '/about', icon: Building2 },
      { name: 'Tin tức', href: '/news', icon: FileText },
      { name: 'Hoạt động', href: '/activities', icon: Calendar },
      { name: 'Tuyển sinh', href: '/admissions', icon: GraduationCap },
      { name: 'Thư viện ảnh', href: '/gallery', icon: Image },
      { name: 'Lịch sự kiện', href: '/calendar', icon: Calendar },
      { name: 'Liên hệ', href: '/contact', icon: Mail },
      { name: 'Khám phá', href: '/explore', icon: Hash },
      { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
      { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
      { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
      { name: 'Văn bản', href: '/dashboard/documents', icon: FileText },
      { name: 'Spaces', href: '/dashboard/spaces', icon: Building2 },
      { name: 'Tổ chuyên môn', href: '/dashboard/departments', icon: Briefcase },
      { name: 'Premium', href: '/dashboard/premium', icon: Crown, requireAuth: true },
      { name: 'Hồ sơ', href: '/dashboard/profile', icon: User, requireAuth: true },
    ]

  const dashboardNavigation: Array<{
    name: string
    href: string
    icon: any
    requireAuth?: boolean
    adminOnly?: boolean
    studentHidden?: boolean
  }> = [
      // Main modules - visible to all authenticated users
      { name: 'Trang chủ', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Mạng xã hội', href: '/dashboard/social', icon: MessageSquare },
      { name: 'Premium', href: '/dashboard/premium', icon: Crown, requireAuth: true },
      { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },

      // Additional modules - with role restrictions
      { name: 'Spaces', href: '/dashboard/spaces', icon: Building2, requireAuth: true },
      { name: 'Văn bản', href: '/dashboard/documents', icon: FileText, requireAuth: true },
      { name: 'Lớp học', href: '/dashboard/classes', icon: BookOpen, adminOnly: true },
      { name: 'Tổ chuyên môn', href: '/dashboard/departments', icon: Briefcase, requireAuth: true },
      { name: 'Người dùng', href: '/dashboard/users', icon: Users, studentHidden: true },
      { name: 'Tài liệu HT', href: '/dashboard/system-docs', icon: BookOpen, adminOnly: true },
      { name: 'Admin Panel', href: '/dashboard/admin', icon: Shield, adminOnly: true },
    ]

  // Use pathname to determine navigation items
  // CRITICAL: Always use dashboardNavigation on initial render (both server and client)
  // to ensure hydration consistency. Only switch to navigation after mount and
  // confirmation that pathname is not a dashboard route.
  // 
  // On server: mounted = false -> use dashboardNavigation
  // On client initial: mounted = false -> use dashboardNavigation (must match server)
  // On client after mount: mounted = true, clientPathname has value -> can safely switch based on pathname
  // 
  // IMPORTANT: We use a memoized value to ensure navItems is stable during initial render
  const navItems: Array<{
    name: string
    href: string
    icon: any
    requireAuth?: boolean
    adminOnly?: boolean
    studentHidden?: boolean
  }> = (() => {
    // CRITICAL: Always use dashboardNavigation until component is fully mounted
    // This ensures server and client initial render are identical
    // We only check mounted, not clientPathname, to avoid any timing issues
    // clientPathname will be null on both server and client initial render
    if (!mounted) {
      return dashboardNavigation
    }

    // After mount, check clientPathname to decide
    // Only switch if we're sure we're not on a dashboard route
    if (clientPathname && !clientPathname.startsWith('/dashboard')) {
      return navigation
    }

    // Default to dashboardNavigation for all dashboard routes or when clientPathname is null
    return dashboardNavigation
  })()

  const handlePostClick = () => {
    if (currentUser) {
      // Navigate to social page and scroll to create post
      router.push('/dashboard/social')
      setTimeout(() => {
        const createPostElement = document.querySelector('[data-create-post]')
        if (createPostElement) {
          createPostElement.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen sticky top-0 flex flex-col transition-colors duration-300">
          <div className="p-4 flex flex-col h-full">
            <div className="mb-4 px-4 flex items-center">
              <Logo size={40} className="cursor-pointer" />
            </div>

            {/* Quick actions + user preview near top (avoid forcing users to scroll to bottom) */}
            {currentUser ? (
              <div className="px-2 mb-4">
                <div className="relative" ref={userMenuRef}>
                  <div
                    onClick={() => router.push(`/users/${currentUser.user?.id}`)}
                    className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar
                          src={avatarSrc || currentUser.user?.image}
                          name={currentUser.user?.name || 'User'}
                          size="sm"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelected}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePickAvatar()
                          }}
                          disabled={uploadingAvatar}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-bluelock-green dark:bg-blue-500 text-black dark:text-white flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label="Đổi ảnh đại diện"
                          title="Đổi ảnh đại diện"
                        >
                          {uploadingAvatar ? (
                            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-black dark:border-white"></span>
                          ) : (
                            <span className="text-xs font-bold">+</span>
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
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
                        setShowUserMenu(!showUserMenu)
                      }}
                      className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors"
                      aria-label="Mở menu người dùng"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  {showUserMenu && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl shadow-xl border border-bluelock-blue/30 dark:border-gray-800 overflow-hidden z-50">
                      {/* Arrow */}
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-bluelock-light-2 dark:bg-gray-900 border-l border-t border-bluelock-blue/30 dark:border-gray-800 transform rotate-45"></div>
                      <UserMenu
                        user={currentUser.user || {}}
                        onClose={() => setShowUserMenu(false)}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePostClick}
                  className="w-full mt-3 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                >
                  Đăng
                </button>
              </div>
            ) : (
              <div className="px-2 mb-4 space-y-3">
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

            <nav className="space-y-2 flex-1 overflow-y-auto pr-1" suppressHydrationWarning>
              {(() => {
                // CRITICAL: Filter items consistently on both server and client
                // On server or before mount, show all items to ensure hydration match
                // After mount, filter admin-only items based on user role
                const filteredItems = !mounted
                  ? navItems // Show all items on server and initial client render
                  : navItems.filter((item) => {
                    const isAdminOnly = (item as any).adminOnly === true
                    if (isAdminOnly) {
                      // Only show admin-only items to ADMIN, SUPER_ADMIN, and BGH users after mount
                      const userRole = session?.user?.role
                      return status === 'authenticated' && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'BGH')
                    }
                    const isStudentHidden = (item as any).studentHidden === true
                    if (isStudentHidden) {
                      // Hide student-hidden items for STUDENT role
                      return status === 'authenticated' && session?.user?.role !== 'STUDENT'
                    }
                    return true
                  })

                return filteredItems.map((item) => {
                  // Calculate isActive only after mount to ensure consistency
                  // On server, always use false to match initial client render
                  const isActive = mounted && effectivePathname
                    ? (effectivePathname === item.href || effectivePathname.startsWith(item.href + '/'))
                    : false
                  const requiresAuth = item.requireAuth === true
                  const isDisabled = mounted && status === 'unauthenticated' && requiresAuth

                  // Build className string consistently - use static classes on server
                  // Only add dynamic classes after mount to avoid hydration mismatch
                  // CRITICAL: Must be identical on server and initial client render
                  const baseClasses = 'flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors font-poppins'

                  // On server or before mount, use static classes only
                  if (!mounted) {
                    const staticClassName = `${baseClasses} text-bluelock-dark dark:text-white`.trim()
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={staticClassName}
                        suppressHydrationWarning
                      >
                        <item.icon size={24} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  }

                  // After mount, use dynamic classes
                  const activeClasses = isActive
                    ? 'font-bold text-bluelock-green dark:text-white'
                    : 'text-bluelock-dark dark:text-white'
                  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  const className = `${baseClasses} ${activeClasses} ${disabledClasses}`.trim()

                  // After mount, render with dynamic behavior
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        // Check auth on click - only redirect if we're sure user is not authenticated
                        if (requiresAuth && status === 'unauthenticated') {
                          e.preventDefault()
                          router.push('/login')
                        }
                      }}
                      className={className}
                      suppressHydrationWarning
                    >
                      <item.icon size={24} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })
              })()}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 border-r border-bluelock-blue/30 dark:border-gray-800 min-h-screen transition-colors duration-300">
          {title && (
            <div className="sticky top-0 bg-bluelock-light/80 dark:bg-black/80 backdrop-blur-sm border-b border-bluelock-blue/30 dark:border-gray-800 z-10 transition-colors duration-300">
              <div className="px-4 py-3">
                <h1 className="text-xl font-bold font-poppins">{title}</h1>
              </div>
            </div>
          )}
          <div>{children}</div>
        </main>

        {/* Right Sidebar */}
        {rightSidebar && (
          <aside className="w-80 p-6 hidden lg:block">
            <div className="sticky top-4">{rightSidebar}</div>
          </aside>
        )}
      </div>
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Contacts Sidebar - Right side with circular avatars */}
      {currentUser && <ContactsSidebar />}
    </div>
  )
}

