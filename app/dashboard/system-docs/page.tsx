'use client'

import { useState, useEffect } from 'react'
import { FileText, Search, Clock, HardDrive, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import SharedLayout from '@/components/Layout/SharedLayout'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DocFile {
    name: string
    path: string
    size: number
    modifiedAt: string
    category: string
}

export default function SystemDocsPage() {
    const [files, setFiles] = useState<DocFile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetch('/api/system-docs')
            .then(res => res.json())
            .then(data => {
                setFiles(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch docs', err)
                setLoading(false)
            })
    }, [])

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <SharedLayout title="Tài liệu hệ thống">
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-poppins"
                        />
                    </div>
                    <div className="text-sm text-gray-400 font-poppins">
                        Tổng cộng: <span className="text-white font-semibold">{filteredFiles.length}</span> tài liệu
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-32 bg-gray-900/50 border border-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFiles.map((file) => (
                            <Link
                                key={file.path}
                                href={`/dashboard/system-docs/${encodeURIComponent(file.name)}`}
                                className="group bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={20} className="text-blue-400" />
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <FileText size={24} />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <h3 className="text-white font-semibold font-poppins truncate group-hover:text-blue-400 transition-colors">
                                            {file.name}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-poppins">
                                            <span className={`px-2 py-0.5 rounded-full ${file.category === 'Root' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'
                                                }`}>
                                                {file.category}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <HardDrive size={12} />
                                                {formatFileSize(file.size)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 font-poppins pt-2">
                                            <Clock size={12} />
                                            Cập nhật: {format(new Date(file.modifiedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredFiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 bg-gray-900 border border-gray-800 rounded-full text-gray-600">
                            <Search size={48} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white font-poppins">Không tìm thấy tài liệu</h3>
                            <p className="text-gray-400 font-poppins max-w-sm">
                                Thử thay đổi từ khóa tìm kiếm để tìm thấy tài liệu bạn cần.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </SharedLayout>
    )
}
