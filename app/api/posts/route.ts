import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { feedCache } from '@/lib/cache'
import { broadcastFeedUpdate } from '@/lib/feed-broadcast'

const postSchema = z.object({
  content: z.string().optional().default(''),
  imageUrl: z.string().optional().nullable().transform((val) => (val && val.trim() ? val.trim() : null)),
  videoUrl: z.string().optional().nullable().transform((val) => (val && val.trim() ? val.trim() : null)),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'LINK']).optional(),
  locationName: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  scheduledAt: z.preprocess((val) => {
    if (!val || val === null || val === undefined || val === '') return null
    if (val instanceof Date) return val
    if (typeof val === 'string') {
      try {
        const date = new Date(val)
        if (isNaN(date.getTime())) return null
        return date
      } catch {
        return null
      }
    }
    return null
  }, z.date().nullable().optional()),
}).refine((data) => {
  const hasContent = data.content && data.content.trim().length > 0
  const hasImage = data.imageUrl && data.imageUrl.length > 0
  const hasVideo = data.videoUrl && data.videoUrl.length > 0
  return hasContent || hasImage || hasVideo
}, {
  message: 'Post must have content or media',
  path: ['content'],
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Normalize the data - ensure empty strings become null for optional fields
    const normalizedBody = {
      content: body.content || '',
      imageUrl: body.imageUrl && body.imageUrl.trim() ? body.imageUrl.trim() : null,
      videoUrl: body.videoUrl && body.videoUrl.trim() ? body.videoUrl.trim() : null,
      type: body.type,
      locationName: body.locationName && body.locationName.trim() ? body.locationName.trim() : null,
      latitude: body.latitude != null ? (typeof body.latitude === 'number' ? body.latitude : parseFloat(String(body.latitude))) : null,
      longitude: body.longitude != null ? (typeof body.longitude === 'number' ? body.longitude : parseFloat(String(body.longitude))) : null,
      scheduledAt: body.scheduledAt && typeof body.scheduledAt === 'string' && body.scheduledAt.trim() ? body.scheduledAt : null,
    }
    
    const validatedData = postSchema.parse(normalizedBody)

    // Determine post type based on media
    const postType = validatedData.videoUrl
      ? 'VIDEO'
      : validatedData.imageUrl
      ? 'IMAGE'
      : 'TEXT'

    const post = await prisma.post.create({
      data: {
        content: validatedData.content || '',
        authorId: session.user.id,
        type: validatedData.type || postType,
        imageUrl: validatedData.imageUrl || null,
        videoUrl: validatedData.videoUrl || null,
        locationName: validatedData.locationName || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        scheduledAt: validatedData.scheduledAt || null,
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
        _count: {
          select: {
            likes: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    })

    // Invalidate cache and broadcast update
    await feedCache.invalidateAllFeeds()
    await broadcastFeedUpdate(session.user.id, 'new_post', {
      post: {
        id: post.id,
        content: post.content,
        author: post.author,
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating post:', error)
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Internal server error'
      : 'Internal server error'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Public endpoint - no authentication required
    const now = new Date()
    
    // First, publish any scheduled posts that are due
    // Skip this if scheduledAt field might not exist
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
      // Ignore errors if field doesn't exist yet or other Prisma errors
      if (error?.code === 'P2009' || error?.code === 'P2011' || error?.message?.includes('Unknown argument')) {
        // Field doesn't exist, skip publishing
      } else {
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
            bookmarks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    
    // Filter out scheduled posts that haven't been published yet
    // Handle case where scheduledAt might not exist on some posts
    const publishedPosts = posts.filter((post: any) => {
      if (!post.scheduledAt) return true // No schedule = published
      try {
        return new Date(post.scheduledAt) <= now // Scheduled time passed = published
      } catch {
        return true // If date parsing fails, treat as published
      }
    })

    // Filter out posts without content and media (empty posts)
    const filteredPosts = publishedPosts.filter(
      (post: any) => post.content?.trim() || post.imageUrl || post.videoUrl
    )

    return NextResponse.json(filteredPosts)
  } catch (error: any) {
    console.error('Error fetching posts:', error)
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Internal server error'
      : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error?.stack : undefined },
      { status: 500 }
    )
  }
}

