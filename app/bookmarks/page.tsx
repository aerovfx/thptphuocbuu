import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BookmarksPage from '@/components/Bookmarks/BookmarksPage'

async function getBookmarkedPosts(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
    },
    include: {
      post: {
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return bookmarks.map((bookmark) => ({
    id: bookmark.post.id,
    content: bookmark.post.content,
    createdAt: bookmark.post.createdAt,
    author: bookmark.post.author,
    _count: bookmark.post._count,
    bookmarkedAt: bookmark.createdAt,
  }))
}

export default async function BookmarksPageWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const bookmarkedPosts = await getBookmarkedPosts(session.user.id)

  return <BookmarksPage bookmarkedPosts={bookmarkedPosts} currentUser={session} />
}

