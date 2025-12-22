import { getCurrentSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { Construction, BookOpen, Clock } from 'lucide-react'

export default async function ClassesPage() {
  const session = await getCurrentSession()
  if (!session) {
    redirect('/login')
  }

  // Module đang trong giai đoạn phát triển, chỉ hiển thị với quản trị admin
  const userRole = session.user.role
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'BGH') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-full blur-2xl opacity-50"></div>
              <div className="relative bg-blue-500 dark:bg-blue-600 p-6 rounded-full">
                <Construction className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-500" />
            Module Lớp Học
          </h1>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full mb-6">
            <Clock className="w-4 h-4" />
            <span className="font-semibold">Đang Phát Triển</span>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Module quản lý lớp học đang trong giai đoạn phát triển và sẽ được ra mắt trong thời gian tới.
            Chúng tôi đang làm việc chăm chỉ để mang đến cho bạn trải nghiệm tốt nhất.
          </p>

          {/* Features Preview */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tính năng sắp có:
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quản lý lớp học</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tạo và quản lý các lớp học</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Phân công giáo viên</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gán giáo viên cho từng lớp</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quản lý học sinh</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Theo dõi danh sách học sinh</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Bài tập và điểm số</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quản lý bài tập và chấm điểm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Quay lại Dashboard
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Cảm ơn bạn đã kiên nhẫn chờ đợi. Chúng tôi sẽ thông báo khi module sẵn sàng!
        </p>
      </div>
    </div>
  )
}
