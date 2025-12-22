import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hoạt động - THPT Phước Bửu',
  description: 'Các hoạt động và sự kiện của Trường THPT Phước Bửu',
}

// Mock data - sau này sẽ lấy từ database
const activities = [
  {
    id: 1,
    title: 'Lễ Khai giảng năm học mới 2024-2025',
    date: '2024-09-05',
    time: '07:00',
    location: 'Sân trường THPT Phước Bửu',
    participants: 'Toàn thể học sinh và giáo viên',
    description: 'Lễ khai giảng năm học mới với nhiều hoạt động sôi nổi và ý nghĩa',
    image: '/images/activities/khai-giang.jpg',
    category: 'Sự kiện',
  },
  {
    id: 2,
    title: 'Hội thi Học sinh thanh lịch',
    date: '2024-10-15',
    time: '14:00',
    location: 'Hội trường lớn',
    participants: 'Học sinh các khối lớp',
    description: 'Cuộc thi tìm kiếm học sinh thanh lịch, tài năng và trí tuệ',
    image: '/images/activities/thanh-lich.jpg',
    category: 'Cuộc thi',
  },
  {
    id: 3,
    title: 'Ngày hội Thể thao',
    date: '2024-11-20',
    time: '07:00',
    location: 'Sân vận động trường',
    participants: 'Toàn thể học sinh',
    description: 'Ngày hội thể thao với nhiều môn thi đấu hấp dẫn',
    image: '/images/activities/the-thao.jpg',
    category: 'Thể thao',
  },
  {
    id: 4,
    title: 'Chương trình Từ thiện',
    date: '2024-12-10',
    time: '08:00',
    location: 'Trung tâm Bảo trợ Xã hội',
    participants: 'Đoàn viên thanh niên',
    description: 'Chương trình từ thiện, thăm hỏi và tặng quà cho các em nhỏ',
    image: '/images/activities/tu-thien.jpg',
    category: 'Xã hội',
  },
]

export default async function ActivitiesPage() {
  const session = await getCurrentSession()

  const categories = ['Tất cả', 'Sự kiện', 'Cuộc thi', 'Thể thao', 'Xã hội', 'Văn hóa']

  return (
    <SharedLayout title="Hoạt động">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hoạt động & Sự kiện
          </h1>
          <p className="text-xl text-gray-600">
            Các hoạt động nổi bật của Trường THPT Phước Bửu
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-500 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                  {activity.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {activity.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {activity.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(activity.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{activity.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{activity.participants}</span>
                  </div>
                </div>

                <Link
                  href={`/activities/${activity.id}`}
                  className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center"
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sự kiện sắp tới
          </h2>
          <div className="space-y-4">
            {activities
              .filter((a) => new Date(a.date) > new Date())
              .slice(0, 3)
              .map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.date).toLocaleDateString('vi-VN')} -{' '}
                      {activity.time}
                    </p>
                  </div>
                  <Link
                    href={`/activities/${activity.id}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Chi tiết →
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

