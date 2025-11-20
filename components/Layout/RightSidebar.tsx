'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MoreHorizontal } from 'lucide-react'
import Avatar from '../Common/Avatar'

interface TrendingTopic {
  category: string
  name: string
  posts: string
}

interface RightSidebarProps {
  trendingTopics?: TrendingTopic[]
  showSearch?: boolean
  showPremium?: boolean
  showWhoToFollow?: boolean
  currentUser?: any
}

export default function RightSidebar({
  trendingTopics = [],
  showSearch = true,
  showPremium = true,
  showWhoToFollow = true,
  currentUser,
}: RightSidebarProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Search */}
      {showSearch && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-full px-4 py-3 flex items-center space-x-3 transition-colors duration-300">
          <Search size={20} className="text-bluelock-dark/60 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="bg-transparent border-none outline-none text-bluelock-dark dark:text-white flex-1 font-poppins placeholder-bluelock-dark/50 dark:placeholder-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = (e.target as HTMLInputElement).value
                if (query.trim()) {
                  router.push(`/explore?q=${encodeURIComponent(query.trim())}`)
                }
              }
            }}
          />
        </div>
      )}

      {/* Premium Subscription */}
      {showPremium && (
        <div className="bg-gradient-to-br from-bluelock-green/20 to-bluelock-purple/20 dark:from-blue-500/10 dark:to-purple-500/10 rounded-2xl p-4 border border-bluelock-green/30 dark:border-blue-500/20 transition-colors duration-300">
          <h2 className="text-xl font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">Đăng ký gói Premium</h2>
          <p className="text-bluelock-dark/70 dark:text-gray-400 text-sm mb-4 font-poppins">
            Đăng ký để mở khóa các tính năng mới và nếu đủ điều kiện, bạn sẽ được nhận một khoản
            chia sẻ doanh thu cho người sáng tạo nội dung.
          </p>
          <button className="w-full bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black px-4 py-2 rounded-full font-bold transition-colors font-poppins shadow-bluelock-glow dark:shadow-none">
            Đăng ký
          </button>
        </div>
      )}

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl overflow-hidden transition-colors duration-300">
          <h2 className="text-xl font-bold p-4 font-poppins text-bluelock-dark dark:text-white">Những điều đang diễn ra</h2>
          <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
            {trendingTopics.map((topic, index) => (
              <Link
                key={index}
                href={`/explore?q=${encodeURIComponent(topic.name)}&tab=latest`}
                className="hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 px-4 py-3 block transition-colors duration-300"
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
                    className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors duration-300 ml-2"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </Link>
            ))}
          </div>
          <button className="w-full px-4 py-3 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 text-left transition-colors duration-300 font-poppins">
            Hiển thị thêm
          </button>
        </div>
      )}

      {/* Who to Follow */}
      {showWhoToFollow && !currentUser && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl overflow-hidden transition-colors duration-300">
          <h2 className="text-xl font-bold p-4 font-poppins text-bluelock-dark dark:text-white">Bạn có thể thích</h2>
          <div className="divide-y divide-bluelock-blue/30 dark:divide-gray-800">
            <div className="px-4 py-3 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar name="Người dùng mẫu" size="md" />
                  <div>
                    <p className="font-semibold font-poppins text-bluelock-dark dark:text-white">Người dùng mẫu</p>
                    <p className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">@user</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black px-4 py-2 rounded-full font-semibold transition-colors font-poppins shadow-bluelock-glow dark:shadow-none"
                >
                  Theo dõi
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/register')}
            className="w-full px-4 py-3 text-bluelock-green dark:text-blue-500 hover:bg-bluelock-light-3 dark:hover:bg-gray-800/50 text-left transition-colors duration-300 font-poppins"
          >
            Hiển thị thêm
          </button>
        </div>
      )}

      {/* Login Prompt for Guests */}
      {!currentUser && (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-2xl p-4 border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          <h2 className="text-xl font-bold mb-2 font-poppins text-bluelock-dark dark:text-white">Bạn chưa đăng nhập</h2>
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
  )
}

