import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SpaceList from '@/components/Spaces/SpaceList'
import SharedLayout from '@/components/Layout/SharedLayout'

async function getSpaces() {
  return await prisma.space.findMany({
    where: {
      isActive: true,
    },
    include: {
      parent: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          members: true,
          departments: true,
        },
      },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
}

export default async function SpacesPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const spaces = await getSpaces()
  const canCreate =
    session.user.role === 'ADMIN' ||
    session.user.role === 'SUPER_ADMIN' ||
    session.user.role === 'BGH'

  return (
    <SharedLayout title="Quản lý Spaces">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
            Không gian làm việc
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Quản lý các không gian làm việc và tổ chức trong trường
          </p>
        </div>

        <SpaceList initialSpaces={spaces} canCreate={canCreate} />
      </div>
    </SharedLayout>
  )
}

