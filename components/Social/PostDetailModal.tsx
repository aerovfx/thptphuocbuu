'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, Bookmark, BookmarkCheck, X, MapPin, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import PostComments from './PostComments'
import Avatar from '../Common/Avatar'
import ShareMenu from './ShareMenu'

interface Post {
  id: string
  content: string
  createdAt: Date
  imageUrl?: string | null
  videoUrl?: string | null
  type?: string
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  scheduledAt?: Date | null
  author: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

interface PostDetailModalProps {
  post: Post
  isOpen: boolean
  onClose: () => void
  currentUserId: string | null
  isGuest?: boolean
  onInteractionRequired?: (action: string) => boolean
}

export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  currentUserId,
  isGuest = false,
  onInteractionRequired,
}: PostDetailModalProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(post._count.likes)
  const [commentsCount, setCommentsCount] = useState(post._count.comments)
  const [showComments, setShowComments] = useState(true)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareButtonRef = useRef<HTMLButtonElement>(null)

  // Load like and bookmark status
  useEffect(() => {
    if (currentUserId && isOpen) {
      // Check if liked
      fetch(`/api/posts/${post.id}/like`)
        .then((res) => res.json())
        .then((data) => {
          if (data.liked !== undefined) {
            setLiked(data.liked)
          }
        })
        .catch(console.error)

      // Check if bookmarked
      fetch('/api/bookmarks')
        .then((res) => res.json())
        .then((data) => {
          if (data.bookmarks) {
            const isBookmarked = data.bookmarks.some((b: any) => b.postId === post.id)
            setBookmarked(isBookmarked)
          }
        })
        .catch(console.error)
    }
  }, [post.id, currentUserId, isOpen])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLike = async () => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('like')
      }
      return
    }

    const wasLiked = liked
    const previousLikesCount = likesCount
    
    // Optimistic update
    setLiked(!liked)
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1))

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: wasLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        // Revert on error
        setLiked(wasLiked)
        setLikesCount(previousLikesCount)
        
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error === 'Already liked') {
          // If already liked, refresh like status
          const checkResponse = await fetch(`/api/posts/${post.id}/like`)
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            if (checkData.liked) {
              setLiked(true)
              // Refresh likes count from server
              router.refresh()
            }
          }
        }
      }
    } catch (error) {
      // Revert on error
      setLiked(wasLiked)
      setLikesCount(previousLikesCount)
      console.error('Error toggling like:', error)
    }
  }

  const handleBookmark = async () => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('bookmark')
      }
      return
    }

    const wasBookmarked = bookmarked
    setBookmarked(!bookmarked)

    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: wasBookmarked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        setBookmarked(wasBookmarked)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      setBookmarked(wasBookmarked)
    }
  }

  const handleShare = () => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('share')
      }
      return
    }

    setShowShareMenu(!showShareMenu)
  }

  const handleAuthorClick = () => {
    router.push(`/users/${post.author.id}`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Image/Video Section */}
          {(post.imageUrl || post.videoUrl) && (
            <div className="md:w-1/2 bg-black flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-0">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt="Post media"
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '90vh' }}
                />
              ) : post.videoUrl ? (
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '90vh' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              ) : null}
            </div>
          )}

          {/* Content Section */}
          <div className={`${post.imageUrl || post.videoUrl ? 'md:w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={post.author.avatar}
                  name={`${post.author.firstName} ${post.author.lastName}`}
                  userId={post.author.id}
                  clickable={true}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3
                    onClick={handleAuthorClick}
                    className="font-bold text-gray-900 dark:text-white hover:underline cursor-pointer font-poppins"
                  >
                    {post.author.firstName} {post.author.lastName}
                  </h3>
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-poppins">
                    @{post.author.firstName.toLowerCase()}
                    {post.author.lastName.toLowerCase().replace(/\s+/g, '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4 flex-1 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {/* Post Text */}
                {post.content && (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words font-poppins leading-relaxed text-lg">
                    {post.content}
                  </p>
                )}

                {/* Location */}
                {post.locationName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span className="font-poppins">{post.locationName}</span>
                  </div>
                )}

                {/* Scheduled Time */}
                {post.scheduledAt && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={16} className="flex-shrink-0" />
                    <span className="font-poppins">
                      Đã lên lịch: {formatDistanceToNow(new Date(post.scheduledAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                )}

                {/* Post Time */}
                <div className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 font-poppins">
                {likesCount > 0 && (
                  <span>
                    <strong className="text-gray-900 dark:text-white">{likesCount.toLocaleString('vi-VN')}</strong> lượt thích
                  </span>
                )}
                {commentsCount > 0 && (
                  <span>
                    <strong className="text-gray-900 dark:text-white">{commentsCount.toLocaleString('vi-VN')}</strong> bình luận
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    liked
                      ? 'text-red-500 hover:bg-red-500/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                  disabled={isGuest}
                >
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                  <span className="font-poppins font-medium">Thích</span>
                </button>

                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                  disabled={isGuest}
                >
                  <MessageCircle size={20} />
                  <span className="font-poppins font-medium">Bình luận</span>
                </button>

                <div className="relative">
                  <button
                    ref={shareButtonRef}
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-green-500 hover:bg-green-500/10 transition-colors"
                    disabled={isGuest}
                  >
                    <Share2 size={20} />
                    <span className="font-poppins font-medium">Chia sẻ</span>
                  </button>
                  {showShareMenu && (
                    <div className="absolute bottom-full left-0 mb-2">
                      <ShareMenu
                        postUrl={`${window.location.origin}/dashboard/social?post=${post.id}`}
                        postContent={post.content}
                        postImageUrl={post.imageUrl}
                        onClose={() => setShowShareMenu(false)}
                        triggerRef={shareButtonRef}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleBookmark}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    bookmarked
                      ? 'text-blue-500 hover:bg-blue-500/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-500/10'
                  }`}
                  disabled={isGuest}
                >
                  {bookmarked ? (
                    <BookmarkCheck size={20} fill="currentColor" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                  <span className="font-poppins font-medium">Lưu</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments && currentUserId && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <PostComments postId={post.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

