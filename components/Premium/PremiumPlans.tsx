'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Crown,
  Building2,
  Users,
  Award,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'

interface PremiumPlansProps {
  currentUser: any
  premiumStatus: {
    isPremium: boolean
    hasBrand: boolean
    brand: {
      id: string
      name: string
      verificationStatus: string
    } | null
    subscription: {
      plan: string
      endDate: string
      activatedBy: string
    } | null
  }
}

const plans = [
  {
    id: 'STANDARD',
    name: 'Premium Standard',
    price: '50',
    priceType: 'công việc hoàn thành',
    period: 'tháng',
    description: 'Gói cơ bản cho cá nhân',
    features: [
      'Tạo thương hiệu xác minh',
      'Tối đa 5 tài khoản liên kết',
      'Badge xác minh',
      'Ưu tiên hiển thị',
      'Analytics cơ bản',
      'Hỗ trợ email',
    ],
    icon: Crown,
    color: 'bg-yellow-500',
    popular: false,
  },
  {
    id: 'PRO',
    name: 'Premium Pro',
    price: '290',
    priceType: 'công việc hoàn thành',
    period: 'tháng',
    description: 'Gói chuyên nghiệp cho doanh nghiệp vừa',
    features: [
      'Tất cả tính năng Standard',
      'Tối đa 20 tài khoản liên kết',
      'Analytics nâng cao',
      'Quản lý team',
      'Ưu tiên hỗ trợ 24/7',
      'Tùy chỉnh badge',
      'API access',
    ],
    icon: Building2,
    color: 'bg-blue-500',
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Liên hệ',
    period: '',
    description: 'Gói doanh nghiệp với tính năng không giới hạn',
    features: [
      'Tất cả tính năng Pro',
      'Không giới hạn tài khoản',
      'Dedicated support',
      'Custom integrations',
      'SLA đảm bảo',
      'Training & onboarding',
      'Priority feature requests',
    ],
    icon: Shield,
    color: 'bg-purple-500',
    popular: false,
  },
]

