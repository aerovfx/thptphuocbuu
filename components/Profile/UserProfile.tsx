'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  MoreHorizontal,
  UserPlus,
  Check,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  Home,
  Hash,
  Bell,
  Mail,
  User,
  Camera,
  Upload,
  Building2,
  Award,
} from 'lucide-react'
import Avatar from '@/components/Common/Avatar'
import SocialFeed from '@/components/Social/SocialFeed'
import RightSidebar from '@/components/Layout/RightSidebar'
import ThemeToggle from '@/components/Common/ThemeToggle'
import Logo from '@/components/Common/Logo'
import { formatDistanceToNow } from 'date-fns'

interface UserProfileProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar: string | null
    coverPhoto: string | null
    bio: string | null
    role: string
    phone: string | null
    dateOfBirth: Date | null
    createdAt: Date
    _count: {
      posts: number
      friendships: number
      friendships2: number
    }
    isFollowing: boolean
    posts: any[]
    remixedPosts?: any[]
    followingCount: number
    followersCount: number
    brandBadge?: {
      badgeType: 'GOLD' | 'SILVER' | 'BLUE'
      badgeIconUrl: string | null
      brand: {
        id: string
        name: string
        logoUrl: string | null
        verificationStatus: string
      }
    } | null
    affiliatedAccounts?: Array<{
      id: string
      firstName: string
      lastName: string
      email: string
      avatar: string | null
    }>
  }
  currentUser: any
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
  PARENT: 'Phụ huynh',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  TEACHER: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  STUDENT: 'bg-green-500/20 text-green-400 border-green-500/50',
  PARENT: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
}

