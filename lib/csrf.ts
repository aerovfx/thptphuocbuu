/**
 * CSRF Token Utilities for Client-Side
 *
 * Helper functions to retrieve and include CSRF tokens in API requests
 */

import { getCsrfToken as getNextAuthCsrfToken } from 'next-auth/react'

/**
 * Get CSRF token from NextAuth
 *
 * Uses NextAuth's built-in getCsrfToken function which fetches from /api/auth/csrf
 * Falls back to reading from cookie if the API call fails
 *
 * @returns CSRF token string or null if not found
 */
export async function getCsrfTokenAsync(): Promise<string | null> {
  try {
    // Use NextAuth's built-in function to get CSRF token
    const token = await getNextAuthCsrfToken()
    return token || null
  } catch (error) {
    console.error('[CSRF] Error getting CSRF token from NextAuth:', error)
    return getCsrfTokenFromCookie()
  }
}

/**
 * Get CSRF token from NextAuth cookie (synchronous fallback)
 *
 * NextAuth stores CSRF token in cookie with format: "token|hash"
 * We extract the token part for use in request headers
 *
 * @returns CSRF token string or null if not found
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    // Server-side, return null
    return null
  }

  // Get all cookies
  const cookies = document.cookie.split(';')

  // Debug: log all cookies to see what we have
  if (process.env.NODE_ENV === 'development') {
    console.log('[CSRF] All cookies:', cookies.map(c => c.trim().split('=')[0]))
  }

  // Find the CSRF token cookie - try multiple possible names
  const csrfCookie = cookies.find(cookie => {
    const trimmed = cookie.trim()
    return (
      trimmed.startsWith('next-auth.csrf-token=') ||
      trimmed.startsWith('__Host-next-auth.csrf-token=') ||
      trimmed.startsWith('__Secure-next-auth.csrf-token=') ||
      // Also try without the prefix for local development
      trimmed.includes('csrf-token=')
    )
  })

  if (!csrfCookie) {
    console.warn('[CSRF] CSRF token cookie not found. Available cookies:',
      cookies.map(c => c.trim().split('=')[0]).join(', '))
    return null
  }

  // Extract the cookie value - handle the case where cookie name might have '=' in it
  const cookieParts = csrfCookie.trim().split('=')
  // Join all parts except the first one (the cookie name)
  const cookieValue = cookieParts.slice(1).join('=')

  if (!cookieValue) {
    console.warn('[CSRF] CSRF token cookie is empty')
    return null
  }

  // Decode URI component and extract token (format: "token|hash")
  try {
    const decodedValue = decodeURIComponent(cookieValue)
    const [token] = decodedValue.split('|')

    if (!token) {
      console.warn('[CSRF] Invalid CSRF token format:', decodedValue.substring(0, 20))
      return null
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[CSRF] Token found:', token.substring(0, 10) + '...')
    }

    return token
  } catch (error) {
    console.error('[CSRF] Error parsing CSRF token:', error)
    return null
  }
}

/**
 * Synchronous version - gets CSRF token from cookie only
 * Use this when you need immediate access and can't await
 *
 * @returns CSRF token string or null if not found
 */
export function getCsrfToken(): string | null {
  return getCsrfTokenFromCookie()
}

/**
 * Create fetch headers with CSRF token included (async)
 *
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CSRF token
 */
export async function getHeadersWithCsrf(additionalHeaders: HeadersInit = {}): Promise<HeadersInit> {
  const csrfToken = await getCsrfTokenAsync()

  const headers: HeadersInit = {
    ...additionalHeaders,
  }

  if (csrfToken) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken
  }

  return headers
}

/**
 * Fetch with CSRF token automatically included
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = await getCsrfTokenAsync()

  const headers = new Headers(options.headers || {})

  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken)
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
