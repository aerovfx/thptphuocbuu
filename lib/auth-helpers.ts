import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from './prisma'

export type AllowedRoles = UserRole | UserRole[]

/**
 * Check if user has required role(s)
 */
export function hasRole(userRole: string, allowedRoles: AllowedRoles): boolean {
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole as UserRole)
  }
  return userRole === allowedRoles
}

/**
 * Get current session with type safety and JWT error handling
 * Gracefully handles JWT decryption errors (e.g., when NEXTAUTH_SECRET changes)
 * Suppresses NextAuth's console error for JWT decryption failures
 */
export async function getCurrentSession() {
  // Store original console.error
  const originalConsoleError = console.error
  
  // Temporarily override console.error to suppress NextAuth JWT errors
  let jwtErrorSuppressed = false
  const errorInterceptor = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || ''
    const isNextAuthJWTError = 
      errorMessage.includes('[next-auth][error][JWT_SESSION_ERROR]') ||
      errorMessage.includes('decryption operation failed') ||
      (errorMessage.includes('JWT_SESSION_ERROR') && errorMessage.includes('next-auth'))
    
    if (isNextAuthJWTError) {
      jwtErrorSuppressed = true
      // Suppress this specific error - we'll handle it gracefully
      return
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args)
  }
  
  try {
    // Override console.error only for this call
    console.error = errorInterceptor
    const session = await getServerSession(authOptions)
    // Restore original console.error immediately after
    console.error = originalConsoleError

    // Block SUSPENDED users from accessing the system
    // If user is SUSPENDED, treat as no-session so dashboard redirects to login.
    if (session?.user) {
      const userId = (session.user as any).id
      const email = session.user.email
      try {
        const dbUser = userId
          ? await prisma.user.findUnique({ where: { id: userId }, select: { status: true } })
          : email
          ? await prisma.user.findUnique({ where: { email }, select: { status: true } })
          : null
        if (dbUser && dbUser.status !== 'ACTIVE') {
          return null
        }
      } catch (e) {
        // If DB check fails, don't accidentally lock users out; fall back to session.
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Auth] Failed to validate user status, using session as-is')
        }
      }
    }

    return session
  } catch (error: any) {
    // Restore original console.error
    console.error = originalConsoleError
    
    // Handle JWT decryption errors gracefully
    // This can happen when:
    // 1. NEXTAUTH_SECRET was changed
    // 2. Old session cookies exist from previous deployment
    // 3. Cookie is corrupted
    const isJWTError = 
      jwtErrorSuppressed ||
      error?.message?.includes('decryption') || 
      error?.code === 'JWT_SESSION_ERROR' ||
      error?.message?.includes('JWT') ||
      error?.name === 'JWTDecodeError' ||
      error?.message?.includes('JWT_SESSION_ERROR')
    
    if (isJWTError) {
      // Silently handle JWT errors - user will need to login again
      // Don't log as error to avoid noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Session decryption failed, treating as no session')
      }
      return null
    }
    
    // Re-throw other errors
    throw error
  } finally {
    // Ensure console.error is always restored
    console.error = originalConsoleError
  }
}

/**
 * Require authentication - returns session or redirects
 */
export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

/**
 * Require specific role(s) - returns session or throws error
 */
export async function requireRole(allowedRoles: AllowedRoles) {
  const session = await requireAuth()
  
  if (!hasRole(session.user.role, allowedRoles)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
  
  return session
}

/**
 * API route helper - require authentication
 */
export async function requireAuthAPI() {
  try {
    const session = await requireAuth()
    return { session, error: null }
  } catch (error) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }
}

/**
 * API route helper - require specific role(s)
 */
export async function requireRoleAPI(allowedRoles: AllowedRoles) {
  try {
    const session = await requireRole(allowedRoles)
    return { session, error: null }
  } catch (error: any) {
    const status = error.message.includes('Forbidden') ? 403 : 401
    return {
      session: null,
      error: NextResponse.json(
        { error: error.message || 'Forbidden' },
        { status }
      ),
    }
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(exp?: number): boolean {
  if (!exp) return true
  const now = Math.floor(Date.now() / 1000)
  return exp < now
}

/**
 * Validate session token
 */
export function validateSessionToken(token: any): boolean {
  if (!token) return false
  if (!token.id || !token.role) return false
  if (isTokenExpired(token.exp)) return false
  return true
}

