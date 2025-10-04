import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
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

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  // Protect teacher routes
  if (pathname.startsWith('/teacher')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token || (token.role !== 'TEACHER' && token.role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  // Protect dashboard routes - redirect based on role
  if (pathname === '/dashboard') {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (token) {
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else if (token.role === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/courses', request.url))
      }
      // STUDENT can access /dashboard
    }
  }
  
  // For now, allow all other routes
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
 