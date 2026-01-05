import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret-key'

export interface AuthUser {
  id: string
  email: string
  role: string
}

/**
 * Verify JWT token from mobile app
 */
export async function verifyJwtToken(token: string): Promise<AuthUser | null> {
  try {
    console.log('[JWT Auth] Verifying token...')
    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log('[JWT Auth] Token decoded successfully:', { id: decoded.id, email: decoded.email, role: decoded.role })

    if (!decoded.userId && !decoded.id) {
      console.error('[JWT Auth] No userId or id in token')
      return null
    }

    const userId = decoded.id || decoded.userId
    console.log('[JWT Auth] User ID from token:', userId)

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      console.error('[JWT Auth] User not found in database:', userId)
      return null
    }

    console.log('[JWT Auth] User found:', { id: user.id, email: user.email, role: user.role, status: user.status })

    // Block suspended users
    if (user.status && user.status !== 'ACTIVE') {
      console.error('[JWT Auth] User is not active:', user.status)
      return null
    }

    console.log('[JWT Auth] Authentication successful for user:', user.email)
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  } catch (error) {
    console.error('[JWT Auth] Token verification failed:', error)
    return null
  }
}

/**
 * Extract JWT token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  console.log('[JWT Auth] Authorization header:', authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : 'None')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[JWT Auth] No Bearer token found in header')
    return null
  }

  const token = authHeader.substring(7)
  console.log('[JWT Auth] Extracted token (first 20 chars):', token.substring(0, 20))
  return token
}

/**
 * Authenticate request using either NextAuth session or JWT token
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  // Try JWT token first (for mobile app)
  const token = extractBearerToken(request)
  if (token) {
    const user = await verifyJwtToken(token)
    if (user) {
      return user
    }
  }

  // If no valid JWT token, the endpoint should fall back to NextAuth session
  return null
}
