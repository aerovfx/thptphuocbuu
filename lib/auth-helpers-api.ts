import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { authenticateRequest } from './jwt-auth'

export interface AuthResult {
  userId: string
  userRole: string
  error?: NextResponse
}

/**
 * Unified authentication for API endpoints
 * Supports both JWT token (mobile) and NextAuth session (web)
 */
export async function authenticateApiRequest(
  request: NextRequest | Request
): Promise<AuthResult | { error: NextResponse }> {
  // Try JWT authentication first (for mobile app)
  const jwtUser = await authenticateRequest(request as NextRequest)

  // Fall back to NextAuth session (for web app)
  const session = !jwtUser ? await getServerSession(authOptions) : null

  if (!jwtUser && !session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let userId: string
  let userRole: string

  if (jwtUser) {
    // Mobile app authentication via JWT
    userId = jwtUser.id
    userRole = jwtUser.role
  } else if (session) {
    // Web app authentication via NextAuth session
    userId = session.user.id
    userRole = session.user.role

    // Ensure user exists in DB
    if (!userId || userId.trim() === '') {
      // Fallback to email lookup
      const byEmail = session.user.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true },
          })
        : null
      if (!byEmail) {
        return {
          error: NextResponse.json(
            { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
            { status: 401 }
          ),
        }
      }
      userId = byEmail.id
      userRole = byEmail.role
    } else {
      const exists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      })
      if (!exists) {
        // Try to recover by email (handles stale token ids after DB reset/migration)
        const byEmail = session.user.email
          ? await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, role: true },
            })
          : null
        if (!byEmail) {
          return {
            error: NextResponse.json(
              { error: 'Tài khoản không tồn tại. Vui lòng đăng nhập lại.' },
              { status: 401 }
            ),
          }
        }
        userId = byEmail.id
        userRole = byEmail.role
      } else {
        userRole = exists.role
      }
    }
  } else {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { userId, userRole }
}
