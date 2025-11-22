'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, X, Sparkles, Award, Building2, Zap } from 'lucide-react'

interface PremiumBannerProps {
  currentUser: any
  isPremium?: boolean
  onDismiss?: () => void
}

export default function PremiumBanner({
  currentUser,
  isPremium = false,
  onDismiss,
}: PremiumBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [premiumStatus, setPremiumStatus] = useState(isPremium)

  useEffect(() => {
    // Check if banner was dismissed in localStorage
    const isDismissed = localStorage.getItem('premium-banner-dismissed')
    if (isDismissed === 'true') {
      setDismissed(true)
    }

    // Fetch premium status if not provided
    if (!isPremium && currentUser) {
      fetch('/api/premium/status')
        .then((res) => {
          if (!res.ok) {
            // If 401 or 404, user is not authenticated or route doesn't exist
            // Silently fail and use default isPremium value
            return null
          }
          return res.json()
        })
        .then((data) => {
          if (data && typeof data.isPremium === 'boolean') {
            setPremiumStatus(data.isPremium)
          }
        })
        .catch((error) => {
          // Silently handle errors - don't show banner if API fails
          console.debug('Failed to fetch premium status:', error)
        })
    }
  }, [currentUser, isPremium])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('premium-banner-dismissed', 'true')
    if (onDismiss) {
      onDismiss()
    }
  }

  const handleUpgrade = () => {
    if (!currentUser) {
      router.push('/login?redirect=/dashboard/premium')
      return
    }
    router.push('/dashboard/premium')
  }

  if (dismissed || premiumStatus) {
    return null
  }

  return (
    <div className="relative bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 dark:from-yellow-600 dark:via-yellow-500 dark:to-yellow-600 rounded-lg p-4 mb-6 border border-yellow-400 dark:border-yellow-500 shadow-lg">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-yellow-900 dark:text-yellow-100 hover:text-yellow-950 dark:hover:text-yellow-50 transition-colors"
      >
        <X size={20} />
      </button>

      <div className="flex items-center space-x-4 pr-8">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-yellow-600 dark:bg-yellow-700 rounded-full flex items-center justify-center">
            <Crown size={24} className="text-white" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 font-poppins">
              Nâng cấp Premium ngay hôm nay!
            </h3>
            <Sparkles size={18} className="text-yellow-900 dark:text-yellow-100" />
          </div>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-poppins mb-2">
            Mở khóa các tính năng cao cấp: Tạo thương hiệu xác minh, quản lý nhiều tài khoản, badge
            vàng, và nhiều hơn nữa
          </p>
          <div className="flex items-center space-x-4 text-xs text-yellow-800 dark:text-yellow-200 font-poppins">
            <div className="flex items-center space-x-1">
              <Building2 size={14} />
              <span>Thương hiệu xác minh</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award size={14} />
              <span>Badge vàng</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap size={14} />
              <span>Ưu tiên hiển thị</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleUpgrade}
            className="px-6 py-2.5 bg-yellow-900 dark:bg-yellow-800 hover:bg-yellow-950 dark:hover:bg-yellow-900 text-white rounded-lg font-poppins font-semibold transition-colors shadow-lg flex items-center space-x-2"
          >
            <Crown size={18} />
            <span>Nâng cấp ngay</span>
          </button>
        </div>
      </div>
    </div>
  )
}

