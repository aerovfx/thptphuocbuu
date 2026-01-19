'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Shield,
  Building2,
  Briefcase,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logo from '../Common/Logo'
import Avatar from '../Common/Avatar'
import { useState } from 'react'
import { getModulesByRole } from '@/lib/dashboard-modules'
import type { UserRole } from '@prisma/client'

// Icon mapping - map icon names to lucide-react components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Crown,
  Shield,
  Building2,
  Briefcase,
  BarChart3,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <Logo size={36} className="cursor-pointer" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {getModulesByRole(session?.user?.role as UserRole)
              .filter((module) => !module.underDevelopment) // Hide modules under development
              .map((module) => {
                const isActive = pathname === module.href || pathname?.startsWith(module.href + '/')
                const Icon = iconMap[module.icon] || LayoutDashboard // Fallback to LayoutDashboard

                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon size={20} />
                    <span>{module.title}</span>
                  </Link>
                )
              })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-4 px-4 py-2">
              <Avatar
                src={session.user?.image}
                name={session.user?.name || 'User'}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user?.role === 'ADMIN' && 'Quản trị viên'}
                {session.user?.role === 'TEACHER' && 'Giáo viên'}
                {session.user?.role === 'STUDENT' && 'Học sinh'}
                {session.user?.role === 'PARENT' && 'Phụ huynh'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

