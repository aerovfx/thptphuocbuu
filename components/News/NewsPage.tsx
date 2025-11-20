'use client'

import { useState } from 'react'
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
  Hash,
  Calendar,
  Eye,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react'
import SharedLayout from '../Layout/SharedLayout'
import RightSidebar from '../Layout/RightSidebar'
import NewsCard from './NewsCard'
import FeaturedNews from './FeaturedNews'
import CategoryFilter from './CategoryFilter'
import Avatar from '../Common/Avatar'
import Logo from '../Common/Logo'

interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  category: string
  status: string
  views: number
  isFeatured: boolean
  isTopNews: boolean
  publishedAt: Date | null
  author: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  department: {
    id: string
    name: string
    slug: string
  } | null
}

interface NewsDepartment {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

interface NewsPageProps {
  articles: NewsArticle[]
  featuredNews: NewsArticle[]
  topNews: NewsArticle[]
  departments: NewsDepartment[]
  session: any
}

const categories = [
  { id: 'all', label: 'Tất cả', icon: Hash },
  { id: 'EDUCATION', label: 'Giáo dục', icon: Hash },
  { id: 'RESEARCH', label: 'Nghiên cứu', icon: Hash },
  { id: 'INNOVATION', label: 'Đổi mới', icon: Hash },
  { id: 'CAMPUS_LIFE', label: 'Đời sống', icon: Hash },
  { id: 'ALUMNI', label: 'Cựu học sinh', icon: Hash },
  { id: 'EVENTS', label: 'Sự kiện', icon: Hash },
  { id: 'ANNOUNCEMENTS', label: 'Thông báo', icon: Hash },
]

export default function NewsPage({
  articles,
  featuredNews,
  topNews,
  departments,
  session,
}: NewsPageProps) {
  const { data: sessionData } = useSession()
  const router = useRouter()
  const currentUser = sessionData || session
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filteredArticles =
    selectedCategory === 'all'
      ? articles
      : articles.filter((article) => article.category === selectedCategory)

  const searchResults = searchQuery
    ? filteredArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredArticles

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Tin tức', href: '/news', icon: Hash },
    { name: 'Khám phá', href: '/explore', icon: Search },
    { name: 'Thông báo', href: '/notifications', icon: Bell, requireAuth: true },
    { name: 'Tin nhắn', href: '/messages', icon: Mail, requireAuth: true },
    { name: 'Hồ sơ', href: currentUser ? '/dashboard' : '/login', icon: User },
  ]

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Giáo dục', posts: '1.2K' },
    { category: 'Chủ đề nổi trội', name: 'Nghiên cứu', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Sự kiện', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Tin tức"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={currentUser} />}
    >
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/news" className="flex items-center space-x-2">
                  <Logo size={32} className="cursor-pointer" />
                  <span className="text-xl font-bold font-montserrat text-white">News</span>
                </Link>
                <div className="hidden md:flex items-center space-x-6">
                  <button className="text-gray-400 hover:text-white font-poppins text-sm">
                    Browse
                  </button>
                  <button className="text-gray-400 hover:text-white font-poppins text-sm">
                    Topics
                  </button>
                  <button className="text-gray-400 hover:text-white font-poppins text-sm">
                    Departments
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:block relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm tin tức..."
                    className="bg-gray-900 rounded-full pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins text-sm w-64"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-gray-400 hover:text-white"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top News Section */}
          {topNews.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 font-poppins">Tin tức nổi bật</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topNews.map((article) => (
                  <NewsCard key={article.id} article={article} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {/* Featured News Section */}
          {featuredNews.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 font-poppins">Tin tức đặc biệt</h2>
              <FeaturedNews articles={featuredNews} />
            </section>
          )}

          {/* Category Filter */}
          <div className="mb-8">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Recent News */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-poppins">
                {selectedCategory === 'all' ? 'Tất cả tin tức' : categories.find((c) => c.id === selectedCategory)?.label}
              </h2>
              <span className="text-gray-500 text-sm font-poppins">
                {searchResults.length} bài viết
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                <Hash className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-400 font-poppins">Không tìm thấy tin tức nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </SharedLayout>
  )
}

