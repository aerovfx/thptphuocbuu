'use client'

import { signOut } from 'next-auth/react'
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
  const handleAddAccount = () => {
    // Mở tab mới để đăng nhập tài khoản khác
    window.open('/login', '_blank')
    if (onClose) onClose()
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
    if (onClose) onClose()
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
        className="w-full px-4 py-3 text-left hover:bg-bluelock-light-3 dark:hover:bg-gray-800 rounded-xl transition-colors font-poppins text-bluelock-dark dark:text-white flex items-center space-x-3"
      >
        <LogOut size={20} className="text-bluelock-dark/60 dark:text-gray-400" />
        <span>Đăng xuất @{username}</span>
      </button>
    </div>
  )
}

