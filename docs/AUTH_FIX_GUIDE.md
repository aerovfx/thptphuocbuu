# Hướng dẫn sửa lỗi Authentication

## Các lỗi thường gặp

### 1. JWT_SESSION_ERROR - "decryption operation failed"

**Nguyên nhân:**
- NEXTAUTH_SECRET đã thay đổi
- Session cookie cũ không thể decrypt với secret mới
- Cookie bị corrupt

**Cách sửa:**
1. Xóa cookies trong browser:
   - Chrome: DevTools > Application > Cookies > Xóa tất cả cookies của domain
   - Hoặc xóa cookies `next-auth.session-token` và `next-auth.csrf-token`
2. Đăng nhập lại
3. Nếu vẫn lỗi, kiểm tra NEXTAUTH_SECRET trong `.env`:
   ```bash
   # Tạo secret mới nếu cần
   openssl rand -base64 32
   ```

### 2. CredentialsSignin

**Nguyên nhân:**
- Email hoặc password không đúng
- User không tồn tại trong database
- User chỉ có OAuth (không có password)

**Cách sửa:**
1. Kiểm tra email/password có đúng không
2. Kiểm tra user có tồn tại:
   ```bash
   npx tsx scripts/fix-auth-issues.ts
   ```
3. Reset password nếu cần:
   ```bash
   npx tsx scripts/reset-admin-password.ts
   ```

## Scripts hỗ trợ

### Kiểm tra authentication issues
```bash
npx tsx scripts/fix-auth-issues.ts
```

### Reset password admin
```bash
npx tsx scripts/reset-admin-password.ts
```

## Các thay đổi đã thực hiện

1. **Cải thiện error handling trong `app/page.tsx`:**
   - Xử lý JWT decryption errors một cách graceful
   - Không crash khi có lỗi session

2. **Cải thiện error handling trong `app/dashboard/layout.tsx`:**
   - Xử lý JWT errors và redirect đến login
   - Thêm error parameter để hiển thị thông báo phù hợp

3. **Cải thiện logging trong `lib/auth.ts`:**
   - Thêm logging chi tiết hơn cho debugging
   - Đảm bảo consistent error handling

## Best Practices

1. **Luôn kiểm tra NEXTAUTH_SECRET:**
   - Phải được set trong `.env`
   - Không thay đổi trong production nếu không cần thiết

2. **Xử lý session errors gracefully:**
   - Không crash app khi có JWT errors
   - Redirect user đến login page

3. **Logging:**
   - Log errors trong development
   - Giảm noise trong production

