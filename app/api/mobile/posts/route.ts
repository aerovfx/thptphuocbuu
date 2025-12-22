import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key'

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

async function verifyToken(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch {
    return null
  }
}

// GET /api/mobile/posts - Get posts feed
export async function GET(request: Request) {
  try {
    const decoded = await verifyToken(request)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get posts with author info, prioritizing verified brands
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
      ],
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            brandBadges: {
              where: { isActive: true },
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                    verificationStatus: true,
                  },
                },
              },
              take: 1,
            },
            ownedBrand: {
              select: {
                id: true,
                name: true,
                verificationStatus: true,
              },
            },
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
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

    // Sort posts: verified brands first
    const sortedPosts = posts.sort((a, b) => {
      const aHasBadge = a.author.brandBadges.length > 0 || a.author.ownedBrand
      const bHasBadge = b.author.brandBadges.length > 0 || b.author.ownedBrand
      if (aHasBadge && !bHasBadge) return -1
      if (!aHasBadge && bHasBadge) return 1
      return 0
    })

    const formattedPosts = sortedPosts.map((post) => ({
      id: post.id,
      content: post.content,
      type: post.type,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      linkUrl: post.linkUrl,
      author: {
        id: post.author.id,
        name: `${post.author.firstName} ${post.author.lastName}`,
        avatar: post.author.avatar,
        role: post.author.role,
        brandBadge: post.author.brandBadges[0]?.brand?.name || post.author.ownedBrand?.name || null,
      },
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: post.likes.some((like) => like.userId === decoded.id),
      createdAt: post.createdAt,
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Mobile get posts error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách bài viết' },
      { status: 500, headers: corsHeaders }
    )
  }
}

