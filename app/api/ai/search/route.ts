import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { semanticSearch } from '@/lib/ai-service'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has Premium or Admin access for AI features
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, role: true },
    })

    const hasAIAccess = user?.isPremium === true || user?.role === 'ADMIN'

    const body = await request.json()
    const { query, type = 'text', limit = 20 } = body

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query không được để trống' }, { status: 400 })
    }

    // Check access for semantic search
    if ((type === 'semantic' || type === 'hybrid') && !hasAIAccess) {
      return NextResponse.json(
        { 
          error: 'Tính năng AI chỉ dành cho tài khoản Premium và Quản trị viên',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    // Perform semantic search
    let semanticResults: Array<{ id: string; score: number }> = []
    
    if ((type === 'semantic' || type === 'hybrid') && hasAIAccess) {
      try {
        semanticResults = await semanticSearch(query)
      } catch (error) {
        console.error('Semantic search error:', error)
        // Continue with text search if semantic fails
      }
    }

    // Build text search query
    const textSearchWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { sender: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { ocrText: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ],
    }

    // Role-based filtering
    if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
      textSearchWhere.assignments = {
        some: {
          assignedToId: session.user.id,
        },
      }
    }

    // Get text search results
    const textSearchDocs = await prisma.incomingDocument.findMany({
      where: textSearchWhere,
      select: {
        id: true,
        title: true,
        documentNumber: true,
        summary: true,
        sender: true,
        status: true,
        type: true,
        priority: true,
        receivedDate: true,
      },
      take: limit,
      orderBy: { receivedDate: 'desc' },
    })

    // Combine results
    const results: Array<{
      id: string
      title: string
      type: 'incoming' | 'outgoing' | 'general'
      documentNumber?: string | null
      summary?: string | null
      sender?: string | null
      score?: number
      status?: string
    }> = []

    // Add semantic search results with scores
    const semanticDocIds = new Set(semanticResults.map((r) => r.id))
    const semanticScoreMap = new Map(semanticResults.map((r) => [r.id, r.score]))

    // Add text search results
    textSearchDocs.forEach((doc) => {
      const score = semanticScoreMap.get(doc.id) || 1.0
      results.push({
        id: doc.id,
        title: doc.title,
        type: 'incoming',
        documentNumber: doc.documentNumber,
        summary: doc.summary,
        sender: doc.sender,
        score: score,
        status: doc.status,
      })
    })

    // Add semantic-only results (if any)
    if (semanticResults.length > 0) {
      const semanticDocIdsSet = new Set(textSearchDocs.map((d) => d.id))
      for (const semanticResult of semanticResults) {
        if (!semanticDocIdsSet.has(semanticResult.id)) {
          // Fetch document details
          const doc = await prisma.incomingDocument.findUnique({
            where: { id: semanticResult.id },
            select: {
              id: true,
              title: true,
              documentNumber: true,
              summary: true,
              sender: true,
              status: true,
            },
          })

          if (doc) {
            results.push({
              id: doc.id,
              title: doc.title,
              type: 'incoming',
              documentNumber: doc.documentNumber,
              summary: doc.summary,
              sender: doc.sender,
              score: semanticResult.score,
              status: doc.status,
            })
          }
        }
      }
    }

    // Sort by score (semantic results first, then text results)
    results.sort((a, b) => (b.score || 1.0) - (a.score || 1.0))

    // Limit results
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({
      results: limitedResults,
      query,
      type,
      total: results.length,
    })
  } catch (error: any) {
    console.error('Error in semantic search:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tìm kiếm', details: error.message },
      { status: 500 }
    )
  }
}

