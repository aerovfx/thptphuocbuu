import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { semanticSearch } from '@/lib/ai-service'

// GET - Semantic and text search for documents
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type') // 'incoming' | 'outgoing' | 'all'
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const searchType = searchParams.get('searchType') || 'text' // 'text' | 'semantic' | 'hybrid'

    if (!q.trim()) {
      return NextResponse.json({ error: 'Query không được để trống' }, { status: 400 })
    }

    // Check if user has Premium or Admin access for AI features
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, role: true },
    })

    const hasAIAccess = user?.isPremium === true || user?.role === 'ADMIN'

    // Try semantic search if enabled and user has access
    let semanticResults: Array<{ id: string; score: number }> = []
    if ((searchType === 'semantic' || searchType === 'hybrid') && hasAIAccess) {
      try {
        semanticResults = await semanticSearch(q)
      } catch (error) {
        console.error('Semantic search error:', error)
        // Continue with text search if semantic fails
      }
    } else if (searchType === 'semantic' || searchType === 'hybrid') {
      // User doesn't have access, return error
      return NextResponse.json(
        { 
          error: 'Tính năng AI chỉ dành cho tài khoản Premium và Quản trị viên',
          requiresPremium: true 
        },
        { status: 403 }
      )
    }

    const results: any[] = []
    const semanticDocIds = new Set(semanticResults.map((r) => r.id))
    const semanticScoreMap = new Map(semanticResults.map((r) => [r.id, r.score]))

    // Search incoming documents
    if (!type || type === 'incoming' || type === 'all') {
      const where: any = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { sender: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { ocrText: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
        ],
      }

      if (status) {
        where.status = status
      }
      if (priority) {
        where.priority = priority
      }

      // Role-based filtering
      if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
        where.assignments = {
          some: {
            assignedToId: session.user.id,
          },
        }
      }

      const incomingDocs = await prisma.incomingDocument.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          assignments: {
            include: {
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              approvals: true,
              assignments: true,
            },
          },
        },
        orderBy: { receivedDate: 'desc' },
        take: limit * 2, // Get more to account for semantic results
      })

      incomingDocs.forEach((doc) => {
        const score = semanticScoreMap.get(doc.id) || 1.0
        results.push({
          ...doc,
          documentType: 'incoming',
          relevanceScore: score,
        })
      })
    }

    // Search outgoing documents
    if (!type || type === 'outgoing' || type === 'all') {
      const where: any = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { recipient: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      }

      if (status) {
        where.status = status
      }
      if (priority) {
        where.priority = priority
      }

      // Role-based filtering
      if (session.user.role === 'STUDENT' || session.user.role === 'PARENT') {
        where.approvals = {
          some: {
            approverId: session.user.id,
          },
        }
      } else if (session.user.role === 'TEACHER') {
        where.createdById = session.user.id
      }

      const outgoingDocs = await prisma.outgoingDocument.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              approvals: true,
              signatures: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      })

      outgoingDocs.forEach((doc) => {
        const score = semanticScoreMap.get(doc.id) || 1.0
        results.push({
          ...doc,
          documentType: 'outgoing',
          relevanceScore: score,
        })
      })
    }

    // Sort by relevance score (semantic results first)
    results.sort((a, b) => (b.relevanceScore || 1.0) - (a.relevanceScore || 1.0))

    // Paginate
    const paginatedResults = results.slice(skip, skip + limit)
    const total = results.length

    return NextResponse.json({
      documents: paginatedResults,
      query: q,
      searchType,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error searching documents:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tìm kiếm', details: error.message },
      { status: 500 }
    )
  }
}


