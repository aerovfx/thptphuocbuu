'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  BookOpen, Users, FileText, MessageSquare, Plus, Bell, Activity, CheckCircle, 
  Clock, Target, Settings, Download, TrendingUp, TrendingDown, ArrowUp, 
  ArrowDown, ChevronRight, RefreshCw, Calendar, AlertCircle, FileCheck, 
  Lightbulb, MoreVertical, ChevronDown
} from 'lucide-react'
import SharedLayout from '../Layout/SharedLayout'
import PremiumBanner from '../Premium/PremiumBanner'
import DocumentChart from './DocumentChart'

// Dynamic import recharts to reduce initial bundle size
const RechartsChart = dynamic(
  () => import('recharts').then((mod) => ({
    default: ({
      data,
    }: {
      data: Array<{ name: string; new: number; closed: number }>
    }) => (
      <mod.ResponsiveContainer width="100%" height={300}>
        <mod.LineChart data={data}>
          <mod.CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <mod.XAxis dataKey="name" stroke="#9CA3AF" />
          <mod.YAxis stroke="#9CA3AF" />
          <mod.Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
          />
          <mod.Legend />
          <mod.Line type="monotone" dataKey="new" stroke="#3B82F6" strokeWidth={2} name="Mới" />
          <mod.Line type="monotone" dataKey="closed" stroke="#10B981" strokeWidth={2} name="Đã đóng" />
        </mod.LineChart>
      </mod.ResponsiveContainer>
    ),
  })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    ),
  }
)

interface StatCard {
  title: string
  value: number | string
  iconName: string
  href: string
  color: string
}

const iconMap: Record<string, any> = {
  BookOpen,
  Users,
  FileText,
  MessageSquare,
}

interface DashboardContentProps {
  statCards: StatCard[]
  trendingTopics: Array<{ category: string; name: string; posts: string }>
  currentUser: any
  stats?: any
}

