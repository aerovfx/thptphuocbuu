'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  GraduationCap, 
  BookOpen,
  FileText,
  Users,
  Settings,
  Crown,
  MessageSquare,
  LayoutDashboard,
  Search,
  Bookmark,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface HelpPageProps {
  currentUser: any
}

interface HelpSection {
  id: string
  title: string
  description: string
  content: string
  estimatedTime?: string
  completed?: boolean
}

const helpSections: HelpSection[] = [
  {
    id: '1',
    title: 'Giới thiệu về hệ thống',
    description: 'Tổng quan về hệ thống quản lý văn bản và tài liệu AI-DMS',
    content: `
      <h2>Chào mừng đến với AI-DMS</h2>
      <p>Hệ thống quản lý văn bản và tài liệu thông minh (AI-DMS) là nền tảng tích hợp AI giúp bạn quản lý, xử lý và tìm kiếm văn bản một cách hiệu quả.</p>
      
      <h3>Tính năng chính:</h3>
      <ul>
        <li><strong>Quản lý văn bản đến/đi:</strong> Tổ chức và theo dõi tất cả văn bản trong hệ thống</li>
        <li><strong>AI hỗ trợ:</strong> Phân loại, trích xuất metadata, tóm tắt và gợi ý soạn thảo tự động</li>
        <li><strong>Ký số điện tử:</strong> Tích hợp VNPT SmartCA và các nhà cung cấp khác</li>
        <li><strong>Soạn thảo văn bản:</strong> Trình soạn thảo giống Google Docs với đầy đủ tính năng</li>
        <li><strong>Quản lý lớp học:</strong> Tạo và quản lý lớp học, bài tập, điểm số</li>
        <li><strong>Mạng xã hội:</strong> Kết nối và tương tác với người dùng khác</li>
      </ul>
    `,
    estimatedTime: '5 phút',
    completed: true,
  },
  {
    id: '2',
    title: 'Bắt đầu với Dashboard',
    description: 'Hướng dẫn sử dụng trang Dashboard và các tính năng cơ bản',
    content: `
      <h2>Dashboard - Trung tâm điều khiển</h2>
      <p>Dashboard là nơi bạn có thể xem tổng quan về tất cả hoạt động trong hệ thống.</p>
      
      <h3>Các thành phần chính:</h3>
      <ul>
        <li><strong>Thẻ thống kê:</strong> Hiển thị số liệu về lớp học, học sinh, văn bản, công việc</li>
        <li><strong>Biểu đồ tiến độ:</strong> Theo dõi tiến độ công việc và văn bản theo thời gian</li>
        <li><strong>Văn bản đến chờ xử lý:</strong> Danh sách văn bản cần xử lý</li>
        <li><strong>Văn bản đi chờ duyệt:</strong> Văn bản đang chờ phê duyệt</li>
        <li><strong>Tiến độ công việc:</strong> Tổng hợp tiến độ các công việc đang thực hiện</li>
      </ul>
      
      <h3>Cách sử dụng:</h3>
      <ol>
        <li>Truy cập Dashboard từ menu bên trái</li>
        <li>Xem các thẻ thống kê để nắm bắt tình hình tổng quan</li>
        <li>Click vào các thẻ để xem chi tiết</li>
        <li>Sử dụng nút "Làm mới" để cập nhật dữ liệu mới nhất</li>
      </ol>
    `,
    estimatedTime: '10 phút',
    completed: true,
  },
  {
    id: '3',
    title: 'Quản lý văn bản đến',
    description: 'Hướng dẫn tải lên, xử lý và quản lý văn bản đến',
    content: `
      <h2>Quản lý văn bản đến</h2>
      <p>Văn bản đến là các tài liệu được gửi đến từ bên ngoài hoặc từ các bộ phận khác.</p>
      
      <h3>Tải lên văn bản:</h3>
      <ol>
        <li>Vào mục <strong>Văn bản → Văn bản đến</strong></li>
        <li>Click nút <strong>"Tải lên văn bản"</strong> hoặc kéo thả file vào khu vực upload</li>
        <li>Điền thông tin: Tiêu đề, Người gửi, Loại văn bản, Mức độ ưu tiên</li>
        <li>Click <strong>"Tải lên"</strong> để hoàn tất</li>
      </ol>
      
      <h3>Xử lý văn bản:</h3>
      <ul>
        <li><strong>Phân công:</strong> Gán văn bản cho người xử lý cụ thể</li>
        <li><strong>Xem chi tiết:</strong> Click vào văn bản để xem đầy đủ thông tin</li>
        <li><strong>Xem PDF:</strong> Nếu văn bản là file PDF, click "Xem PDF" để xem trực tiếp</li>
        <li><strong>Cập nhật trạng thái:</strong> Thay đổi trạng thái từ "Chờ xử lý" → "Đang xử lý" → "Hoàn thành"</li>
      </ul>
      
      <h3>Tìm kiếm văn bản:</h3>
      <p>Bạn có thể tìm kiếm văn bản bằng:</p>
      <ul>
        <li><strong>Tìm kiếm thông thường:</strong> Nhập từ khóa vào ô tìm kiếm</li>
        <li><strong>Tìm kiếm AI (Premium):</strong> Sử dụng tìm kiếm ngữ nghĩa để tìm văn bản liên quan</li>
        <li><strong>Lọc theo:</strong> Trạng thái, Mức độ ưu tiên, Loại văn bản, Ngày nhận</li>
      </ul>
    `,
    estimatedTime: '15 phút',
    completed: false,
  },
  {
    id: '4',
    title: 'Soạn thảo văn bản đi',
    description: 'Hướng dẫn sử dụng trình soạn thảo văn bản đi giống Google Docs',
    content: `
      <h2>Soạn thảo văn bản đi</h2>
      <p>Trình soạn thảo văn bản đi cung cấp đầy đủ tính năng giống Google Docs để bạn soạn thảo văn bản chuyên nghiệp.</p>
      
      <h3>Tạo văn bản mới:</h3>
      <ol>
        <li>Vào mục <strong>Văn bản → Văn bản đi → Tạo mới</strong></li>
        <li>Bắt đầu soạn thảo trong trình soạn thảo</li>
        <li>Tiêu đề sẽ tự động được nhận diện từ nội dung (H1 hoặc đoạn đầu tiên)</li>
      </ol>
      
      <h3>Thanh công cụ định dạng:</h3>
      <ul>
        <li><strong>Hoàn tác/Làm lại:</strong> Undo/Redo các thao tác</li>
        <li><strong>In đậm/Nghiêng/Gạch chân:</strong> Định dạng văn bản</li>
        <li><strong>Màu chữ/Màu nền:</strong> Thay đổi màu sắc</li>
        <li><strong>Liên kết:</strong> Chèn link vào văn bản</li>
        <li><strong>Hình ảnh:</strong> Chèn hình ảnh từ URL</li>
        <li><strong>Bảng:</strong> Tạo và chỉnh sửa bảng</li>
      </ul>
      
      <h3>Menu chính:</h3>
      <ul>
        <li><strong>Tệp:</strong> Tạo mới, Mở, Xuất PDF/Word, In</li>
        <li><strong>Chỉnh sửa:</strong> Hoàn tác, Làm lại, Tìm và thay thế</li>
        <li><strong>Xem:</strong> Chế độ xem, Toàn màn hình</li>
        <li><strong>Chèn:</strong> Hình ảnh, Bảng, Liên kết</li>
        <li><strong>Định dạng:</strong> Định dạng văn bản và đoạn văn</li>
        <li><strong>Công cụ:</strong> Chính tả, Số từ</li>
      </ul>
      
      <h3>Lưu văn bản:</h3>
      <ul>
        <li><strong>Lưu tự động:</strong> Hệ thống tự động lưu vào localStorage mỗi 30 giây</li>
        <li><strong>Lưu vào database:</strong> Click nút "Lưu" hoặc nhấn <strong>Ctrl+S</strong> để lưu vào database</li>
        <li><strong>Xem văn bản đã lưu:</strong> Click link "Xem văn bản đã lưu" trong status bar</li>
      </ul>
      
      <h3>Xuất văn bản:</h3>
      <ul>
        <li><strong>Xuất PDF:</strong> Menu Tệp → Xuất PDF</li>
        <li><strong>Xuất Word:</strong> Menu Tệp → Xuất Word</li>
        <li><strong>In:</strong> Menu Tệp → In hoặc <strong>Ctrl+P</strong></li>
      </ul>
    `,
    estimatedTime: '20 phút',
    completed: false,
  },
  {
    id: '5',
    title: 'Ký số điện tử',
    description: 'Hướng dẫn sử dụng tính năng ký số VNPT SmartCA',
    content: `
      <h2>Ký số điện tử với VNPT SmartCA</h2>
      <p>Hệ thống hỗ trợ ký số điện tử thông qua VNPT SmartCA, cho phép bạn ký văn bản từ xa bằng smartphone.</p>
      
      <h3>Quy trình ký số:</h3>
      <ol>
        <li><strong>Chuẩn bị văn bản:</strong> Văn bản phải ở trạng thái "Đã phê duyệt"</li>
        <li><strong>Click "Ký số":</strong> Trong trang chi tiết văn bản đi, click nút "Ký số"</li>
        <li><strong>Chọn nhà cung cấp:</strong> Chọn "VNPT Smart CA"</li>
        <li><strong>Nhập thông tin:</strong> Lý do ký số, Địa điểm ký số (tùy chọn)</li>
        <li><strong>Xác nhận trong app:</strong> Mở ứng dụng VNPT SmartCA trên điện thoại</li>
        <li><strong>Quét QR code hoặc nhập challenge code:</strong> Để xác nhận ký số</li>
        <li><strong>Hoàn tất:</strong> Hệ thống sẽ tự động nhận chữ ký và nhúng vào PDF</li>
      </ol>
      
      <h3>Lưu ý:</h3>
      <ul>
        <li>Đảm bảo bạn đã đăng ký và có tài khoản VNPT SmartCA</li>
        <li>Ứng dụng VNPT SmartCA phải được cài đặt trên điện thoại</li>
        <li>Văn bản sẽ được tính hash SHA256 trước khi gửi đến SmartCA</li>
        <li>Chữ ký sẽ được nhúng vào PDF theo chuẩn PAdES</li>
      </ul>
      
      <h3>Gửi văn bản sau khi ký:</h3>
      <p>Sau khi ký số thành công, bạn có thể:</p>
      <ol>
        <li>Click nút <strong>"Gửi văn bản"</strong> trong trang chi tiết</li>
        <li>Văn bản sẽ được đánh dấu là "Đã gửi" (COMPLETED)</li>
        <li>Ngày gửi sẽ được ghi nhận tự động</li>
      </ol>
    `,
    estimatedTime: '15 phút',
    completed: false,
  },
  {
    id: '6',
    title: 'Quản lý lớp học',
    description: 'Hướng dẫn tạo và quản lý lớp học, bài tập, điểm số',
    content: `
      <h2>Quản lý lớp học</h2>
      <p>Hệ thống cho phép giáo viên tạo và quản lý lớp học, giao bài tập và chấm điểm.</p>
      
      <h3>Tạo lớp học mới:</h3>
      <ol>
        <li>Vào mục <strong>Lớp học → Tạo lớp mới</strong></li>
        <li>Điền thông tin: Tên lớp, Mô tả, Môn học</li>
        <li>Thêm học sinh vào lớp (có thể thêm sau)</li>
        <li>Click <strong>"Tạo lớp"</strong> để hoàn tất</li>
      </ol>
      
      <h3>Giao bài tập:</h3>
      <ul>
        <li>Vào trang chi tiết lớp học</li>
        <li>Click <strong>"Tạo bài tập"</strong></li>
        <li>Điền thông tin: Tiêu đề, Mô tả, Hạn nộp, Điểm số</li>
        <li>Đính kèm file (nếu có)</li>
        <li>Giao cho toàn bộ lớp hoặc học sinh cụ thể</li>
      </ul>
      
      <h3>Chấm điểm:</h3>
      <ul>
        <li>Xem danh sách bài nộp của học sinh</li>
        <li>Click vào bài nộp để xem chi tiết</li>
        <li>Chấm điểm và nhận xét</li>
        <li>Lưu điểm số vào hệ thống</li>
      </ul>
    `,
    estimatedTime: '20 phút',
    completed: false,
  },
  {
    id: '7',
    title: 'Tính năng AI',
    description: 'Hướng dẫn sử dụng các tính năng AI trong hệ thống',
    content: `
      <h2>Tính năng AI (Premium/Admin)</h2>
      <p>Các tính năng AI chỉ dành cho tài khoản Premium và Admin.</p>
      
      <h3>Phân loại văn bản tự động:</h3>
      <ul>
        <li>Hệ thống tự động phân loại văn bản đến thành các loại: Chỉ đạo, Hồ sơ, Tờ trình, Đề nghị, Khác</li>
        <li>Độ chính xác được hiển thị dưới dạng phần trăm</li>
      </ul>
      
      <h3>Trích xuất metadata:</h3>
      <ul>
        <li>Tự động trích xuất: Số văn bản, Ngày ban hành, Nơi ban hành, Người ký</li>
        <li>Giúp điền tự động các trường trong form</li>
      </ul>
      
      <h3>Tóm tắt văn bản:</h3>
      <ul>
        <li>Tự động tạo tóm tắt ngắn gọn (100-200 từ) cho văn bản dài</li>
        <li>Giúp người xử lý nắm bắt nội dung nhanh chóng</li>
      </ul>
      
      <h3>Gợi ý soạn thảo:</h3>
      <ul>
        <li>AI gợi ý nội dung văn bản dựa trên tiêu đề và người nhận</li>
        <li>Tuân theo định dạng NĐ 30</li>
        <li>Click nút "AI Gợi ý" trong trình soạn thảo</li>
      </ul>
      
      <h3>Tìm kiếm ngữ nghĩa:</h3>
      <ul>
        <li>Tìm kiếm văn bản theo ý nghĩa, không cần nhớ từ khóa chính xác</li>
        <li>Sử dụng thanh tìm kiếm AI trong trang Văn bản</li>
        <li>Kết quả được sắp xếp theo độ liên quan</li>
      </ul>
    `,
    estimatedTime: '15 phút',
    completed: false,
  },
  {
    id: '8',
    title: 'Premium và Brand',
    description: 'Hướng dẫn đăng ký Premium và tạo Brand account',
    content: `
      <h2>Premium và Brand Account</h2>
      <p>Nâng cấp lên Premium để mở khóa các tính năng cao cấp và tạo Brand account.</p>
      
      <h3>Đăng ký Premium:</h3>
      <ol>
        <li>Vào mục <strong>Premium</strong> trong menu</li>
        <li>Chọn gói phù hợp:
          <ul>
            <li><strong>Premium Standard:</strong> 50 công việc hoàn thành/tháng</li>
            <li><strong>Premium Pro:</strong> 290 công việc hoàn thành/tháng</li>
            <li><strong>Enterprise:</strong> Liên hệ để biết thêm</li>
          </ul>
        </li>
        <li>Hoàn thành đủ số công việc yêu cầu trong tháng</li>
        <li>Premium sẽ tự động kích hoạt hoặc click "Đăng ký ngay"</li>
      </ol>
      
      <h3>Tạo Brand Account:</h3>
      <ol>
        <li>Phải có tài khoản Premium</li>
        <li>Vào mục <strong>Brand → Tạo thương hiệu</strong></li>
        <li>Điền thông tin: Tên thương hiệu, Website, Logo, Giấy phép kinh doanh</li>
        <li>Gửi yêu cầu xác minh</li>
        <li>Chờ Admin phê duyệt</li>
      </ol>
      
      <h3>Tính năng Premium:</h3>
      <ul>
        <li>Tất cả tính năng AI</li>
        <li>Tạo Brand account xác minh</li>
        <li>Quản lý nhiều tài khoản liên kết</li>
        <li>Analytics nâng cao</li>
        <li>Ưu tiên hỗ trợ</li>
      </ul>
    `,
    estimatedTime: '15 phút',
    completed: false,
  },
  {
    id: '9',
    title: 'Mạng xã hội',
    description: 'Hướng dẫn sử dụng tính năng mạng xã hội và tương tác',
    content: `
      <h2>Mạng xã hội</h2>
      <p>Kết nối và tương tác với người dùng khác trong hệ thống.</p>
      
      <h3>Đăng bài:</h3>
      <ul>
        <li>Vào mục <strong>Mạng xã hội</strong></li>
        <li>Click vào ô "Bạn đang nghĩ gì?"</li>
        <li>Nhập nội dung, đính kèm hình ảnh/video (nếu có)</li>
        <li>Click <strong>"Đăng"</strong> để chia sẻ</li>
      </ul>
      
      <h3>Tương tác:</h3>
      <ul>
        <li><strong>Thích:</strong> Click icon tim để thích bài viết</li>
        <li><strong>Bình luận:</strong> Click icon bình luận để viết bình luận</li>
        <li><strong>Chia sẻ:</strong> Click icon chia sẻ để chia sẻ bài viết</li>
        <li><strong>Theo dõi:</strong> Click "Theo dõi" trên trang cá nhân</li>
      </ul>
      
      <h3>Tìm kiếm người dùng:</h3>
      <ul>
        <li>Sử dụng thanh tìm kiếm ở đầu trang</li>
        <li>Xem gợi ý người dùng trong sidebar</li>
        <li>Xem danh sách người dùng trong mục "Người dùng"</li>
      </ul>
    `,
    estimatedTime: '10 phút',
    completed: false,
  },
  {
    id: '10',
    title: 'Cài đặt và tùy chỉnh',
    description: 'Hướng dẫn cài đặt tài khoản và tùy chỉnh giao diện',
    content: `
      <h2>Cài đặt và tùy chỉnh</h2>
      <p>Tùy chỉnh tài khoản và giao diện theo sở thích của bạn.</p>
      
      <h3>Cài đặt tài khoản:</h3>
      <ul>
        <li><strong>Thông tin cá nhân:</strong> Cập nhật tên, email, số điện thoại</li>
        <li><strong>Ảnh đại diện:</strong> Upload ảnh đại diện mới</li>
        <li><strong>Đổi mật khẩu:</strong> Thay đổi mật khẩu tài khoản</li>
        <li><strong>Thông báo:</strong> Cài đặt loại thông báo muốn nhận</li>
      </ul>
      
      <h3>Tùy chỉnh giao diện:</h3>
      <ul>
        <li><strong>Chế độ sáng/tối:</strong> Click icon mặt trời/trăng ở góc trên bên phải</li>
        <li><strong>Ngôn ngữ:</strong> Chọn ngôn ngữ hiển thị (hiện tại: Tiếng Việt)</li>
        <li><strong>Font chữ:</strong> Tùy chỉnh trong trình soạn thảo văn bản</li>
      </ul>
      
      <h3>Quyền riêng tư:</h3>
      <ul>
        <li>Cài đặt ai có thể xem hồ sơ của bạn</li>
        <li>Cài đặt ai có thể gửi tin nhắn</li>
        <li>Cài đặt hiển thị email/số điện thoại</li>
      </ul>
    `,
    estimatedTime: '10 phút',
    completed: false,
  },
  {
    id: '11',
    title: 'Xử lý sự cố',
    description: 'Hướng dẫn xử lý các vấn đề thường gặp',
    content: `
      <h2>Xử lý sự cố</h2>
      <p>Giải quyết các vấn đề thường gặp khi sử dụng hệ thống.</p>
      
      <h3>Văn bản không hiển thị đúng định dạng:</h3>
      <ul>
        <li>Kiểm tra xem văn bản có phải là HTML không</li>
        <li>Thử refresh trang (F5)</li>
        <li>Xóa cache trình duyệt và thử lại</li>
      </ul>
      
      <h3>Không thể lưu văn bản:</h3>
      <ul>
        <li>Kiểm tra kết nối internet</li>
        <li>Đảm bảo đã nhập tiêu đề và nội dung</li>
        <li>Kiểm tra quyền truy cập (chỉ người tạo hoặc Admin mới có thể chỉnh sửa)</li>
        <li>Thử lưu lại sau vài giây</li>
      </ul>
      
      <h3>Ký số không thành công:</h3>
      <ul>
        <li>Đảm bảo văn bản đã được phê duyệt</li>
        <li>Kiểm tra kết nối với VNPT SmartCA</li>
        <li>Đảm bảo ứng dụng SmartCA đã được cài đặt và đăng nhập</li>
        <li>Kiểm tra challenge code có đúng không</li>
        <li>Thử lại sau vài phút</li>
      </ul>
      
      <h3>Tính năng AI không hoạt động:</h3>
      <ul>
        <li>Kiểm tra xem tài khoản có phải Premium hoặc Admin không</li>
        <li>Nếu chưa có Premium, nâng cấp tài khoản</li>
        <li>Kiểm tra API key của OpenAI (nếu có quyền Admin)</li>
      </ul>
      
      <h3>Liên hệ hỗ trợ:</h3>
      <p>Nếu gặp vấn đề khác, vui lòng:</p>
      <ul>
        <li>Gửi email đến: support@aidms.com</li>
        <li>Gọi hotline: 1900-xxxx</li>
        <li>Tạo ticket hỗ trợ trong hệ thống</li>
      </ul>
    `,
    estimatedTime: '10 phút',
    completed: false,
  },
]

