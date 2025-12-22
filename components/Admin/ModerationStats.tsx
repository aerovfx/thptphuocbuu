'use client'

import { BarChart, PieChart, TrendingUp } from 'lucide-react'

interface ModerationStatsProps {
    stats: any
}

export default function ModerationStats({ stats }: ModerationStatsProps) {
    const categories = [
        { value: 'PROFANITY', label: 'Tục tĩu - chửi thề', color: 'bg-red-500' },
        { value: 'OFFENSIVE', label: 'Xúc phạm cá nhân', color: 'bg-orange-500' },
        { value: 'DISCRIMINATION', label: 'Kỳ thị - phân biệt', color: 'bg-yellow-500' },
        { value: 'SEXUAL', label: 'Tình dục - khiêu dâm', color: 'bg-pink-500' },
        { value: 'VIOLENCE', label: 'Bạo lực - tự hại', color: 'bg-red-600' },
        { value: 'DRUGS', label: 'Ma túy - chất cấm', color: 'bg-purple-500' },
        { value: 'POLITICAL', label: 'Chính trị - cực đoan', color: 'bg-blue-500' },
        { value: 'MISINFORMATION', label: 'Tin giả', color: 'bg-gray-500' },
        { value: 'SENSATIONAL', label: 'Giật gân - câu view', color: 'bg-green-500' },
    ]

    const severities = [
        { value: 'FORBIDDEN', label: '🔴 Cấm tuyệt đối', color: 'bg-red-500' },
        { value: 'RESTRICTED', label: '🟠 Hạn chế', color: 'bg-orange-500' },
        { value: 'CONDITIONAL', label: '🟡 Có điều kiện', color: 'bg-yellow-500' },
        { value: 'ALLOWED', label: '🟢 Cho phép', color: 'bg-green-500' },
    ]

    const maxCategoryCount = Math.max(
        ...stats.byCategory.map((item: any) => item._count),
        1
    )

    const maxSeverityCount = Math.max(
        ...stats.bySeverity.map((item: any) => item._count),
        1
    )

    return (
        <div className="space-y-8">
            {/* By Category */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Vi phạm theo loại nội dung
                    </h2>
                </div>

                <div className="space-y-3">
                    {stats.byCategory.map((item: any) => {
                        const category = categories.find((c) => c.value === item.violationType)
                        const percentage = (item._count / maxCategoryCount) * 100

                        return (
                            <div key={item.violationType}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {category?.label || item.violationType}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {item._count}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`${category?.color || 'bg-blue-500'} h-2 rounded-full transition-all`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* By Severity */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Vi phạm theo mức độ nghiêm trọng
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {severities.map((severity) => {
                        const item = stats.bySeverity.find((s: any) => s.severity === severity.value)
                        const count = item?._count || 0

                        return (
                            <div
                                key={severity.value}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${severity.color}`} />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {severity.label}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Tổng quan
                        </h3>
                        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                            <p>• Tổng số vi phạm: <strong>{stats.totalViolations}</strong></p>
                            <p>• Đã chặn hôm nay: <strong>{stats.blockedToday}</strong></p>
                            <p>• Bộ lọc đang hoạt động: <strong>{stats.activeFilters}/{stats.totalFilters}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
