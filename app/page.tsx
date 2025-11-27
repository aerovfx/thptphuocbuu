import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'

// Lazy load HomePage to reduce initial bundle size
const HomePage = dynamic(() => import('@/components/Home/HomePage'), {
  ssr: true,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  ),
})

async function getPublicPosts() {
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

  // Optimized: Use select instead of include, and limit fields
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      content: true,
      createdAt: true,
      type: true,
      imageUrl: true,
      videoUrl: true,
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
    where: {
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  
  // Posts are already filtered in the query, no need for additional filtering
  return posts
}

export default async function Home() {
  // Safely get session with error handling for JWT decryption errors
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error: any) {
    // Handle JWT decryption errors (e.g., when NEXTAUTH_SECRET changes)
    // This can happen when:
    // 1. NEXTAUTH_SECRET was changed
    // 2. Old session cookies exist from previous deployment
    // 3. Cookie is corrupted
    if (
      error?.message?.includes('decryption') || 
      error?.code === 'JWT_SESSION_ERROR' ||
      error?.message?.includes('JWT') ||
      error?.name === 'JWTDecodeError'
    ) {
      // Silently handle JWT errors - user will need to login again
      // Don't log as error to avoid noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Session decryption failed, treating as no session')
      }
      session = null
    } else {
      // Log other errors but don't crash the page
      console.error('[Auth] Unexpected error getting session:', error)
      session = null
    }
  }
  
  const posts = await getPublicPosts()

  return <HomePage initialPosts={posts} session={session} />
}
