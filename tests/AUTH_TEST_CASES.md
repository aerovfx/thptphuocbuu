# Test Cases - Đăng ký & Đăng nhập

## A. Đăng ký & Đăng nhập

### TC01: Đăng ký bằng email hợp lệ

**ID**: TC01  
**Mô tả**: Đăng ký tài khoản mới với email hợp lệ  
**Điều kiện tiên quyết**: Chưa có tài khoản với email này

**Các bước thực hiện**:
1. Vào trang đăng ký (`/register`)
2. Nhập thông tin:
   - Email: `test@example.com`
   - Mật khẩu: `password123`
   - Xác nhận mật khẩu: `password123`
   - Họ: `Nguyễn`
   - Tên: `Văn A`
   - Ngày sinh: `01/01/2000`
   - Vai trò: `Học sinh`
3. Click nút "Đăng ký"

**Kết quả mong đợi**:
- ✅ Hiển thị thông báo "Đăng ký thành công"
- ✅ Nhận email xác nhận (nếu có email service)
- ✅ Sau khi click link xác nhận trong email → Tài khoản được kích hoạt
- ✅ Có thể đăng nhập thành công với email và mật khẩu đã đăng ký
- ✅ Chuyển đến trang đăng nhập với thông báo "Đăng ký thành công"

**Dữ liệu test**:
- Email: `test@example.com`
- Password: `password123`
- First Name: `Nguyễn`
- Last Name: `Văn A`
- Date of Birth: `2000-01-01`
- Role: `STUDENT`

---

### TC02: Đăng ký bằng email đã tồn tại

**ID**: TC02  
**Mô tả**: Thử đăng ký với email đã được sử dụng  
**Điều kiện tiên quyết**: Email `existing@example.com` đã có tài khoản trong hệ thống

**Các bước thực hiện**:
1. Vào trang đăng ký (`/register`)
2. Nhập email đã tồn tại: `existing@example.com`
3. Nhập các thông tin khác hợp lệ
4. Click nút "Đăng ký"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Email đã được sử dụng"
- ❌ Không tạo tài khoản mới
- ❌ Form vẫn giữ nguyên dữ liệu (trừ email)

**Dữ liệu test**:
- Email: `existing@example.com` (đã tồn tại)
- Password: `password123`
- First Name: `Nguyễn`
- Last Name: `Văn B`

---

### TC03: Đăng ký mật khẩu không khớp

**ID**: TC03  
**Mô tả**: Thử đăng ký với mật khẩu và xác nhận mật khẩu khác nhau  
**Điều kiện tiên quyết**: Không có

**Các bước thực hiện**:
1. Vào trang đăng ký (`/register`)
2. Nhập email hợp lệ: `newuser@example.com`
3. Nhập mật khẩu: `password123`
4. Nhập xác nhận mật khẩu: `password456` (khác với mật khẩu)
5. Nhập các thông tin khác hợp lệ
6. Click nút "Đăng ký"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Mật khẩu xác nhận không khớp"
- ❌ Không tạo tài khoản
- ❌ Form validation ngăn submit

**Dữ liệu test**:
- Email: `newuser@example.com`
- Password: `password123`
- Confirm Password: `password456` (khác)
- First Name: `Trần`
- Last Name: `Văn C`

**Lưu ý**: Hiện tại form đăng ký chưa có field "Xác nhận mật khẩu". Cần bổ sung.

---

### TC04: Đăng nhập thành công

**ID**: TC04  
**Mô tả**: Đăng nhập với email và mật khẩu đúng  
**Điều kiện tiên quyết**: 
- Tài khoản đã được tạo và xác minh email (nếu có email verification)
- Email: `test@example.com`
- Password: `password123`

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Nhập email: `test@example.com`
3. Nhập mật khẩu: `password123`
4. Click nút "Đăng nhập"

