export type GuideGroupId = 'getting-started' | 'documents' | 'account' | 'social' | 'troubleshooting'

export type GuideItem = {
  id: string
  slug: string
  title: string
  description: string
  estimatedTime?: string
  html: string
}

export type GuideGroup = {
  id: GuideGroupId
  title: string
  description?: string
  items: GuideItem[]
}

export const guideGroups: GuideGroup[] = [
  {
    id: 'getting-started',
    title: 'Bắt đầu',
    description: 'Làm quen nhanh với hệ thống',
    items: [
      {
        id: 'intro',
        slug: 'gioi-thieu',
        title: 'Giới thiệu về hệ thống',
        description: 'Tổng quan về hệ thống quản lý văn bản và tài liệu',
        estimatedTime: '5 phút',
        html: `
          <h2>Chào mừng</h2>
          <p>Trang hướng dẫn này được thiết kế theo phong cách “Learn” giống React Docs để bạn học nhanh theo từng bước. Tham khảo cách tổ chức nội dung tại: <a href="https://react.dev/learn" target="_blank" rel="noreferrer">react.dev/learn</a>.</p>

          <h3>Bạn sẽ làm được gì?</h3>
          <ul>
            <li><strong>Xem thông tin cá nhân:</strong> cập nhật hồ sơ, thay avatar</li>
            <li><strong>Đổi/đặt mật khẩu:</strong> đổi mật khẩu hoặc đặt mật khẩu nếu đăng nhập Google</li>
            <li><strong>Quản lý văn bản:</strong> tải lên, phân công, theo dõi trạng thái</li>
          </ul>
        `,
      },
      {
        id: 'dashboard',
        slug: 'dashboard',
        title: 'Bắt đầu với Dashboard',
        description: 'Xem tổng quan hoạt động và truy cập nhanh các module',
        estimatedTime: '10 phút',
        html: `
          <h2>Dashboard - Trung tâm điều khiển</h2>
          <p>Dashboard là nơi bạn xem tổng quan dữ liệu quan trọng và truy cập nhanh các phần trong hệ thống.</p>

          <h3>Các khu vực chính</h3>
          <ul>
            <li><strong>Thống kê nhanh:</strong> số liệu về văn bản, công việc, lớp học (tùy role)</li>
            <li><strong>Danh sách cần xử lý:</strong> văn bản đến/đi đang chờ</li>
            <li><strong>Điểm nổi bật:</strong> thông báo, hoạt động gần đây</li>
          </ul>

          <h3>Mẹo</h3>
          <ul>
            <li>Hãy dùng menu bên trái để chuyển nhanh giữa các module.</li>
            <li>Nếu thấy chậm, thử refresh trang hoặc quay lại sau vài giây (Cloud Run đôi khi cold start).</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'documents',
    title: 'Văn bản',
    description: 'Tải lên, xử lý, soạn thảo và ký số',
    items: [
      {
        id: 'incoming',
        slug: 'van-ban-den',
        title: 'Quản lý văn bản đến',
        description: 'Tải lên, phân công xử lý và theo dõi trạng thái',
        estimatedTime: '15 phút',
        html: `
          <h2>Tải lên văn bản đến</h2>
          <ol>
            <li>Vào <strong>Văn bản → Văn bản đến</strong></li>
            <li>Chọn file (PDF/DOC/DOCX/JPG/PNG) và nhập thông tin cơ bản</li>
            <li>Nhấn <strong>Tải lên</strong></li>
          </ol>

          <h3>Giới hạn dung lượng</h3>
          <ul>
            <li>Hệ thống hỗ trợ upload tới <strong>50MB</strong>/lần.</li>
            <li>Với file lớn, hệ thống upload trực tiếp lên lưu trữ để tránh giới hạn request.</li>
          </ul>

          <h3>Phân công & trạng thái</h3>
          <ul>
            <li>Phân công người xử lý theo yêu cầu</li>
            <li>Cập nhật trạng thái: Chờ xử lý → Đang xử lý → Hoàn thành</li>
          </ul>
        `,
      },
      {
        id: 'outgoing',
        slug: 'van-ban-di',
        title: 'Soạn thảo văn bản đi',
        description: 'Soạn thảo nội dung và quản lý phiên bản',
        estimatedTime: '20 phút',
        html: `
          <h2>Soạn thảo văn bản đi</h2>
          <p>Bạn có thể tạo văn bản mới và soạn thảo theo mẫu/định dạng nội bộ.</p>

          <h3>Lưu</h3>
          <ul>
            <li><strong>Lưu nhanh:</strong> dùng nút Lưu (hoặc tổ hợp phím nếu có hỗ trợ)</li>
            <li><strong>Xem lại:</strong> kiểm tra nội dung trước khi gửi/phê duyệt</li>
          </ul>
        `,
      },
      {
        id: 'signature',
        slug: 'ky-so',
        title: 'Ký số điện tử',
        description: 'Ký số văn bản (tùy cấu hình nhà cung cấp)',
        estimatedTime: '15 phút',
        html: `
          <h2>Ký số điện tử</h2>
          <p>Nếu hệ thống đã cấu hình nhà cung cấp chữ ký, bạn có thể thực hiện ký số cho văn bản theo quy trình phê duyệt.</p>

          <h3>Lưu ý</h3>
          <ul>
            <li>Văn bản thường cần ở trạng thái phù hợp (đã phê duyệt) trước khi ký.</li>
            <li>Nếu ký số thất bại, xem mục “Xử lý sự cố”.</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'account',
    title: 'Tài khoản',
    description: 'Hồ sơ cá nhân & bảo mật',
    items: [
      {
        id: 'profile',
        slug: 'tai-khoan-ca-nhan',
        title: 'Thông tin cá nhân',
        description: 'Cập nhật hồ sơ, thay avatar',
        estimatedTime: '8 phút',
        html: `
          <h2>Xem & cập nhật hồ sơ</h2>
          <ol>
            <li>Vào <strong>Cài đặt</strong> (menu bên trái)</li>
            <li>Cập nhật <strong>Họ, Tên, SĐT, Ngày sinh, Giới thiệu</strong></li>
            <li>Nhấn <strong>Lưu thay đổi</strong></li>
          </ol>

          <h3>Thay avatar</h3>
          <ul>
            <li>Trong Cài đặt, chọn <strong>Thay avatar</strong></li>
            <li>Chọn ảnh (tối đa 5MB)</li>
          </ul>
        `,
      },
      {
        id: 'password',
        slug: 'doi-mat-khau',
        title: 'Đổi mật khẩu',
        description: 'Tự đổi/đặt mật khẩu (hỗ trợ tài khoản Google)',
        estimatedTime: '6 phút',
        html: `
          <h2>Đổi mật khẩu</h2>
          <p>Bạn có thể đổi mật khẩu trong <strong>Cài đặt → Bảo mật</strong>.</p>

          <h3>Nếu bạn đã có mật khẩu</h3>
          <ul>
            <li>Nhập <strong>mật khẩu hiện tại</strong></li>
            <li>Nhập <strong>mật khẩu mới</strong> (tối thiểu 8 ký tự)</li>
            <li>Xác nhận mật khẩu</li>
          </ul>

          <h3>Nếu bạn đăng nhập bằng Google và chưa có mật khẩu</h3>
          <ul>
            <li>Bạn có thể <strong>đặt mật khẩu lần đầu</strong> để đăng nhập bằng email/mật khẩu khi cần.</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'social',
    title: 'Tương tác',
    description: 'Mạng xã hội & tin nhắn',
    items: [
      {
        id: 'social-feed',
        slug: 'mang-xa-hoi',
        title: 'Mạng xã hội',
        description: 'Đăng bài và tương tác',
        estimatedTime: '10 phút',
        html: `
          <h2>Mạng xã hội</h2>
          <ul>
            <li>Đăng bài, thích, bình luận</li>
            <li>Theo dõi người dùng</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Xử lý sự cố',
    description: 'Các lỗi thường gặp và cách khắc phục nhanh',
    items: [
      {
        id: 'issues',
        slug: 'xu-ly-su-co',
        title: 'Xử lý sự cố',
        description: 'Các bước kiểm tra nhanh',
        estimatedTime: '10 phút',
        html: `
          <h2>Những lỗi thường gặp</h2>
          <h3>Không upload được</h3>
          <ul>
            <li>Kiểm tra dung lượng file</li>
            <li>Thử đăng xuất/đăng nhập lại</li>
          </ul>

          <h3>Không thấy avatar mới</h3>
          <ul>
            <li>Đợi vài giây rồi refresh trang</li>
            <li>Nếu vẫn chưa thấy, đăng xuất/đăng nhập lại để làm mới session</li>
          </ul>
        `,
      },
    ],
  },
]

export type FlatGuideItem = GuideItem & { groupId: GuideGroupId; groupTitle: string }

export function flattenGuides(groups: GuideGroup[] = guideGroups): FlatGuideItem[] {
  const out: FlatGuideItem[] = []
  for (const g of groups) {
    for (const item of g.items) {
      out.push({ ...item, groupId: g.id, groupTitle: g.title })
    }
  }
  return out
}


