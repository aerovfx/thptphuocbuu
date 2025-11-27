# Hướng dẫn tạo tài khoản Admin

Có 3 cách để tạo tài khoản Admin trong hệ thống:

## Cách 1: Sử dụng tài khoản Admin có sẵn (Khuyến nghị)

Hệ thống đã có sẵn tài khoản Admin test:

**Thông tin đăng nhập:**
- **Email**: `admin@test.com`
- **Password**: `Admin@123!Secure`
- **Tên**: Admin System
- **Role**: ADMIN

**Cách sử dụng:**
1. Chạy seed script để đảm bảo tài khoản tồn tại:
   ```bash
   npm run db:seed
   ```
2. Đăng nhập tại: `http://localhost:3000/login`

## Cách 2: Tạo Admin mới bằng script (Khuyến nghị cho production)

Sử dụng script để tạo tài khoản Admin mới:

```bash
npm run create-admin
```

Script sẽ hỏi bạn:
- Email
- Mật khẩu (tối thiểu 6 ký tự)
- Tên
- Họ

**Ví dụ:**
```bash
$ npm run create-admin

🔐 Tạo tài khoản Admin mới

Email: admin@example.com
Mật khẩu (tối thiểu 6 ký tự): MySecurePassword123
Tên: Admin
Họ: User

✅ Tạo tài khoản Admin thành công!
```

## Cách 3: Tạo Admin trực tiếp qua API (Chỉ dùng trong development)

Bạn có thể tạo Admin bằng cách gọi API register với role ADMIN:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Lưu ý:** 
- Trang đăng ký (`/register`) không cho phép chọn role ADMIN vì lý do bảo mật
- Chỉ nên dùng cách này trong môi trường development

## Cách 4: Tạo Admin trực tiếp trong database (Advanced)

Nếu bạn quen với Prisma Studio:

1. Chạy Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Mở browser tại `http://localhost:5555`
3. Vào bảng `User`
4. Click "Add record"
5. Điền thông tin:
   - Email: email của bạn
   - Password: hash password (sử dụng bcrypt)
   - firstName: Tên
   - lastName: Họ
   - role: ADMIN

**Lưu ý:** Bạn cần hash password trước. Có thể dùng script:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(console.log)"
```

## Bảo mật

⚠️ **Quan trọng:**
- Không nên cho phép đăng ký role ADMIN công khai
- Chỉ tạo Admin trong môi trường development hoặc qua script có kiểm soát
- Trong production, nên tạo Admin đầu tiên thủ công, sau đó Admin có thể tạo Admin khác qua dashboard

## Kiểm tra tài khoản Admin

Sau khi tạo, bạn có thể:
1. Đăng nhập tại: `http://localhost:3000/login`
2. Kiểm tra role trong dashboard
3. Xem danh sách users tại: `http://localhost:3000/dashboard/users` (chỉ Admin mới thấy)

