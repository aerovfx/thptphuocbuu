'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, UserPlus } from 'lucide-react'

interface UserMenuProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  onClose?: () => void
}

export default function UserMenu({ user, onClose }: UserMenuProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleAddAccount = () => {
    // Mở tab mới để đăng nhập tài khoản khác
    window.open('/login', '_blank')
    if (onClose) onClose()
  }

  const handleLogout = async () => {
    if (isLoggingOut) return // Prevent double clicks

    try {
      setIsLoggingOut(true)
      if (onClose) onClose()

      // Sign out with redirect
      const result = await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      })

      // If redirect is false, manually redirect
      if (result && !(result as any).url) {
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Force redirect even if signOut fails
      router.push('/login')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const username = user.email?.split('@')[0] || 'user'

  return (
    <div className="p-2">
      <button
        onClick={handleAddAccount}
        className="w-full px-4 py-3 text-left hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-xl transition-colors font-poppins text-bluelock-dark dark:text-white flex items-center space-x-3"
      >
        <UserPlus size={20} className="text-bluelock-dark/60 dark:text-gray-400" />
        <span>Thêm tài khoản hiện có</span>
      </button>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full px-4 py-3 text-left hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-xl transition-colors font-poppins text-bluelock-dark dark:text-white flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogOut size={20} className="text-bluelock-dark/60 dark:text-gray-400" />
        <span>{isLoggingOut ? 'Đang đăng xuất...' : `Đăng xuất @${username}`}</span>
      </button>
    </div>
  )
}