export default function PremiumPlans({ currentUser, premiumStatus }: PremiumPlansProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [completedTasksCount, setCompletedTasksCount] = useState<number | null>(null)

  // Fetch completed tasks count
  useEffect(() => {
    const fetchCompletedTasks = async () => {
      try {
        const response = await fetch(`/api/premium/completed-tasks`)
        if (response.ok) {
          const data = await response.json()
          setCompletedTasksCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching completed tasks:', error)
      }
    }
    fetchCompletedTasks()
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (premiumStatus.isPremium) {
      alert('Bạn đã có tài khoản Premium. Vui lòng hủy gói hiện tại trước khi đăng ký gói mới.')
      return
    }

    const plan = plans.find(p => p.id === planId)
    if (plan && plan.priceType) {
      const requiredTasks = parseInt(plan.price)
      if (completedTasksCount !== null && completedTasksCount < requiredTasks) {
        alert(`Bạn cần hoàn thành ít nhất ${requiredTasks} công việc trong tháng này để đăng ký gói ${plan.name}. Hiện tại bạn đã hoàn thành ${completedTasksCount} công việc.`)
        return
      }
    }

    setSelectedPlan(planId)
    setIsSubscribing(true)

    try {
      const response = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert('Đã nâng cấp Premium thành công! Bây giờ bạn có thể tạo thương hiệu.')
      router.refresh()
      router.push('/dashboard/brand/create')
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi khi đăng ký Premium')
    } finally {
      setIsSubscribing(false)
      setSelectedPlan(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy tài khoản Premium? Bạn sẽ mất quyền truy cập vào các tính năng Premium.')) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await fetch('/api/premium/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi')
      }

      alert('Đã hủy tài khoản Premium thành công')
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Đã xảy ra lỗi khi hủy Premium')
    } finally {
      setIsCancelling(false)
      setShowCancelModal(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-bluelock-dark dark:text-white font-poppins mb-4">
          Nâng cấp tài khoản Premium
        </h1>
        <p className="text-lg text-bluelock-dark/60 dark:text-gray-400 font-poppins max-w-2xl mx-auto">
          Mở khóa các tính năng cao cấp: Tạo thương hiệu xác minh, quản lý nhiều tài khoản, và
          nhiều hơn nữa
        </p>
        {premiumStatus.isPremium && premiumStatus.subscription && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 inline-block">
            <p className="text-sm text-bluelock-dark dark:text-gray-300 font-poppins">
              <span className="font-bold text-green-600 dark:text-green-400">Premium {premiumStatus.subscription.plan}</span> - 
              Hết hạn: {new Date(premiumStatus.subscription.endDate).toLocaleDateString('vi-VN')}
              {premiumStatus.subscription.activatedBy === 'TASKS' && (
                <span className="ml-2 text-xs text-gray-500">(Tự động kích hoạt)</span>
              )}
            </p>
          </div>
        )}
        {completedTasksCount !== null && !premiumStatus.isPremium && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 inline-block">
            <p className="text-sm text-bluelock-dark dark:text-gray-300 font-poppins">
              Bạn đã hoàn thành <span className="font-bold text-blue-600 dark:text-blue-400">{completedTasksCount}</span> công việc trong tháng này
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
              Premium sẽ tự động kích hoạt khi bạn hoàn thành đủ số công việc yêu cầu
            </p>
          </div>
        )}
      </div>

      {/* Current Status */}
      {premiumStatus.isPremium && (
        <div className="mb-8 p-6 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Check size={24} className="text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-bluelock-dark dark:text-white font-poppins">
                  Bạn đang sử dụng Premium
                </h3>
                <p className="text-sm text-bluelock-dark/60 dark:text-gray-400 font-poppins">
                  {premiumStatus.hasBrand
                    ? `Thương hiệu: ${premiumStatus.brand?.name}`
                    : 'Bạn có thể tạo thương hiệu ngay bây giờ'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {premiumStatus.hasBrand && (
                <button
                  onClick={() => router.push(`/dashboard/brand/${premiumStatus.brand?.id}`)}
                  className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors"
                >
                  Quản lý thương hiệu
                </button>
              )}
              {!premiumStatus.hasBrand && (
                <button
                  onClick={() => router.push('/dashboard/brand/create')}
                  className="px-4 py-2 bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white rounded-lg font-poppins font-semibold transition-colors"
                >
                  Tạo thương hiệu
                </button>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                {isCancelling ? 'Đang xử lý...' : 'Hủy Premium'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isSelected = selectedPlan === plan.id
          const isProcessing = isSubscribing && isSelected

          return (
            <div
              key={plan.id}
              className={`relative bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border-2 transition-all ${
                plan.popular
                  ? 'border-bluelock-green dark:border-blue-500 shadow-lg scale-105'
                  : 'border-bluelock-blue/30 dark:border-gray-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-bluelock-green dark:bg-blue-500 text-black dark:text-white px-4 py-1 rounded-full text-sm font-poppins font-semibold">
                    Phổ biến nhất
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins mb-2">
                  {plan.name}
                </h3>
                <p className="text-bluelock-dark/60 dark:text-gray-400 font-poppins mb-4">
                  {plan.description}
                </p>
                <div className="mb-4">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-bluelock-dark dark:text-white font-poppins">
                      {plan.price}
                    </span>
                    {plan.period && plan.priceType && (
                      <span className="text-bluelock-dark/60 dark:text-gray-400 font-poppins text-sm">
                        {plan.priceType}/{plan.period}
                      </span>
                    )}
                    {plan.period && !plan.priceType && (
                      <span className="text-bluelock-dark/60 dark:text-gray-400 font-poppins ml-2">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  {plan.priceType && (
                    <p className="text-xs text-bluelock-dark/50 dark:text-gray-500 font-poppins mt-1 text-center">
                      (Tương đương {parseInt(plan.price) * 1000} VNĐ/tháng)
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-bluelock-dark dark:text-white font-poppins">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={premiumStatus.isPremium || isProcessing || (!!plan.priceType && completedTasksCount !== null && completedTasksCount < parseInt(plan.price))}
                className={`w-full py-3 rounded-lg font-poppins font-semibold transition-colors flex items-center justify-center space-x-2 ${
                  premiumStatus.isPremium
                    ? 'bg-gray-600 cursor-not-allowed text-white'
                    : plan.priceType && completedTasksCount !== null && completedTasksCount < parseInt(plan.price)
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : plan.popular
                    ? 'bg-bluelock-green hover:bg-bluelock-green-bright dark:bg-blue-500 dark:hover:bg-blue-600 text-black dark:text-white'
                    : 'bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white border border-bluelock-blue/30 dark:border-gray-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : premiumStatus.isPremium ? (
                  <span>Đã đăng ký</span>
                ) : plan.priceType && completedTasksCount !== null && completedTasksCount < parseInt(plan.price) ? (
                  <span>Chưa đủ điều kiện ({completedTasksCount}/{plan.price} công việc)</span>
                ) : plan.id === 'ENTERPRISE' ? (
                  <>
                    <span>Liên hệ</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <span>Đăng ký ngay</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 border border-bluelock-blue/30 dark:border-gray-800">
        <h2 className="text-2xl font-bold text-bluelock-dark dark:text-white font-poppins mb-6">
          So sánh các gói
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bluelock-blue/30 dark:border-gray-800">
                <th className="text-left py-3 px-4 font-poppins font-semibold text-bluelock-dark dark:text-white">
                  Tính năng
                </th>
                <th className="text-center py-3 px-4 font-poppins font-semibold text-bluelock-dark dark:text-white">
                  Standard
                </th>
                <th className="text-center py-3 px-4 font-poppins font-semibold text-bluelock-dark dark:text-white">
                  Pro
                </th>
                <th className="text-center py-3 px-4 font-poppins font-semibold text-bluelock-dark dark:text-white">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-bluelock-blue/30 dark:border-gray-800">
                <td className="py-3 px-4 font-poppins text-bluelock-dark dark:text-white">
                  Tài khoản liên kết
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  5
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  20
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Không giới hạn
                </td>
              </tr>
              <tr className="border-b border-bluelock-blue/30 dark:border-gray-800">
                <td className="py-3 px-4 font-poppins text-bluelock-dark dark:text-white">
                  Analytics
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Cơ bản
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Nâng cao
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Custom
                </td>
              </tr>
              <tr className="border-b border-bluelock-blue/30 dark:border-gray-800">
                <td className="py-3 px-4 font-poppins text-bluelock-dark dark:text-white">
                  Hỗ trợ
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Email
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  24/7
                </td>
                <td className="py-3 px-4 text-center font-poppins text-bluelock-dark/60 dark:text-gray-400">
                  Dedicated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bluelock-light-2 dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-bluelock-blue/30 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-bluelock-dark dark:text-white font-poppins">
                Hủy tài khoản Premium
              </h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-bluelock-dark/60 dark:text-gray-400 hover:text-bluelock-dark dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-bluelock-dark dark:text-white font-poppins mb-6">
              Bạn có chắc chắn muốn hủy tài khoản Premium? Bạn sẽ mất quyền truy cập vào các tính
              năng Premium và thương hiệu của bạn.
            </p>
            {premiumStatus.hasBrand && (
              <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <p className="text-sm text-yellow-400 font-poppins">
                  ⚠️ Bạn đang có thương hiệu "{premiumStatus.brand?.name}". Vui lòng xóa thương hiệu
                  trước khi hủy Premium.
                </p>
              </div>
            )}
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-bluelock-light-2 dark:bg-gray-800 hover:bg-bluelock-light-3 dark:hover:bg-gray-700 text-bluelock-dark dark:text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling || premiumStatus.hasBrand}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-poppins font-semibold transition-colors"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

