import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SharedLayout from '@/components/Layout/SharedLayout'
// import DocumentEditor from '@/components/Docs/DocumentEditor' // Disabled - Google Docs Clone removed for performance

// Disabled - Google Docs Clone removed for performance
// async function getDocument(id: string, userId: string) {
//   const document = await prisma.collaborativeDocument.findUnique({
//     where: { id },
//     include: {
//       owner: {
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           email: true,
//           avatar: true,
//         },
//       },
//       permissions: {
//         where: { userId },
//         take: 1,
//       },
//     },
//   })

//   if (!document) {
//     return null
//   }

//   // Check if user has access
//   if (document.ownerId !== userId && document.permissions.length === 0) {
//     return null
//   }

//   return document
// }

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  // Disabled - Google Docs Clone removed for performance
  return (
    <SharedLayout title="Tính năng đã tạm ngưng">
      <div className="p-6 text-center text-gray-400">
        <p className="font-poppins mb-4">
          Tính năng soạn thảo tài liệu cộng tác đã được tạm ngưng để tối ưu hiệu suất hệ thống.
        </p>
        <p className="font-poppins text-sm">
          Vui lòng sử dụng tính năng "Văn bản đi" để soạn thảo văn bản.
        </p>
      </div>
    </SharedLayout>
  )

  // const { id } = await params
  // const document = await getDocument(id, session.user.id)

  // if (!document) {
  //   return (
  //     <SharedLayout title="Tài liệu không tồn tại">
  //       <div className="p-6 text-center text-gray-400">
  //         <p className="font-poppins">
  //           Không tìm thấy tài liệu này hoặc bạn không có quyền truy cập.
  //         </p>
  //       </div>
  //     </SharedLayout>
  //   )
  // }

  // const userRole =
  //   document.ownerId === session.user.id
  //     ? 'OWNER'
  //     : document.permissions[0]?.role || 'VIEWER'

  // const trendingTopics = [
  //   { category: 'Chủ đề nổi trội', name: document.title, posts: '0' },
  // ]

  // // For document editor, we don't need SharedLayout wrapper
  // // The DocumentEditor component handles its own layout
  // return (
  //   <DocumentEditor
  //     document={{
  //       ...document,
  //       content: document.content as any,
  //       updatedAt: document.updatedAt.toISOString(),
  //       createdAt: document.createdAt.toISOString(),
  //       lastEditedAt: document.lastEditedAt?.toISOString() || null,
  //     }}
  //     currentUser={session}
  //     userRole={userRole}
  //   />
  // )
}

