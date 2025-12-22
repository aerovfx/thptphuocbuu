import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clearFilterCache } from '@/lib/content-moderation'

// GET - List all filters
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const filters = await prisma.contentFilter.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(filters)
  } catch (error) {
    console.error('Error fetching filters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new filter
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      keyword,
      category,
      severity,
      replacement,
      description,
      isRegex,
      caseSensitive,
      wholeWord,
    } = body

    if (!keyword || !category || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const filter = await prisma.contentFilter.create({
      data: {
        keyword,
        category,
        severity,
        replacement: replacement || null,
        description: description || null,
        isRegex: isRegex || false,
        caseSensitive: caseSensitive || false,
        wholeWord: wholeWord !== undefined ? wholeWord : true,
        createdById: session.user.id,
        active: true,
      },
    })

    // Clear cache to reflect new filter
    clearFilterCache()

    return NextResponse.json(filter, { status: 201 })
  } catch (error: any) {
    console.error('Error creating filter:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update filter
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Filter ID required' }, { status: 400 })
    }

    const filter = await prisma.contentFilter.update({
      where: { id },
      data: updateData,
    })

    // Clear cache to reflect updated filter
    clearFilterCache()

    return NextResponse.json(filter)
  } catch (error: any) {
    console.error('Error updating filter:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete filter
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Filter ID required' }, { status: 400 })
    }

    await prisma.contentFilter.delete({
      where: { id },
    })

    // Clear cache to reflect deleted filter
    clearFilterCache()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting filter:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
