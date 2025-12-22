import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DepartmentList from '@/components/Departments/DepartmentList'
import SharedLayout from '@/components/Layout/SharedLayout'

async function getDepartments() {
  try {
    // Check if prisma.department exists
    if (!prisma.department) {
      console.error('prisma.department is undefined. Prisma Client may need to be regenerated.')
      return []
    }

    return await prisma.department.findMany({
      where: {
        isActive: true,
      },
      include: {
        space: {
          select: {
            name: true,
          },
        },
        leader: {
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
            documents: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return []
  }
}

export default async function DepartmentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Chỉ ADMIN, BGH, TRUONG_TONG mới được truy cập
  if (
    session.user.role !== 'ADMIN' &&
    session.user.role !== 'SUPER_ADMIN' &&
    session.user.role !== 'BGH' &&
    session.user.role !== 'TRUONG_TONG'
  ) {
    // STUDENT và các role khác redirect về dashboard
    redirect('/dashboard')
  }

  const departments = await getDepartments()
  const canCreate =
    session.user.role === 'ADMIN' ||
    session.user.role === 'SUPER_ADMIN' ||
    session.user.role === 'BGH'

  return (
    <SharedLayout title="Tổ Chuyên Môn">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
            Tổ Chuyên Môn
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Quản lý các tổ chuyên môn và bộ phận trong trường
          </p>
        </div>

        <DepartmentList initialDepartments={departments} canCreate={canCreate} />
      </div>
    </SharedLayout>
  )
}

