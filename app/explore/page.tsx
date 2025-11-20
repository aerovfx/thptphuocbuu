import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExplorePage from '@/components/Explore/ExplorePage'
import { getRankedFeed } from '@/lib/feed-service'

async function getTrendingTopics() {
  // Mock trending topics - in real app, this would be calculated from posts
  return [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Gumayusi', posts: '28.9K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Built', posts: '261K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Real-time', posts: '144K' },
    { category: 'Doanh nghiệp & Tài chính - Nổi bật', name: 'Incredible', posts: '147K' },
  ]
}

async function searchUsers(query: string) {
  if (!query) return []
  
  // SQLite doesn't support case-insensitive mode, use contains without mode
  // We'll filter case-insensitively in application code if needed
  const lowerQuery = query.toLowerCase()
  
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
    },
    take: 50, // Get more to filter
  })

  // Filter case-insensitively in application
  return allUsers
    .filter(
      (user) =>
        user.firstName.toLowerCase().includes(lowerQuery) ||
        user.lastName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 10)
}

async function searchPosts(query: string, tab: string = 'top', userId?: string) {
  // Sử dụng ranked feed service cho tab 'top'
  if (tab === 'top' && !query) {
    try {
      const posts = await getRankedFeed(userId || null, 'top', undefined, 50)
      return posts.map((post) => ({
        ...post,
        createdAt: new Date(post.createdAt),
      }))
    } catch (error) {
      console.error('Error fetching ranked feed:', error)
      // Fallback to direct query
    }
  }

  // Fallback: direct query cho search hoặc latest tab
  if (!query && tab === 'latest') {
    const allPosts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return allPosts
      .filter((post) => post.content?.trim() || post.imageUrl || post.videoUrl)
      .map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
      }))
  }

  if (!query) return []
  
  // SQLite doesn't support case-insensitive mode
  // Get all recent posts and filter in application
  const lowerQuery = query.toLowerCase()
  
  const allPosts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          reposts: true,
          bookmarks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Get more to filter
  })

  // Filter case-insensitively in application
  return allPosts
    .filter((post) => post.content.toLowerCase().includes(lowerQuery))
    .slice(0, 20)
    .map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
    }))
}

export default async function ExplorePageWrapper({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>
}) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const query = params.q || ''
  const tab = params.tab || 'top'
  
  const [trendingTopics, users, posts] = await Promise.all([
    getTrendingTopics(),
    tab === 'people' ? searchUsers(query) : [],
    // Use ranked feed for 'top' tab, search for others
    searchPosts(query, tab, session?.user?.id),
  ])

  return (
    <ExplorePage
      initialQuery={query}
      initialTab={tab}
      trendingTopics={trendingTopics}
      users={users}
      posts={posts}
      session={session}
    />
  )
}

