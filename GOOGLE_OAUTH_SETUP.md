# Cấu hình Google OAuth

## ✅ Trạng Thái: Đã Cấu Hình

Google OAuth đã được cấu hình thành công cho project **thptphuocbuu360**.

---

## 📋 Thông Tin OAuth Credentials

### Production Environment

- **Project**: `in360project`
- **Service**: `thptphuocbuu360`
- **Region**: `asia-southeast1`
- **Production URL**: `https://thptphuocbuu.edu.vn`

### OAuth Credentials

```
Client ID:       1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com
Client Secret:   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
```

### Authorized Redirect URIs

```
✅ https://thptphuocbuu.edu.vn/api/auth/callback/google
✅ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
✅ http://localhost:3000/api/auth/callback/google
```

---

## 🔧 Development Setup

File `.env.local` đã được cấu hình tự động với các giá trị sau:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=SFGMADQcmMPoE6r0cKJ/tNfQ2b/tyVbhj74tqEDhcFg=
GOOGLE_CLIENT_ID=1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Khởi động Development Server

```bash
npm run dev
```

Sau đó truy cập: `http://localhost:3000/login` và test Google OAuth.

---

## 🚀 Production Deployment

### Environment Variables trên Cloud Run

Các biến môi trường sau đã được cấu hình trên Cloud Run:

```bash
NEXTAUTH_URL=https://thptphuocbuu.edu.vn
NEXTAUTH_SECRET=SFGMADQcmMPoE6r0cKJ/tNfQ2b/tyVbhj74tqEDhcFg=
GOOGLE_CLIENT_ID=1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Cập Nhật Credentials (Nếu Cần)

Nếu bạn cần cập nhật Google OAuth credentials trong tương lai:

```bash
# Cập nhật Client ID và Secret
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --project=in360project \
  --update-env-vars="GOOGLE_CLIENT_ID=<new-client-id>,GOOGLE_CLIENT_SECRET=<new-client-secret>"
```

---

## 🧪 Testing

### Test trên Production

1. Truy cập: https://thptphuocbuu.edu.vn/login
2. Nhấn nút **"Đăng nhập với Google"**
3. Chọn tài khoản Google
4. Kiểm tra xem có redirect về dashboard thành công không

### Test trên Development

1. Chạy: `npm run dev`
2. Truy cập: http://localhost:3000/login
3. Nhấn nút **"Đăng nhập với Google"**
4. Chọn tài khoản Google
5. Kiểm tra xem có redirect về dashboard thành công không

---

## 📊 Xem Logs

Nếu gặp vấn đề, xem logs của Cloud Run:

```bash
# Logs real-time
gcloud run services logs tail thptphuocbuu360 \
  --region=asia-southeast1 \
  --project=in360project

# Tìm lỗi OAuth
gcloud run services logs read thptphuocbuu360 \
  --region=asia-southeast1 \
  --project=in360project \
  --limit=50 \
  | grep -i "oauth\|google\|auth"
```

---

## 🔐 Security Best Practices

> [!WARNING]
> **Bảo Mật Credentials**
> - Client Secret là thông tin nhạy cảm
> - **KHÔNG** commit `.env.local` vào Git
> - File `.env.local` đã được thêm vào `.gitignore`
> - Trong production, cân nhắc sử dụng Secret Manager

### Migrate to Secret Manager (Recommended)

Để bảo mật tốt hơn, chuyển sang Secret Manager:

```bash
# Tạo secrets
echo -n "https://thptphuocbuu.edu.vn" | \
  gcloud secrets create NEXTAUTH_URL --data-file=- --project=in360project

echo -n "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" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=- --project=in360project

# Cập nhật Cloud Run
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --project=in360project \
  --update-secrets="GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest"
```

---

## 🔧 Troubleshooting

### Lỗi: "Redirect URI mismatch"

- **Nguyên nhân**: Authorized redirect URI chưa được thêm vào Google Cloud Console
- **Giải pháp**: Kiểm tra lại [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=in360project)

### Lỗi: "Configuration not found"

- **Nguyên nhân**: Environment variables chưa được load
- **Giải pháp**: Restart Cloud Run service

### Lỗi: "Invalid client"

- **Nguyên nhân**: Client ID hoặc Client Secret không đúng
- **Giải pháp**: Kiểm tra lại credentials

---

## 📚 Tài Liệu Tham Khảo

- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
- [Cloud Run Secrets](https://cloud.google.com/run/docs/configuring/secrets)

---

**Last Updated**: 2025-12-22  
**Status**: ✅ Active and Configured
