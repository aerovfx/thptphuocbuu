import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import BrandVerificationList from '@/components/Brand/BrandVerificationList'

async function getPendingBrands() {
  const brands = await prisma.brand.findMany({
    where: {
      verificationStatus: 'PENDING',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          badges: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return brands
}

async function getAllBrands() {
  const brands = await prisma.brand.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          badges: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return brands
}

export default async function AdminBrandsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Only ADMIN can access this page
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard?error=unauthorized')
  }

  const pendingBrands = await getPendingBrands()
  const allBrands = await getAllBrands()

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Quản lý thương hiệu', posts: `${allBrands.length}` },
  ]

  return (
    <SharedLayout
      title="Quản lý thương hiệu"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <BrandVerificationList pendingBrands={pendingBrands} allBrands={allBrands} currentUser={session} />
    </SharedLayout>
  )
}