export default function UserProfile({ user, currentUser }: UserProfileProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(user.isFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'highlights' | 'media' | 'likes'>('posts')
  const [avatar, setAvatar] = useState(user.avatar)
  const [coverPhoto, setCoverPhoto] = useState(user.coverPhoto)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [followersCount, setFollowersCount] = useState(user.followersCount)

  const isOwnProfile = currentUser?.user?.id === user.id
  const displayName = `${user.firstName} ${user.lastName}`
  const handle = `@${user.email.split('@')[0]}`

  const handleFollow = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const response = await fetch(`/api/users/${user.id}/follow`, {
        method,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      // Update followers count
      if (newFollowingState) {
        setFollowersCount((prev) => prev + 1)
      } else {
        setFollowersCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error)
      alert(error.message || 'Đã xảy ra lỗi')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'posts', label: 'Bài đăng', count: user._count.posts },
    { id: 'replies', label: 'Bên liên kết', count: 0 },
    { id: 'highlights', label: 'Các phản hồi', count: 0 },
    { id: 'media', label: 'Sự kiện nổi bật', count: 0 },
    { id: 'likes', label: 'Phương tiện', count: 0 },
  ]

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: displayName, posts: `${user._count.posts} bài đăng` },
    { category: 'Chủ đề nổi trội', name: roleLabels[user.role], posts: 'Nổi bật' },
  ]

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Khám phá', href: '/explore', icon: Hash },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Dấu trang', href: '/bookmarks', icon: Bookmark, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser?.user?.id ? `/users/${currentUser.user.id}` : '/login', icon: User },
  ]

  const handlePostClick = () => {
    if (currentUser) {
      router.push('/dashboard/social')
    } else {
      router.push('/login')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể tải lên avatar')
      }

      const data = await response.json()
      setAvatar(data.url)
      // Update session to reflect new avatar
      // Refresh router to update session
      router.refresh()
      // Small delay before reload to ensure session is updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      alert(error.message || 'Không thể tải lên avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/users/${user.id}/cover`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Không thể tải lên hình bìa')
      }

      const data = await response.json()
      setCoverPhoto(data.url)
      // Refresh router to update session
      router.refresh()
      // Small delay before reload to ensure session is updated
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error: any) {
      console.error('Error uploading cover photo:', error)
      alert(error.message || 'Không thể tải lên hình bìa')
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <div className="min-h-screen bg-bluelock-light dark:bg-black text-bluelock-dark dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4">
        {/* Left Sidebar - Navigation */}
        <div className="hidden lg:block col-span-3 border-r border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          <div className="sticky top-0 p-4 flex flex-col h-screen">
            <div className="mb-8">
              <Logo size={40} className="cursor-pointer" />
            </div>

            {/* Navigation Items */}
            <nav className="space-y-2 flex-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.name === 'Hồ sơ' && pathname?.startsWith('/users/'))
                const isDisabled = item.requireAuth && !currentUser

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (isDisabled) {
                        router.push('/login')
                      } else {
                        router.push(item.href)
                      }
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors font-poppins text-left ${
                      isActive 
                        ? 'font-bold text-bluelock-green dark:text-blue-500' 
                        : 'text-bluelock-dark dark:text-white'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    <item.icon size={24} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>

            {/* Post Button */}
            {currentUser && (
              <button
                onClick={handlePostClick}
                className="w-full mt-4 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white font-bold py-3 px-4 rounded-full transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
              >
                Đăng
              </button>
            )}

            {/* User Profile Preview */}
            {currentUser && (
              <div className="mt-auto pt-4">
                <button
                  onClick={() => router.push(`/users/${currentUser.user?.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-full hover:bg-bluelock-light-2 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={currentUser.user?.image}
                      name={currentUser.user?.name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate font-poppins text-bluelock-dark dark:text-white">
                        {currentUser.user?.name || 'User'}
                      </p>
                      <p className="text-bluelock-dark/60 dark:text-gray-500 text-xs truncate font-poppins">
                        @{currentUser.user?.email?.split('@')[0] || 'user'}
                      </p>
                    </div>
                  </div>
                  <MoreHorizontal size={18} className="text-bluelock-dark/60 dark:text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-6 border-x border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-bluelock-light/80 dark:bg-black/80 backdrop-blur-sm z-10 border-b border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
            <div className="flex items-center space-x-4 p-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-bluelock-light-2 dark:hover:bg-gray-800 rounded-full transition-colors duration-300"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold font-poppins text-bluelock-dark dark:text-white">{displayName}</h1>
                <p className="text-sm text-bluelock-dark/60 dark:text-gray-500 font-poppins">{user._count.posts} bài đăng</p>
              </div>
            </div>
          </div>

          {/* Profile Banner */}
          <div 
            className="h-48 bg-gradient-to-r from-bluelock-green to-bluelock-purple dark:from-blue-600 dark:to-purple-600 relative transition-colors duration-300 overflow-hidden"
            style={{
              backgroundImage: coverPhoto ? `url(${coverPhoto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {isOwnProfile && (
              <label className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
                {uploadingCover ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Camera size={20} />
                )}
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-4 pb-4 border-b border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
            <div className="flex justify-between items-start -mt-16 mb-4">
              <div className="relative">
                <Avatar
                  src={avatar}
                  name={displayName}
                  size="xl"
                  className="border-4 border-bluelock-light dark:border-black transition-colors duration-300"
                />
                {isOwnProfile && (
                  <label className="absolute -bottom-2 -right-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black dark:border-white"></div>
                    ) : (
                      <Camera size={16} />
                    )}
                  </label>
                )}
                {user.role === 'ADMIN' && (
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-1">
                    <Check size={16} className="text-black" />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-4">
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={isLoading}
                    className={`px-6 py-2.5 rounded-full font-semibold font-poppins transition-colors duration-300 flex items-center space-x-2 ${
                      isFollowing
                        ? 'bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-blue dark:text-white border border-bluelock-blue/50 dark:border-gray-700'
                        : 'bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black dark:text-black shadow-bluelock-glow dark:shadow-none'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : isFollowing ? (
                      <>
                        <Check size={18} />
                        <span>Đang theo dõi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Theo dõi</span>
                      </>
                    )}
                  </button>
                )}
                {!isOwnProfile && (
                  <button className="p-2 hover:bg-bluelock-light-2 dark:hover:bg-gray-800 rounded-full transition-colors duration-300 text-bluelock-blue dark:text-white">
                    <MessageSquare size={20} />
                  </button>
                )}
                <button className="p-2 hover:bg-bluelock-light-2 dark:hover:bg-gray-800 rounded-full transition-colors duration-300 text-bluelock-blue dark:text-white">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-2xl font-bold font-poppins text-bluelock-dark dark:text-white">{displayName}</h2>
                {user.role === 'ADMIN' && (
                  <div className="bg-yellow-500 rounded-full p-1">
                    <Check size={14} className="text-black" />
                  </div>
                )}
                {/* Brand Badge */}
                {user.brandBadge && (
                  <div
                    className={`px-2 py-1 rounded text-xs font-poppins font-semibold flex items-center space-x-1 ${
                      user.brandBadge.badgeType === 'GOLD'
                        ? 'bg-yellow-500 text-yellow-900'
                        : user.brandBadge.badgeType === 'SILVER'
                        ? 'bg-gray-400 text-gray-900'
                        : 'bg-blue-500 text-blue-900'
                    }`}
                    title={`Thương hiệu: ${user.brandBadge.brand.name}`}
                  >
                    {user.brandBadge.badgeIconUrl ? (
                      <img
                        src={user.brandBadge.badgeIconUrl}
                        alt="Badge"
                        className="w-4 h-4 rounded"
                      />
                    ) : (
                      <Award size={14} />
                    )}
                    <span>{user.brandBadge.badgeType}</span>
                  </div>
                )}
              </div>
              <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins mb-3">{handle}</p>
              {/* Affiliated Brand */}
              {user.brandBadge && (
                <div className="mb-3 p-3 bg-bluelock-light dark:bg-gray-800 rounded-lg border border-bluelock-blue/30 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 size={16} className="text-bluelock-green" />
                    <span className="text-sm font-semibold text-bluelock-dark dark:text-white font-poppins">
                      Liên kết với {user.brandBadge.brand.name}
                    </span>
                    {user.brandBadge.brand.verificationStatus === 'APPROVED' && (
                      <Check size={14} className="text-green-500" />
                    )}
                  </div>
                  {user.brandBadge.brand.logoUrl && (
                    <img
                      src={user.brandBadge.brand.logoUrl}
                      alt={user.brandBadge.brand.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                </div>
              )}
              {user.bio && (
                <p className="text-bluelock-dark dark:text-white font-poppins mb-3">{user.bio}</p>
              )}
              {/* Affiliated Accounts */}
              {user.affiliatedAccounts && user.affiliatedAccounts.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold text-bluelock-dark dark:text-white font-poppins mb-2">
                    Tài khoản liên kết:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.affiliatedAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => router.push(`/users/${account.id}`)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-bluelock-light dark:bg-gray-800 rounded-lg hover:bg-bluelock-light-2 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Avatar
                          src={account.avatar}
                          name={`${account.firstName} ${account.lastName}`}
                          size="sm"
                        />
                        <span className="text-sm font-poppins text-bluelock-dark dark:text-white">
                          {account.firstName} {account.lastName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-4 text-sm text-bluelock-dark/60 dark:text-gray-500 font-poppins mb-3">
                {user.phone && (
                  <div className="flex items-center space-x-1">
                    <MapPin size={16} />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <LinkIcon size={16} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>
                    Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4 font-poppins">
                <div className="hover:underline cursor-pointer">
                  <span className="font-semibold text-bluelock-dark dark:text-white">{user.followingCount}</span>
                  <span className="text-bluelock-dark/60 dark:text-gray-500 ml-1">Đang theo dõi</span>
                </div>
                <div className="hover:underline cursor-pointer">
                  <span className="font-semibold text-bluelock-dark dark:text-white">{followersCount}</span>
                  <span className="text-bluelock-dark/60 dark:text-gray-500 ml-1">Người theo dõi</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role]} font-poppins`}>
                  {roleLabels[user.role]}
                </span>
              </div>
            </div>
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
                {tab.count > 0 && (
                  <span className="ml-2 text-bluelock-dark/60 dark:text-gray-500 text-sm font-normal">({tab.count})</span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-bluelock-green dark:bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div>
            {activeTab === 'posts' && (
              <SocialFeed
                initialPosts={user.posts}
                currentUserId={currentUser?.user?.id || null}
                isGuest={!currentUser}
                onInteractionRequired={() => {
                  router.push('/login')
                  return false
                }}
              />
            )}
            {activeTab !== 'posts' && (
              <div className="p-8 text-center text-bluelock-dark/60 dark:text-gray-500 font-poppins">
                Tính năng này đang được phát triển
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block col-span-3">
          <RightSidebar trendingTopics={trendingTopics} currentUser={currentUser} />
        </div>
      </div>
      <ThemeToggle />
    </div>
  )
}

