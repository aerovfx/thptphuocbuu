import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { logger } from './logger'

/**
 * CSRF Validation Middleware
 * 
 * Protects state-changing API routes from Cross-Site Request Forgery attacks
 * by validating CSRF tokens on POST/PUT/PATCH/DELETE requests.
 */

/**
 * Validate CSRF token for state-changing operations
 * 
 * NextAuth uses double-submit cookie pattern:
 * - Cookie: next-auth.csrf-token (format: "token|hash")
 * - Header: X-CSRF-Token or CSRF-Token
 * 
 * @param request - NextRequest object
 * @returns boolean - true if valid, false otherwise
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            // Not authenticated - CSRF not applicable
            return true
        }

        // Get CSRF token from request header
        const csrfTokenFromRequest =
            request.headers.get('x-csrf-token') ||
            request.headers.get('csrf-token')

        if (!csrfTokenFromRequest) {
            logger.warn('[CSRF] Missing CSRF token in request headers')
            return false
        }

        // Get expected CSRF token from cookie
        const csrfCookie = request.cookies.get('next-auth.csrf-token')?.value

        if (!csrfCookie) {
            logger.warn('[CSRF] Missing CSRF token cookie')
            return false
        }

        // CSRF cookie format: "token|hash"
        // We only need the token part for validation
        const [expectedToken] = csrfCookie.split('|')

        if (!expectedToken) {
            logger.warn('[CSRF] Invalid CSRF cookie format')
            return false
        }

        // Simple string comparison (NextAuth handles the crypto)
        // For production, consider using crypto.timingSafeEqual for timing attack protection
        const isValid = csrfTokenFromRequest === expectedToken

        if (!isValid) {
            logger.warn('[CSRF] CSRF token mismatch', {
                received: csrfTokenFromRequest.substring(0, 10) + '...',
                expected: expectedToken.substring(0, 10) + '...'
            })
        }

        return isValid
    } catch (error) {
        logger.error('[CSRF] CSRF validation error:', error)
        return false
    }
}

/**
 * Wrapper for API route handlers requiring CSRF protection
 * 
 * Automatically validates CSRF tokens for state-changing methods (POST, PUT, PATCH, DELETE)
 * GET, HEAD, and OPTIONS requests are exempted from CSRF validation
 * 
 * @param handler - API route handler function
 * @returns Wrapped handler with CSRF protection
 * 
 * @example
 * ```typescript
 * import { withCsrfProtection } from '@/lib/csrf-middleware'
 * 
 * export const POST = withCsrfProtection(async (request: NextRequest) => {
 *   // Your API logic here - CSRF is already validated
 *   const session = await getServerSession(authOptions)
 *   // ...
 * })
 * ```
 */
export function withCsrfProtection(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: any) => {
        // Only validate for state-changing methods
        const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

        if (statefulMethods.includes(request.method)) {
            const isValid = await validateCsrfToken(request)

            if (!isValid) {
                logger.warn(`[CSRF] Blocked ${request.method} request to ${request.url} due to invalid CSRF token`)
                return NextResponse.json(
                    {
                        error: 'Invalid CSRF token',
                        message: 'This request was blocked for security reasons. Please refresh the page and try again.'
                    },
                    { status: 403 }
                )
            }
        }

        // CSRF validated (or not required for GET/HEAD/OPTIONS), proceed with handler
        return handler(request, context)
    }
}

/**
 * Alternative: Manual CSRF validation for custom logic
 * 
 * Use this if you need more control over the validation process
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const isValid = await validateCsrfToken(request)
 *   if (!isValid) {
 *     return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 *   }
 *   // Your logic here
 * }
 * ```
 */
