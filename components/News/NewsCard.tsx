'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Eye, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import Avatar from '../Common/Avatar'

interface NewsCardProps {
  article: {
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
  }
  variant?: 'default' | 'compact' | 'featured'
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

export default function NewsCard({ article, variant = 'default' }: NewsCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/news/${article.slug}`}
        className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:bg-gray-800 transition-colors group"
      >
        {article.featuredImage && (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-poppins">
              {categoryLabels[article.category] || article.category}
            </span>
            {article.department && (
              <span className="text-xs text-gray-500 font-poppins">
                {article.department.name}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors font-poppins">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-gray-400 line-clamp-2 font-poppins">{article.excerpt}</p>
          )}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
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
              <span className="font-poppins">{article.views}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/news/${article.slug}`}
        className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:bg-gray-800 transition-colors group"
      >
        <div className="flex flex-col md:flex-row">
          {article.featuredImage && (
            <div className="relative w-full md:w-1/3 h-64 md:h-auto overflow-hidden">
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 p-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-poppins">
                {categoryLabels[article.category] || article.category}
              </span>
              {article.department && (
                <span className="text-xs text-gray-500 font-poppins">
                  {article.department.name}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors font-poppins">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="text-gray-400 mb-4 line-clamp-3 font-poppins">{article.excerpt}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={article.author.avatar}
                  name={`${article.author.firstName} ${article.author.lastName}`}
                  size="sm"
                />
                <div>
                  <p className="text-sm text-white font-poppins">
                    {article.author.firstName} {article.author.lastName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span className="font-poppins">
                      {article.publishedAt
                        ? formatDistanceToNow(new Date(article.publishedAt), {
                            addSuffix: true,
                            locale: vi,
                          })
                        : 'Chưa xuất bản'}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="text-gray-500 group-hover:text-blue-500 transition-colors" size={20} />
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/news/${article.slug}`}
      className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:bg-gray-800 transition-colors group"
    >
      {article.featuredImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-poppins">
            {categoryLabels[article.category] || article.category}
          </span>
          {article.department && (
            <span className="text-xs text-gray-500 font-poppins">{article.department.name}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors font-poppins">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-gray-400 mb-4 line-clamp-3 font-poppins">{article.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3">
            <Avatar
              src={article.author.avatar}
              name={`${article.author.firstName} ${article.author.lastName}`}
              size="sm"
            />
            <div>
              <p className="text-white font-poppins">
                {article.author.firstName} {article.author.lastName}
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar size={12} />
                <span className="font-poppins">
                  {article.publishedAt
                    ? formatDistanceToNow(new Date(article.publishedAt), {
                        addSuffix: true,
                        locale: vi,
                      })
                    : 'Chưa xuất bản'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Eye size={14} />
            <span className="font-poppins">{article.views}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

