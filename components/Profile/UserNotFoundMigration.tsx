'use client'

import Link from 'next/link'
import { AlertCircle, Home, LogIn, UserPlus } from 'lucide-react'

interface UserNotFoundMigrationProps {
  userId?: string
}

export default function UserNotFoundMigration({ userId }: UserNotFoundMigrationProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-100 rounded-full p-4">
            <AlertCircle className="w-16 h-16 text-yellow-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Tài khoản chưa khôi phục
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 text-center mb-8">
          Hệ thống vừa được nâng cấp lên cơ sở dữ liệu mới
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thông báo quan trọng
          </h2>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Hệ thống LMS THPT Phước Bửu đã chuyển sang database mới (Neon PostgreSQL) vào ngày <strong>26/12/2025</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Database cũ (Prisma Accelerate) đã hết quota miễn phí và không thể truy cập được</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Tài khoản của bạn chưa được khôi phục trong hệ thống mới</span>
            </li>
          </ul>
        </div>

        {/* User ID Info (if provided) */}
        {userId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">User ID bạn đang tìm:</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded font-mono break-all">
              {userId}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Để tiếp tục sử dụng hệ thống:
          </h3>

          <div className="space-y-3">
            {/* Option 1: Login with Google */}
            <div className="bg-white rounded-lg p-4 border border-indigo-200">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 rounded-lg p-2 mt-1">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">1. Đăng nhập với Google</h4>
                  <p className="text-sm text-gray-600 mb-3">Đăng nhập bằng tài khoản Google của bạn. Hệ thống sẽ tự động tạo tài khoản mới.</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Đăng nhập với Google
                  </Link>
                </div>
              </div>
            </div>

            {/* Option 2: Register new account */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 rounded-lg p-2 mt-1">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">2. Đăng ký tài khoản mới</h4>
                  <p className="text-sm text-gray-600 mb-3">Tạo tài khoản mới với email @thptphuocbuu.edu.vn hoặc @gmail.com</p>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Đăng ký ngay
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-3 text-center">Cần hỗ trợ?</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-blue-600">📧</span>
              <span>Liên hệ admin để được hỗ trợ khôi phục tài khoản: <strong>admin@thptphuocbuu.edu.vn</strong></span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-blue-600">💬</span>
              <span>Hoặc đăng nhập với tài khoản mới và liên hệ admin trong hệ thống</span>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>

        {/* Technical Info (collapsible) */}
        <details className="mt-8 bg-gray-50 rounded-lg p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Thông tin kỹ thuật (dành cho admin)
          </summary>
          <div className="mt-4 text-xs text-gray-600 space-y-2 font-mono">
            <p><strong>Migration Date:</strong> 2025-12-26</p>
            <p><strong>Old Database:</strong> Prisma Accelerate (db.prisma.io) - LOCKED</p>
            <p><strong>New Database:</strong> Neon PostgreSQL (ap-southeast-1)</p>
            <p><strong>Reason:</strong> Monthly query limit exceeded on old database</p>
            {userId && (
              <>
                <p><strong>Requested User ID:</strong> {userId}</p>
                <p><strong>Status:</strong> Not found in new database</p>
              </>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}
