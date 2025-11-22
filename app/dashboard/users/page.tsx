import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SharedLayout from '@/components/Layout/SharedLayout'
import UsersList from '@/components/Users/UsersList'

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
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const users = await getAllUsers()

  return (
    <SharedLayout title="Người dùng">
      <div className="p-6">
        <UsersList users={users} currentUserRole={session.user.role} />
      </div>
    </SharedLayout>
  )
}

