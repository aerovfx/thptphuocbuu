import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { Calendar as CalendarIcon, Clock, MapPin, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Lịch sự kiện - THPT Phước Bửu',
  description: 'Lịch các sự kiện và hoạt động của Trường THPT Phước Bửu',
}

// Mock data - sau này sẽ lấy từ database
const events = [
  {
    id: 1,
    title: 'Lễ Khai giảng năm học mới',
    date: '2024-09-05',
    time: '07:00',
    location: 'Sân trường',
    type: 'Sự kiện',
    important: true,
  },
  {
    id: 2,
    title: 'Họp phụ huynh đầu năm',
    date: '2024-09-15',
    time: '14:00',
    location: 'Hội trường lớn',
    type: 'Họp',
    important: false,
  },
  {
    id: 3,
    title: 'Hội thi Học sinh thanh lịch',
    date: '2024-10-15',
    time: '14:00',
    location: 'Hội trường lớn',
    type: 'Cuộc thi',
    important: true,
  },
  {
    id: 4,
    title: 'Kiểm tra giữa kỳ I',
    date: '2024-10-20',
    time: '07:00',
    location: 'Các phòng học',
    type: 'Kiểm tra',
    important: false,
  },
  {
    id: 5,
    title: 'Ngày hội Thể thao',
    date: '2024-11-20',
    time: '07:00',
    location: 'Sân vận động',
    type: 'Thể thao',
    important: true,
  },
  {
    id: 6,
    title: 'Hội thi Văn nghệ',
    date: '2024-11-25',
    time: '18:00',
    location: 'Hội trường lớn',
    type: 'Văn hóa',
    important: false,
  },
]

const months = [
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
]

export default async function CalendarPage() {
  const session = await getCurrentSession()

  // Group events by month
  const eventsByMonth = events.reduce((acc, event) => {
    const month = new Date(event.date).getMonth() + 1
    const monthKey = `Tháng ${month}`
    if (!acc[monthKey]) {
      acc[monthKey] = []
    }
    acc[monthKey].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return (
    <SharedLayout title="Lịch sự kiện">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Lịch sự kiện
          </h1>
          <p className="text-xl text-gray-600">
            Lịch các sự kiện và hoạt động trong năm học
          </p>
        </div>

        {/* Calendar View */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Events List */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <div key={month} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                  {month}
                </h2>
                <div className="space-y-4">
                  {monthEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`border-l-4 ${
                        event.important
                          ? 'border-red-500 bg-red-50'
                          : 'border-blue-500 bg-blue-50'
                      } p-4 rounded-r-lg`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-2">
                              {event.title}
                            </h3>
                            {event.important && (
                              <Bell className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              <span>
                                {new Date(event.date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Sự kiện sắp tới
              </h3>
              <div className="space-y-3">
                {events
                  .filter((e) => new Date(e.date) >= new Date())
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="border-l-2 border-blue-500 pl-3"
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(event.date).toLocaleDateString('vi-VN')} -{' '}
                        {event.time}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Event Types */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Loại sự kiện
              </h3>
              <div className="space-y-2">
                {['Sự kiện', 'Cuộc thi', 'Thể thao', 'Văn hóa', 'Họp', 'Kiểm tra'].map(
                  (type) => (
                    <button
                      key={type}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

