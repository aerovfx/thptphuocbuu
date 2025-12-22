# Test Cases - Đăng nhập với Google OAuth

## TC_GOOGLE_01: Đăng nhập với Google thành công (Tài khoản mới)

**ID**: TC_GOOGLE_01  
**Mô tả**: Đăng nhập với Google khi chưa có tài khoản trong hệ thống  
**Điều kiện tiên quyết**: 
- Chưa có tài khoản với email Google này
- Google OAuth đã được cấu hình đúng

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click nút "Đăng nhập với Google"
3. Chọn tài khoản Google
4. Cho phép ứng dụng truy cập thông tin

**Kết quả mong đợi**:
- ✅ Tài khoản được tạo tự động với thông tin từ Google
- ✅ Đăng nhập thành công
- ✅ Chuyển đến trang dashboard (`/dashboard`)
- ✅ Session được tạo
- ✅ Thông tin người dùng được lưu (tên, email, avatar)

**Dữ liệu test**:
- Google Account: Bất kỳ tài khoản Google chưa đăng ký

---

## TC_GOOGLE_02: Đăng nhập với Google thành công (Tài khoản đã tồn tại)

**ID**: TC_GOOGLE_02  
**Mô tả**: Đăng nhập với Google khi đã có tài khoản  
**Điều kiện tiên quyết**: 
- Đã có tài khoản với email Google này (đã đăng nhập bằng Google trước đó)

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click nút "Đăng nhập với Google"
3. Chọn tài khoản Google đã liên kết
4. Cho phép ứng dụng truy cập

**Kết quả mong đợi**:
- ✅ Đăng nhập thành công
- ✅ Chuyển đến trang dashboard
- ✅ Session được tạo
- ✅ Không tạo tài khoản mới

**Dữ liệu test**:
- Google Account: Tài khoản đã đăng ký trước đó

---

## TC_GOOGLE_03: Đăng nhập với Google - Từ chối quyền truy cập

**ID**: TC_GOOGLE_03  
**Mô tả**: Người dùng từ chối cho phép ứng dụng truy cập  
**Điều kiện tiên quyết**: Không có

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click nút "Đăng nhập với Google"
3. Chọn tài khoản Google
4. Từ chối cho phép ứng dụng truy cập

**Kết quả mong đợi**:
- ❌ Không đăng nhập được
- ❌ Quay lại trang đăng nhập
- ❌ Hiển thị thông báo lỗi (nếu có)
- ❌ Không tạo tài khoản

---

## TC_GOOGLE_04: Đăng nhập với Google - Lỗi cấu hình

**ID**: TC_GOOGLE_04  
**Mô tả**: Google OAuth chưa được cấu hình hoặc cấu hình sai  
**Điều kiện tiên quyết**: 
- `GOOGLE_CLIENT_ID` hoặc `GOOGLE_CLIENT_SECRET` chưa được set
- Hoặc cấu hình sai trong Google Console

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click nút "Đăng nhập với Google"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Lỗi khi đăng nhập với Google. Vui lòng thử lại."
- ❌ Không chuyển đến Google OAuth page
- ❌ Quay lại trang đăng nhập

---

## TC_GOOGLE_05: Đăng nhập với Google - Email đã tồn tại (Credentials)

**ID**: TC_GOOGLE_05  
**Mô tả**: Đăng nhập với Google nhưng email đã được đăng ký bằng email/password  
**Điều kiện tiên quyết**: 
- Email `test@example.com` đã được đăng ký bằng email/password

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click nút "Đăng nhập với Google"
3. Chọn tài khoản Google có email trùng với email đã đăng ký

**Kết quả mong đợi**:
- ⚠️ Có thể:
  - Tự động liên kết tài khoản Google với tài khoản hiện có
  - Hoặc hiển thị lỗi: "Email này đã được đăng ký. Vui lòng đăng nhập bằng email/password."
  - Hoặc yêu cầu xác nhận để liên kết tài khoản

**Lưu ý**: Cần quyết định behavior cho trường hợp này

---

## Cấu hình Google OAuth

### 1. Tạo OAuth Credentials trong Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Cấu hình:
   - **Name**: Phước Bửu School
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy **Client ID** và **Client Secret**

### 2. Cấu hình Environment Variables

Thêm vào file `.env.local`:

