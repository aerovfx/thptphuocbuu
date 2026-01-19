import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Role-based access control
    if (path.startsWith('/dashboard')) {
      // Allow guest access to specific public modules
      const publicDashboardPaths = ['/dashboard/documents', '/dashboard/spaces', '/dashboard/departments']
      const isPublicDashboardPath = publicDashboardPaths.some(p => path.startsWith(p))

      // All authenticated users can access dashboard (and guests for public paths)
      if (!token && !isPublicDashboardPath) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Admin-only routes (allow ADMIN, SUPER_ADMIN, and BGH)
      if (path.startsWith('/dashboard/admin') && token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN' && token?.role !== 'BGH') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Classes module - tạm ẩn, chỉ hiển thị với quản trị admin (ADMIN, SUPER_ADMIN, BGH)
      if (path.startsWith('/dashboard/classes') && token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN' && token?.role !== 'BGH') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      const canUploadRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG', 'QUAN_NHIEM', 'BAN_TT', 'DOAN_TN', 'DANG_BO']
      if (
        path.startsWith('/dashboard/documents/upload') &&
        !canUploadRoles.includes(token?.role as string)
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
        const publicRoutes = [
          '/login',
          '/register',
          '/api/auth',
          '/api/mobile', // Allow all mobile API routes
        ]
        if (publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
          return true
        }

        // Require authentication for protected routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          // Allow guest access to specific public modules
          const publicDashboardPaths = [
            '/dashboard/documents',
            '/dashboard/spaces',
            '/dashboard/departments'
          ]
          if (publicDashboardPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
            return true
          }
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
    // Don't match API routes - they should be handled by Next.js directly
  ],
}

