import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRankedFeed } from '@/lib/feed-service'

/**
 * GET /api/posts/feed
 * 
 * Trả về ranked feed với thuật toán tối ưu news feed
 * 
 * Query params:
 * - tab: 'top' | 'latest' (default: 'top')
 * - q: search query (optional)
 * - limit: số lượng posts (default: 50)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'top'
    const query = searchParams.get('q') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const posts = await getRankedFeed(session?.user?.id || null, tab, query, limit)

    return NextResponse.json(posts)
  } catch (error: any) {
    console.error('Error fetching ranked feed:', error)
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error?.message || 'Internal server error'
        : 'Internal server error'
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    )
  }
}

