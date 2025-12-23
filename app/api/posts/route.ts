import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { feedCache } from '@/lib/cache'
import { broadcastFeedUpdate } from '@/lib/feed-broadcast'
import { extractFirstUrl } from '@/lib/media-embed'
import { moderateContent } from '@/lib/content-moderation'
import { sendEmail } from '@/lib/email'
import { withCsrfProtection } from '@/lib/csrf-middleware'

const postSchema = z.object({
  content: z.string().optional().default(''),
  imageUrl: z.string().optional().nullable().transform((val) => (val && val.trim() ? val.trim() : null)),
  images: z.array(z.string()).optional().default([]),
  videoUrl: z.string().optional().nullable().transform((val) => (val && val.trim() ? val.trim() : null)),
  linkUrl: z.string().optional().nullable().transform((val) => (val && val.trim() ? val.trim() : null)),
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
  const hasImages = data.images && data.images.length > 0
  const hasVideo = data.videoUrl && data.videoUrl.length > 0
  const hasLink = data.linkUrl && data.linkUrl.length > 0
  return hasContent || hasImage || hasImages || hasVideo || hasLink
}, {
  message: 'Post must have content or media',
  path: ['content'],
})

export const POST = withCsrfProtection(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure the session user exists in DB. If token is missing id (or points to a deleted user),
    // creating a post will violate posts_authorId_fkey and crash with 500.
    let authorId = session.user.id
    if (!authorId || authorId.trim() === '') {
      // Fallback to email lookup
      const byEmail = session.user.email
        ? await prisma.user.findUnique({ where: { email: session.user.email } })
        : null
      if (!byEmail) {
        return NextResponse.json(
          { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
          { status: 401 }
        )
      }
      authorId = byEmail.id
    } else {
      const exists = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      })
      if (!exists) {
        // Try to recover by email (handles stale token ids after DB reset/migration)
        const byEmail = session.user.email
          ? await prisma.user.findUnique({ where: { email: session.user.email } })
          : null
        if (!byEmail) {
          return NextResponse.json(
            { error: 'Tài khoản không tồn tại. Vui lòng đăng nhập lại.' },
            { status: 401 }
          )
        }
        authorId = byEmail.id
      }
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
      images: Array.isArray(body.images) ? body.images.filter((img: any) => img && typeof img === 'string' && img.trim()) : [],
      videoUrl: body.videoUrl && body.videoUrl.trim() ? body.videoUrl.trim() : null,
      linkUrl: body.linkUrl && body.linkUrl.trim() ? body.linkUrl.trim() : null,
      type: body.type,
      locationName: body.locationName && body.locationName.trim() ? body.locationName.trim() : null,
      latitude: body.latitude != null ? (typeof body.latitude === 'number' ? body.latitude : parseFloat(String(body.latitude))) : null,
      longitude: body.longitude != null ? (typeof body.longitude === 'number' ? body.longitude : parseFloat(String(body.longitude))) : null,
      scheduledAt: body.scheduledAt && typeof body.scheduledAt === 'string' && body.scheduledAt.trim() ? body.scheduledAt : null,
    }

    const validatedData = postSchema.parse(normalizedBody)

    // Content moderation ONLY for text content (not URLs)
    // XSS protection should not block legitimate video/image URLs
    if (validatedData.content && validatedData.content.trim()) {
      const moderation = await moderateContent(
        validatedData.content,
        session.user.role as any,  // Type cast for Next Auth session type
        'POST',
        authorId
      )

      // XSS detection - block malicious code in text
      if (moderation.xssDetected) {
        return NextResponse.json(
          {
            error: moderation.message || 'Nội dung chứa mã HTML/JavaScript không được phép',
            sanitized: moderation.sanitizedContent,
            code: 'XSS_BLOCKED',
          },
          { status: 400 }
        )
      }

      // Profanity/offensive content check
      if (!moderation.allowed) {
        return NextResponse.json(
          {
            error: moderation.message || 'Nội dung có chứa từ ngữ không phù hợp',
            code: 'CONTENT_BLOCKED',
            violations: moderation.violations,
            suggestions: moderation.suggestions,
          },
          { status: 400 }
        )
      }
    }

    // URLs (videoUrl, imageUrl, linkUrl) are NOT checked by XSS protection
    // They are validated by Zod schema for format only


    // If user pasted a link in content and didn't explicitly set linkUrl/imageUrl/videoUrl/images,
    // auto-detect the first URL and store it in linkUrl for embedding.
    let linkUrl = validatedData.linkUrl
    const hasImages = validatedData.images && validatedData.images.length > 0
    if (!linkUrl && !validatedData.imageUrl && !validatedData.videoUrl && !hasImages && validatedData.content) {
      const first = extractFirstUrl(validatedData.content)
      if (first) linkUrl = first
    }

    // Determine post type based on media
    const postType = validatedData.videoUrl
      ? 'VIDEO'
      : (validatedData.imageUrl || hasImages)
        ? 'IMAGE'
        : linkUrl
          ? 'LINK'
          : 'TEXT'

    const post = await prisma.post.create({
      data: {
        content: validatedData.content || '',
        authorId,
        type: validatedData.type || postType,
        imageUrl: validatedData.imageUrl || null,
        images: validatedData.images || [],
        videoUrl: validatedData.videoUrl || null,
        linkUrl: linkUrl || null,
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
            bookmarks: true,
          },
        },
      },
    })

    // Flatten brand badge shape for the client
    const normalizedPost: any = {
      ...post,
      author: {
        ...post.author,
        brandBadge: (post.author as any).brandBadges?.[0] || null,
      },
    }
    delete normalizedPost.author.brandBadges

    // Email support/notification when an affiliated account posts (verified brand only)
    try {
      const member = await prisma.brandMember.findFirst({
        where: {
          userId: authorId,
          brand: { verificationStatus: 'APPROVED' },
        },
        select: {
          brand: {
            select: {
              name: true,
              createdBy: { select: { email: true } },
            },
          },
        },
      })

      if (member?.brand?.createdBy?.email) {
        const supportEmail = process.env.BRAND_SUPPORT_EMAIL
        const recipients = Array.from(
          new Set([member.brand.createdBy.email, supportEmail].filter(Boolean))
        ) as string[]
        const authorName = `${post.author.firstName} ${post.author.lastName}`.trim()
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const postUrl = `${appUrl}/dashboard/social`

        await Promise.all(
          recipients.map((email) =>
            sendEmail({
              to: email,
              subject: `[Brand] Bài đăng mới - ${member.brand.name}`,
              html: `
                <h3>Bài đăng mới từ tài khoản liên kết</h3>
                <p><strong>Thương hiệu:</strong> ${member.brand.name}</p>
                <p><strong>Tài khoản đăng:</strong> ${authorName}</p>
                <p><a href="${postUrl}">Mở hệ thống để xem</a></p>
              `,
              text: `Bài đăng mới từ tài khoản liên kết\nThương hiệu: ${member.brand.name}\nTài khoản đăng: ${authorName}\nXem: ${postUrl}`,
            })
          )
        )
      }
    } catch (e) {
      // Non-fatal
      console.error('Brand post email notify failed:', e)
    }

    // Invalidate cache and broadcast update
    await feedCache.invalidateAllFeeds()
    await broadcastFeedUpdate(session.user.id, 'new_post', {
      post: {
        id: normalizedPost.id,
        content: normalizedPost.content,
        author: normalizedPost.author,
      },
    })

    return NextResponse.json(normalizedPost, { status: 201 })
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
}) // Close withCsrfProtection wrapper


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
      (post: any) => post.content?.trim() || post.imageUrl || post.videoUrl || post.linkUrl
    )

    // Normalize + prioritize verified brand posts
    const normalized = filteredPosts.map((p: any) => {
      const brandBadge = p.author?.brandBadges?.[0] || null
      const author = { ...p.author, brandBadge }
      delete author.brandBadges
      return { ...p, author }
    })

    normalized.sort((a: any, b: any) => {
      const aBoost = a.author?.brandBadge?.brand?.verificationStatus === 'APPROVED' ? 1 : 0
      const bBoost = b.author?.brandBadge?.brand?.verificationStatus === 'APPROVED' ? 1 : 0
      if (aBoost !== bBoost) return bBoost - aBoost
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(normalized)
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