**Kết quả mong đợi**:
- ✅ Đăng nhập thành công
- ✅ Chuyển đến trang dashboard (`/dashboard`)
- ✅ Hiển thị tên người dùng ở header/navigation
- ✅ Session được tạo và lưu
- ✅ Có thể truy cập các trang yêu cầu đăng nhập

**Dữ liệu test**:
- Email: `test@example.com`
- Password: `password123`

---

### TC05: Đăng nhập sai mật khẩu 5 lần

**ID**: TC05  
**Mô tả**: Thử đăng nhập với mật khẩu sai 5 lần liên tiếp  
**Điều kiện tiên quyết**: Tài khoản tồn tại với email `test@example.com`

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Nhập email: `test@example.com`
3. Nhập mật khẩu sai: `wrongpassword`
4. Click "Đăng nhập" → Lần 1
5. Lặp lại bước 3-4 thêm 4 lần (tổng 5 lần)

**Kết quả mong đợi**:
- ❌ Lần 1-4: Hiển thị lỗi "Email hoặc mật khẩu không đúng"
- ❌ Lần 5: 
  - Tài khoản bị khóa trong 15 phút
  - Hiển thị thông báo: "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."
  - Nhận email cảnh báo về việc khóa tài khoản (nếu có email service)
- ❌ Không thể đăng nhập trong 15 phút tiếp theo
- ✅ Sau 15 phút: Có thể đăng nhập lại

**Dữ liệu test**:
- Email: `test@example.com`
- Password (sai): `wrongpassword1`, `wrongpassword2`, `wrongpassword3`, `wrongpassword4`, `wrongpassword5`

**Lưu ý**: Hiện tại hệ thống chưa có cơ chế lockout. Cần implement:
- Field `failedLoginAttempts` và `lockedUntil` trong User model
- Logic đếm số lần đăng nhập sai
- Logic khóa tài khoản sau 5 lần sai
- Gửi email cảnh báo

---

### TC06: Quên mật khẩu

**ID**: TC06  
**Mô tả**: Yêu cầu đặt lại mật khẩu qua email  
**Điều kiện tiên quyết**: Email `test@example.com` đã đăng ký trong hệ thống

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Click link "Quên mật khẩu"
3. Vào trang quên mật khẩu (`/forgot-password`)
4. Nhập email: `test@example.com`
5. Click nút "Gửi link đặt lại mật khẩu"

**Kết quả mong đợi**:
- ✅ Hiển thị thông báo: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu."
- ✅ Nhận email chứa link đặt lại mật khẩu
- ✅ Link có format: `/reset-password/[token]`
- ✅ Link hết hạn sau 15 phút (hiện tại là 1 giờ - cần điều chỉnh)
- ✅ Click link → Chuyển đến trang đặt lại mật khẩu
- ✅ Có thể đặt mật khẩu mới

**Dữ liệu test**:
- Email: `test@example.com`

**Lưu ý**: 
- Hiện tại reset token expires sau 1 giờ (3600000ms). Test case yêu cầu 15 phút (900000ms).
- Cần cập nhật: `resetTokenExpires = new Date(Date.now() + 900000)`

---

## B. Test Cases Bổ Sung

### TC07: Đăng ký với email không hợp lệ

**ID**: TC07  
**Mô tả**: Thử đăng ký với email không đúng format  
**Điều kiện tiên quyết**: Không có

**Các bước thực hiện**:
1. Vào trang đăng ký (`/register`)
2. Nhập email không hợp lệ: `invalid-email`
3. Nhập các thông tin khác hợp lệ
4. Click nút "Đăng ký"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Email không hợp lệ"
- ❌ Form validation ngăn submit
- ❌ Không tạo tài khoản

**Dữ liệu test**:
- Email: `invalid-email` (không hợp lệ)
- Password: `password123`

---

### TC08: Đăng ký với mật khẩu quá ngắn

**ID**: TC08  
**Mô tả**: Thử đăng ký với mật khẩu dưới 6 ký tự  
**Điều kiện tiên quyết**: Không có

