# 🔍 Phân Tích Lỗi 403 Forbidden - Mobile App Login

## 📋 Vấn Đề

Mobile app không thể đăng nhập, hiển thị lỗi:
```
Không thể kết nối đến server. Vui lòng kiểm tra:
1. Kết nối mạng của bạn
2. URL server có đúng không
3. Server có đang hoạt động không
```

## 🔬 Nguyên Nhân

### 1. Server Response
- **Status Code**: `403 Forbidden`
- **Content-Type**: `text/html; charset=UTF-8` (thay vì `application/json`)
- **Response Body**: HTML error page từ Google Cloud Run

```html
<html><head>
<meta http-equiv="content-type" content="text/html;charset=utf-8">
<title>403 Forbidden</title>
</head>
<body text=#000000 bgcolor=#ffffff>
<h1>Error: Forbidden</h1>
<h2>Your client does not have permission to get URL <code>/api/mobile/auth/login</code> from this server.</h2>
</body></html>
```

### 2. Root Cause
- **Middleware blocking**: Next.js middleware có thể đang block `/api/mobile` routes
- **Cloud Run routing**: Route `/api/mobile/auth/login` có thể chưa được deploy hoặc không accessible
- **CORS/Authorization**: Cloud Run có thể yêu cầu authentication

## ✅ Giải Pháp Đã Áp Dụng

### 1. Cập Nhật Middleware
Đã sửa `middleware.ts` để allow `/api/mobile` routes:

```typescript
const publicRoutes = [
  '/login', 
  '/register', 
  '/api/auth',
  '/api/mobile', // ✅ Allow all mobile API routes
]
```

### 2. Middleware Matcher
Đã đảm bảo middleware không match API routes:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    // Don't match API routes - they should be handled by Next.js directly
  ],
}
```

## 🚀 Các Bước Khắc Phục

### Bước 1: Redeploy lên Cloud Run

Route `/api/mobile/auth/login` cần được deploy lên Cloud Run:

```bash
cd /Users/vietchung/phuocbuu
gcloud builds submit --config cloudbuild.yaml --project in360project
```

Hoặc dùng script deploy:
```bash
./deploy-phuocbuu-cloud-run.sh
```

### Bước 2: Đợi 2-3 phút

Sau khi deploy, đợi vài phút để Cloud Run service update.

### Bước 3: Test API Endpoint

```bash
curl -X POST https://phuocbuu-vglgngs3yq-as.a.run.app/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

**Expected Response** (nếu thành công):
```json
{
  "error": "Email hoặc mật khẩu không đúng"
}
```

**Nếu vẫn 403**: Cần kiểm tra Cloud Run IAM permissions.

### Bước 4: Kiểm Tra Cloud Run IAM

Đảm bảo service cho phép unauthenticated requests:

```bash
gcloud run services describe phuocbuu \
  --region asia-southeast1 \
  --project in360project \
  --format="value(spec.template.spec.containers[0].ports[0].containerPort)"
```

Nếu service yêu cầu authentication, cần update:

```bash
gcloud run services update phuocbuu \
  --region asia-southeast1 \
  --project in360project \
  --allow-unauthenticated
```

## 🧪 Test Local

Trước khi deploy, test local để đảm bảo route hoạt động:

### 1. Chạy Local Server

```bash
cd /Users/vietchung/phuocbuu
npm run dev
```

### 2. Test Local API

```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### 3. Update Mobile App Constants (Tạm thời)

Nếu local test OK, có thể test mobile app với local server:

```dart
// mobile_app/lib/utils/constants.dart
static const String baseUrl = 'http://localhost:3000'; // iOS Simulator
// static const String baseUrl = 'http://10.0.2.2:3000'; // Android Emulator
```

**Lưu ý**: 
- iOS Simulator: dùng `localhost`
- Android Emulator: dùng `10.0.2.2`

## 📊 Debug Checklist

- [ ] Middleware đã được update để allow `/api/mobile`
- [ ] Route `/api/mobile/auth/login/route.ts` tồn tại
- [ ] CORS headers đã được set trong API route
- [ ] Cloud Run service đã được redeploy
- [ ] Cloud Run service cho phép unauthenticated requests
- [ ] API endpoint trả về JSON (không phải HTML)
- [ ] Mobile app baseUrl đúng

## 🔧 Troubleshooting

### Nếu vẫn 403 sau khi deploy:

1. **Kiểm tra Cloud Run logs**:
```bash
gcloud run services logs read phuocbuu \
  --region asia-southeast1 \
  --project in360project \
  --limit 50
```

2. **Kiểm tra route có được build**:
```bash
# Trong Docker container
ls -la /app/app/api/mobile/auth/login/
```

3. **Test với Postman/Insomnia**:
- Verify request headers
- Check response format
- Verify CORS headers

### Nếu nhận HTML thay vì JSON:

- Server đang trả về error page
- Có thể là Next.js error page hoặc Cloud Run error
- Kiểm tra logs để xem lỗi gì

## 📝 Notes

- Middleware chỉ nên match `/dashboard/*` routes
- API routes (`/api/*`) nên được handle trực tiếp bởi Next.js
- Mobile API routes (`/api/mobile/*`) cần CORS headers
- Cloud Run cần được configure để allow unauthenticated requests

## ✅ Status

- [x] Middleware đã được fix
- [ ] Cần redeploy lên Cloud Run
- [ ] Cần verify API endpoint hoạt động
- [ ] Cần test mobile app sau khi deploy

