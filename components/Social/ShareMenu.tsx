'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Facebook, Twitter, Link, Copy, Check } from 'lucide-react'

interface ShareMenuProps {
  postUrl: string
  postContent?: string
  postImageUrl?: string | null
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement>
}

export default function ShareMenu({
  postUrl,
  postContent,
  postImageUrl,
  onClose,
  triggerRef,
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        (!triggerRef || !triggerRef.current?.contains(event.target as Node))
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
    onClose()
  }

  const handleTwitterShare = () => {
    const text = postContent ? `${postContent.substring(0, 100)}...` : 'Xem bài viết này'
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
    onClose()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error copying link:', error)
      alert('Không thể sao chép liên kết')
    }
  }

  return (
    <div
      ref={menuRef}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 min-w-[240px] z-50"
    >
      <div className="px-2 py-1">
        <button
          onClick={handleFacebookShare}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <Facebook size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white font-poppins">Facebook</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Chia sẻ lên Facebook</div>
          </div>
        </button>

        <button
          onClick={handleTwitterShare}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
            <Twitter size={20} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white font-poppins">Twitter</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">Chia sẻ lên Twitter</div>
          </div>
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
            {copied ? (
              <Check size={20} className="text-white" />
            ) : (
              <Link size={20} className="text-white" />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white font-poppins">
              {copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
              {copied ? 'Liên kết đã được sao chép' : 'Sao chép liên kết bài viết'}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