**Các bước thực hiện**:
1. Vào trang đăng ký (`/register`)
2. Nhập email hợp lệ: `shortpass@example.com`
3. Nhập mật khẩu: `12345` (5 ký tự)
4. Nhập các thông tin khác hợp lệ
5. Click nút "Đăng ký"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Mật khẩu phải có ít nhất 6 ký tự"
- ❌ Form validation ngăn submit
- ❌ Không tạo tài khoản

**Dữ liệu test**:
- Email: `shortpass@example.com`
- Password: `12345` (< 6 ký tự)

---

### TC09: Đăng nhập với email không tồn tại

**ID**: TC09  
**Mô tả**: Thử đăng nhập với email chưa đăng ký  
**Điều kiện tiên quyết**: Email `nonexistent@example.com` không tồn tại trong hệ thống

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Nhập email: `nonexistent@example.com`
3. Nhập mật khẩu bất kỳ: `password123`
4. Click nút "Đăng nhập"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Email hoặc mật khẩu không đúng" (không tiết lộ email không tồn tại - security best practice)
- ❌ Không đăng nhập được
- ❌ Không tạo session

**Dữ liệu test**:
- Email: `nonexistent@example.com`
- Password: `password123`

---

### TC10: Đăng nhập với mật khẩu sai

**ID**: TC10  
**Mô tả**: Thử đăng nhập với mật khẩu sai  
**Điều kiện tiên quyết**: Tài khoản tồn tại với email `test@example.com` và password `password123`

**Các bước thực hiện**:
1. Vào trang đăng nhập (`/login`)
2. Nhập email: `test@example.com`
3. Nhập mật khẩu sai: `wrongpassword`
4. Click nút "Đăng nhập"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Email hoặc mật khẩu không đúng"
- ❌ Không đăng nhập được
- ❌ Không tạo session
- ✅ Đếm số lần đăng nhập sai (để phục vụ TC05)

**Dữ liệu test**:
- Email: `test@example.com`
- Password (sai): `wrongpassword`

---

### TC11: Reset mật khẩu với token hợp lệ

**ID**: TC11  
**Mô tả**: Đặt lại mật khẩu với token hợp lệ từ email  
**Điều kiện tiên quyết**: 
- Đã yêu cầu reset password (TC06)
- Có token hợp lệ từ email
- Token chưa hết hạn

**Các bước thực hiện**:
1. Click link reset password từ email: `/reset-password/[token]`
2. Vào trang đặt lại mật khẩu
3. Nhập mật khẩu mới: `newpassword123`
4. Nhập xác nhận mật khẩu: `newpassword123`
5. Click nút "Đặt lại mật khẩu"

**Kết quả mong đợi**:
- ✅ Mật khẩu được cập nhật thành công
- ✅ Hiển thị thông báo: "Mật khẩu đã được đặt lại thành công"
- ✅ Token bị vô hiệu hóa (không thể dùng lại)
- ✅ Có thể đăng nhập với mật khẩu mới
- ✅ Không thể đăng nhập với mật khẩu cũ

**Dữ liệu test**:
- Token: `[token từ email]`
- New Password: `newpassword123`
- Confirm Password: `newpassword123`

---

### TC12: Reset mật khẩu với token hết hạn

**ID**: TC12  
**Mô tả**: Thử đặt lại mật khẩu với token đã hết hạn  
**Điều kiện tiên quyết**: Token đã hết hạn (sau 15 phút)

**Các bước thực hiện**:
1. Click link reset password đã hết hạn: `/reset-password/[expired-token]`
2. Vào trang đặt lại mật khẩu
3. Nhập mật khẩu mới: `newpassword123`
4. Click nút "Đặt lại mật khẩu"

**Kết quả mong đợi**:
- ❌ Hiển thị lỗi: "Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới."
- ❌ Mật khẩu không được cập nhật
- ❌ Cần yêu cầu reset password lại

**Dữ liệu test**:
- Token: `[expired-token]` (hết hạn sau 15 phút)
- New Password: `newpassword123`

