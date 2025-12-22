import { prisma } from '@/lib/prisma'
import { getCurrentSession } from '@/lib/auth-helpers'
import dynamic from 'next/dynamic'
import CountdownLanding from '@/components/Landing/CountdownLanding'
import LaunchOverlay from '@/components/Landing/LaunchOverlay'

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
      linkUrl: true,
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
  // getCurrentSession() handles JWT errors gracefully
  const session = await getCurrentSession()

  // Pre-launch landing page (countdown). After launch time, fall through to normal homepage.
  // Configure via NEXT_PUBLIC_LAUNCH_AT (ISO string). Default: 2025-12-20 (VN timezone).
  const launchAtRaw = process.env.NEXT_PUBLIC_LAUNCH_AT || '2025-12-20T00:00:00+07:00'
  const launchAt = new Date(launchAtRaw)
  const now = new Date()
  const isValidLaunchDate = !isNaN(launchAt.getTime())

  // If logged in and landing is active, clicking should go to dashboard, not login.
  const landingHref = session ? '/dashboard' : '/login'

  if (isValidLaunchDate && now < launchAt) {
    // Before launch: show countdown with rocket. User can click rocket to open login.
    return <CountdownLanding launchAtIso={launchAtRaw} href={landingHref} />
  }
  
  const posts = await getPublicPosts()

  return (
    <>
      {/* After launch: show normal homepage, but run one-time rocket launch overlay for each user who hasn't seen it yet */}
      {isValidLaunchDate && <LaunchOverlay launchAtIso={launchAtRaw} href={landingHref} />}
      <HomePage initialPosts={posts} session={session} />
    </>
  )
}
