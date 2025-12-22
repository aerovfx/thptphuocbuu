'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import Avatar from '../Common/Avatar'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

interface PostCommentsProps {
  postId: string
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!session) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (errorData?.code === 'CONTENT_BLOCKED') {
          alert(errorData?.error || 'Bình luận có chứa từ ngữ không phù hợp')
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
      <div className="space-y-4 mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start space-x-3">
            <Avatar
              src={null}
              name={`${comment.author.firstName} ${comment.author.lastName}`}
              size="sm"
              userId={comment.author.id}
              clickable={true}
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p className="font-semibold text-sm text-bluelock-dark dark:text-white font-poppins">
                  {comment.author.firstName} {comment.author.lastName}
                </p>
                <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>
              <p className="text-bluelock-dark/70 dark:text-gray-300 text-sm font-poppins">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {session ? (
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận..."
            className="flex-1 px-4 py-2 bg-bluelock-light-2 dark:bg-gray-900 border border-bluelock-blue/30 dark:border-gray-800 rounded-full text-bluelock-dark dark:text-white placeholder-bluelock-dark/50 dark:placeholder-gray-500 focus:outline-none focus:border-bluelock-green dark:focus:border-blue-500 transition-colors duration-300 font-poppins"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-bluelock-glow dark:shadow-none"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-4 text-center border border-bluelock-blue/30 dark:border-gray-800 transition-colors duration-300">
          <p className="text-bluelock-dark/60 dark:text-gray-400 text-sm mb-2 font-poppins">Đăng nhập để bình luận</p>
          <button
            onClick={() => router.push('/login')}
            className="text-bluelock-green dark:text-blue-500 hover:text-bluelock-green-bright dark:hover:text-blue-400 text-sm font-semibold font-poppins transition-colors duration-300"
          >
            Đăng nhập
          </button>
        </div>
      )}
    </div>
  )
}

