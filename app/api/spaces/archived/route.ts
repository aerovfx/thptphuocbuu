import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/spaces/archived
 * Get archived spaces grouped by academic year
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') // Filter by specific academic year

    const where: any = {
      archivedAt: { not: null }, // Only get archived spaces
    }

    if (academicYear) {
      where.academicYear = academicYear
    }

    const spaces = await prisma.space.findMany({
      where,
      include: {
        parent: true,
        _count: {
          select: {
            members: true,
            departments: true,
            documents: true,
          },
        },
      },
      orderBy: [
        { academicYear: 'desc' }, // Newest academic year first
        { archivedAt: 'desc' }, // Most recently archived first
      ],
    })

    // Group by academic year
    const groupedByYear: Record<string, typeof spaces> = {}
    spaces.forEach((space) => {
      const year = space.academicYear || 'Không xác định'
      if (!groupedByYear[year]) {
        groupedByYear[year] = []
      }
      groupedByYear[year].push(space)
    })

    // Get list of unique academic years (sorted descending)
    const academicYears = Object.keys(groupedByYear).sort((a, b) => {
      // Parse year strings like "2025-2026" to compare
      const aStart = parseInt(a.split('-')[0] || '0', 10)
      const bStart = parseInt(b.split('-')[0] || '0', 10)
      return bStart - aStart
    })

    return NextResponse.json({
      spaces,
      groupedByYear,
      academicYears,
      total: spaces.length,
    })
  } catch (error) {
    console.error('Error fetching archived spaces:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy danh sách spaces đã lưu trữ' },
      { status: 500 }
    )
  }
}

