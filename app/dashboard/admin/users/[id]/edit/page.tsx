import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import EditUserForm from '@/components/Admin/EditUserForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUser(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        bio: true,
        phone: true,
        dateOfBirth: true,
        metadata: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    })
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    return (
      <SharedLayout title="Không tìm thấy người dùng">
        <div className="p-6 text-center text-gray-400">
          <p className="font-poppins">Không tìm thấy người dùng này.</p>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout title="Chỉnh sửa người dùng">
      <EditUserForm user={user} currentUser={session} />
    </SharedLayout>
  )
}

