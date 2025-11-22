'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Copy, Check, LogIn } from 'lucide-react'

const testAccounts = [
  {
    id: 1,
    name: 'Admin System',
    email: 'admin@test.com',
    password: 'Admin@123!Secure',
    role: 'ADMIN',
    color: 'bg-red-500',
  },
  {
    id: 2,
    name: 'Nguyễn Văn Giáo',
    email: 'teacher@test.com',
    password: 'Teacher@456!Secure',
    role: 'TEACHER',
    color: 'bg-blue-500',
  },
  {
    id: 3,
    name: 'Trần Thị Học',
    email: 'student@test.com',
    password: 'Student@789!Secure',
    role: 'STUDENT',
    color: 'bg-green-500',
  },
  {
    id: 4,
    name: 'Lê Văn Phụ',
    email: 'parent@test.com',
    password: 'Parent@012!Secure',
    role: 'PARENT',
    color: 'bg-purple-500',
  },
  {
    id: 5,
    name: 'Phạm Thị Khách',
    email: 'visitor@test.com',
    password: 'Visitor@345!Secure',
    role: 'VISITOR (STUDENT)',
    color: 'bg-yellow-500',
  },
]

export default function TestAccountsPage() {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [loggingIn, setLoggingIn] = useState<number | null>(null)

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleQuickLogin = async (account: typeof testAccounts[0]) => {
    setLoggingIn(account.id)
    try {
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        alert(`Đăng nhập thất bại: ${result?.error || 'Lỗi không xác định'}`)
      }
    } catch (error: any) {
      alert(`Lỗi: ${error.message || 'Đã xảy ra lỗi'}`)
    } finally {
      setLoggingIn(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
            Tài khoản Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Sử dụng các tài khoản này để test các chức năng của hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${account.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {account.name.charAt(0)}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold font-poppins ${
                  account.role === 'ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  account.role === 'TEACHER' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  account.role === 'STUDENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  account.role === 'PARENT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {account.role}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
                {account.name}
              </h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={account.email}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(account.email, account.id * 10 + 1)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy email"
                    >
                      {copiedId === account.id * 10 + 1 ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Password</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="password"
                      value={account.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(account.password, account.id * 10 + 2)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy password"
                    >
                      {copiedId === account.id * 10 + 2 ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleQuickLogin(account)}
                disabled={loggingIn === account.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
              >
                {loggingIn === account.id ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Đăng nhập nhanh</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 font-poppins">
            💡 Hướng dẫn sử dụng
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 font-poppins">
            <li>• Click vào icon Copy để sao chép Email hoặc Password</li>
            <li>• Click "Đăng nhập nhanh" để tự động đăng nhập với tài khoản đó</li>
            <li>• Hoặc sử dụng thông tin để đăng nhập thủ công tại trang /login</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

