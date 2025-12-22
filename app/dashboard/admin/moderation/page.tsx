import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ModerationDashboard from '@/components/Admin/ModerationDashboard'

export const metadata = {
    title: 'Quản lý Kiểm duyệt | Admin',
    description: 'Quản lý bộ lọc nội dung và log kiểm duyệt',
}

export default async function ModerationPage() {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        redirect('/dashboard')
    }

    // Fetch filters
    const filters = await prisma.contentFilter.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            createdBy: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
    })

    // Fetch recent logs
    const logs = await prisma.moderationLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    })

    // Statistics
    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))

    const stats = {
        totalFilters: await prisma.contentFilter.count(),
        activeFilters: await prisma.contentFilter.count({ where: { active: true } }),
        totalViolations: await prisma.moderationLog.count(),
        blockedToday: await prisma.moderationLog.count({
            where: {
                action: 'BLOCKED',
                createdAt: {
                    gte: today,
                },
            },
        }),
        byCategory: await prisma.moderationLog.groupBy({
            by: ['violationType'],
            _count: true,
            orderBy: {
                _count: {
                    violationType: 'desc',
                },
            },
            take: 5,
        }),
        bySeverity: await prisma.moderationLog.groupBy({
            by: ['severity'],
            _count: true,
        }),
    }

    return (
        <ModerationDashboard
            filters={filters}
            logs={logs}
            stats={stats}
            currentUser={session.user}
        />
    )
}
