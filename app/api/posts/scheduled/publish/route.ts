import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API endpoint để publish các scheduled posts đã đến giờ
// Có thể gọi từ cron job hoặc khi user truy cập
export async function POST(request: Request) {
  try {
    const now = new Date()
    
    // Try to update scheduled posts - handle gracefully if field doesn't exist
    try {
      const result = await prisma.post.updateMany({
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

      return NextResponse.json({
        message: `Published ${result.count} scheduled posts`,
        published: result.count,
      })
    } catch (error: any) {
      // If field doesn't exist or other Prisma errors, return success with 0 published
      if (error?.code === 'P2009' || error?.code === 'P2011' || error?.message?.includes('Unknown argument')) {
        return NextResponse.json({
          message: 'No scheduled posts to publish',
          published: 0,
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error publishing scheduled posts:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

// GET endpoint để check scheduled posts (for debugging)
export async function GET(request: Request) {
  try {
    const now = new Date()
    
    try {
      const scheduledPosts = await prisma.post.findMany({
        where: {
          AND: [
            { scheduledAt: { lte: now } },
            { scheduledAt: { not: null } },
          ],
        },
        select: {
          id: true,
          content: true,
          scheduledAt: true,
          createdAt: true,
        },
        take: 10,
      })

      return NextResponse.json({
        count: scheduledPosts.length,
        posts: scheduledPosts,
      })
    } catch (error: any) {
      // If field doesn't exist, return empty result
      if (error?.code === 'P2009' || error?.code === 'P2011' || error?.message?.includes('Unknown argument')) {
        return NextResponse.json({
          count: 0,
          posts: [],
        })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

