# Mobile App Setup Guide

## Cấu Hình Đã Fix

### 1. Base URL đã được cập nhật
- **Old**: `https://phuocbuu-vglgngs3yq-as.a.run.app`
- **New**: `https://thptphuocbuu.edu.vn` (custom domain)

File: `lib/utils/constants.dart`

### 2. API Endpoints
Mobile app sử dụng các endpoint riêng:
- Login: `POST /api/mobile/auth/login`
- Get User Info: `GET /api/mobile/auth/me`
- Posts: `GET /api/mobile/posts`

### 3. Authentication Flow
1. User nhập email và password trong `LoginScreen`
2. `AuthService.login()` gửi request đến `/api/mobile/auth/login`
3. Server trả về:
   ```json
   {
     "success": true,
     "token": "JWT_TOKEN_HERE",
     "user": {
       "id": "user_id",
       "email": "email@example.com",
       "firstName": "Tên",
       "lastName": "Họ",
       "fullName": "Họ Tên",
       "role": "STUDENT",
       "avatar": "https://..."
     }
   }
   ```
4. Token được lưu vào `SecureStorage`
5. Token được gửi kèm trong header: `Authorization: Bearer <token>`

## Build & Run

### Android
```bash
cd mobile_app
flutter pub get
flutter run
```

### iOS
```bash
cd mobile_app
flutter pub get
cd ios
pod install
cd ..
flutter run
```

### Build Release
```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## Debug Login Issues

Nếu login không hoạt động, check log console:
1. `[API] POST https://thptphuocbuu.edu.vn/api/mobile/auth/login`
2. `[API] Response status: XXX`
3. `[AuthService] Response data: ...`

### Common Issues & Fixes

#### 1. SocketException / Timeout
- **Nguyên nhân**: Không kết nối được server
- **Fix**:
  - Kiểm tra internet
  - Kiểm tra URL trong `constants.dart`
  - Kiểm tra firewall/VPN

#### 2. HTML Response Instead of JSON
- **Nguyên nhân**: Server trả về error page HTML
- **Fix**:
  - Check server có đang chạy không
  - Check URL có đúng không
  - Check CORS headers

#### 3. Empty Response
- **Nguyên nhân**: Server không phản hồi
- **Fix**: Check server logs

#### 4. Status 401
- **Nguyên nhân**: Email/password sai
- **Fix**: Kiểm tra thông tin đăng nhập

#### 5. Status 403
- **Nguyên nhân**: Tài khoản bị tạm dừng
- **Fix**: Check user status trong database

## Server Requirements

Server phải có:
1. CORS headers cho mobile:
   ```typescript
   'Access-Control-Allow-Origin': '*'
   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
   'Access-Control-Allow-Headers': 'Content-Type, Authorization'
   ```

2. JWT authentication:
   - Secret key: `NEXTAUTH_SECRET` hoặc `JWT_SECRET`
   - Expiry: 30 days
   - Payload: `{ id, email, role }`

3. Mobile auth endpoints:
   - `/api/mobile/auth/login` - POST
   - `/api/mobile/auth/me` - GET
   - `/api/mobile/posts` - GET

## Testing

### Test Login API từ Terminal
```bash
curl -X POST https://thptphuocbuu.edu.vn/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Expected Response
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "xxx",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "fullName": "Test User",
    "role": "STUDENT",
    "avatar": null
  }
}
```

## Deployment Notes

### Android
1. Update `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

2. Add network security config if needed:
   ```xml
   android:usesCleartextTraffic="true"
   ```

### iOS
1. Update `ios/Runner/Info.plist`:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsArbitraryLoads</key>
     <true/>
   </dict>
   ```

## Environment Switcher (Optional)

Để switch giữa dev và production, bạn có thể thêm:

```dart
// lib/utils/env.dart
enum Environment { dev, prod }

class Env {
  static Environment current = Environment.prod;

  static String get baseUrl {
    switch (current) {
      case Environment.dev:
        return 'http://localhost:3000';
      case Environment.prod:
        return 'https://thptphuocbuu.edu.vn';
    }
  }
}
```

Sau đó update `constants.dart`:
```dart
static String get baseUrl => Env.baseUrl;
```
