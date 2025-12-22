import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import AdminDashboard from '@/components/Admin/AdminDashboard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAdminStats() {
  try {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalRoles,
      totalModules,
      enabledModules,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => prisma.user.count().catch(() => 0)),
      prisma.user.count({ where: { status: 'SUSPENDED' } }).catch(() => 0),
      prisma.role.count().catch(() => 0),
      prisma.module.count().catch(() => 0),
      prisma.module.count({ where: { enabled: true } }).catch(() => 0),
      prisma.adminAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }).catch(() => []),
    ])

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        suspended: suspendedUsers || 0,
      },
      roles: {
        total: totalRoles || 0,
      },
      modules: {
        total: totalModules || 0,
        enabled: enabledModules || 0,
      },
      recentAuditLogs: (recentAuditLogs || []).map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    // Return default stats on error
    return {
      users: {
        total: 0,
        active: 0,
        suspended: 0,
      },
      roles: {
        total: 0,
      },
      modules: {
        total: 0,
        enabled: 0,
      },
      recentAuditLogs: [],
    }
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Allow ADMIN, SUPER_ADMIN, and BGH
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BGH') {
    redirect('/dashboard')
  }

  const stats = await getAdminStats()

  return (
    <SharedLayout title="Admin Panel">
      <AdminDashboard stats={stats} currentUser={session} />
    </SharedLayout>
  )
}

