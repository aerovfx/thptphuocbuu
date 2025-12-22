import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { Image as ImageIcon, Calendar, Camera } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thư viện ảnh - THPT Phước Bửu',
  description: 'Thư viện ảnh các hoạt động của Trường THPT Phước Bửu',
}

// Mock data - sau này sẽ lấy từ database
const albums = [
  {
    id: 1,
    title: 'Lễ Khai giảng năm học 2024-2025',
    date: '2024-09-05',
    coverImage: '/images/gallery/khai-giang.jpg',
    photoCount: 45,
    category: 'Sự kiện',
  },
  {
    id: 2,
    title: 'Hội thi Học sinh thanh lịch',
    date: '2024-10-15',
    coverImage: '/images/gallery/thanh-lich.jpg',
    photoCount: 32,
    category: 'Cuộc thi',
  },
  {
    id: 3,
    title: 'Ngày hội Thể thao',
    date: '2024-11-20',
    coverImage: '/images/gallery/the-thao.jpg',
    photoCount: 58,
    category: 'Thể thao',
  },
  {
    id: 4,
    title: 'Chương trình Từ thiện',
    date: '2024-12-10',
    coverImage: '/images/gallery/tu-thien.jpg',
    photoCount: 28,
    category: 'Xã hội',
  },
  {
    id: 5,
    title: 'Hội thi Văn nghệ',
    date: '2024-11-05',
    coverImage: '/images/gallery/van-nghe.jpg',
    photoCount: 40,
    category: 'Văn hóa',
  },
  {
    id: 6,
    title: 'Hoạt động Ngoại khóa',
    date: '2024-10-25',
    coverImage: '/images/gallery/ngoai-khoa.jpg',
    photoCount: 35,
    category: 'Hoạt động',
  },
]

const categories = ['Tất cả', 'Sự kiện', 'Cuộc thi', 'Thể thao', 'Xã hội', 'Văn hóa', 'Hoạt động']

export default async function GalleryPage() {
  const session = await getCurrentSession()

  return (
    <SharedLayout title="Thư viện ảnh">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thư viện ảnh
          </h1>
          <p className="text-xl text-gray-600">
            Khoảnh khắc đẹp từ các hoạt động của Trường THPT Phước Bửu
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

        {/* Albums Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
            >
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600">
                  {album.category}
                </div>
                <div className="absolute bottom-4 left-4 flex items-center text-white">
                  <Camera className="w-4 h-4 mr-1" />
                  <span className="text-sm">{album.photoCount} ảnh</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {album.title}
                </h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {new Date(album.date).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Xem thêm
          </button>
        </div>
      </div>
    </SharedLayout>
  )
}

