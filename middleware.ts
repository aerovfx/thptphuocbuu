import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow access to public routes
        const publicRoutes = [
          "/",
          "/sign-in",
          "/sign-up",
          "/test",
          "/test-simple",
          "/test-db",
          "/test-nextauth",
          "/test-all",
          "/test-signup",
          "/test-form",
          "/test-s3-upload",
          "/test-gcs-video",
          "/test-auth",
          "/api/webhook",
          "/api/auth"
        ]
  
  const { pathname } = request.nextUrl
  
  // Check if the current path is a public route
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // For now, allow all other routes (we'll add authentication later)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
 