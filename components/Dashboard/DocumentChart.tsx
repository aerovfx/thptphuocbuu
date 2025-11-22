'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Calendar, TrendingUp } from 'lucide-react'

// Dynamic import recharts to reduce initial bundle size
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
)
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
)
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    ),
  }
)

interface DocumentChartProps {
  userId: string
  role: string
}

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

export default function DocumentChart({ userId, role }: DocumentChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/dashboard/chart-data?period=${timePeriod}&userId=${userId}&role=${role}`)
        const data = await response.json()
        setChartData(data)
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [timePeriod, userId, role])

  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'quarter', label: 'Quý' },
    { value: 'year', label: 'Năm' },
  ]

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-poppins mb-1">Tổng quan văn bản</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Số lượng văn bản theo thời gian</p>
        </div>
        <div className="flex items-center space-x-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setTimePeriod(period.value)}
              className={`px-4 py-2 rounded-lg text-sm font-poppins transition-colors ${
                timePeriod === period.value
                  ? 'bg-gray-900 dark:bg-gray-800 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280" 
            style={{ fontFamily: 'var(--font-poppins)', fontSize: '12px' }}
            className="dark:stroke-gray-400"
          />
          <YAxis 
            stroke="#6b7280" 
            style={{ fontFamily: 'var(--font-poppins)', fontSize: '12px' }}
            className="dark:stroke-gray-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontFamily: 'var(--font-poppins)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend 
            wrapperStyle={{ fontFamily: 'var(--font-poppins)', paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="văn bản đến"
            stroke="#8b5cf6"
            strokeWidth={3}
            name="Văn bản đến"
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="văn bản đi"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Văn bản đi"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="hoàn thành"
            stroke="#10b981"
            strokeWidth={3}
            name="Hoàn thành"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

