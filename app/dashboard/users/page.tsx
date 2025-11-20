import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Users as UsersIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import Avatar from '@/components/Common/Avatar'

async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
  PARENT: 'Phụ huynh',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  TEACHER: 'bg-blue-100 text-blue-800',
  STUDENT: 'bg-green-100 text-green-800',
  PARENT: 'bg-purple-100 text-purple-800',
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const users = await getAllUsers()

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Người dùng', posts: '1.2K' },
  ]

  return (
    <SharedLayout
      title="Người dùng"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <div className="p-6">
        <div className="flex items-center justify-end mb-8">
          {session.user.role === 'ADMIN' && (
            <Link
              href="/dashboard/users/new"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 font-poppins font-semibold transition-colors"
            >
              <UserPlus size={20} />
              <span>Thêm người dùng</span>
            </Link>
          )}
        </div>

        {users.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <UsersIcon className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-400 text-lg font-poppins">Chưa có người dùng nào</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                    Người dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-poppins">
                    Ngày tham gia
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatar}
                          name={`${user.firstName} ${user.lastName}`}
                          size="sm"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white font-poppins">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400 font-poppins">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-poppins ${
                          roleColors[user.role] || 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-poppins">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SharedLayout>
  )
}

