'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { UserPlus, Check } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  variant?: 'default' | 'small'
  onFollowChange?: (isFollowing: boolean) => void
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  variant = 'default',
  onFollowChange,
}: FollowButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const method = isFollowing ? 'DELETE' : 'POST'
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      onFollowChange?.(newFollowingState)
    } catch (error: any) {
      console.error('Error following/unfollowing:', error)
      alert(error.message || 'Đã xảy ra lỗi')
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-3 py-1 rounded-full text-sm font-semibold font-poppins transition-colors ${
          isFollowing
            ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
            : 'bg-white hover:bg-gray-200 text-black'
        } disabled:opacity-50 flex items-center space-x-1`}
      >
        {isLoading ? (
          <span>...</span>
        ) : isFollowing ? (
          <>
            <Check size={14} />
            <span>Đang theo dõi</span>
          </>
        ) : (
          <>
            <UserPlus size={14} />
            <span>Theo dõi</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-6 py-2 rounded-full font-semibold font-poppins transition-colors ${
        isFollowing
          ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
          : 'bg-white hover:bg-gray-200 text-black'
      } disabled:opacity-50 flex items-center space-x-2`}
    >
      {isLoading ? (
        <span>Đang xử lý...</span>
      ) : isFollowing ? (
        <>
          <Check size={18} />
          <span>Đang theo dõi</span>
        </>
      ) : (
        <>
          <UserPlus size={18} />
          <span>Theo dõi</span>
        </>
      )}
    </button>
  )
}

