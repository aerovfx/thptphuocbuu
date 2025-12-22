import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { FileText, Calendar, CheckCircle, AlertCircle, BookOpen, GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tuyển sinh - THPT Phước Bửu',
  description: 'Thông tin tuyển sinh Trường THPT Phước Bửu',
}

const admissionInfo = {
  schoolYear: '2024-2025',
  target: 600,
  deadline: '2024-07-15',
  examDate: '2024-07-20',
  resultsDate: '2024-08-01',
}

const requirements = [
  {
    title: 'Đối tượng tuyển sinh',
    items: [
      'Học sinh đã tốt nghiệp THCS hoặc tương đương',
      'Tuổi từ 15 đến 20 (tính đến ngày 31/12 của năm tuyển sinh)',
      'Có hộ khẩu thường trú hoặc tạm trú tại địa phương',
    ],
  },
  {
    title: 'Hồ sơ đăng ký',
    items: [
      'Đơn đăng ký dự tuyển (theo mẫu)',
      'Bản sao giấy khai sinh',
      'Bản sao học bạ THCS',
      'Bản sao bằng tốt nghiệp THCS hoặc giấy chứng nhận tốt nghiệp',
      'Giấy chứng nhận ưu tiên (nếu có)',
      'Ảnh 3x4 (2 tấm)',
    ],
  },
  {
    title: 'Phương thức tuyển sinh',
    items: [
      'Xét tuyển dựa trên kết quả học tập THCS',
      'Thi tuyển các môn: Toán, Văn, Anh',
      'Xét tuyển kết hợp với thi tuyển',
    ],
  },
]

const subjects = [
  { name: 'Toán', duration: '90 phút', format: 'Trắc nghiệm + Tự luận' },
  { name: 'Ngữ văn', duration: '90 phút', format: 'Tự luận' },
  { name: 'Tiếng Anh', duration: '60 phút', format: 'Trắc nghiệm' },
]

export default async function AdmissionsPage() {
  const session = await getCurrentSession()

  return (
    <SharedLayout title="Tuyển sinh">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tuyển sinh năm học {admissionInfo.schoolYear}
          </h1>
          <p className="text-xl text-gray-600">
            Thông tin chi tiết về tuyển sinh vào Trường THPT Phước Bửu
          </p>
        </div>

        {/* Important Dates */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-900">
                Hạn nộp hồ sơ
              </h3>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {new Date(admissionInfo.deadline).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Calendar className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">
                Ngày thi tuyển
              </h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {new Date(admissionInfo.examDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-green-900">
                Công bố kết quả
              </h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {new Date(admissionInfo.resultsDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Target */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-12 text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">
            Chỉ tiêu tuyển sinh: {admissionInfo.target} học sinh
          </h2>
          <p className="text-blue-100">
            Năm học {admissionInfo.schoolYear}
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-6 mb-12">
          {requirements.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Exam Subjects */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Các môn thi tuyển
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors"
              >
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  {subject.name}
                </h4>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <span className="font-semibold">Thời gian:</span> {subject.duration}
                  </p>
                  <p>
                    <span className="font-semibold">Hình thức:</span> {subject.format}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Đăng ký tuyển sinh trực tuyến
          </h3>
          <p className="text-gray-600 mb-6">
            Điền thông tin và nộp hồ sơ trực tuyến để tiết kiệm thời gian
          </p>
          {session ? (
            <a
              href="/dashboard/admissions/apply"
              className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Đăng ký ngay
            </a>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Vui lòng đăng nhập để đăng ký tuyển sinh
              </p>
              <a
                href="/login"
                className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đăng nhập
              </a>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-12 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Thông tin liên hệ
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <p className="font-semibold mb-2">Phòng Tuyển sinh</p>
              <p>Điện thoại: (0254) 3xxx xxx</p>
              <p>Email: tuyensinh@thptphuocbuu.edu.vn</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Thời gian làm việc</p>
              <p>Thứ 2 - Thứ 6: 7:00 - 17:00</p>
              <p>Thứ 7: 7:00 - 11:30</p>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

