import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
import CreateOutgoingDocument from '@/components/DMS/CreateOutgoingDocument'

export default async function CreateOutgoingDocumentPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Chỉ ADMIN và TEACHER mới có thể tạo văn bản đi
  if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
    redirect('/dashboard/dms/outgoing')
  }

  const trendingTopics = [
    { category: 'Chủ đề nổi trội', name: 'Văn bản đi', posts: '856' },
    { category: 'Chủ đề nổi trội', name: 'Quản lý tài liệu', posts: '642' },
  ]

  // CreateOutgoingDocument now handles its own layout (Google Docs style)
  return <CreateOutgoingDocument currentUser={session} />
}

