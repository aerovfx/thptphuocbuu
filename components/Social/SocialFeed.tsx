'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, BookmarkCheck, UserPlus, Check, MapPin, Edit, Trash2, ChefHat } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale/vi'
import PostComments from './PostComments'
import Avatar from '../Common/Avatar'
import EditPostModal from './EditPostModal'
import PostDetailModal from './PostDetailModal'
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
  isRemix?: boolean
  remixedAt?: Date | string
  author: {
    id: string
    firstName: string
    lastName: string
    avatar?: string | null
  }
  _count?: {
    likes?: number
    comments?: number
    reposts?: number
  }
}

interface SocialFeedProps {
  initialPosts: Post[]
  currentUserId: string | null
  isGuest?: boolean
  onInteractionRequired?: (action: string) => boolean
}

export default function SocialFeed({
  initialPosts,
  currentUserId,
  isGuest = false,
  onInteractionRequired,
}: SocialFeedProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set())
  const [remixedPosts, setRemixedPosts] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [viewingPost, setViewingPost] = useState<Post | null>(null)
  const [sharingPostId, setSharingPostId] = useState<string | null>(null)
  const shareButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // Load bookmarked posts, liked posts, and follow status on mount
  useEffect(() => {
    if (currentUserId) {
      // Load bookmarks
      fetch('/api/bookmarks')
        .then((res) => res.json())
        .then((data) => {
          if (data.bookmarks) {
            setBookmarkedPosts(new Set(data.bookmarks.map((b: any) => b.postId)))
          }
        })
        .catch(console.error)

      // Load liked posts
      const postIds = initialPosts.map((post) => post.id)
      Promise.all(
        postIds.map((postId) =>
          fetch(`/api/posts/${postId}/like`)
            .then((res) => res.json())
            .then((data) => ({ postId, liked: data.liked }))
            .catch(() => ({ postId, liked: false }))
        )
      ).then((results) => {
        const likedSet = new Set<string>()
        results.forEach(({ postId, liked }) => {
          if (liked) {
            likedSet.add(postId)
          }
        })
        setLikedPosts(likedSet)
      })

      // Load remixed posts
      Promise.all(
        postIds.map((postId) =>
          fetch(`/api/posts/${postId}/remix`)
            .then((res) => res.json())
            .then((data) => ({ postId, remixed: data.remixed }))
            .catch(() => ({ postId, remixed: false }))
        )
      ).then((results) => {
        const remixedSet = new Set<string>()
        results.forEach(({ postId, remixed }) => {
          if (remixed) {
            remixedSet.add(postId)
          }
        })
        setRemixedPosts(remixedSet)
      })

      // Load follow status for all unique authors
      const uniqueAuthorIds = [...new Set(initialPosts.map((post) => post.author.id))]
      Promise.all(
        uniqueAuthorIds.map((authorId) =>
          fetch(`/api/users/${authorId}/follow`)
            .then((res) => res.json())
            .then((data) => ({ authorId, isFollowing: data.isFollowing }))
            .catch(() => ({ authorId, isFollowing: false }))
        )
      ).then((results) => {
        const followingSet = new Set<string>()
        results.forEach(({ authorId, isFollowing }) => {
          if (isFollowing) {
            followingSet.add(authorId)
          }
        })
        setFollowingUsers(followingSet)
      })
    }
  }, [currentUserId, initialPosts])

  // Update posts when initialPosts changes (e.g., after creating a new post)
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  // Listen for post creation events and refresh posts
  useEffect(() => {
    const handlePostCreated = () => {
      // Fetch latest posts from API
      fetch('/api/posts?limit=20')
        .then((res) => res.json())
        .then((data) => {
          // API returns array directly, not wrapped in object
          if (Array.isArray(data)) {
            setPosts(data)
          } else if (data.posts && Array.isArray(data.posts)) {
            setPosts(data.posts)
          }
        })
        .catch((error) => {
          console.error('Error fetching posts after creation:', error)
          // Fallback to router refresh if API fails
          router.refresh()
        })
    }

    // Listen for custom event
    window.addEventListener('postCreated', handlePostCreated)

    return () => {
      window.removeEventListener('postCreated', handlePostCreated)
    }
  }, [router])

  const handleLike = async (postId: string) => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('like')
      }
      return
    }

    const isLiked = likedPosts.has(postId)
    const previousLikedPosts = new Set(likedPosts)
    
    // Optimistic update
    const newLikedPosts = new Set(likedPosts)
    if (isLiked) {
      newLikedPosts.delete(postId)
    } else {
      newLikedPosts.add(postId)
    }
    setLikedPosts(newLikedPosts)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        // Revert on error
        setLikedPosts(previousLikedPosts)
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error === 'Already liked') {
          // If already liked, refresh like status
          const checkResponse = await fetch(`/api/posts/${postId}/like`)
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            if (checkData.liked) {
              setLikedPosts((prev) => new Set(prev).add(postId))
            }
          }
        }
      }
    } catch (error) {
      // Revert on error
      setLikedPosts(previousLikedPosts)
      console.error('Error toggling like:', error)
    }
  }

  const toggleComments = (postId: string) => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('comment')
      }
      return
    }

    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedComments(newExpanded)
  }

  const handleShare = (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('share')
      }
      return
    }

    // Toggle share menu
    if (sharingPostId === postId) {
      setSharingPostId(null)
    } else {
      setSharingPostId(postId)
    }
  }

  const handlePostMenu = (e: React.MouseEvent, postId: string, authorId: string) => {
    e.stopPropagation()
    // TODO: Show menu with options: Copy link, Report, etc.
    console.log('Post menu:', postId)
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      return
    }

    setDeletingPostId(postId)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove post from state
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId))
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Lỗi khi xóa bài viết')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Đã xảy ra lỗi khi xóa bài viết')
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleEditSuccess = () => {
    router.refresh()
    // Reload posts
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data)
        }
      })
      .catch(console.error)
  }

  const handleAuthorClick = (authorId: string) => {
    router.push(`/users/${authorId}`)
  }

  const handleFollow = async (authorId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isGuest || !currentUserId || authorId === currentUserId) return

    const isFollowing = followingUsers.has(authorId)
    setLoadingFollow((prev) => new Set(prev).add(authorId))

    // Optimistic update
    setFollowingUsers((prev) => {
      const newSet = new Set(prev)
      if (isFollowing) {
        newSet.delete(authorId)
      } else {
        newSet.add(authorId)
      }
      return newSet
    })

    try {
      const response = await fetch(`/api/users/${authorId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        // Revert on error
        setFollowingUsers((prev) => {
          const reverted = new Set(prev)
          if (isFollowing) {
            reverted.add(authorId)
          } else {
            reverted.delete(authorId)
          }
          return reverted
        })
        const data = await response.json()
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error)
      alert(error.message || 'Đã xảy ra lỗi')
    } finally {
      setLoadingFollow((prev) => {
        const newSet = new Set(prev)
        newSet.delete(authorId)
        return newSet
      })
    }
  }

  const handleBookmark = async (postId: string) => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('bookmark')
      }
      return
    }

    // Capture current state before update
    const isBookmarked = bookmarkedPosts.has(postId)

    // Optimistic update
    setBookmarkedPosts((prevBookmarked) => {
      const newBookmarked = new Set(prevBookmarked)
      if (isBookmarked) {
        newBookmarked.delete(postId)
      } else {
        newBookmarked.add(postId)
      }
      return newBookmarked
    })

    try {
      const response = await fetch(`/api/posts/${postId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        // Revert on error using functional update
        setBookmarkedPosts((prevBookmarked) => {
          const reverted = new Set(prevBookmarked)
          if (isBookmarked) {
            reverted.add(postId)
          } else {
            reverted.delete(postId)
          }
          return reverted
        })
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      // Revert on error using functional update
      setBookmarkedPosts((prevBookmarked) => {
        const reverted = new Set(prevBookmarked)
        if (isBookmarked) {
          reverted.add(postId)
        } else {
          reverted.delete(postId)
        }
        return reverted
      })
    }
  }

  const handleRemix = async (postId: string) => {
    if (isGuest || !currentUserId) {
      if (onInteractionRequired) {
        onInteractionRequired('remix')
      }
      return
    }

    // Capture current state before update
    const isRemixed = remixedPosts.has(postId)

    // Optimistic update
    setRemixedPosts((prevRemixed) => {
      const newRemixed = new Set(prevRemixed)
      if (isRemixed) {
        newRemixed.delete(postId)
      } else {
        newRemixed.add(postId)
      }
      return newRemixed
    })

    // Update post count optimistically
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              _count: {
                likes: post._count?.likes || 0,
                comments: post._count?.comments || 0,
                reposts: (post._count?.reposts || 0) + (isRemixed ? -1 : 1),
              },
            }
          : post
      )
    )

    try {
      const response = await fetch(`/api/posts/${postId}/remix`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Revert on error
        setRemixedPosts((prevRemixed) => {
          const reverted = new Set(prevRemixed)
          if (isRemixed) {
            reverted.add(postId)
          } else {
            reverted.delete(postId)
          }
          return reverted
        })
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  _count: {
                    likes: post._count?.likes || 0,
                    comments: post._count?.comments || 0,
                    reposts: (post._count?.reposts || 0) + (isRemixed ? 1 : -1),
                  },
                }
              : post
          )
        )
      } else {
        // Refresh to get updated counts
        router.refresh()
      }
    } catch (error) {
      console.error('Error toggling remix:', error)
      // Revert on error
      setRemixedPosts((prevRemixed) => {
        const reverted = new Set(prevRemixed)
        if (isRemixed) {
          reverted.add(postId)
        } else {
          reverted.delete(postId)
        }
        return reverted
      })
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                _count: {
                  ...post._count,
                  reposts: (post._count.reposts || 0) + (isRemixed ? 1 : -1),
                },
              }
            : post
        )
      )
    }
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <article
          key={post.id}
          className="px-4 py-3 border-b border-bluelock-blue/30 dark:border-gray-800 hover:bg-bluelock-light-2 dark:hover:bg-gray-900/30 transition-colors duration-300"
        >
          {post.isRemix && (
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400 px-4">
              <ChefHat size={14} fill="currentColor" />
              <span className="font-poppins">Đã remix</span>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <Avatar
              src={post.author.avatar}
              name={`${post.author.firstName} ${post.author.lastName}`}
              size="md"
              userId={post.author.id}
              clickable={true}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2 flex-wrap flex-1 min-w-0">
                  <h3
                    onClick={() => handleAuthorClick(post.author.id)}
                    className="font-bold text-bluelock-dark dark:text-white hover:underline cursor-pointer font-poppins"
                  >
                    {post.author.firstName} {post.author.lastName}
                  </h3>
                  <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                    @{post.author.firstName.toLowerCase()}
                    {post.author.lastName.toLowerCase().replace(/\s+/g, '')}
                  </span>
                  <span className="text-bluelock-dark/60 dark:text-gray-500">·</span>
                  <span className="text-bluelock-dark/60 dark:text-gray-500 text-sm font-poppins">
                    {formatDistanceToNow(
                      new Date(post.isRemix && post.remixedAt ? post.remixedAt : post.createdAt),
                      {
                        addSuffix: true,
                        locale: vi,
                      }
                    )}
                  </span>
                  {/* Follow button - only show if not own post and user is logged in */}
                  {currentUserId && post.author.id !== currentUserId && (
                    <button
                      onClick={(e) => handleFollow(post.author.id, e)}
                      disabled={loadingFollow.has(post.author.id)}
                      className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold font-poppins transition-colors duration-300 disabled:opacity-50 ${
                        followingUsers.has(post.author.id)
                          ? 'bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white border border-bluelock-blue/30 dark:border-gray-700'
                          : 'bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-white dark:hover:bg-gray-200 text-black'
                      } flex items-center space-x-1`}
                      title={followingUsers.has(post.author.id) ? 'Hủy theo dõi' : 'Theo dõi'}
                    >
                      {loadingFollow.has(post.author.id) ? (
                        <span>...</span>
                      ) : followingUsers.has(post.author.id) ? (
                        <>
                          <Check size={12} />
                          <span>Đang theo dõi</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={12} />
                          <span>Theo dõi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {/* Edit and Delete buttons - only show for own posts */}
                  {currentUserId && post.author.id === currentUserId && (
                    <>
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors duration-300"
                        title="Chỉnh sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingPostId === post.id}
                        className="text-bluelock-dark/60 dark:text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full p-1 transition-colors duration-300 disabled:opacity-50"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => handlePostMenu(e, post.id, post.author.id)}
                    className="text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 hover:bg-bluelock-green/10 dark:hover:bg-blue-500/10 rounded-full p-1 transition-colors duration-300"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {post.content && (
                <p 
                  className="text-bluelock-dark dark:text-white mb-3 whitespace-pre-wrap break-words font-poppins leading-relaxed cursor-pointer hover:underline"
                  onClick={() => setViewingPost(post)}
                >
                  {post.content}
                </p>
              )}

              {/* Media Display */}
              {post.imageUrl && (
                <div className="mb-3 rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 cursor-pointer"
                  onClick={() => setViewingPost(post)}
                >
                  <img
                    src={post.imageUrl}
                    alt="Post media"
                    className="w-full max-h-96 object-contain bg-bluelock-light-2 dark:bg-gray-900 hover:opacity-90 transition-opacity"
                  />
                </div>
              )}

              {post.videoUrl && (
                <div className="mb-3 rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 cursor-pointer"
                  onClick={() => setViewingPost(post)}
                >
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full max-h-96 object-contain bg-bluelock-light-2 dark:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                </div>
              )}

              {/* Location Display */}
              {post.locationName && (
                <div className="mb-3 flex items-center space-x-2 text-sm text-bluelock-dark/70 dark:text-gray-400">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="font-poppins">{post.locationName}</span>
                </div>
              )}

              <div className="flex items-center justify-between max-w-md mt-3">
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center space-x-1 text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500 transition-colors group duration-300"
                  disabled={isGuest}
                >
                  <div className="p-2 rounded-full group-hover:bg-bluelock-green/10 dark:group-hover:bg-blue-500/10 transition-colors">
                    <MessageCircle size={18.75} />
                  </div>
                  {(post._count?.comments || 0) > 0 && (
                    <span className="text-sm font-poppins">{post._count?.comments || 0}</span>
                  )}
                </button>

                <button
                  onClick={() => handleRemix(post.id)}
                  className={`flex items-center space-x-1 transition-colors group duration-300 ${
                    post.author.id === currentUserId
                      ? 'text-green-500 opacity-50 cursor-not-allowed'
                      : remixedPosts.has(post.id)
                      ? 'text-green-500'
                      : 'text-bluelock-dark/60 dark:text-gray-500 hover:text-green-500'
                  }`}
                  disabled={isGuest || post.author.id === currentUserId}
                  title={
                    post.author.id === currentUserId
                      ? 'Không thể remix bài viết của chính mình'
                      : remixedPosts.has(post.id)
                      ? 'Hủy remix'
                      : 'Remix bài viết'
                  }
                >
                  <div className={`p-2 rounded-full transition-colors ${
                    post.author.id === currentUserId
                      ? 'bg-green-500/20'
                      : 'group-hover:bg-green-500/10'
                  }`}>
                    <ChefHat
                      size={18.75}
                      fill={remixedPosts.has(post.id) || post.author.id === currentUserId ? 'currentColor' : 'none'}
                    />
                  </div>
                  {(post._count?.reposts || 0) > 0 && (
                    <span className="text-sm font-poppins">{post._count?.reposts || 0}</span>
                  )}
                </button>

                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 transition-colors group duration-300 ${
                    likedPosts.has(post.id)
                      ? 'text-red-500'
                      : 'text-bluelock-dark/60 dark:text-gray-500 hover:text-red-500'
                  }`}
                  disabled={isGuest}
                >
                  <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                    <Heart
                      size={18.75}
                      fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
                    />
                  </div>
                  {((post._count?.likes || 0) > 0 || likedPosts.has(post.id)) && (
                    <span className="text-sm font-poppins">
                      {(post._count?.likes || 0) + (likedPosts.has(post.id) ? 1 : 0)}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    ref={(el) => {
                      if (el) {
                        shareButtonRefs.current.set(post.id, el)
                      } else {
                        shareButtonRefs.current.delete(post.id)
                      }
                    }}
                    onClick={(e) => handleShare(post.id, e)}
                    className="flex items-center space-x-1 text-bluelock-dark/60 dark:text-gray-500 hover:text-green-500 transition-colors group duration-300"
                    disabled={isGuest}
                  >
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                      <Share2 size={18.75} />
                    </div>
                  </button>
                  {sharingPostId === post.id && (
                    <div className="absolute bottom-full left-0 mb-2">
                      <ShareMenu
                        postUrl={`${window.location.origin}/dashboard/social?post=${post.id}`}
                        postContent={post.content}
                        postImageUrl={post.imageUrl}
                        onClose={() => setSharingPostId(null)}
                        triggerRef={shareButtonRefs.current.get(post.id) as any}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleBookmark(post.id)}
                  className={`flex items-center space-x-1 transition-colors group duration-300 ${
                    bookmarkedPosts.has(post.id)
                      ? 'text-bluelock-green dark:text-blue-500'
                      : 'text-bluelock-dark/60 dark:text-gray-500 hover:text-bluelock-green dark:hover:text-blue-500'
                  }`}
                  disabled={isGuest}
                  title={bookmarkedPosts.has(post.id) ? 'Xóa khỏi dấu trang' : 'Lưu vào dấu trang'}
                >
                  <div className="p-2 rounded-full group-hover:bg-bluelock-green/10 dark:group-hover:bg-blue-500/10 transition-colors">
                    {bookmarkedPosts.has(post.id) ? (
                      <BookmarkCheck size={18.75} fill="currentColor" />
                    ) : (
                      <Bookmark size={18.75} />
                    )}
                  </div>
                </button>
              </div>

              {expandedComments.has(post.id) && currentUserId && (
                <div className="mt-4">
                  <PostComments postId={post.id} />
                </div>
              )}
            </div>
          </div>
        </article>
      ))}

      {posts.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-bluelock-dark/60 dark:text-gray-500 font-poppins">Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</p>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Post Detail Modal */}
      {viewingPost && (
        <PostDetailModal
          post={viewingPost}
          isOpen={!!viewingPost}
          onClose={() => setViewingPost(null)}
          currentUserId={currentUserId}
          isGuest={isGuest}
          onInteractionRequired={onInteractionRequired}
        />
      )}
    </div>
  )
}

