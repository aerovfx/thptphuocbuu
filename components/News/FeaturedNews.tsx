'use client'

import NewsCard from './NewsCard'

interface FeaturedNewsProps {
  articles: Array<{
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
}

export default function FeaturedNews({ articles }: FeaturedNewsProps) {
  if (articles.length === 0) return null

  const mainArticle = articles[0]
  const sideArticles = articles.slice(1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Featured Article */}
      <div className="lg:col-span-2">
        <NewsCard article={mainArticle} variant="featured" />
      </div>

      {/* Side Articles */}
      <div className="space-y-6">
        {sideArticles.map((article) => (
          <NewsCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    </div>
  )
}

