# Cấu hình Google OAuth

## Thông tin Client ID
Client ID của bạn: `442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com`

## Các bước cấu hình

### 1. Lấy Client Secret
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Credentials**
4. Tìm OAuth 2.0 Client ID của bạn
5. Copy **Client Secret**

### 2. Cập nhật file `.env`
Thêm hoặc cập nhật các biến sau trong file `.env`:

```env
GOOGLE_CLIENT_ID=442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

### 3. Cấu hình Authorized Redirect URIs
Trong Google Cloud Console, thêm các URI sau vào **Authorized redirect URIs**:

- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

### 4. Kiểm tra cấu hình
Sau khi cập nhật `.env`, khởi động lại server:

```bash
npm run dev
```

Truy cập trang đăng nhập và kiểm tra nút "Đăng nhập với Google".

## Lưu ý
- Client Secret là thông tin bảo mật, không commit vào Git
- Đảm bảo file `.env` đã được thêm vào `.gitignore`
- Trong production, sử dụng biến môi trường an toàn

