'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  BookOpen, Users, FileText, MessageSquare, Plus, Bell, Activity, CheckCircle, 
  Clock, Target, Settings, Download, TrendingUp, TrendingDown, ArrowUp, 
  ArrowDown, ChevronRight, RefreshCw, Calendar, AlertCircle, FileCheck, 
  Lightbulb, MoreVertical, ChevronDown, LayoutDashboard, Building2, Briefcase, 
  Shield, Crown, BarChart3
} from 'lucide-react'
import SharedLayout from '../Layout/SharedLayout'
import PremiumBanner from '../Premium/PremiumBanner'
import DocumentChart from './DocumentChart'
import { DashboardModule } from '@/lib/dashboard-modules'
import { usePathname } from 'next/navigation'

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
  LayoutDashboard,
  Building2,
  Briefcase,
  Shield,
  Crown,
  Settings,
  BarChart3,
}

interface DashboardContentProps {
  statCards: StatCard[]
  trendingTopics: Array<{ category: string; name: string; posts: string }>
  currentUser: any
  stats?: any
  modules?: DashboardModule[]
}

export default function DashboardContent({
  statCards: initialStatCards,
  trendingTopics,
  currentUser,
  stats: initialStats,
  modules = [],
}: DashboardContentProps) {
  const router = useRouter()
  const pathname = usePathname()
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
        {/* Top Navigation Bar - Module Navigation */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2 flex-wrap">
            {modules
              .filter((m) => m.category === 'overview' || m.category === 'management')
              .slice(0, 5)
              .map((module) => {
                const IconComponent = iconMap[module.icon] || FileText
                const isActive = pathname === module.href || pathname?.startsWith(module.href + '/')
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`px-4 py-2 rounded-lg font-poppins font-medium transition-colors flex items-center space-x-2 ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span>{module.title}</span>
                  </Link>
                )
              })}
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

        {/* General Report Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins">Báo cáo tổng quan</h2>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-poppins text-sm flex items-center space-x-2">
              <Download size={16} />
              <span>Tải báo cáo</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">Tổng giao dịch</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-poppins">
                {stats?.incomingDocs || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-poppins mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                2% tăng
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">Trường hợp hủy</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-poppins">
                {stats?.pendingIncoming || 0}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 font-poppins mt-1 flex items-center">
                <TrendingDown size={12} className="mr-1" />
                0.1% giảm
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">Văn bản đến</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 font-poppins">
                {stats?.incomingDocs || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-poppins mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                49% tăng
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">Văn bản đi</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-poppins">
                {stats?.outgoingDocs || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-poppins mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                52% tăng
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-1">Người dùng mới</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 font-poppins">
                {stats?.students || stats?.friends || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-poppins mt-1 flex items-center">
                <TrendingUp size={12} className="mr-1" />
                52% tăng
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold font-poppins mb-2">
                  {stats?.completedIncoming || 0}
                </p>
                <p className="text-blue-100 font-poppins text-sm mb-4">
                  Văn bản đã hoàn thành trong tháng này sau các khoản phí liên quan, & trước thuế.
                </p>
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-poppins font-semibold hover:bg-blue-50 transition-colors">
                  Tải báo cáo
                </button>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-poppins mb-1">47%</p>
                <p className="text-blue-100 font-poppins text-sm">Tăng trưởng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Top Documents & Recent Activities & Schedules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Top Documents */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">Văn bản hàng tuần</h2>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-poppins hover:bg-gray-200 dark:hover:bg-gray-700">
                    Xuất Excel
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-poppins hover:bg-gray-200 dark:hover:bg-gray-700">
                    Xuất PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">Hình ảnh</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">Tên văn bản</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-poppins">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {(stats?.recentDocuments || []).slice(0, 5).map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white font-poppins">
                          {doc.title || 'Văn bản không có tiêu đề'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                          {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full font-poppins ${
                          doc.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : doc.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {doc.status === 'COMPLETED' ? 'Hoàn thành' : doc.status === 'PENDING' ? 'Chờ xử lý' : doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-poppins mr-3">
                          Sửa
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-poppins">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.recentDocuments || stats.recentDocuments.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 font-poppins">
                        Chưa có văn bản nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Hiển thị 1-5 của {(stats?.recentDocuments || []).length}</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg font-poppins hover:bg-gray-50 dark:hover:bg-gray-800">
                  Trước
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg font-poppins hover:bg-gray-50 dark:hover:bg-gray-800">
                  Sau
                </button>
              </div>
            </div>
          </div>

          {/* Schedules */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">Lịch trình</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-900 dark:text-white font-poppins">
                    {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 font-poppins py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const date = new Date()
                    date.setDate(1)
                    date.setDate(date.getDate() + i - date.getDay())
                    const day = date.getDate()
                    const isToday = date.toDateString() === new Date().toDateString()
                    const hasTask = (stats?.upcomingTasks || []).some((task: any) => {
                      if (!task.dueDate) return false
                      const taskDate = new Date(task.dueDate)
                      return taskDate.toDateString() === date.toDateString()
                    })
                    
                    return (
                      <div
                        key={i}
                        className={`text-center text-sm font-poppins py-2 ${
                          isToday
                            ? 'bg-blue-500 text-white rounded-lg'
                            : hasTask
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {day > 0 && day <= 31 ? day : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3 mt-6">
                {(stats?.upcomingTasks || []).slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white font-poppins">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}
                      </p>
                    </div>
                  </div>
                ))}
                {(!stats?.upcomingTasks || stats.upcomingTasks.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-4">
                    Không có lịch trình
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activities */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">Hoạt động gần đây</h2>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {(stats?.recentActivities || []).slice(0, 10).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    {activity.user?.avatar ? (
                      <img src={activity.user.avatar} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-poppins font-semibold">
                        {activity.user?.firstName?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-poppins">
                      <span className="font-semibold">
                        {activity.user?.firstName} {activity.user?.lastName}
                      </span>
                      {' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {activity.action === 'CREATE' ? 'đã tạo' : activity.action === 'UPDATE' ? 'đã cập nhật' : activity.action === 'APPROVE' ? 'đã phê duyệt' : 'đã thực hiện'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
                      {new Date(activity.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-8">
                  Chưa có hoạt động nào
                </p>
              )}
              {(stats?.recentActivities || []).length > 10 && (
                <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-poppins">
                  Xem thêm
                </button>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-poppins">Giao dịch</h2>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {(stats?.recentDocuments || []).slice(0, 10).map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      {doc.createdBy?.avatar ? (
                        <img src={doc.createdBy.avatar} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-poppins font-semibold">
                          {doc.createdBy?.firstName?.[0] || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white font-poppins">
                        {doc.createdBy?.firstName} {doc.createdBy?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                        {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold font-poppins ${
                      doc.status === 'COMPLETED' 
                        ? 'text-green-600 dark:text-green-400'
                        : doc.status === 'PENDING'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {doc.status === 'COMPLETED' ? '+' : doc.status === 'PENDING' ? '~' : '-'}
                      {doc.status === 'COMPLETED' ? '100' : doc.status === 'PENDING' ? '0' : '0'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                      {doc.status === 'COMPLETED' ? 'Hoàn thành' : doc.status === 'PENDING' ? 'Chờ xử lý' : doc.status}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats?.recentDocuments || stats.recentDocuments.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins text-center py-8">
                  Chưa có giao dịch nào
                </p>
              )}
              {(stats?.recentDocuments || []).length > 10 && (
                <button className="w-full mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-poppins">
                  Xem thêm
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
