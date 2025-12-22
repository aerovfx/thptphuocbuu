import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SharedLayout from '@/components/Layout/SharedLayout'
import { redirect } from 'next/navigation'
import AccountSettingsClient from '@/components/Settings/AccountSettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const trendingTopics = [
    { category: 'Chủ đề nổi trội ở Việt Nam', name: 'Cài đặt', posts: '856' },
  ]

  return (
    <SharedLayout
      title="Cài đặt"
    >
      <div className="p-6">
        <AccountSettingsClient />
      </div>
    </SharedLayout>
  )
}

