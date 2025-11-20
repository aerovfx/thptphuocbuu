import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import HomePage from '@/components/Home/HomePage'

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
    take: 50,
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

export default async function Home() {
  const session = await getServerSession(authOptions)
  const posts = await getPublicPosts()

  return <HomePage initialPosts={posts} session={session} />
}
