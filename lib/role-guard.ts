import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'

/**
 * Kiểm tra và redirect nếu user không có quyền truy cập
 * @param allowedRoles - Danh sách roles được phép
 * @param redirectTo - URL để redirect (mặc định: /)
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: string = '/'
): Promise<UserRole> {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const userRole = session.user.role as UserRole

  if (!allowedRoles.includes(userRole)) {
    // Nếu là STUDENT cố truy cập trang không được phép, redirect về trang chủ
    if (userRole === 'STUDENT') {
      redirect(redirectTo)
    }
    // Các role khác cũng redirect về trang chủ
    redirect(redirectTo)
  }

  return userRole
}

/**
 * Kiểm tra user có role được phép không (không redirect)
 */
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return false
  }

  const userRole = session.user.role as UserRole
  return allowedRoles.includes(userRole)
}

/**
 * Lấy role hiện tại của user
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.role as UserRole | null
}

