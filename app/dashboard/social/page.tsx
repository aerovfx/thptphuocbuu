import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SocialFeed from '@/components/Social/SocialFeed'
import CreatePost from '@/components/Social/CreatePost'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'

async function getPosts() {
  // Auto-publish scheduled posts that are due
  const now = new Date()
  try {
    await prisma.post.updateMany({
      where: {
        AND: [
          { scheduledAt: { lte: now } },
          { scheduledAt: { not: null } },
        ],
      },
      data: {
        scheduledAt: null,
      },
    })
  } catch (error: any) {
    // Silently fail if there's an error (e.g., field doesn't exist yet)
    if (error?.code !== 'P2009' && error?.code !== 'P2011') {
      console.error('Error publishing scheduled posts:', error)
    }
  }

  const posts = await prisma.post.findMany({
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
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  
  // Filter out scheduled posts that haven't been published yet
  return posts.filter((post: any) => {
    if (!post.scheduledAt) return true // No schedule = published
    try {
      return new Date(post.scheduledAt) <= now // Scheduled time passed = published
    } catch {
      return true // If date parsing fails, treat as published
    }
  })
}

async function getTrendingTopics() {
  return [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Gumayusi', posts: '28.9K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Built', posts: '261K' },
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Real-time', posts: '144K' },
  ]
}

export default async function SocialPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const [posts, trendingTopics] = await Promise.all([getPosts(), getTrendingTopics()])

  return (
    <SharedLayout
      title="Mạng xã hội"
      showCreatePost={true}
      rightSidebar={
        <RightSidebar
          trendingTopics={trendingTopics}
          currentUser={session}
          showWhoToFollow={false}
        />
      }
    >
      <div className="divide-y divide-gray-800">
        <div className="p-4 border-b border-gray-800" data-create-post>
          <CreatePost />
        </div>
        <div className="p-4">
          <SocialFeed initialPosts={posts} currentUserId={session.user.id} />
        </div>
      </div>
    </SharedLayout>
  )
}

