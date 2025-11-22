/**
 * Premium Check Utilities
 * 
 * Helper functions to check if user has Premium or Admin access
 */

export interface User {
  id?: string
  role?: string
  isPremium?: boolean
}

/**
 * Check if user has Premium or Admin access
 */
export function hasPremiumOrAdminAccess(user: User | null | undefined): boolean {
  if (!user) return false
  return user.isPremium === true || user.role === 'ADMIN'
}

/**
 * Check if user has Premium access (excluding Admin)
 */
export function hasPremiumAccess(user: User | null | undefined): boolean {
  if (!user) return false
  return user.isPremium === true
}

/**
 * Check if user is Admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false
  return user.role === 'ADMIN'
}

