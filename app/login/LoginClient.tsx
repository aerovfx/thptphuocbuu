'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getProviders, signIn } from 'next-auth/react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import ThemeToggle from '@/components/Common/ThemeToggle'
import Logo from '@/components/Common/Logo'

export default function LoginClient() {
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null)

  // Check for error from OAuth or other sources
  const errorParam = searchParams?.get('error')

  // Detect whether Google provider is enabled (server-side config)
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const providers = await getProviders()
          if (!mounted) return
          setGoogleEnabled(!!providers?.google)
        } catch {
          if (!mounted) return
          // If providers endpoint fails, don't block the page; just hide Google button.
          setGoogleEnabled(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [])

  // Use useEffect to handle URL error params
  useEffect(() => {
    if (!errorParam) return

    if (errorParam === 'OAuthSignin') {
      setError('Lỗi khi đăng nhập với Google. Vui lòng thử lại.')
    } else if (errorParam === 'OAuthCallback') {
      setError('Lỗi xử lý callback từ Google. Vui lòng thử lại.')
    } else if (errorParam === 'OAuthCreateAccount') {
      setError('Không thể tạo tài khoản từ Google. Vui lòng liên hệ quản trị viên.')
    } else if (errorParam === 'EmailSignin') {
      setError('Lỗi gửi email xác thực. Vui lòng thử lại.')
    } else if (errorParam === 'CredentialsSignin') {
      setError('Email hoặc mật khẩu không đúng.')
    } else if (errorParam === 'SessionRequired') {
      setError('Vui lòng đăng nhập để tiếp tục.')
    }
  }, [errorParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Trim và normalize email/password
      const normalizedEmail = email.trim().toLowerCase()
      const normalizedPassword = password.trim()

      // Validate input
      if (!normalizedEmail || !normalizedPassword) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu')
        return
      }

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password: normalizedPassword,
        redirect: false,
      })

      if (result?.error) {
        const errorMsg = result.error

        // Check if account is locked by fetching user info
        try {
          const userCheck = await fetch('/api/auth/check-lockout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail }),
          })
          const lockoutInfo = await userCheck.json()

          if (lockoutInfo.lockedUntil) {
            const lockedUntil = new Date(lockoutInfo.lockedUntil)
            const now = new Date()
            if (lockedUntil > now) {
              const minutesRemaining = Math.ceil(
                (lockedUntil.getTime() - now.getTime()) / 60000
              )
              setError(
                `Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${minutesRemaining} phút.`
              )
              return
            }
          }
        } catch {
          // ignore
        }

        // Map NextAuth error codes to user-friendly messages
        if (errorMsg === 'CredentialsSignin') {
          setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.')
        } else if (errorMsg.includes('Email hoặc mật khẩu')) {
          setError(errorMsg)
        } else if (errorMsg.includes('OAuth')) {
          setError('Tài khoản này chỉ đăng nhập bằng Google.')
        } else if (errorMsg.includes('SessionRequired')) {
          setError('Vui lòng đăng nhập để tiếp tục.')
        } else {
          setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
        }
      } else if (result?.ok) {
        // Login successful - redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        setError('Đã xảy ra lỗi không xác định. Vui lòng thử lại.')
      }
    } catch (err: any) {
      setError(err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setOauthLoading(true)

    try {
      if (googleEnabled === false) {
        setError('Google OAuth chưa được cấu hình. Vui lòng liên hệ quản trị viên.')
        return
      }
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      })
    } catch {
      setError('Lỗi khi đăng nhập với Google. Vui lòng thử lại.')
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors duration-300">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={56} />
          </div>
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 font-poppins">
            Đăng nhập vào tài khoản của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300"
              >
                Mật khẩu
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-300"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-300"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Hoặc
              </span>
            </div>
          </div>

          {googleEnabled ? (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || oauthLoading}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <GoogleIcon className="w-5 h-5" />
              <span>{oauthLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}</span>
            </button>
          ) : googleEnabled === null ? (
            <div className="mt-4 w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 py-2 px-4 rounded-lg font-medium opacity-80">
              <GoogleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>Đang kiểm tra Google OAuth...</span>
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
              Google OAuth chưa được cấu hình.
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-300"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  )
}


