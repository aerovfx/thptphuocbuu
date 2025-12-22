'use client'

import { useState, useEffect } from 'react'
import { Button, Input, Select, SelectItem, Badge, Switch } from '@/components/ui'
import FilterDialog from './FilterDialog'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react'
import type { ContentCategory, ModerationSeverity } from '@prisma/client'

const SEVERITY_BADGES = {
    FORBIDDEN: { label: '🔴 Cấm', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
    RESTRICTED: { label: '🟠 Hạn chế', className: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
    CONDITIONAL: { label: '🟡 Điều kiện', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
    ALLOWED: { label: '🟢 Cho phép', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
}

const CATEGORY_LABELS: Record<ContentCategory, string> = {
    PROFANITY: 'Tục tĩu',
    OFFENSIVE: 'Xúc phạm',
    DISCRIMINATION: 'Kỳ thị',
    SEXUAL: 'Tình dục',
    VIOLENCE: 'Bạo lực',
    DRUGS: 'Ma túy',
    POLITICAL: 'Chính trị',
    MISINFORMATION: 'Tin giả',
    SENSATIONAL: 'Giật gân',
}

interface FilterManagementProps {
    initialFilters: any[]
}

export default function FilterManagement({ initialFilters }: FilterManagementProps) {
    const [filters, setFilters] = useState(initialFilters)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingFilter, setEditingFilter] = useState<any | null>(null)

    // Filter/search state
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [severityFilter, setSeverityFilter] = useState<string>('all')
    const [activeFilter, setActiveFilter] = useState<string>('all')

    // Pagination
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    const fetchFilters = async () => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(categoryFilter !== 'all' && { category: categoryFilter }),
                ...(severityFilter !== 'all' && { severity: severityFilter }),
                ...(activeFilter !== 'all' && { active: activeFilter }),
            })

            const response = await fetch(`/api/admin/filters?${params}`)

            if (!response.ok) {
                throw new Error('Failed to fetch filters')
            }

            const data = await response.json()
            setFilters(data.filters)
            setTotalPages(data.pagination.totalPages)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFilters()
    }, [page, search, categoryFilter, severityFilter, activeFilter])

    const handleToggleActive = async (filterId: string, currentActive: boolean) => {
        try {
            const response = await fetch(`/api/admin/filters/${filterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentActive }),
            })

            if (!response.ok) {
                throw new Error('Failed to toggle filter status')
            }

            fetchFilters()
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleDelete = async (filterId: string, keyword: string) => {
        if (!confirm(`Bạn có chắc muốn xóa filter "${keyword}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/admin/filters/${filterId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete filter')
            }

            fetchFilters()
        } catch (err: any) {
            alert(err.message)
        }
    }

    const handleEdit = (filter: any) => {
        setEditingFilter(filter)
        setDialogOpen(true)
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
        setEditingFilter(null)
        fetchFilters()
    }

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Quản lý Filters</h2>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Filter
                </Button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm từ khóa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </Select>

                {/* Severity Filter */}
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectItem value="all">Tất cả mức độ</SelectItem>
                    {Object.entries(SEVERITY_BADGES).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </Select>

                {/* Active Filter */}
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Đã tắt</SelectItem>
                </Select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Từ khóa
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Danh mục
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mức độ
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thay thế
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : filters.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Không tìm thấy filter nào
                                    </td>
                                </tr>
                            ) : (
                                filters.map((filter) => (
                                    <tr key={filter.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-medium">{filter.keyword}</span>
                                                {filter.description && (
                                                    <span className="text-xs text-gray-500 mt-1">{filter.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="font-normal">
                                                {CATEGORY_LABELS[filter.category as ContentCategory]}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={SEVERITY_BADGES[filter.severity as ModerationSeverity].className}>
                                                {SEVERITY_BADGES[filter.severity as ModerationSeverity].label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {filter.replacement ? (
                                                <span className="text-sm text-gray-700 font-mono">"{filter.replacement}"</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Switch
                                                checked={filter.active}
                                                onCheckedChange={() => handleToggleActive(filter.id, filter.active)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(filter)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(filter.id, filter.keyword)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Trang {page} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialog */}
            <FilterDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingFilter(null)
                }}
                filter={editingFilter}
                onSuccess={handleDialogClose}
            />
        </div>
    )
}
