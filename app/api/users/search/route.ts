import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || searchParams.get('email') || searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isAdmin =
      session.user.role === 'ADMIN' ||
      session.user.role === 'SUPER_ADMIN' ||
      session.user.role === 'BGH'

    // If no query, return list of users (for admin)
    if (!q) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const users = await prisma.user.findMany({
        where: {},
        take: Math.min(limit, 100),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ users })
    }

    // Try to find by ID first, then by email
    let user = await prisma.user.findUnique({
      where: { id: q },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        status: true,
      },
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: q.toLowerCase().trim() },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          status: true,
        },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simplified states: hide any non-ACTIVE users from non-admin search results
    if ((user as any).status !== 'ACTIVE' && !isAdmin) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hide status field for non-admins
    if (!isAdmin) {
      const { status, ...rest } = user as any
      return NextResponse.json(rest)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error searching user:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tìm kiếm người dùng' },
      { status: 500 }
    )
  }
}

