'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Clock, HardDrive, FileText, Share2, Download, Printer } from 'lucide-react'
import Link from 'next/link'
import SharedLayout from '@/components/Layout/SharedLayout'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DocContent {
    name: string
    content: string
    size: number
    modifiedAt: string
}

export default function DocViewerPage({ params }: { params: { filename: string } }) {
    const [doc, setDoc] = useState<DocContent | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const filename = decodeURIComponent(params.filename)
        fetch(`/api/system-docs/${filename}`)
            .then(res => res.json())
            .then(data => {
                setDoc(data)
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch doc content', err)
                setLoading(false)
            })
    }, [params.filename])

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <SharedLayout title={doc?.name || 'Đang tải tài liệu...'}>
            <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/dashboard/system-docs"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <div className="p-2 bg-gray-900 border border-gray-800 rounded-lg group-hover:bg-gray-800">
                            <ChevronLeft size={20} />
                        </div>
                        <span className="font-medium font-poppins">Quay lại danh sách</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Chia sẻ">
                            <Share2 size={20} />
                        </button>
                        <button className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="Tải về">
                            <Download size={20} />
                        </button>
                        <button className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all" title="In">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="h-10 w-2/3 bg-gray-900 rounded-lg animate-pulse" />
                        <div className="h-4 w-1/4 bg-gray-900 rounded-lg animate-pulse" />
                        <div className="space-y-2 pt-8">
                            <div className="h-4 w-full bg-gray-900 rounded-lg animate-pulse" />
                            <div className="h-4 w-full bg-gray-900 rounded-lg animate-pulse" />
                            <div className="h-4 w-3/4 bg-gray-900 rounded-lg animate-pulse" />
                        </div>
                    </div>
                ) : doc ? (
                    <div className="space-y-8">
                        <header className="space-y-4 pb-8 border-b border-gray-800">
                            <h1 className="text-3xl md:text-4xl font-bold text-white font-poppins">
                                {doc.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 font-poppins">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
                                        <FileText size={16} />
                                    </div>
                                    System Markdown
                                </div>
                                <div className="flex items-center gap-2">
                                    <HardDrive size={16} />
                                    {formatFileSize(doc.size)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    Cập nhật: {format(new Date(doc.modifiedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </div>
                            </div>
                        </header>

                        <article className="prose prose-invert prose-blue max-w-none 
              prose-headings:font-poppins prose-headings:font-bold 
              prose-p:text-gray-300 prose-p:leading-relaxed 
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-blue-300 prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800 prose-pre:rounded-xl
              prose-img:rounded-2xl
              prose-strong:text-white
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-500/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
              prose-table:border prose-table:border-gray-800 prose-table:rounded-xl prose-table:overflow-hidden
              prose-th:bg-gray-900 prose-th:px-4 prose-th:py-3 prose-th:text-white
              prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-gray-800
            ">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {doc.content}
                            </ReactMarkdown>
                        </article>

                        <div className="flex items-center justify-between gap-4 pt-12 border-t border-gray-800">
                            <div className="text-sm text-gray-500 font-poppins italic">
                                Tài liệu này được tạo tự động từ mã nguồn dự án.
                            </div>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="text-blue-400 hover:text-blue-300 font-medium font-poppins transition-colors"
                            >
                                Lên đầu trang ↑
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <h3 className="text-xl font-bold text-white font-poppins">Không tìm thấy tài liệu</h3>
                        <Link href="/dashboard/system-docs" className="text-blue-400 hover:underline font-poppins">
                            Quay lại danh sách
                        </Link>
                    </div>
                )}
            </div>
        </SharedLayout>
    )
}
