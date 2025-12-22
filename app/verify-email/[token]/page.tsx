'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Common/Logo'
import ThemeToggle from '@/components/Common/ThemeToggle'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token không hợp lệ')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Đã xảy ra lỗi khi xác nhận email')
          return
        }

        setStatus('success')
        setMessage(data.message || 'Email đã được xác nhận thành công')
      } catch (error) {
        setStatus('error')
        setMessage('Đã xảy ra lỗi khi xác nhận email')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-300">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size={56} />
          </div>
          
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                Đang xác nhận email...
              </h2>
              <p className="text-gray-600 dark:text-gray-300 font-poppins">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                Xác nhận thành công!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 font-poppins">
                {message}
              </p>
              <Link
                href="/login"
                className="inline-block bg-primary-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors font-poppins"
              >
                Đăng nhập ngay
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                Xác nhận thất bại
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 font-poppins">
                {message}
              </p>
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="inline-block bg-primary-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors font-poppins"
                >
                  Quay lại đăng nhập
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                  Hoặc{' '}
                  <Link
                    href="/register"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    đăng ký lại
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <ThemeToggle />
    </div>
  )
}

