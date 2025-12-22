'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Power, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FilterManagerProps {
    filters: any[]
    currentUser: any
}

export default function FilterManager({ filters: initialFilters, currentUser }: FilterManagerProps) {
    const router = useRouter()
    const [filters, setFilters] = useState(initialFilters)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        keyword: '',
        category: 'PROFANITY',
        severity: 'FORBIDDEN',
        replacement: '',
        description: '',
        isRegex: false,
        caseSensitive: false,
        wholeWord: true,
    })

    const categories = [
        { value: 'PROFANITY', label: 'Tục tĩu - chửi thề', color: 'red' },
        { value: 'OFFENSIVE', label: 'Xúc phạm cá nhân', color: 'orange' },
        { value: 'DISCRIMINATION', label: 'Kỳ thị - phân biệt', color: 'yellow' },
        { value: 'SEXUAL', label: 'Tình dục - khiêu dâm', color: 'pink' },
        { value: 'VIOLENCE', label: 'Bạo lực - tự hại', color: 'red' },
        { value: 'DRUGS', label: 'Ma túy - chất cấm', color: 'purple' },
        { value: 'POLITICAL', label: 'Chính trị - cực đoan', color: 'blue' },
        { value: 'MISINFORMATION', label: 'Tin giả', color: 'gray' },
        { value: 'SENSATIONAL', label: 'Giật gân - câu view', color: 'green' },
    ]

    const severities = [
        { value: 'FORBIDDEN', label: '🔴 Cấm tuyệt đối', color: 'red' },
        { value: 'RESTRICTED', label: '🟠 Hạn chế mạnh', color: 'orange' },
        { value: 'CONDITIONAL', label: '🟡 Có điều kiện', color: 'yellow' },
        { value: 'ALLOWED', label: '🟢 Cho phép', color: 'green' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/admin/moderation/filters', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to save filter')
            }

            alert(editingId ? 'Đã cập nhật bộ lọc' : 'Đã thêm bộ lọc mới')
            setShowAddForm(false)
            setEditingId(null)
            setFormData({
                keyword: '',
                category: 'PROFANITY',
                severity: 'FORBIDDEN',
                replacement: '',
                description: '',
                isRegex: false,
                caseSensitive: false,
                wholeWord: true,
            })
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Đã xảy ra lỗi')
        }
    }

    const handleEdit = (filter: any) => {
        setFormData({
            keyword: filter.keyword,
            category: filter.category,
            severity: filter.severity,
            replacement: filter.replacement || '',
            description: filter.description || '',
            isRegex: filter.isRegex,
            caseSensitive: filter.caseSensitive,
            wholeWord: filter.wholeWord,
        })
        setEditingId(filter.id)
        setShowAddForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bộ lọc này?')) return

        try {
            const response = await fetch(`/api/admin/moderation/filters?id=${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to delete')

            alert('Đã xóa bộ lọc')
            router.refresh()
        } catch (error) {
            alert('Đã xảy ra lỗi khi xóa')
        }
    }

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const response = await fetch('/api/admin/moderation/filters', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !currentActive }),
            })

            if (!response.ok) throw new Error('Failed to toggle')

            router.refresh()
        } catch (error) {
            alert('Đã xảy ra lỗi')
        }
    }

    return (
        <div>
            {/* Add Button */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Danh sách bộ lọc ({filters.length})
                </h2>
                <button
                    onClick={() => {
                        setShowAddForm(true)
                        setEditingId(null)
                        setFormData({
                            keyword: '',
                            category: 'PROFANITY',
                            severity: 'FORBIDDEN',
                            replacement: '',
                            description: '',
                            isRegex: false,
                            caseSensitive: false,
                            wholeWord: true,
                        })
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Thêm bộ lọc
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {editingId ? 'Chỉnh sửa bộ lọc' : 'Thêm bộ lọc mới'}
                        </h3>
                        <button
                            onClick={() => {
                                setShowAddForm(false)
                                setEditingId(null)
                            }}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Từ khóa *
                                </label>
                                <input
                                    type="text"
                                    value={formData.keyword}
                                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="vl, ngu, ..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Loại nội dung *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Mức độ *
                                </label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    {severities.map((sev) => (
                                        <option key={sev.value} value={sev.value}>
                                            {sev.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Từ thay thế (gợi ý)
                                </label>
                                <input
                                    type="text"
                                    value={formData.replacement}
                                    onChange={(e) => setFormData({ ...formData, replacement: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="không, thiếu hiểu biết, ..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="Lý do cấm từ này..."
                            />
                        </div>

                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isRegex}
                                    onChange={(e) => setFormData({ ...formData, isRegex: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Regex pattern</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.caseSensitive}
                                    onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Phân biệt hoa thường</span>
                            </label>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.wholeWord}
                                    onChange={(e) => setFormData({ ...formData, wholeWord: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Chỉ từ nguyên vẹn</span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false)
                                    setEditingId(null)
                                }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                <Save size={18} />
                                {editingId ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Từ khóa</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Loại</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Mức độ</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Thay thế</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filters.map((filter: any) => (
                            <tr key={filter.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                <td className="px-4 py-3">
                                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {filter.keyword}
                                    </code>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {categories.find(c => c.value === filter.category)?.label}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm">
                                        {severities.find(s => s.value === filter.severity)?.label}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {filter.replacement && (
                                        <code className="text-sm text-green-600 dark:text-green-400">
                                            → {filter.replacement}
                                        </code>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleToggleActive(filter.id, filter.active)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${filter.active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}
                                    >
                                        <Power size={14} />
                                        {filter.active ? 'Hoạt động' : 'Tắt'}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(filter)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(filter.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            title="Xóa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
