import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Cài đặt', posts: '856' },
  ]

  return (
    <SharedLayout
      title="Cài đặt"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <div className="p-6">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 font-poppins">
            Thông tin tài khoản
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                Tên đầy đủ
              </label>
              <p className="text-white font-poppins">{session.user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                Email
              </label>
              <p className="text-white font-poppins">{session.user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-poppins">
                Vai trò
              </label>
              <p className="text-white font-poppins">{session.user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

