'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Eye, ArrowLeft, Share2, Bookmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import SharedLayout from '../Layout/SharedLayout'
import RightSidebar from '../Layout/RightSidebar'
import NewsCard from './NewsCard'
import Avatar from '../Common/Avatar'

interface NewsArticlePageProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    content: string
    featuredImage: string | null
    category: string
    views: number
    publishedAt: Date | null
    author: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
      email: string
    }
    department: {
      name: string
      slug: string
    } | null
  }
  relatedArticles: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    featuredImage: string | null
    category: string
    views: number
    publishedAt: Date | null
    author: {
      id: string
      firstName: string
      lastName: string
      avatar: string | null
    }
    department: {
      name: string
      slug: string
    } | null
  }>
  session: any
}

const categoryLabels: Record<string, string> = {
  EDUCATION: 'Giáo dục',
  RESEARCH: 'Nghiên cứu',
  INNOVATION: 'Đổi mới',
  CAMPUS_LIFE: 'Đời sống',
  ALUMNI: 'Cựu học sinh',
  EVENTS: 'Sự kiện',
  ANNOUNCEMENTS: 'Thông báo',
  GENERAL: 'Chung',
}

export default function NewsArticlePage({
  article,
  relatedArticles,
  session,
}: NewsArticlePageProps) {
  const { data: sessionData } = useSession()
  const currentUser = sessionData || session

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Giáo dục', posts: '1.2K' },
    { category: 'Chủ đề nổi trội', name: 'Nghiên cứu', posts: '856' },
  ]

  return (
    <SharedLayout
      title={article.title}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={currentUser} />}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition-colors font-poppins"
        >
          <ArrowLeft size={20} />
          <span>Quay lại tin tức</span>
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-poppins">
              {categoryLabels[article.category] || article.category}
            </span>
            {article.department && (
              <span className="text-sm text-gray-500 font-poppins">{article.department.name}</span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 font-poppins">{article.title}</h1>

          {article.excerpt && (
            <p className="text-xl text-gray-400 mb-6 font-poppins">{article.excerpt}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar
                src={article.author.avatar}
                name={`${article.author.firstName} ${article.author.lastName}`}
                size="md"
              />
              <div>
                <p className="text-white font-semibold font-poppins">
                  {article.author.firstName} {article.author.lastName}
                </p>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span className="font-poppins">
                      {article.publishedAt
                        ? formatDistanceToNow(new Date(article.publishedAt), {
                            addSuffix: true,
                            locale: vi,
                          })
                        : 'Chưa xuất bản'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye size={14} />
                    <span className="font-poppins">{article.views} lượt xem</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <Bookmark size={20} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-invert max-w-none mb-12">
          <div
            className="text-gray-300 leading-relaxed font-poppins"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6 font-poppins">Tin tức liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <NewsCard key={relatedArticle.id} article={relatedArticle} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </SharedLayout>
  )
}

