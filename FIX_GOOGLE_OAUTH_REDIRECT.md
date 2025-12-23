# 🔧 Sửa lỗi Google OAuth - redirect_uri_mismatch

## Vấn đề
```
Error 400: redirect_uri_mismatch
Access blocked: This app's request is invalid
```

## Nguyên nhân
Google OAuth redirect URI chưa được cấu hình cho URL production mới:
- **URL Production**: `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app`
- **Redirect URI cần thêm**: `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google`

## Cách sửa

### Bước 1: Truy cập Google Cloud Console
1. Mở: https://console.cloud.google.com/apis/credentials
2. Chọn project: **in360project**
3. Click vào OAuth 2.0 Client ID: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com` (tên "thptphuocbuu")

### Bước 2: Thêm Authorized redirect URIs

Trong phần **Authorized redirect URIs**, thêm các URL sau:

```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
```

**Các URI hiện có (giữ lại):**
```
http://localhost:3000/api/auth/callback/google
```

### Bước 3: Thêm Authorized JavaScript origins (nếu cần)

Trong phần **Authorized JavaScript origins**, thêm:

```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
```

**Các origins hiện có (giữ lại):**
```
http://localhost:3000
```

### Bước 4: Lưu thay đổi
1. Click **SAVE** ở dưới cùng
2. Đợi vài giây để thay đổi có hiệu lực

### Bước 5: Kiểm tra lại

Truy cập lại ứng dụng và thử đăng nhập bằng Google:
```
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/login
```

## Screenshot hướng dẫn

### Vị trí cấu hình trong Google Cloud Console:

```
Google Cloud Console
  └── APIs & Services
      └── Credentials
          └── OAuth 2.0 Client IDs
              └── [Your Client ID]
                  ├── Authorized JavaScript origins
                  │   ├── http://localhost:3000
                  │   └── https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
                  │
                  └── Authorized redirect URIs
                      ├── http://localhost:3000/api/auth/callback/google
                      └── https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
```

## Lưu ý

- ✅ **Giữ lại** các URI cho localhost để development vẫn hoạt động
- ✅ **Thêm** URIs cho production URL
- ⚠️ Nếu URL production thay đổi trong tương lai, cần cập nhật lại
- ⚠️ Có thể mất 5-10 phút để thay đổi có hiệu lực hoàn toàn

## Custom Domain (Tùy chọn)

Nếu bạn muốn sử dụng custom domain thay vì URL Cloud Run dài:

### 1. Map custom domain trong Cloud Run
```bash
gcloud run domain-mappings create \
  --service thptphuocbuu360 \
  --domain thptphuocbuu360.edu.vn \
  --region asia-southeast1 \
  --project in360project
```

### 2. Cập nhật DNS Records
Thêm CNAME record trỏ đến Cloud Run:
```
Type: CNAME
Name: thptphuocbuu360 (hoặc www)
Value: ghs.googlehosted.com
TTL: 3600
```

### 3. Cập nhật Google OAuth URIs
Thay thế URLs bằng custom domain:
```
https://thptphuocbuu360.edu.vn/api/auth/callback/google
```

### 4. Cập nhật NEXTAUTH_URL trong Cloud Run
```bash
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars "NEXTAUTH_URL=https://thptphuocbuu360.edu.vn"
```

## Troubleshooting

### Vẫn gặp lỗi sau khi cấu hình?

1. **Clear browser cache và cookies**
2. **Thử incognito/private mode**
3. **Đợi 5-10 phút** cho Google cập nhật cấu hình
4. **Kiểm tra logs Cloud Run:**
   ```bash
   gcloud beta run services logs tail thptphuocbuu360 --region asia-southeast1
   ```

### Kiểm tra env vars đã đúng chưa:
```bash
gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format="value(spec.template.spec.containers[0].env)"
```

Nên thấy:
```
NEXTAUTH_URL=https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
GOOGLE_CLIENT_ID=1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

## Tham khảo thêm

- [NextAuth.js OAuth Configuration](https://next-auth.js.org/configuration/providers/oauth)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
