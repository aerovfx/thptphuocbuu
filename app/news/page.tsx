import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NewsPage from '@/components/News/NewsPage'

async function getNewsArticles() {
  return await prisma.newsArticle.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      department: true,
    },
    orderBy: [
      { isTopNews: 'desc' },
      { isFeatured: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: 50,
  })
}

async function getFeaturedNews() {
  return await prisma.newsArticle.findMany({
    where: {
      status: 'PUBLISHED',
      isFeatured: true,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      department: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
  })
}

async function getTopNews() {
  return await prisma.newsArticle.findMany({
    where: {
      status: 'PUBLISHED',
      isTopNews: true,
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      department: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 4,
  })
}

async function getDepartments() {
  return await prisma.newsDepartment.findMany({
    orderBy: { order: 'asc' },
    take: 10,
  })
}

export default async function NewsPageWrapper() {
  const session = await getServerSession(authOptions)
  const [articles, featuredNews, topNews, departments] = await Promise.all([
    getNewsArticles(),
    getFeaturedNews(),
    getTopNews(),
    getDepartments(),
  ])

  return (
    <NewsPage
      articles={articles}
      featuredNews={featuredNews}
      topNews={topNews}
      departments={departments}
      session={session}
    />
  )
}

