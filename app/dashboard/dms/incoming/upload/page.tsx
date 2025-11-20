import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import RightSidebar from '@/components/Layout/RightSidebar'
import UploadIncomingDocument from '@/components/DMS/UploadIncomingDocument'

export default async function UploadIncomingDocumentPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Chỉ ADMIN và TEACHER mới có thể upload
  if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
    redirect('/dashboard/dms/incoming')
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đến', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  return (
    <SharedLayout
      title="Tải lên văn bản đến"
      rightSidebar={<RightSidebar trendingTopics={trendingTopics} currentUser={session} />}
    >
      <UploadIncomingDocument currentUser={session} />
    </SharedLayout>
  )
}