---

## C. Test Data Setup

### Users cần tạo cho testing:

```sql
-- User đã tồn tại (cho TC02)
INSERT INTO users (id, email, password, firstName, lastName, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('user1', 'existing@example.com', '$2a$10$...', 'Nguyễn', 'Văn A', 'STUDENT', NOW(), NOW(), NOW());

-- User cho TC04, TC05, TC10
INSERT INTO users (id, email, password, firstName, lastName, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('user2', 'test@example.com', '$2a$10$...', 'Trần', 'Văn B', 'STUDENT', NOW(), NOW(), NOW());
```

### Test Accounts:

| Email | Password | Status | Purpose |
|-------|----------|--------|---------|
| `existing@example.com` | `password123` | Active | TC02 - Email đã tồn tại |
| `test@example.com` | `password123` | Active | TC04, TC05, TC10 - Đăng nhập |
| `nonexistent@example.com` | - | - | TC09 - Email không tồn tại |

---

## D. Các Tính Năng Cần Implement

### 1. Password Confirmation Field
- **File**: `app/register/page.tsx`
- **Cần thêm**: Field "Xác nhận mật khẩu"
- **Validation**: So sánh password và confirmPassword

### 2. Date of Birth Field
- **File**: `app/register/page.tsx`
- **Cần thêm**: Field "Ngày sinh"
- **Validation**: Format date hợp lệ

### 3. Account Lockout Mechanism
- **Schema**: Thêm fields vào User model:
  - `failedLoginAttempts Int @default(0)`
  - `lockedUntil DateTime?`
- **Logic**: 
  - Đếm số lần đăng nhập sai
  - Khóa tài khoản sau 5 lần sai
  - Tự động mở khóa sau 15 phút
- **File**: `lib/auth.ts` - authorize function

### 4. Email Verification
- **Schema**: Đã có `emailVerified DateTime?`
- **Logic**: 
  - Gửi email xác nhận sau khi đăng ký
  - Yêu cầu xác nhận trước khi đăng nhập (optional)
- **File**: `app/api/auth/register/route.ts`

### 5. Reset Password Token Expiry
- **File**: `app/api/auth/forgot-password/route.ts`
- **Cần sửa**: `resetTokenExpires = new Date(Date.now() + 900000)` (15 phút thay vì 1 giờ)

### 6. Email Service Integration
- **Cần**: Tích hợp email service (SendGrid, AWS SES, etc.)
- **Mục đích**: Gửi email xác nhận, reset password, cảnh báo lockout

---

## E. Test Execution Checklist

- [ ] TC01: Đăng ký bằng email hợp lệ
- [ ] TC02: Đăng ký bằng email đã tồn tại
- [ ] TC03: Đăng ký mật khẩu không khớp (cần implement confirm password)
- [ ] TC04: Đăng nhập thành công
- [ ] TC05: Đăng nhập sai mật khẩu 5 lần (cần implement lockout)
- [ ] TC06: Quên mật khẩu
- [ ] TC07: Đăng ký với email không hợp lệ
- [ ] TC08: Đăng ký với mật khẩu quá ngắn
- [ ] TC09: Đăng nhập với email không tồn tại
- [ ] TC10: Đăng nhập với mật khẩu sai
- [ ] TC11: Reset mật khẩu với token hợp lệ
- [ ] TC12: Reset mật khẩu với token hết hạn

---

## F. Notes

1. **Security Best Practices**:
   - Không tiết lộ email có tồn tại hay không (TC09)
   - Rate limiting cho forgot password endpoint
   - Token reset password chỉ dùng 1 lần
   - Hash password với bcrypt

2. **User Experience**:
   - Hiển thị thông báo lỗi rõ ràng
   - Form validation real-time
   - Loading states khi submit

3. **Testing Environment**:
   - Sử dụng test database riêng
   - Cleanup sau mỗi test run
   - Mock email service trong development

