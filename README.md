# Hệ thống LMS Trường học với Tính năng Mạng xã hội

Dự án website trường học dựa trên kiến trúc LMS (Learning Management System) với các tính năng mạng xã hội giống Facebook và quản lý văn bản.

## Tính năng chính

### 1. Hệ thống LMS
- **Quản lý lớp học**: Tạo và quản lý lớp học, môn học
- **Đăng ký lớp**: Học sinh có thể đăng ký vào các lớp học
- **Bài tập**: Giáo viên tạo bài tập, học sinh nộp bài
- **Chấm điểm**: Giáo viên chấm điểm và đưa ra phản hồi
- **Thông báo**: Thông báo lớp học và hệ thống

### 2. Mạng xã hội
- **Đăng bài**: Tạo và chia sẻ bài viết
- **Bình luận**: Bình luận trên các bài viết
- **Thích**: Thích và bỏ thích bài viết
- **Kết bạn**: Gửi và chấp nhận lời mời kết bạn
- **Timeline**: Xem dòng thời gian hoạt động

### 3. Quản lý văn bản
- **Tải lên**: Tải lên các loại văn bản (thông báo, chính sách, báo cáo, biểu mẫu)
- **Phân loại**: Phân loại văn bản theo loại và danh mục
- **Quyền truy cập**: Quản lý quyền xem và tải xuống
- **Tìm kiếm**: Tìm kiếm văn bản theo tiêu đề, loại, người tải lên

### 4. Quản lý người dùng
- **Đăng ký/Đăng nhập**: Hệ thống xác thực người dùng
- **Vai trò**: Quản trị viên, Giáo viên, Học sinh, Phụ huynh
- **Hồ sơ**: Quản lý thông tin cá nhân

## Công nghệ sử dụng

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM với SQLite
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI, Lucide Icons

## Cài đặt

1. **Cài đặt dependencies**:
```bash
npm install
```

2. **Thiết lập database**:
```bash
# Tạo file .env từ .env.example
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Tạo database và tables
npm run db:push
```

3. **Chạy ứng dụng**:
```bash
npm run dev
```

4. **Truy cập**: Mở trình duyệt tại `http://localhost:3000`

## Cấu trúc dự án

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Trang dashboard
│   ├── login/            # Trang đăng nhập
│   └── register/         # Trang đăng ký
├── components/            # React components
│   ├── Layout/           # Layout components
│   └── Social/           # Social media components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # Auth configuration
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
└── types/                # TypeScript types
```

## Database Schema

### User Roles
- `ADMIN`: Quản trị viên
- `TEACHER`: Giáo viên
- `STUDENT`: Học sinh
- `PARENT`: Phụ huynh

### Document Types
- `ANNOUNCEMENT`: Thông báo
- `POLICY`: Chính sách
- `REPORT`: Báo cáo
- `FORM`: Biểu mẫu
- `OTHER`: Khác

## Tính năng trong tương lai

- [ ] Upload file cho bài tập và văn bản
- [ ] Thông báo real-time
- [ ] Chat trực tuyến
- [ ] Video call cho lớp học
- [ ] Báo cáo và thống kê chi tiết
- [ ] Mobile app

## License

MIT

