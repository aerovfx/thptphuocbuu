import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import ContactForm from '@/components/Contact/ContactForm'

export const metadata: Metadata = {
  title: 'Liên hệ - THPT Phước Bửu',
  description: 'Thông tin liên hệ Trường THPT Phước Bửu',
}

const contactInfo = {
  address: '123 Đường ABC, Phường XYZ, Thành phố Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu',
  phone: '(0254) 3xxx xxx',
  email: 'info@thptphuocbuu.edu.vn',
  fax: '(0254) 3xxx xxx',
  workingHours: {
    weekdays: '7:00 - 17:00',
    saturday: '7:00 - 11:30',
    sunday: 'Nghỉ',
  },
}

const departments = [
  {
    name: 'Phòng Hành chính',
    phone: '(0254) 3xxx xxx',
    email: 'hanhchinh@thptphuocbuu.edu.vn',
  },
  {
    name: 'Phòng Tuyển sinh',
    phone: '(0254) 3xxx xxx',
    email: 'tuyensinh@thptphuocbuu.edu.vn',
  },
  {
    name: 'Phòng Đào tạo',
    phone: '(0254) 3xxx xxx',
    email: 'daotao@thptphuocbuu.edu.vn',
  },
  {
    name: 'Phòng Công tác Học sinh',
    phone: '(0254) 3xxx xxx',
    email: 'cths@thptphuocbuu.edu.vn',
  },
]

export default async function ContactPage() {
  const session = await getCurrentSession()

  return (
    <SharedLayout title="Liên hệ">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-xl text-gray-600">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Main Contact */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Thông tin liên hệ
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Địa chỉ</p>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Điện thoại</p>
                    <p className="text-gray-600">{contactInfo.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600">{contactInfo.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Giờ làm việc</p>
                    <p className="text-gray-600">
                      Thứ 2 - Thứ 6: {contactInfo.workingHours.weekdays}
                    </p>
                    <p className="text-gray-600">
                      Thứ 7: {contactInfo.workingHours.saturday}
                    </p>
                    <p className="text-gray-600">
                      Chủ nhật: {contactInfo.workingHours.sunday}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Các phòng ban
              </h3>
              <div className="space-y-3">
                {departments.map((dept, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-semibold text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-600">{dept.phone}</p>
                    <p className="text-sm text-gray-600">{dept.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Send className="w-6 h-6 mr-2 text-blue-600" />
              Gửi tin nhắn
            </h2>
            <ContactForm />
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Bản đồ
          </h3>
          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              Bản đồ sẽ được tích hợp Google Maps tại đây
            </p>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Kết nối với chúng tôi
          </h3>
          <p className="text-gray-600 mb-6">
            Theo dõi chúng tôi trên các mạng xã hội để cập nhật thông tin mới nhất
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="#"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Facebook
            </a>
            <a
              href="#"
              className="bg-blue-400 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors"
            >
              Zalo
            </a>
            <a
              href="#"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