```env
GOOGLE_CLIENT_ID=442514522574-5sm9bp4nb09nspuk10rutdvdc04pujbg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXTAUTH_URL=https://thptphuocbuu.edu.vn
NEXTAUTH_SECRET=NtGmEZ26lPBtdSIXlMae/+JTk1yJXio3+IehmbqCxK4=
```

### 3. Kiểm tra cấu hình

```bash
# Kiểm tra environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

---

## Test Script

### Manual Test Steps

1. **Kiểm tra cấu hình**:
   ```bash
   # Kiểm tra .env.local có GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
   cat .env.local | grep GOOGLE
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Test đăng nhập**:
   - Mở browser: `http://localhost:3000/login`
   - Click "Đăng nhập với Google"
   - Chọn tài khoản Google
   - Kiểm tra redirect về dashboard

4. **Kiểm tra database**:
   ```sql
   -- Kiểm tra user được tạo
   SELECT id, email, "firstName", "lastName", avatar, "emailVerified" 
   FROM users 
   WHERE email = 'your-google-email@gmail.com';
   
   -- Kiểm tra account được liên kết
   SELECT * FROM accounts WHERE "provider" = 'google';
   ```

---

## Troubleshooting

### Lỗi: "OAuthSignin"
- **Nguyên nhân**: Google OAuth chưa được cấu hình hoặc cấu hình sai
- **Giải pháp**: 
  - Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env.local`
  - Kiểm tra redirect URI trong Google Console khớp với `NEXTAUTH_URL`

### Lỗi: "OAuthCallback"
- **Nguyên nhân**: Lỗi xử lý callback từ Google
- **Giải pháp**:
  - Kiểm tra redirect URI trong Google Console
  - Kiểm tra `NEXTAUTH_SECRET` đã được set
  - Kiểm tra logs trong console

### Lỗi: "OAuthCreateAccount"
- **Nguyên nhân**: Không thể tạo tài khoản từ Google
- **Giải pháp**:
  - Kiểm tra database connection
  - Kiểm tra User model có đầy đủ fields
  - Kiểm tra logs để xem lỗi cụ thể

### Redirect URI không khớp
- **Lỗi**: `redirect_uri_mismatch`
- **Giải pháp**: 
  - Đảm bảo redirect URI trong Google Console khớp chính xác với:
    - Development: `http://localhost:3000/api/auth/callback/google`
    - Production: `https://yourdomain.com/api/auth/callback/google`

---

## Expected Database State

Sau khi đăng nhập với Google thành công:

### Users Table
```sql
SELECT * FROM users WHERE email = 'user@gmail.com';
```
- `email`: Email từ Google
- `firstName`: Tên từ Google profile
- `lastName`: Họ từ Google profile
- `avatar`: Avatar URL từ Google
- `emailVerified`: Timestamp (tự động verified khi dùng Google)
- `password`: NULL (không có password cho OAuth users)

### Accounts Table
```sql
SELECT * FROM accounts WHERE "provider" = 'google';
```
- `provider`: 'google'
- `providerAccountId`: Google user ID
- `userId`: Foreign key đến users table
- `access_token`: Google access token
- `refresh_token`: Google refresh token (nếu có)
- `expires_at`: Token expiry timestamp

---

## Test Checklist

- [ ] TC_GOOGLE_01: Đăng nhập với Google (tài khoản mới)
- [ ] TC_GOOGLE_02: Đăng nhập với Google (tài khoản đã tồn tại)
- [ ] TC_GOOGLE_03: Từ chối quyền truy cập
- [ ] TC_GOOGLE_04: Lỗi cấu hình
- [ ] TC_GOOGLE_05: Email đã tồn tại (credentials)

---

## Notes

1. **Security**: 
   - Không commit `.env.local` vào git
   - Sử dụng different OAuth credentials cho development và production
   - Rotate secrets định kỳ

2. **User Experience**:
   - Hiển thị loading state khi đang xử lý OAuth
   - Xử lý lỗi một cách user-friendly
   - Có thể cho phép liên kết Google account với tài khoản hiện có

3. **Testing**:
   - Test với nhiều tài khoản Google khác nhau
   - Test với tài khoản Google chưa có avatar
   - Test với tài khoản Google có tên/họ đặc biệt

