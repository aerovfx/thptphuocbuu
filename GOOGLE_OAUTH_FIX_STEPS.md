# 🔧 Hướng dẫn Fix Google OAuth - Error 400: redirect_uri_mismatch

## ✅ Xác nhận: Cloud Run đã cấu hình ĐÚNG

Đã kiểm tra và xác nhận:
- ✅ `NEXTAUTH_URL` = `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app`
- ✅ `GOOGLE_CLIENT_ID` = `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com`
- ✅ `GOOGLE_CLIENT_SECRET` = Đã set (35 ký tự)
- ✅ `NEXTAUTH_SECRET` = Đã set (44 ký tự)
- ✅ NextAuth providers endpoint hoạt động đúng
- ✅ Callback URL được generate: `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google`

## ❌ Vấn đề: Google Cloud Console OAuth chưa lưu đúng

Test cho thấy OAuth flow bị lỗi với `error=google`, nghĩa là **Google Cloud Console chưa được cấu hình đúng**.

## 📋 Các bước sửa lỗi (làm chính xác theo thứ tự)

### Bước 1: Mở Google Cloud Console OAuth Credentials

1. Vào link: https://console.cloud.google.com/apis/credentials?project=in360project
2. Tìm OAuth 2.0 Client ID có ID: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1` (tên: "thptphuocbuu")
3. Click vào tên credential để mở form chỉnh sửa

### Bước 2: Kiểm tra và thêm Authorized JavaScript origins

Trong phần **"Authorized JavaScript origins"**, đảm bảo có URL:

```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
```

**Lưu ý:**
- ✅ Phải có `https://` ở đầu
- ✅ KHÔNG có dấu `/` ở cuối
- ✅ KHÔNG có khoảng trắng trước/sau
- ✅ Copy chính xác URL trên (không gõ tay)

### Bước 3: Kiểm tra và thêm Authorized redirect URIs

Trong phần **"Authorized redirect URIs"**, đảm bảo có URL:

```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
```

**Lưu ý:**
- ✅ Phải có `https://` ở đầu
- ✅ Phải có `/api/auth/callback/google` ở cuối
- ✅ KHÔNG có khoảng trắng trước/sau
- ✅ KHÔNG có dấu `/` thừa ở cuối
- ✅ Copy chính xác URL trên (không gõ tay)

### Bước 4: Lưu thay đổi

1. **Click nút "SAVE" ở cuối form**
2. Đợi thấy thông báo "OAuth client updated" ở góc phải màn hình
3. **Chụp màn hình** lại form để confirm đã lưu đúng

### Bước 5: Đợi Google propagate changes

- Google OAuth có thể mất **5-10 phút** để cập nhật
- Trong lúc chờ, **ĐỪNG** thử login liên tục (có thể bị rate limit)

### Bước 6: Test lại sau khi đợi

Sau 5-10 phút, thử login bằng Google tại:
```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/login
```

## 🔍 Checklist xác nhận đã làm đúng

Sau khi làm xong, Google Cloud Console OAuth form phải có:

### Authorized JavaScript origins:
```
✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
✓ http://localhost:3000 (nếu còn, giữ lại cho local dev)
```

### Authorized redirect URIs:
```
✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
✓ http://localhost:3000/api/auth/callback/google (nếu còn, giữ lại cho local dev)
```

## ⚠️ Các lỗi thường gặp

### 1. Quên click nút SAVE
- Nhiều người thêm URI xong rồi đóng tab mà không save
- **Giải pháp**: Luôn chờ thấy toast "OAuth client updated" trước khi đóng tab

### 2. Copy URL bị thừa/thiếu ký tự
- Có khoảng trắng thừa
- Thiếu `https://`
- Thừa dấu `/` ở cuối
- **Giải pháp**: Copy chính xác URL trong guide này

### 3. Thêm vào sai OAuth credential
- Nếu project có nhiều OAuth credentials
- Phải thêm vào đúng credential có Client ID: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1`
- **Giải pháp**: Kiểm tra lại Client ID trước khi save

### 4. Test ngay sau khi save
- Google cần thời gian để propagate changes
- **Giải pháp**: Đợi 5-10 phút trước khi test

### 5. Browser cache
- Trình duyệt có thể cache OAuth error cũ
- **Giải pháp**: Thử Incognito/Private mode hoặc clear cache

## 🧪 Lệnh test sau khi fix

Sau khi đợi 5-10 phút và đã save đúng, chạy lệnh này để test:

```bash
# Test providers endpoint
curl -s "https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/providers" | python3 -m json.tool

# Kiểm tra OAuth redirect
curl -sL -I "https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/signin/google" | grep -i location
```

Nếu vẫn lỗi, chụp màn hình:
1. Google Cloud Console OAuth form (phần URIs)
2. Error message đầy đủ khi login
3. Gửi cho dev để troubleshoot tiếp

## 📞 Nếu vẫn không được

Nếu sau khi làm đúng tất cả các bước trên và đợi 10 phút mà vẫn lỗi:

1. **Tạo OAuth credential mới:**
   - Vào https://console.cloud.google.com/apis/credentials?project=in360project
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "thptphuocbuu360-production"
   - Thêm JavaScript origins và Redirect URIs như trên
   - Copy Client ID và Client Secret mới
   - Update Cloud Run env vars với credentials mới

2. **Liên hệ support** với thông tin:
   - Screenshot OAuth form
   - Screenshot error message
   - Timestamp khi test
   - Browser đã dùng để test

---

**Last updated**: 2025-12-23
**Status**: Cloud Run OK ✅ | Google Console cần fix ⚠️
