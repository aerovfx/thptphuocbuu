# Hướng dẫn Kiểm tra Môi trường & Cấu hình

## Tổng quan

Script `check-environment.ts` kiểm tra toàn bộ môi trường và cấu hình trước khi deploy để đảm bảo:
- Backend chạy đúng phiên bản (Node/NextJS/Prisma/DB migrations)
- Frontend build không lỗi
- Kết nối database hoạt động và được seed đúng dữ liệu mẫu
- Redis cache (nếu có) hoạt động
- API đang trỏ đúng môi trường DEV, không trỏ PROD
- Email/SMS tắt trong dev, chuyển sang sandbox

## Cách sử dụng

```bash
npm run check-env
```

Hoặc:

```bash
npx tsx scripts/check-environment.ts
```

## Các kiểm tra được thực hiện

### 1. ✅ Phiên bản Backend
- **Node.js**: Kiểm tra phiên bản >= 18
- **Next.js**: Kiểm tra phiên bản trong package.json
- **Prisma**: Kiểm tra phiên bản trong package.json

### 2. ✅ Environment Variables
**Required:**
- `DATABASE_URL`: Đường dẫn đến database
- `NEXTAUTH_SECRET`: Secret key cho NextAuth.js
- `NEXTAUTH_URL`: URL của ứng dụng

**Optional:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Cho Google OAuth
- `OPENAI_API_KEY`: Cho AI features
- `REDIS_URL`: Cho Redis cache
- `SMTP_*`: Cho email sending
- `TWILIO_*`: Cho SMS sending

### 3. ✅ Database Connection
- Kiểm tra kết nối database
- Kiểm tra Prisma Client đã được generate
- Kiểm tra schema đã được sync
- Kiểm tra số lượng tables

### 4. ✅ Redis Cache (Optional)
- Kiểm tra kết nối Redis nếu `REDIS_URL` được set
- Kiểm tra read/write operations

### 5. ✅ Email/SMS Configuration
**Development:**
- Email sending bị tắt, logs ra console
- SMS nên sử dụng sandbox

**Production:**
- Email phải có SMTP configuration
- SMS phải có service configuration

### 6. ✅ API Endpoints
- Kiểm tra `NEXTAUTH_URL` trỏ đúng môi trường:
  - Development: `http://localhost:3000`
  - Production: Không được chứa `localhost`

### 7. ✅ Build Status
- Kiểm tra thư mục `.next` tồn tại

### 8. ✅ Seed Data
- Kiểm tra có users, classes, posts trong database
- Cảnh báo nếu chưa có dữ liệu mẫu

## Kết quả

Script sẽ hiển thị:
- ✅ **Passed**: Tất cả kiểm tra đều pass
- ⚠️ **Warnings**: Có cảnh báo nhưng không chặn deploy
- ❌ **Failed**: Có lỗi cần sửa trước khi deploy

## Ví dụ Output

```
🔍 Kiểm tra môi trường & cấu hình...

================================================================================

📊 KẾT QUẢ KIỂM TRA:

✅ Node.js Version
   Node.js v22.19.0 (>= 18 required)

✅ Database Connection
   Connected successfully

✅ Email Configuration
   Development mode - email sending disabled (logs to console)

⚠️ Seed Data: Users
   No users found. Run: npm run db:seed

================================================================================
📈 TÓM TẮT:
   ✅ Passed: 15
   ⚠️  Warnings: 12
   ❌ Failed: 0
================================================================================
```

## Checklist trước khi Deploy

- [ ] Chạy `npm run check-env` và tất cả checks đều pass hoặc chỉ có warnings
- [ ] Database đã được migrate (`npm run db:push`)
- [ ] Prisma Client đã được generate (`npm run db:generate`)
- [ ] Build thành công (`npm run build`)
- [ ] Không có lỗi lint nghiêm trọng (`npm run lint`)
- [ ] Environment variables đã được set đúng
- [ ] `NODE_ENV=production` trong production
- [ ] `NEXTAUTH_URL` trỏ đúng domain production
- [ ] Email/SMS đã được cấu hình cho production (nếu cần)
- [ ] Redis cache đã được cấu hình (nếu cần)

## Troubleshooting

### Database Connection Failed
```bash
# Kiểm tra DATABASE_URL trong .env
# Đảm bảo database file tồn tại
npm run db:push
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

### Missing Environment Variables
```bash
# Copy từ .env.example
cp .env.example .env
# Chỉnh sửa .env với các giá trị thực tế
```

### Build Failed
```bash
# Xóa cache và build lại
rm -rf .next
npm run build
```

### Seed Data Missing
```bash
npm run db:seed
```

## Lưu ý

1. **Development**: Email/SMS sẽ log ra console, không gửi thật
2. **Production**: Phải cấu hình SMTP/SMS service thật
3. **Redis**: Optional, chỉ cần nếu sử dụng caching
4. **OpenAI**: Optional, chỉ cần nếu sử dụng AI features

