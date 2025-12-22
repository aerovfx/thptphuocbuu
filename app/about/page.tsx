import { Metadata } from 'next'
import { getCurrentSession } from '@/lib/auth-helpers'
import SharedLayout from '@/components/Layout/SharedLayout'
import { Building2, Award, Users, BookOpen, GraduationCap, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Giới thiệu - THPT Phước Bửu',
  description: 'Thông tin về Trường THPT Phước Bửu',
}

export default async function AboutPage() {
  const session = await getCurrentSession()

  const stats = [
    { icon: Users, label: 'Học sinh', value: '2000+', color: 'text-blue-600' },
    { icon: BookOpen, label: 'Lớp học', value: '50+', color: 'text-green-600' },
    { icon: GraduationCap, label: 'Giáo viên', value: '100+', color: 'text-purple-600' },
    { icon: Award, label: 'Năm thành lập', value: '2010', color: 'text-orange-600' },
  ]

  const values = [
    {
      icon: Heart,
      title: 'Tâm huyết',
      description: 'Đội ngũ giáo viên tận tâm, nhiệt huyết với sự nghiệp giáo dục',
    },
    {
      icon: Award,
      title: 'Chất lượng',
      description: 'Cam kết chất lượng giáo dục cao, đào tạo học sinh toàn diện',
    },
    {
      icon: Users,
      title: 'Đồng hành',
      description: 'Luôn đồng hành cùng học sinh trong mọi hoạt động học tập và rèn luyện',
    },
    {
      icon: Building2,
      title: 'Phát triển',
      description: 'Không ngừng đổi mới, nâng cao chất lượng dạy và học',
    },
  ]

  return (
    <SharedLayout title="Giới thiệu">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trường THPT Phước Bửu
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nơi ươm mầm tài năng, phát triển toàn diện cho thế hệ trẻ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
              >
                <Icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* About Content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Về chúng tôi</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              Trường THPT Phước Bửu được thành lập với sứ mệnh đào tạo thế hệ trẻ
              có đầy đủ kiến thức, kỹ năng và phẩm chất đạo đức để trở thành những công
              dân có ích cho xã hội.
            </p>
            <p>
              Với đội ngũ giáo viên giàu kinh nghiệm, cơ sở vật chất hiện đại và
              phương pháp giảng dạy tiên tiến, chúng tôi cam kết mang đến môi trường
              học tập tốt nhất cho học sinh.
            </p>
            <p>
              Trường không chỉ chú trọng vào việc truyền đạt kiến thức mà còn phát
              triển toàn diện về thể chất, tinh thần và kỹ năng sống cho học sinh.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Giá trị cốt lõi
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {value.title}
                      </h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh</h3>
            <p className="text-gray-700 leading-relaxed">
              Đào tạo học sinh có đầy đủ kiến thức, kỹ năng và phẩm chất đạo đức,
              phát triển toàn diện về trí tuệ, thể chất và tinh thần, chuẩn bị
              hành trang vững chắc cho tương lai.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Tầm nhìn</h3>
            <p className="text-gray-700 leading-relaxed">
              Trở thành trường THPT chất lượng cao, là địa chỉ tin cậy của phụ huynh
              và học sinh, góp phần nâng cao chất lượng giáo dục của địa phương và
              cả nước.
            </p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-blue-600 rounded-lg shadow-md p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Bạn muốn tìm hiểu thêm?
          </h3>
          <p className="text-blue-100 mb-6">
            Hãy liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Liên hệ ngay
          </a>
        </div>
      </div>
    </SharedLayout>
  )
}

