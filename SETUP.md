# Hướng dẫn Cài đặt

## Bước 1: Cài đặt Dependencies

```bash
npm install
```

## Bước 2: Thiết lập Database

1. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env` và thêm NEXTAUTH_SECRET:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Để tạo NEXTAUTH_SECRET, bạn có thể chạy:
```bash
openssl rand -base64 32
```

3. Tạo database và schema:
```bash
npm run db:generate
npm run db:push
```

## Bước 3: Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Bước 4: Tạo tài khoản đầu tiên

1. Truy cập `http://localhost:3000/register`
2. Đăng ký tài khoản với vai trò ADMIN hoặc TEACHER
3. Đăng nhập và bắt đầu sử dụng

## Lưu ý

- Database SQLite sẽ được tạo tự động tại `prisma/dev.db`
- Để xem database, chạy: `npm run db:studio`
- Để reset database, xóa file `prisma/dev.db` và chạy lại `npm run db:push`

## Troubleshooting

### Lỗi "Cannot find module"
- Chạy lại `npm install`

### Lỗi database
- Xóa `prisma/dev.db` và chạy lại `npm run db:push`

### Lỗi authentication
- Kiểm tra NEXTAUTH_SECRET trong file `.env`

