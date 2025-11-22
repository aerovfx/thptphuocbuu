import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import BrandDashboard from '@/components/Brand/BrandDashboard'

export default async function BrandDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  // Check if brand exists and user has access
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  })

  if (!brand) {
    redirect('/dashboard?error=brand_not_found')
  }

  // Check if user is a member
  if (brand.members.length === 0 && brand.createdById !== session.user.id) {
    redirect('/dashboard?error=no_access')
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: brand.name, posts: '0' },
  ]

  return (
    <SharedLayout
      title={`Thương hiệu: ${brand.name}`}
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <BrandDashboard brandId={id} currentUser={session} />
    </SharedLayout>
  )
}

