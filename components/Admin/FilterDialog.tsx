'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label, Textarea, Select, SelectItem, Switch } from '@/components/ui'
import type { ContentCategory, ModerationSeverity } from '@prisma/client'

const CATEGORY_OPTIONS = [
    { value: 'PROFANITY', label: '🔴 Tục tĩu - Chửi thề', color: 'text-red-600' },
    { value: 'OFFENSIVE', label: '🟠 Xúc phạm cá nhân', color: 'text-orange-600' },
    { value: 'DISCRIMINATION', label: '🟡 Kỳ thị - Phân biệt', color: 'text-yellow-600' },
    { value: 'SEXUAL', label: '🔴 Tình dục - Khiêu dâm', color: 'text-red-600' },
    { value: 'VIOLENCE', label: '🔴 Bạo lực - Tự hại', color: 'text-red-600' },
    { value: 'DRUGS', label: '🔴 Ma túy - Chất cấm', color: 'text-red-600' },
    { value: 'POLITICAL', label: '🟠 Chính trị - Cực đoan', color: 'text-orange-600' },
    { value: 'MISINFORMATION', label: '🟡 Tin giả', color: 'text-yellow-600' },
    { value: 'SENSATIONAL', label: '🟢 Giật gân - Câu view', color: 'text-green-600' },
]

const SEVERITY_OPTIONS = [
    { value: 'FORBIDDEN', label: '🔴 Cấm tuyệt đối', color: 'text-red-600' },
    { value: 'RESTRICTED', label: '🟠 Hạn chế mạnh', color: 'text-orange-600' },
    { value: 'CONDITIONAL', label: '🟡 Có điều kiện', color: 'text-yellow-600' },
    { value: 'ALLOWED', label: '🟢 Cho phép', color: 'text-green-600' },
]

interface FilterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    filter?: any // Existing filter for editing
    onSuccess: () => void
}

export default function FilterDialog({ open, onOpenChange, filter, onSuccess }: FilterDialogProps) {
    const isEdit = !!filter
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [keyword, setKeyword] = useState(filter?.keyword || '')
    const [category, setCategory] = useState<ContentCategory>(filter?.category || 'PROFANITY')
    const [severity, setSeverity] = useState<ModerationSeverity>(filter?.severity || 'FORBIDDEN')
    const [description, setDescription] = useState(filter?.description || '')
    const [replacement, setReplacement] = useState(filter?.replacement || '')
    const [isRegex, setIsRegex] = useState(filter?.isRegex || false)
    const [caseSensitive, setCaseSensitive] = useState(filter?.caseSensitive || false)
    const [wholeWord, setWholeWord] = useState(filter?.wholeWord ?? true)
    const [allowedContexts, setAllowedContexts] = useState(filter?.allowedContexts || '')
    const [active, setActive] = useState(filter?.active ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const url = isEdit
                ? `/api/admin/filters/${filter.id}`
                : '/api/admin/filters'

            const method = isEdit ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword,
                    category,
                    severity,
                    description: description || null,
                    replacement: replacement || null,
                    isRegex,
                    caseSensitive,
                    wholeWord,
                    allowedContexts: allowedContexts || null,
                    active,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to save filter')
            }

            onSuccess()
            onOpenChange(false)

            // Reset form
            if (!isEdit) {
                setKeyword('')
                setDescription('')
                setReplacement('')
                setAllowedContexts('')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Chỉnh sửa Filter' : 'Thêm Filter Mới'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Cập nhật thông tin filter' : 'Tạo filter mới để kiểm duyệt nội dung'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Keyword */}
                    <div className="space-y-2">
                        <Label htmlFor="keyword">
                            Từ khóa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="keyword"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Nhập từ khóa cần lọc"
                            required
                        />
                    </div>

                    {/* Category & Severity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Danh mục <span className="text-red-500">*</span>
                            </Label>
                            <Select value={category} onValueChange={(v) => setCategory(v as ContentCategory)}>
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="severity">
                                Mức độ <span className="text-red-500">*</span>
                            </Label>
                            <Select value={severity} onValueChange={(v) => setSeverity(v as ModerationSeverity)}>
                                {SEVERITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Mô tả lý do cấm</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Giải thích tại sao từ khóa này cần được lọc"
                            rows={2}
                        />
                    </div>

                    {/* Replacement */}
                    <div className="space-y-2">
                        <Label htmlFor="replacement">Từ gợi ý thay thế</Label>
                        <Input
                            id="replacement"
                            value={replacement}
                            onChange={(e) => setReplacement(e.target.value)}
                            placeholder="Từ thay thế phù hợp hơn"
                        />
                    </div>

                    {/* Advanced Options */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Tùy chọn nâng cao</h4>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Regex Pattern</Label>
                                    <p className="text-sm text-gray-500">Sử dụng biểu thức chính quy</p>
                                </div>
                                <Switch checked={isRegex} onCheckedChange={setIsRegex} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Case Sensitive</Label>
                                    <p className="text-sm text-gray-500">Phân biệt chữ hoa/thường</p>
                                </div>
                                <Switch checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Whole Word</Label>
                                    <p className="text-sm text-gray-500">Chỉ khớp từ nguyên vẹn</p>
                                </div>
                                <Switch checked={wholeWord} onCheckedChange={setWholeWord} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Active</Label>
                                    <p className="text-sm text-gray-500">Kích hoạt filter</p>
                                </div>
                                <Switch checked={active} onCheckedChange={setActive} />
                            </div>
                        </div>
                    </div>

                    {/* Allowed Contexts */}
                    <div className="space-y-2">
                        <Label htmlFor="allowedContexts">Ngữ cảnh cho phép (JSON array)</Label>
                        <Textarea
                            id="allowedContexts"
                            value={allowedContexts}
                            onChange={(e) => setAllowedContexts(e.target.value)}
                            placeholder='["giáo dục", "khoa học"]'
                            rows={2}
                        />
                        <p className="text-xs text-gray-500">
                            Từ khóa sẽ được cho phép nếu xuất hiện trong các ngữ cảnh này
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
