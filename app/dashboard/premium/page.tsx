import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import PremiumPlans from '@/components/Premium/PremiumPlans'

async function getPremiumStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
        brandId: true,
      },
    })

    // Try to get brand if brandId exists and brands table exists
    let brand = null
    let hasBrand = false
    if (user?.brandId) {
      try {
        brand = await prisma.brand.findUnique({
          where: { id: user.brandId },
          select: {
            id: true,
            name: true,
            verificationStatus: true,
          },
        })
        hasBrand = !!brand
      } catch (error) {
        // Brand table doesn't exist yet, ignore
        if (process.env.NODE_ENV === 'development') {
          console.log('Brand table not available yet')
        }
      }
    }

    // Try to get subscription if premium
    let subscription = null
    if (user?.isPremium) {
      try {
        const sub = await prisma.premiumSubscription.findFirst({
          where: {
            userId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
          select: {
            plan: true,
            endDate: true,
            activatedBy: true,
          },
        })
        if (sub) {
          subscription = {
            plan: sub.plan,
            endDate: sub.endDate.toISOString(),
            activatedBy: sub.activatedBy,
          }
        }
      } catch (error) {
        // Subscription table doesn't exist yet, ignore
        if (process.env.NODE_ENV === 'development') {
          console.log('Subscription table not available yet')
        }
      }
    }

    return {
      isPremium: user?.isPremium || false,
      hasBrand,
      brand,
      subscription,
    }
  } catch (error: any) {
    // Fallback if any database error occurs
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching premium status:', error)
    }
    return {
      isPremium: false,
      hasBrand: false,
      brand: null,
      subscription: null,
    }
  }
}

export default async function PremiumPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const premiumStatus = await getPremiumStatus(session.user.id)

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Premium', posts: '0' },
  ]

  return (
    <SharedLayout
      title="Nâng cấp Premium"
    >
      <PremiumPlans currentUser={session} premiumStatus={premiumStatus} />
    </SharedLayout>
  )
}

