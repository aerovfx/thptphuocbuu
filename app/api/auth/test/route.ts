import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { validateSessionToken, hasRole } from '@/lib/auth-helpers'
import { UserRole } from '@prisma/client'

/**
 * Test endpoint for authentication and authorization
 * This endpoint helps test various auth scenarios
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const testType = url.searchParams.get('type')

    // Test 1: Check if user is authenticated
    if (testType === 'auth') {
      if (!session) {
        return NextResponse.json(
          {
            authenticated: false,
            message: 'User is not authenticated',
          },
          { status: 401 }
        )
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        },
      })
    }

    // Test 2: Check role-based access
    if (testType === 'role') {
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const requiredRole = (url.searchParams.get('role') || 'ADMIN') as UserRole
      const hasAccess = hasRole(session.user.role, requiredRole)

      return NextResponse.json({
        userRole: session.user.role,
        requiredRole,
        hasAccess,
        message: hasAccess
          ? 'Access granted'
          : 'Access denied: Insufficient permissions',
      })
    }

    // Test 3: Check token validity
    if (testType === 'token') {
      // This would require accessing the raw token
      // In a real scenario, you might decode the JWT
      return NextResponse.json({
        message: 'Token validation test',
        note: 'JWT tokens are validated automatically by NextAuth',
      })
    }

    // Test 4: Check expired session
    if (testType === 'expired') {
      if (!session) {
        return NextResponse.json(
          {
            expired: true,
            message: 'No active session',
          },
          { status: 401 }
        )
      }

      return NextResponse.json({
        expired: false,
        message: 'Session is active',
        sessionMaxAge: '30 days',
      })
    }

    // Default: Return all test info
    return NextResponse.json({
      availableTests: [
        'auth - Check authentication status',
        'role - Check role-based access (requires ?role=ADMIN|TEACHER|STUDENT)',
        'token - Token validation info',
        'expired - Check if session is expired',
      ],
      currentSession: session
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Test failed',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

