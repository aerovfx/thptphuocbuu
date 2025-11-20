import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import NewsArticlePage from '@/components/News/NewsArticlePage'

async function getArticle(slug: string) {
  const article = await prisma.newsArticle.findUnique({
    where: {
      slug,
      status: 'PUBLISHED',
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
        },
      },
      department: true,
    },
  })

  if (!article) {
    return null
  }

  // Increment views
  await prisma.newsArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  })

  // Get related articles
  const relatedArticles = await prisma.newsArticle.findMany({
    where: {
      status: 'PUBLISHED',
      category: article.category,
      id: { not: article.id },
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
    take: 3,
  })

  return { article, relatedArticles }
}

export default async function NewsArticlePageWrapper({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getServerSession(authOptions)
  const { slug } = await params
  const data = await getArticle(slug)

  if (!data) {
    notFound()
  }

  return <NewsArticlePage article={data.article} relatedArticles={data.relatedArticles} session={session} />
}

