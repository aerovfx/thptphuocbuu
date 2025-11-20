import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-helpers'
import { z } from 'zod'
import { slugify } from '@/lib/utils'

const newsArticleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  featuredImage: z.string().url().optional().or(z.literal('')),
  category: z.enum([
    'EDUCATION',
    'RESEARCH',
    'INNOVATION',
    'CAMPUS_LIFE',
    'ALUMNI',
    'EVENTS',
    'ANNOUNCEMENTS',
    'GENERAL',
  ]),
  departmentId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isTopNews: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
})

export async function POST(request: Request) {
  try {
    // Require ADMIN or TEACHER role
    const { session, error } = await requireRoleAPI(['ADMIN', 'TEACHER'])
    if (error) {
      return error
    }

    const body = await request.json()
    const validatedData = newsArticleSchema.parse(body)

    // Generate slug from title
    const baseSlug = slugify(validatedData.title)
    let slug = baseSlug
    let counter = 1

    // Ensure unique slug
    while (await prisma.newsArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const article = await prisma.newsArticle.create({
      data: {
        ...validatedData,
        slug,
        authorId: session.user.id,
        status: validatedData.publishedAt ? 'PUBLISHED' : 'DRAFT',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        featuredImage: validatedData.featuredImage || null,
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
        department: true,
      },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating news article:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo bài viết' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const department = searchParams.get('department')
    const featured = searchParams.get('featured') === 'true'
    const topNews = searchParams.get('topNews') === 'true'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      status: 'PUBLISHED',
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (department) {
      where.department = { slug: department }
    }

    if (featured) {
      where.isFeatured = true
    }

    if (topNews) {
      where.isTopNews = true
    }

    if (search) {
      // SQLite doesn't support case-insensitive mode
      // We'll filter in application code
      const lowerSearch = search.toLowerCase()
      const allArticles = await prisma.newsArticle.findMany({
        where: {
          status: 'PUBLISHED',
          ...(category && category !== 'all' ? { category: category as any } : {}),
          ...(department ? { department: { slug: department } } : {}),
          ...(featured ? { isFeatured: true } : {}),
          ...(topNews ? { isTopNews: true } : {}),
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
          department: true,
        },
        orderBy: [
          { isTopNews: 'desc' },
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: 200, // Get more to filter
      })

      const filtered = allArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(lowerSearch) ||
          article.excerpt?.toLowerCase().includes(lowerSearch) ||
          article.content.toLowerCase().includes(lowerSearch)
      )

      return NextResponse.json({
        articles: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset,
      })
    }

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          department: true,
        },
        orderBy: [
          { isTopNews: 'desc' },
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.newsArticle.count({ where }),
    ])

    return NextResponse.json({
      articles,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching news articles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

