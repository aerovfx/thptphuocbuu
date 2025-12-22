import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SocialFeed from '@/components/Social/SocialFeed'
import CreatePost from '@/components/Social/CreatePost'
import SharedLayout from '@/components/Layout/SharedLayout'

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
          brandBadges: {
            where: {
              isActive: true,
              brand: { verificationStatus: 'APPROVED' },
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              badgeType: true,
              badgeIconUrl: true,
              brand: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  verificationStatus: true,
                },
              },
            },
          },
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
  const published = posts.filter((post: any) => {
    if (!post.scheduledAt) return true // No schedule = published
    try {
      return new Date(post.scheduledAt) <= now // Scheduled time passed = published
    } catch {
      return true // If date parsing fails, treat as published
    }
  })

  const normalized = published.map((p: any) => {
    const brandBadge = p.author?.brandBadges?.[0] || null
    const author = { ...p.author, brandBadge }
    delete author.brandBadges
    return { ...p, author }
  })

  // Prioritize verified brand posts
  normalized.sort((a: any, b: any) => {
    const aBoost = a.author?.brandBadge?.brand?.verificationStatus === 'APPROVED' ? 1 : 0
    const bBoost = b.author?.brandBadge?.brand?.verificationStatus === 'APPROVED' ? 1 : 0
    if (aBoost !== bBoost) return bBoost - aBoost
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return normalized
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

