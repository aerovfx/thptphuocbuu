'use client'

import { useMemo, useState } from 'react'
import { Search, BookOpen, FileText, User, MessageSquare, Shield, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import SharedLayout from '@/components/Layout/SharedLayout'

type HelpCategory =
  | 'Bắt đầu'
  | 'Tài khoản'
  | 'Văn bản'
  | 'Tin nhắn'
  | 'Mạng xã hội'
  | 'Quản trị'
  | 'Dành cho Dev'

type HelpArticle = {
  id: string
  category: HelpCategory
  title: string
  summary: string
  keywords: string[]
  icon: any
  content: React.ReactNode
}

const articles: HelpArticle[] = [
  {
    id: 'getting-started',
    category: 'Bắt đầu',
    title: 'Bắt đầu nhanh',
    summary: 'Đăng nhập, điều hướng menu, và những thao tác cơ bản.',
    keywords: ['đăng nhập', 'dashboard', 'menu', 'bắt đầu'],
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Bắt đầu nhanh</h2>
        <p className="text-gray-300 font-poppins">
          Đây là hướng dẫn ngắn để bạn dùng được hệ thống ngay trong 5 phút.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-300 font-poppins">
          <li>Đăng nhập vào hệ thống.</li>
          <li>Vào <strong>Dashboard</strong> để xem tổng quan.</li>
          <li>Dùng menu bên trái để mở các module: Văn bản, Spaces, Tổ chuyên môn, Mạng xã hội…</li>
          <li>Vào <strong>Cài đặt</strong> để cập nhật thông tin cá nhân / đổi mật khẩu / thay avatar.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'account-profile',
    category: 'Tài khoản',
    title: 'Thông tin cá nhân',
    summary: 'Xem và cập nhật họ tên, SĐT, ngày sinh, giới thiệu.',
    keywords: ['profile', 'thông tin cá nhân', 'cài đặt', 'phone', 'bio'],
    icon: User,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Thông tin cá nhân</h2>
        <p className="text-gray-300 font-poppins">
          Vào <strong>/dashboard/settings</strong> để chỉnh sửa thông tin của chính bạn.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 font-poppins">
          <li><strong>Họ/Tên</strong>: hiển thị trên hồ sơ và các bài đăng.</li>
          <li><strong>SĐT</strong>, <strong>Ngày sinh</strong>, <strong>Giới thiệu</strong>: giúp hoàn thiện hồ sơ.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'account-avatar',
    category: 'Tài khoản',
    title: 'Thay avatar',
    summary: 'Tải ảnh đại diện (tối đa 5MB) và tự cập nhật.',
    keywords: ['avatar', 'ảnh đại diện', 'profile picture'],
    icon: User,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Thay avatar</h2>
        <ol className="list-decimal pl-6 space-y-2 text-gray-300 font-poppins">
          <li>Vào <strong>Cài đặt</strong> → <strong>Thông tin cá nhân</strong>.</li>
          <li>Ở mục <strong>Avatar</strong>, bấm <strong>Thay avatar</strong> và chọn ảnh.</li>
          <li>Chờ upload xong, avatar sẽ được cập nhật trên toàn hệ thống.</li>
        </ol>
        <p className="text-gray-400 text-sm font-poppins">
          Lưu ý: chỉ hỗ trợ file ảnh, tối đa 5MB.
        </p>
      </div>
    ),
  },
  {
    id: 'account-password',
    category: 'Tài khoản',
    title: 'Đổi mật khẩu',
    summary: 'Đổi mật khẩu khi có mật khẩu cũ hoặc đặt mật khẩu lần đầu cho tài khoản Google.',
    keywords: ['đổi mật khẩu', 'password', 'google', 'oauth'],
    icon: Settings,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Đổi mật khẩu</h2>
        <p className="text-gray-300 font-poppins">
          Vào <strong>/dashboard/settings</strong> → <strong>Bảo mật</strong>.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 font-poppins">
          <li>Nếu tài khoản đã có mật khẩu: nhập <strong>mật khẩu hiện tại</strong> + <strong>mật khẩu mới</strong>.</li>
          <li>Nếu đăng nhập bằng Google/OAuth và chưa có mật khẩu: bạn có thể <strong>đặt mật khẩu lần đầu</strong>.</li>
        </ul>
        <p className="text-gray-400 text-sm font-poppins">Mật khẩu yêu cầu tối thiểu 8 ký tự.</p>
      </div>
    ),
  },
  {
    id: 'dms-upload',
    category: 'Văn bản',
    title: 'Tải lên văn bản (tối đa 50MB)',
    summary: 'Upload văn bản đến/đi; file lớn sẽ upload trực tiếp lên GCS để ổn định.',
    keywords: ['upload', '50mb', 'văn bản đến', 'dms'],
    icon: FileText,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Tải lên văn bản (tối đa 50MB)</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 font-poppins">
          <li>Chọn file và điền thông tin bắt buộc (tiêu đề, loại, ưu tiên…).</li>
          <li>File nhỏ: upload qua server như bình thường.</li>
          <li>File lớn: hệ thống dùng <strong>signed URL</strong> để upload thẳng lên storage (ổn định trên Cloud Run).</li>
        </ul>
        <p className="text-gray-400 text-sm font-poppins">
          Gợi ý: với file lớn, phần “trích xuất nội dung tự động” có thể được bỏ qua để tránh timeout.
        </p>
      </div>
    ),
  },
  {
    id: 'messages',
    category: 'Tin nhắn',
    title: 'Nhắn tin',
    summary: 'Gửi tin nhắn, xem danh sách liên hệ gần đây.',
    keywords: ['messages', 'tin nhắn', 'chat'],
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Tin nhắn</h2>
        <p className="text-gray-300 font-poppins">
          Vào <strong>Tin nhắn</strong> để xem các cuộc trò chuyện 1-1 và gửi tin nhắn.
        </p>
      </div>
    ),
  },
  {
    id: 'social',
    category: 'Mạng xã hội',
    title: 'Bài đăng & tương tác',
    summary: 'Đăng bài, bình luận, like, theo dõi người dùng.',
    keywords: ['post', 'like', 'comment', 'follow', 'mạng xã hội'],
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Bài đăng & tương tác</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-300 font-poppins">
          <li>Vào <strong>Mạng xã hội</strong> để xem feed và tạo bài viết.</li>
          <li>Bạn có thể like/bình luận và theo dõi người dùng khác.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'admin-basics',
    category: 'Quản trị',
    title: 'Quản trị cơ bản',
    summary: 'Quản lý người dùng, vai trò, và module.',
    keywords: ['admin', 'users', 'roles', 'modules'],
    icon: Shield,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Quản trị cơ bản</h2>
        <p className="text-gray-300 font-poppins">
          Với tài khoản có quyền quản trị, bạn có thể vào <strong>Admin Panel</strong> để quản lý người dùng, roles và modules.
        </p>
      </div>
    ),
  },
  {
    id: 'learn-react',
    category: 'Dành cho Dev',
    title: 'Học React (tham khảo)',
    summary: 'Tài liệu chính thức để học React theo lộ trình “Learn”.',
    keywords: ['react', 'learn', 'frontend', 'jsx', 'hooks'],
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white font-poppins">Học React (tham khảo)</h2>
        <p className="text-gray-300 font-poppins">
          Nếu bạn muốn tuỳ biến giao diện hoặc phát triển tính năng frontend, tài liệu “Learn” của React rất phù hợp.
        </p>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <a
            className="text-blue-400 hover:text-blue-300 font-poppins font-semibold"
            href="https://react.dev/learn"
            target="_blank"
            rel="noreferrer"
          >
            Mở tài liệu React Learn →
          </a>
          <p className="text-gray-400 text-sm font-poppins mt-2">
            Gợi ý lộ trình: Quick Start → Describing the UI → Adding Interactivity → Managing State.
          </p>
        </div>
      </div>
    ),
  },
]

