import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { lockedUntil: null, failedLoginAttempts: 0 },
        { status: 200 }
      )
    }

    return NextResponse.json({
      lockedUntil: user.lockedUntil?.toISOString() || null,
      failedLoginAttempts: user.failedLoginAttempts || 0,
    })
  } catch (error) {
    console.error('Check lockout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

