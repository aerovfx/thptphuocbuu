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

    if (!q) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
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
        },
      })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

