'use client'

import { useState } from 'react'
import { Shield, Filter, FileText, BarChart3, Plus, Download, Upload } from 'lucide-react'
import FilterManagement from './FilterManagement'
import ModerationLogs from './ModerationLogs'
import ModerationStats from './ModerationStats'

interface ModerationDashboardProps {
    filters: any[]
    logs: any[]
    stats: any
    currentUser: any
}

export default function ModerationDashboard({
    filters,
    logs,
    stats,
    currentUser,
}: ModerationDashboardProps) {
    const [activeTab, setActiveTab] = useState<'filters' | 'logs' | 'stats'>('filters')

    const tabs = [
        { id: 'filters' as const, label: 'Bộ lọc từ khóa', icon: Filter, count: stats.activeFilters },
        { id: 'logs' as const, label: 'Lịch sử kiểm duyệt', icon: FileText, count: stats.totalViolations },
        { id: 'stats' as const, label: 'Thống kê', icon: BarChart3 },
    ]

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-red-500" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Quản lý Kiểm duyệt Nội dung
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Quản lý bộ lọc từ khóa, xem lịch sử kiểm duyệt và thống kê vi phạm
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng bộ lọc</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFilters}</p>
                        </div>
                        <Filter className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Đang hoạt động</p>
                            <p className="text-2xl font-bold text-green-600">{stats.activeFilters}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng vi phạm</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViolations}</p>
                        </div>
                        <FileText className="w-8 h-8 text-orange-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Chặn hôm nay</p>
                            <p className="text-2xl font-bold text-red-600">{stats.blockedToday}</p>
                        </div>
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'filters' && (
                        <FilterManagement initialFilters={filters} />
                    )}
                    {activeTab === 'logs' && (
                        <ModerationLogs logs={logs} />
                    )}
                    {activeTab === 'stats' && (
                        <ModerationStats stats={stats} />
                    )}
                </div>
            </div>
        </div>
    )
}
