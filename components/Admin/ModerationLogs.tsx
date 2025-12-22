'use client'

import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface ModerationLogsProps {
    logs: any[]
}

export default function ModerationLogs({ logs }: ModerationLogsProps) {
    const getActionBadge = (action: string) => {
        const badges = {
            BLOCKED: { label: 'Đã chặn', color: 'red', icon: Shield },
            ALLOWED: { label: 'Cho phép', color: 'green', icon: CheckCircle },
            WARNING: { label: 'Cảnh báo', color: 'yellow', icon: AlertTriangle },
        }
        const badge = badges[action as keyof typeof badges] || badges.ALLOWED
        const Icon = badge.icon

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-${badge.color}-100 text-${badge.color}-700 dark:bg-${badge.color}-900/20 dark:text-${badge.color}-400`}>
                <Icon size={12} />
                {badge.label}
            </span>
        )
    }

    const getSeverityBadge = (severity: string) => {
        const badges = {
            FORBIDDEN: '🔴 Cấm tuyệt đối',
            RESTRICTED: '🟠 Hạn chế',
            CONDITIONAL: '🟡 Có điều kiện',
            ALLOWED: '🟢 Cho phép',
        }
        return badges[severity as keyof typeof badges] || severity
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Lịch sử kiểm duyệt ({logs.length} gần nhất)
                </h2>
            </div>

            <div className="space-y-3">
                {logs.map((log: any) => (
                    <div
                        key={log.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {getActionBadge(log.action)}
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {getSeverityBadge(log.severity)}
                                    </span>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {log.violationType}
                                    </span>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mb-2">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-words">
                                        {log.originalText.length > 200
                                            ? log.originalText.substring(0, 200) + '...'
                                            : log.originalText}
                                    </p>
                                </div>

                                {log.matchedKeywords && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {JSON.parse(log.matchedKeywords).map((keyword: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                    <span>•</span>
                                    <span>
                                        {log.user.firstName} {log.user.lastName}
                                    </span>
                                    <span>•</span>
                                    <span>{log.contentType}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        Chưa có log kiểm duyệt nào
                    </div>
                )}
            </div>
        </div>
    )
}
