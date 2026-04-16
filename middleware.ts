import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Danh sách các trang công khai (không cần đăng nhập)
    const publicDashboardPaths = [
      '/dashboard/documents',
      '/dashboard/dms',
      '/dashboard/spaces',
      '/dashboard/departments',
    ]
    // Trang chủ dashboard (chính xác /dashboard) cũng công khai
    const isPublicDashboardPath =
      path === '/dashboard' ||
      publicDashboardPaths.some(p => path.startsWith(p))

    // Role-based access control
    if (path.startsWith('/dashboard')) {
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

    // Gắn header x-is-public-path để layout biết đây là trang công khai (không cần session)
    const response = NextResponse.next()
    if (isPublicDashboardPath) {
      response.headers.set('x-is-public-path', '1')
    }
    return response
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
            '/dashboard/dms',
            '/dashboard/spaces',
            '/dashboard/departments',
          ]
          // Trang chủ dashboard cũng công khai
          if (
            req.nextUrl.pathname === '/dashboard' ||
            publicDashboardPaths.some(p => req.nextUrl.pathname.startsWith(p))
          ) {
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

