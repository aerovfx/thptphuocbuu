import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const postUpdateSchema = z.object({
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

// PUT - Update post
export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    // Normalize the data
    const normalizedBody = {
      content: body.content || '',
      imageUrl: body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null,
      videoUrl: body.videoUrl && typeof body.videoUrl === 'string' && body.videoUrl.trim() ? body.videoUrl.trim() : null,
      type: body.type,
      locationName: body.locationName && typeof body.locationName === 'string' && body.locationName.trim() ? body.locationName.trim() : null,
      latitude: body.latitude != null ? (typeof body.latitude === 'number' ? body.latitude : parseFloat(String(body.latitude))) : null,
      longitude: body.longitude != null ? (typeof body.longitude === 'number' ? body.longitude : parseFloat(String(body.longitude))) : null,
      scheduledAt: body.scheduledAt && typeof body.scheduledAt === 'string' && body.scheduledAt.trim() ? body.scheduledAt : null,
    }

    const validatedData = postUpdateSchema.parse(normalizedBody)

    // Determine post type based on media
    const postType = validatedData.videoUrl
      ? 'VIDEO'
      : validatedData.imageUrl
      ? 'IMAGE'
      : 'TEXT'

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: validatedData.content || '',
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
          },
        },
      },
    })

    return NextResponse.json(updatedPost, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating post:', error)
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

// DELETE - Delete post
export async function DELETE(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params

    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting post:', error)
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