export default function DashboardContent({
  statCards: initialStatCards,
  trendingTopics,
  currentUser,
  stats: initialStats,
}: DashboardContentProps) {
  const router = useRouter()
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [statCards, setStatCards] = useState(initialStatCards)
  const [stats, setStats] = useState(initialStats)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [timeFilter, setTimeFilter] = useState<'Hôm nay' | 'Hôm qua' | 'Ngày mai'>('Hôm nay')
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  const [weekFilter, setWeekFilter] = useState<'Tuần này' | 'Tuần trước'>('Tuần này')
  const [chartData, setChartData] = useState<any[]>([])

  const handleStatCardClick = (href: string, title: string) => {
    setActiveCard(title)
    router.push(href)
  }

  const fetchStats = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const newStats = await response.json()
        setStats(newStats)
        setLastUpdated(new Date())

        // Update stat cards based on new stats
        const userRole = currentUser?.user?.role
        const isTeacherOrAdmin = userRole === 'TEACHER' || userRole === 'ADMIN'
        
        const updatedStatCards = initialStatCards.map((card) => {
          if (card.title === 'Lớp học') {
            return { ...card, value: newStats.classes || 0 }
          } else if (card.title === 'Học sinh' || card.title === 'Bạn bè') {
            return { ...card, value: isTeacherOrAdmin
              ? (newStats.students || 0) 
              : (newStats.friends || 0) }
          } else if (card.title === 'Văn bản đến') {
            return { ...card, value: newStats.incomingDocs || 0 }
          } else if (card.title === 'Văn bản đi') {
            return { ...card, value: newStats.outgoingDocs || 0 }
          } else if (card.title === 'Công việc') {
            return { ...card, value: newStats.assignments || newStats.assignedDocs || 0 }
          } else if (card.title === 'Tiến độ') {
            return { ...card, value: `${newStats.workProgress || 0}%` }
          }
          return card
        })
        setStatCards(updatedStatCards)

        // Generate chart data (mock data for now - should come from API)
        const mockChartData = [
          { name: 'Mon', new: 42, closed: 28 },
          { name: 'Tue', new: 28, closed: 35 },
          { name: 'Wed', new: 43, closed: 30 },
          { name: 'Thu', new: 34, closed: 25 },
          { name: 'Fri', new: 20, closed: 18 },
          { name: 'Sat', new: 25, closed: 22 },
          { name: 'Sun', new: 22, closed: 20 },
        ]
        setChartData(mockChartData)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [initialStatCards, currentUser?.user?.role])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats()
    }, 10000)

    return () => clearInterval(interval)
  }, [fetchStats])

  // Also refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchStats()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchStats])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'Vừa cập nhật'
    if (diff < 3600) return `Cập nhật ${Math.floor(diff / 60)} phút trước`
    return `Cập nhật ${Math.floor(diff / 3600)} giờ trước`
  }

  const userName = currentUser?.user?.name || 'Người dùng'
  
  return (
    <SharedLayout
      title={`Chào mừng, ${userName}!`}
    >
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Top Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-poppins font-medium">
              Trang chủ
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-poppins transition-colors">
              Ngân sách
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-poppins transition-colors">
              Nhóm
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <select className="px-4 py-2 bg-gray-800 text-white rounded-lg font-poppins border border-gray-700">
              <option>AI-DMS System</option>
            </select>
          </div>
        </div>

        {/* Premium Banner */}
        <PremiumBanner currentUser={currentUser} />

        {/* Summary Cards Row - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Due Tasks Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <button
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins hover:text-gray-900 dark:hover:text-white"
                >
                  <span>{timeFilter}</span>
                  <ChevronDown size={16} />
                </button>
                {showTimeDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => { setTimeFilter('Hôm qua'); setShowTimeDropdown(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                    >
                      Hôm qua
                    </button>
                    <button
                      onClick={() => { setTimeFilter('Hôm nay'); setShowTimeDropdown(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins bg-blue-50 dark:bg-blue-900/20"
                    >
                      Hôm nay
                    </button>
                    <button
                      onClick={() => { setTimeFilter('Ngày mai'); setShowTimeDropdown(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-poppins"
                    >
                      Ngày mai
                    </button>
                  </div>
                )}
              </div>
              <MoreVertical size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
            </div>
            <div className="mb-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white font-poppins">
                {stats?.dueTasksToday || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">Công việc đến hạn</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
              Đã hoàn thành: {stats?.completedTasksToday || 0}
            </p>
          </div>

          {/* Overdue Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins">Quá hạn</h3>
              <MoreVertical size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
            </div>
            <div className="mb-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white font-poppins">
                {stats?.overdueTasks || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">Công việc</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
              Quá hạn hôm qua: {stats?.overdueTasksYesterday || 0}
            </p>
          </div>

          {/* Issues Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins">Vấn đề</h3>
              <MoreVertical size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
            </div>
            <div className="mb-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white font-poppins">
                {stats?.openIssues || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">Đang mở</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
              Đã đóng hôm nay: {stats?.closedIssuesToday || 0}
            </p>
          </div>

          {/* Features Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-poppins">Tính năng</h3>
              <MoreVertical size={18} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
            </div>
            <div className="mb-2">
              <p className="text-4xl font-bold text-gray-900 dark:text-white font-poppins">
                {stats?.featuresProposals || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mt-1">Đề xuất</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
              Đã triển khai: {stats?.implementedFeatures || 0}
            </p>
          </div>
        </div>

        {/* Summary Section with Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-poppins">
              Tóm tắt Văn bản
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setWeekFilter('Tuần này')}
                className={`px-4 py-2 rounded-lg text-sm font-poppins transition-colors ${
                  weekFilter === 'Tuần này'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setWeekFilter('Tuần trước')}
                className={`px-4 py-2 rounded-lg text-sm font-poppins transition-colors ${
                  weekFilter === 'Tuần trước'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Tuần trước
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-4 font-poppins">Mới vs Đã đóng</h3>
              <RechartsChart data={chartData} />
            </div>

            {/* Overview Cards */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 font-poppins mb-2">
                  {stats?.incomingDocs || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">Văn bản đến</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 font-poppins mb-2">
                  {stats?.completedIncoming || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">Đã hoàn thành</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards - Modern Design (Keep existing) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statCards.map((stat) => {
            const isPercentage = typeof stat.value === 'string' && stat.value.includes('%')
            const numericValue = typeof stat.value === 'string' ? parseFloat(stat.value.replace('%', '')) : stat.value
            const trend = numericValue > 0 ? 'up' : 'down'
            const trendValue = numericValue > 0 ? '2.5' : '1.8'
            
            return (
            <button
              key={stat.title}
              onClick={() => handleStatCardClick(stat.href, stat.title)}
              onMouseEnter={() => setActiveCard(stat.title)}
              onMouseLeave={() => setActiveCard(null)}
                className={`bg-white dark:bg-gray-900 rounded-xl p-6 border transition-all cursor-pointer text-left shadow-sm hover:shadow-md flex flex-col h-full ${
                activeCard === stat.title
                    ? 'border-blue-500 scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4 flex-shrink-0">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-poppins font-medium">{stat.title}</p>
                  <div className={`${stat.color} p-2 rounded-lg flex-shrink-0`}>
                    {(() => {
                      const IconComponent = iconMap[stat.iconName]
                      return IconComponent ? <IconComponent className="text-white" size={18} /> : null
                    })()}
                  </div>
                </div>

                <div className="flex flex-col flex-grow justify-between">
                  <div className="mb-3">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
                      {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                    </p>
                    {stat.title === 'Công việc' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mb-2 leading-tight">
                        {(currentUser?.user?.role === 'TEACHER' || currentUser?.user?.role === 'ADMIN')
                          ? 'Công việc chưa hoàn thành'
                          : 'Tổng công việc được giao'}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center space-x-1 text-sm">
                      {trend === 'up' ? (
                        <>
                          <TrendingUp size={14} className="text-green-500 flex-shrink-0" />
                          <span className="text-green-500 font-poppins text-xs">{trendValue}% trên mục tiêu</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown size={14} className="text-red-500 flex-shrink-0" />
                          <span className="text-red-500 font-poppins text-xs">{trendValue}% dưới mục tiêu</span>
                        </>
                      )}
                    </div>
                <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-poppins bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full inline-block">
                        30 ngày
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Progress Cards */}
        {stats && (stats.pendingIncoming || stats.pendingOutgoing || stats.assignments) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.pendingIncoming !== undefined && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-yellow-500" size={20} />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white font-poppins">Văn bản đến chờ xử lý</h3>
                  </div>
                </div>
                <div className="flex items-end space-x-2 mb-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">{stats.pendingIncoming}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mb-1">
                    / {stats.incomingDocs || 0} tổng
                  </p>
                </div>
                {stats.incomingDocs > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.pendingIncoming / stats.incomingDocs) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {stats.pendingOutgoing !== undefined && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-orange-500" size={20} />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white font-poppins">Văn bản đi chờ duyệt</h3>
                  </div>
            </div>
                <div className="flex items-end space-x-2 mb-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">{stats.pendingOutgoing}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mb-1">
                    / {stats.outgoingDocs || 0} tổng
              </p>
            </div>
                {stats.outgoingDocs > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((stats.pendingOutgoing / stats.outgoingDocs) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
          </div>
            )}

            {stats.assignments !== undefined && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="text-blue-500" size={20} />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white font-poppins">Tiến độ công việc</h3>
                  </div>
                </div>
                <div className="flex items-end space-x-2 mb-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">{stats.workProgress}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins mb-1">
                    {stats.completedAssignments || 0} / {(stats.assignments || 0) + (stats.completedAssignments || 0)} hoàn thành
                  </p>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.workProgress, 100)}%` }}
                    ></div>
                  </div>
            </div>
            </div>
            )}
          </div>
        )}

        {/* Chart */}
        <div className="mb-8">
          {currentUser?.user?.id && currentUser?.user?.role && (
            <DocumentChart userId={currentUser.user.id} role={currentUser.user.role} />
          )}
        </div>
      </div>
    </SharedLayout>
  )
}
