import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/auth-helpers'
import dynamic from 'next/dynamic'

// Lazy load HomePage to reduce initial bundle size
const HomePage = dynamic(() => import('@/components/home/HomePage'), {
  ssr: true,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  ),
})

async function getPublicPosts() {
  const now = new Date()
  try {
    // Auto-publish scheduled posts that are due
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
  } catch (error: unknown) {
    // Silently fail if schema/validation error; log others except connection issues
    const err = error as { code?: string }
    if (err?.code !== 'P2009' && err?.code !== 'P2011' && err?.code !== 'P1001') {
      console.error('Error publishing scheduled posts:', error)
    }
  }

  try {
    // Optimized: Use select instead of include; include images + reposts for feed UI
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        type: true,
        imageUrl: true,
        images: true,
        videoUrl: true,
        linkUrl: true,
        locationName: true,
        latitude: true,
        longitude: true,
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
          },
        },
      },
      where: {
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return posts
  } catch (error: unknown) {
    // DB unreachable (e.g. PostgreSQL not running, wrong DATABASE_URL) — render page with empty posts
    const err = error as { code?: string; name?: string }
    const isConnectionError =
      err?.code === 'P1001' ||
      err?.name === 'PrismaClientInitializationError'
    if (isConnectionError && process.env.NODE_ENV === 'development') {
      console.warn(
        '[Home] Database unreachable. Start PostgreSQL or set DATABASE_URL in .env.local. Showing empty posts.'
      )
    }
    return []
  }
}

export default async function Home() {
  // Safely get session with error handling for JWT decryption errors
  // getCurrentSession() handles JWT errors gracefully
  const session = await getCurrentSession()

  const posts = await getPublicPosts()

  return <HomePage initialPosts={posts} session={session} />
}