const categoryOrder: HelpCategory[] = [
  'Bắt đầu',
  'Tài khoản',
  'Văn bản',
  'Tin nhắn',
  'Mạng xã hội',
  'Quản trị',
  'Dành cho Dev',
]

export default function HelpCenter() {
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string>('getting-started')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => {
      const hay = `${a.title} ${a.summary} ${a.keywords.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const grouped = useMemo(() => {
    const map = new Map<HelpCategory, HelpArticle[]>()
    for (const c of categoryOrder) map.set(c, [])
    for (const a of filtered) map.get(a.category)?.push(a)
    return map
  }, [filtered])

  const active = useMemo(() => articles.find((a) => a.id === activeId) || articles[0], [activeId])

  return (
    <SharedLayout title="Hướng dẫn sử dụng">
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={18} className="text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm hướng dẫn..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-poppins"
                />
              </div>

              <div className="text-xs text-gray-500 font-poppins mb-3">
                Mẹo: bạn có thể tìm “avatar”, “đổi mật khẩu”, “50mb”, “văn bản”…
              </div>

              <div className="space-y-4">
                {categoryOrder.map((cat) => {
                  const list = grouped.get(cat) || []
                  if (!list.length) return null
                  return (
                    <div key={cat}>
                      <div className="text-sm font-semibold text-gray-300 font-poppins mb-2">{cat}</div>
                      <div className="space-y-1">
                        {list.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setActiveId(a.id)}
                            className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                              a.id === activeId
                                ? 'bg-blue-500/10 border-blue-500/40 text-white'
                                : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800/50'
                            }`}
                          >
                            <a.icon size={18} className="mt-0.5 text-gray-400" />
                            <div className="min-w-0">
                              <div className="font-poppins font-semibold truncate">{a.title}</div>
                              <div className="text-xs text-gray-500 font-poppins line-clamp-2">{a.summary}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8 xl:col-span-9">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-2 text-sm text-gray-400 font-poppins mb-4">
                <span>{active.category}</span>
                <ChevronRight size={16} />
                <span className="text-gray-300">{active.title}</span>
              </div>

              {active.content}

              <div className="mt-8 pt-6 border-t border-gray-800 text-sm text-gray-500 font-poppins">
                Cần thêm hướng dẫn? Hãy nói mình module nào cần hướng dẫn (VD: Văn bản đến/đi, Spaces, Lớp học…).
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 font-poppins">
              Tham khảo thêm tài liệu React (cho dev):{' '}
              <Link className="text-blue-400 hover:text-blue-300" href="https://react.dev/learn" target="_blank">
                react.dev/learn
              </Link>
            </div>
          </main>
        </div>
      </div>
    </SharedLayout>
  )
}


