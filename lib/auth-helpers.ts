import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

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
 * Get current session with type safety
 */
export async function getCurrentSession() {
  const session = await getServerSession(authOptions)
  return session
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

