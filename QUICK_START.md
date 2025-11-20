# Quick Start Guide

## Kiểm tra trước khi chạy

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Thiết lập Database

**Quan trọng**: Sau khi cập nhật Prisma schema, bạn cần chạy:

```bash
# Generate Prisma Client với schema mới
npm run db:generate

# Push schema changes to database
npm run db:push
```

Lưu ý: `db:push` sẽ:
- Tạo các bảng mới (Account, Session, VerificationToken)
- Cập nhật cột `password` thành optional trong bảng User
- Thêm cột `emailVerified` vào bảng User

### 3. Kiểm tra Environment Variables

Tạo file `.env` nếu chưa có:
```bash
cp .env.example .env
```

Đảm bảo có các biến sau:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"  # Bắt buộc
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional - chỉ cần nếu muốn dùng Google login)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**Tạo NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## Troubleshooting

### Lỗi: "Prisma Client has not been generated"
```bash
npm run db:generate
```

### Lỗi: "Table does not exist" hoặc "Column does not exist"
```bash
npm run db:push
```

### Lỗi: "NEXTAUTH_SECRET is missing"
- Kiểm tra file `.env` có NEXTAUTH_SECRET
- Tạo secret mới: `openssl rand -base64 32`

### Lỗi: "Google OAuth error"
- Nếu không dùng Google OAuth, có thể bỏ qua
- Nếu muốn dùng, cần thiết lập trong Google Cloud Console

### Lỗi: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

## Kiểm tra hoạt động

1. **Truy cập**: http://localhost:3000
2. **Đăng ký tài khoản**: http://localhost:3000/register
3. **Đăng nhập**: http://localhost:3000/login
4. **Test API**: http://localhost:3000/api/auth/test?type=auth

## Database Migration

Nếu database đã có dữ liệu cũ:

1. **Backup database** (nếu cần):
```bash
cp prisma/dev.db prisma/dev.db.backup
```

2. **Push schema mới**:
```bash
npm run db:push
```

3. **Update existing users** (nếu cần):
- Users hiện tại vẫn giữ password
- Chỉ users mới từ OAuth mới có password = null

## Next Steps

1. ✅ Chạy `npm run db:generate` và `npm run db:push`
2. ✅ Kiểm tra `.env` file
3. ✅ Chạy `npm run dev`
4. ✅ Test đăng nhập/đăng ký
5. ✅ (Optional) Thiết lập Google OAuth

