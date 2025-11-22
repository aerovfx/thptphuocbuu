import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import BrandVerificationForm from '@/components/Brand/BrandVerificationForm'

export default async function CreateBrandPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Check if user is premium
  const { prisma } = await import('@/lib/prisma')
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, brandId: true },
    })

    if (!user?.isPremium) {
      redirect('/dashboard/premium')
    }

    // Check if user already has a brand
    let hasBrand = false
    if (user.brandId) {
      try {
        const brand = await prisma.brand.findUnique({
          where: { id: user.brandId },
          select: { id: true },
        })
        hasBrand = !!brand
        if (hasBrand) {
          redirect(`/dashboard/brand/${user.brandId}`)
        }
      } catch (error) {
        // Brand table doesn't exist yet, ignore
        console.log('Brand table not available yet')
      }
    }
  } catch (error: any) {
    console.error('Error checking premium status:', error)
    // Fallback: allow access if error occurs
  }

  return (
    <SharedLayout
      title="Tạo thương hiệu"
    >
      <BrandVerificationForm currentUser={session} />
    </SharedLayout>
  )
}