export default function HelpPage({ currentUser }: HelpPageProps) {
  const [selectedSection, setSelectedSection] = useState<HelpSection>(helpSections[0])
  const [currentStep, setCurrentStep] = useState(1)

  const handleNext = () => {
    if (currentStep < helpSections.length) {
      setCurrentStep(currentStep + 1)
      setSelectedSection(helpSections[currentStep])
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setSelectedSection(helpSections[currentStep - 2])
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-poppins">
                <LayoutDashboard size={18} />
                <span>Trang chủ</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-poppins">
                <Search size={18} />
                <span>Tìm kiếm</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <Bookmark size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors relative">
              <Bell size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
              <Menu size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar - Course Navigation */}
        <aside className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[calc(100vh-64px)] sticky top-[64px] overflow-y-auto">
          <div className="p-6">
            {/* Course Header */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-poppins font-semibold">
                  Hướng dẫn
                </span>
                <CheckCircle2 size={16} className="text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-poppins">
                Hướng dẫn sử dụng AI-DMS
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins mb-4">
                Hướng dẫn chi tiết về các tính năng và cách sử dụng hệ thống quản lý văn bản thông minh
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 font-poppins">
                <div className="flex items-center space-x-1">
                  <Clock size={14} />
                  <span>~2 giờ</span>
                </div>
                <div className="flex items-center space-x-1">
                  <GraduationCap size={14} />
                  <span>Hoàn thành {helpSections.filter(s => s.completed).length}/{helpSections.length}</span>
                </div>
              </div>
            </div>

            {/* Course Steps */}
            <div className="space-y-2">
              {helpSections.map((section, index) => {
                const isActive = section.id === selectedSection.id
                const isCompleted = section.completed
                const stepNumber = index + 1

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSection(section)
                      setCurrentStep(stepNumber)
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isActive
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {stepNumber}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold mb-1 font-poppins ${
                          isActive
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {section.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins line-clamp-2">
                          {section.description}
                        </p>
                        {section.estimatedTime && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-poppins">
                            {section.estimatedTime}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-64px)]">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
              {/* Content */}
              <div 
                className="prose prose-invert max-w-none text-gray-900 dark:text-white font-poppins help-content"
                style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                }}
                dangerouslySetInnerHTML={{ __html: selectedSection.content }}
              />
              <style jsx>{`
                .help-content :global(h2) {
                  font-size: 1.75rem;
                  font-weight: 700;
                  margin-top: 2.5rem;
                  margin-bottom: 1.25rem;
                  color: inherit;
                  border-bottom: 2px solid rgba(59, 130, 246, 0.2);
                  padding-bottom: 0.5rem;
                }
                .help-content :global(h2:first-child) {
                  margin-top: 0;
                }
                .help-content :global(h3) {
                  font-size: 1.35rem;
                  font-weight: 600;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  color: inherit;
                }
                .help-content :global(p) {
                  margin-bottom: 1.25rem;
                  line-height: 1.9;
                  color: inherit;
                  font-size: 15px;
                }
                .help-content :global(ul),
                .help-content :global(ol) {
                  margin-left: 2rem;
                  margin-bottom: 1.5rem;
                  padding-left: 0.5rem;
                }
                .help-content :global(li) {
                  margin-bottom: 0.75rem;
                  line-height: 1.9;
                  font-size: 15px;
                }
                .help-content :global(ul li) {
                  list-style-type: disc;
                }
                .help-content :global(ol li) {
                  list-style-type: decimal;
                }
                .help-content :global(strong) {
                  font-weight: 600;
                  color: inherit;
                }
                .help-content :global(code) {
                  background-color: rgba(0, 0, 0, 0.05);
                  padding: 0.2em 0.4em;
                  border-radius: 3px;
                  font-family: 'Courier New', monospace;
                  font-size: 0.9em;
                }
                .dark .help-content :global(code) {
                  background-color: rgba(255, 255, 255, 0.1);
                }
              `}</style>

              {/* Navigation */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-poppins transition-colors ${
                    currentStep === 1
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <ChevronLeft size={18} />
                  <span>Trước</span>
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                  {currentStep}/{helpSections.length}
                </div>
                <button
                  onClick={handleNext}
                  disabled={currentStep === helpSections.length}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-poppins transition-colors ${
                    currentStep === helpSections.length
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <span>Sau</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Quick Links & Contacts */}
        <aside className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[calc(100vh-64px)] sticky top-[64px] overflow-y-auto">
          <div className="p-4">
            {/* Menu Button */}
            <div className="mb-4">
              <button className="w-full p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <Menu size={18} className="text-blue-600 dark:text-blue-400" />
              </button>
            </div>
            
            {/* Settings & Messages */}
            <div className="mb-6 space-y-2">
              <button className="w-full p-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <Settings size={18} className="text-red-600 dark:text-red-400" />
                <MessageSquare size={18} className="text-red-600 dark:text-red-400" />
              </button>
            </div>

            {/* Quick Links */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-poppins px-2 mb-3">
                Liên kết nhanh
              </h3>
              <div className="space-y-2">
                <a
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </a>
                <a
                  href="/dashboard/documents"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <FileText size={16} />
                  <span>Văn bản</span>
                </a>
                <a
                  href="/dashboard/classes"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <BookOpen size={16} />
                  <span>Lớp học</span>
                </a>
                <a
                  href="/dashboard/premium"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <Crown size={16} />
                  <span>Premium</span>
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-gray-700 dark:text-gray-300 font-poppins"
                >
                  <Settings size={16} />
                  <span>Cài đặt</span>
                </a>
              </div>
            </div>

            {/* Contacts */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide font-poppins px-2 mb-3">
                Liên hệ hỗ trợ
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Hỗ trợ kỹ thuật', badge: 2 },
                  { name: 'Tư vấn Premium', badge: 1 },
                  { name: 'Admin', badge: null },
                  { name: 'Moderator', badge: null },
                ].map((contact, i) => (
                  <div
                    key={i}
                    className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    title={contact.name}
                  >
                    {contact.name.charAt(0)}
                    {contact.badge && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {contact.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

