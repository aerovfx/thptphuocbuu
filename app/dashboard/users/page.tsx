import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import UsersList from '@/components/Users/UsersList'
import { requireRole } from '@/lib/role-guard'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function UsersPage() {
  // Chỉ ADMIN, TEACHER mới được truy cập trang này
  const role = await requireRole(['ADMIN', 'TEACHER', 'SUPER_ADMIN', 'BGH', 'TRUONG_TONG'], '/')
  
  const session = await getServerSession(authOptions)
  if (!session) return null

  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'

  const users = await prisma.user.findMany({
    // Simplified states: only ACTIVE users are visible to non-admins
    where: isAdmin ? {} : { status: 'ACTIVE' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      status: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <SharedLayout title="Người dùng">
      <div className="p-6">
        <UsersList users={users} currentUserRole={session.user.role} />
      </div>
    </SharedLayout>
  )
}

