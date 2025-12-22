# Hướng dẫn Test Đăng nhập với Google OAuth

## ✅ Kiểm tra cấu hình

Cấu hình Google OAuth đã được kiểm tra và sẵn sàng:

- ✅ GOOGLE_CLIENT_ID: Đã được cấu hình
- ✅ GOOGLE_CLIENT_SECRET: Đã được cấu hình  
- ✅ NEXTAUTH_URL: http://localhost:3000
- ✅ NEXTAUTH_SECRET: Đã được cấu hình
- ✅ Database: OK

## 🚀 Các bước test

### 1. Khởi động server

```bash
npm run dev
```

### 2. Mở trang đăng nhập

Mở browser và truy cập: **http://localhost:3000/login**

### 3. Click "Đăng nhập với Google"

Bạn sẽ thấy nút "Đăng nhập với Google" với icon Chrome ở phía dưới form đăng nhập.

### 4. Chọn tài khoản Google

- Google sẽ hiển thị popup để chọn tài khoản
- Chọn tài khoản Google bạn muốn đăng nhập

### 5. Cho phép truy cập

- Google sẽ yêu cầu xác nhận quyền truy cập
- Click "Cho phép" để tiếp tục

### 6. Kiểm tra kết quả

**Kết quả mong đợi:**
- ✅ Redirect về `/dashboard`
- ✅ Đăng nhập thành công
- ✅ Session được tạo
- ✅ Tài khoản được tạo tự động (nếu chưa có)

## 🔍 Kiểm tra Database

Sau khi đăng nhập thành công, kiểm tra database:

```bash
# Kiểm tra user được tạo
npx prisma studio
# Hoặc
sqlite3 prisma/dev.db "SELECT id, email, firstName, lastName, avatar, 'emailVerified' FROM users WHERE email LIKE '%gmail.com%';"

# Kiểm tra account được liên kết
sqlite3 prisma/dev.db "SELECT * FROM accounts WHERE provider = 'google';"
```

## 📝 Test Cases

### TC1: Đăng nhập với Google (Tài khoản mới)
- **Bước**: Click "Đăng nhập với Google" với email chưa đăng ký
- **Kết quả**: Tài khoản được tạo tự động, đăng nhập thành công

### TC2: Đăng nhập với Google (Tài khoản đã tồn tại)
- **Bước**: Click "Đăng nhập với Google" với email đã đăng ký trước đó
- **Kết quả**: Đăng nhập thành công, không tạo tài khoản mới

### TC3: Từ chối quyền truy cập
- **Bước**: Click "Đăng nhập với Google" nhưng từ chối quyền truy cập
- **Kết quả**: Quay lại trang đăng nhập, không đăng nhập được

## ⚠️ Troubleshooting

### Lỗi: "OAuthSignin"
**Nguyên nhân**: Google OAuth chưa được cấu hình đúng

**Giải pháp**:
1. Kiểm tra `.env.local` có đầy đủ:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret
   ```

2. Kiểm tra Redirect URI trong Google Console:
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services > Credentials
   - Chọn OAuth 2.0 Client ID
   - Kiểm tra "Authorized redirect URIs" có:
     - `http://localhost:3000/api/auth/callback/google`

### Lỗi: "redirect_uri_mismatch"
**Nguyên nhân**: Redirect URI không khớp

**Giải pháp**:
- Đảm bảo redirect URI trong Google Console khớp chính xác:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://yourdomain.com/api/auth/callback/google`
- Lưu ý: Phải khớp cả `http` vs `https` và có/không có trailing slash

### Lỗi: "OAuthCallback"
**Nguyên nhân**: Lỗi xử lý callback từ Google

**Giải pháp**:
1. Kiểm tra `NEXTAUTH_SECRET` đã được set
2. Kiểm tra logs trong terminal để xem lỗi cụ thể
3. Kiểm tra database connection

### Không redirect về dashboard
**Nguyên nhân**: Callback redirect không đúng

**Giải pháp**:
- Kiểm tra `callbackUrl` trong `handleGoogleSignIn`
- Kiểm tra `redirect` callback trong `lib/auth.ts`

## 🧪 Chạy script kiểm tra

```bash
npx tsx scripts/test-google-oauth.ts
```

Script này sẽ:
- Kiểm tra environment variables
- Kiểm tra database schema
- Liệt kê các tài khoản Google đã liên kết
- Hiển thị hướng dẫn test

## 📊 Expected Flow

```
User clicks "Đăng nhập với Google"
    ↓
Redirect to Google OAuth
    ↓
User selects Google account
    ↓
User grants permission
    ↓
Google redirects to /api/auth/callback/google
    ↓
NextAuth processes callback
    ↓
Create/Update user in database
    ↓
Create/Update account in database
    ↓
Create session
    ↓
Redirect to /dashboard
```

## ✅ Checklist

Trước khi test:
- [ ] Server đang chạy (`npm run dev`)
- [ ] Environment variables đã được cấu hình
- [ ] Redirect URI đã được thêm vào Google Console
- [ ] Database đã được migrate

Sau khi test:
- [ ] Đăng nhập thành công
- [ ] Redirect về dashboard
- [ ] User được tạo trong database
- [ ] Account được liên kết trong database
- [ ] Session được tạo

## 🔗 Links hữu ích

- [Google Cloud Console](https://console.cloud.google.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

