import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NotificationsPage from '@/components/Notifications/NotificationsPage'

async function getNotifications(userId: string) {
  // Get notifications from various sources
  // For now, we'll create a mock structure
  // In production, you'd have a Notification model
  
  // Get recent posts that user might be interested in
  const recentPosts = await prisma.post.findMany({
    where: {
      authorId: {
        not: userId,
      },
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Get pending approvals for DMS
  const pendingApprovals = await prisma.approval.findMany({
    where: {
      approverId: userId,
      status: 'PENDING',
    },
    include: {
      outgoingDocument: {
        select: {
          id: true,
          title: true,
        },
      },
      incomingDocument: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Get recent followers (if you have a way to track this)
  // For now, we'll use a placeholder structure

  return {
    posts: recentPosts,
    approvals: pendingApprovals,
  }
}

export default async function NotificationsPageWrapper() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const notifications = await getNotifications(session.user.id)

  return <NotificationsPage notifications={notifications} currentUser={session} />
}

