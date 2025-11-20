import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Role-based access control
    if (path.startsWith('/dashboard')) {
      // All authenticated users can access dashboard
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Admin-only routes
      if (path.startsWith('/dashboard/admin') && token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Teacher-only routes
      if (
        path.startsWith('/dashboard/classes/new') &&
        token.role !== 'TEACHER' &&
        token.role !== 'ADMIN'
      ) {
        return NextResponse.redirect(new URL('/dashboard/classes', req.url))
      }

      if (
        path.startsWith('/dashboard/documents/upload') &&
        token.role !== 'TEACHER' &&
        token.role !== 'ADMIN'
      ) {
        return NextResponse.redirect(new URL('/dashboard/documents', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = ['/login', '/register', '/api/auth']
        if (publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
          return true
        }

        // Require authentication for protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}

