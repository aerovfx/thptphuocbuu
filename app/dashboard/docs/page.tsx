import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import DocumentsList from '@/components/Docs/DocumentsList'

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Tài liệu', posts: '0' },
  ]

  return (
    <SharedLayout
      title="Tài liệu cộng tác"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <DocumentsList currentUser={session} />
    </SharedLayout>
  )
}

