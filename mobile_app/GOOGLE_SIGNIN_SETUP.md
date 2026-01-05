# Google Sign-In và Đăng Ký - Mobile App Setup

## ✅ Hoàn Thành

Đã thêm Google Sign-In authentication và màn hình đăng ký cho mobile app Flutter.

## 📱 Tính Năng Mới

### 1. Google Sign-In
- Đăng nhập bằng tài khoản Google
- Tự động tạo tài khoản mới khi đăng nhập lần đầu
- Tích hợp với backend OAuth API

### 2. Màn Hình Đăng Ký
- Form đăng ký tài khoản mới
- Validation đầy đủ
- Chọn vai trò (Học sinh/Giáo viên/Phụ huynh)
- Chọn ngày sinh (optional)

## 🔧 Cấu Hình

### iOS Configuration
File: `ios/Runner/Info.plist`

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.1069154179448-b0ffktmf1ugmufv2q7521aq1d1ikv8fi</string>
        </array>
    </dict>
</array>
```

### Google OAuth Client ID
- **iOS Client ID**: `1069154179448-b0ffktmf1ugmufv2q7521aq1d1ikv8fi.apps.googleusercontent.com`
- **Reversed Client ID** (URL Scheme): `com.googleusercontent.apps.1069154179448-b0ffktmf1ugmufv2q7521aq1d1ikv8fi`

## 📂 Files Đã Tạo/Sửa

### Mobile App

#### Tạo Mới:
1. **`lib/screens/auth/register_screen.dart`**
   - Màn hình đăng ký tài khoản mới
   - Form với các trường: Họ, Tên, Email, Password, Ngày sinh, Vai trò
   - Navigation về login screen sau khi đăng ký thành công

2. **`MOBILE_APP_SETUP.md`**
   - Hướng dẫn setup và troubleshooting mobile app

3. **`GOOGLE_SIGNIN_SETUP.md`** (file này)
   - Hướng dẫn Google Sign-In configuration

#### Cập Nhật:
1. **`lib/services/auth_service.dart`**
   - Thêm method `register()` để đăng ký tài khoản mới
   - Thêm method `signInWithGoogle()` để đăng nhập Google
   - Google Sign-In instance với iOS client ID

2. **`lib/screens/auth/login_screen.dart`**
   - Thêm nút "Đăng nhập với Google"
   - Thêm link "Đăng ký ngay" để navigate đến register screen
   - Loading state cho Google Sign-In

3. **`pubspec.yaml`**
   - Thêm dependency: `google_sign_in: ^6.2.1`

4. **`ios/Runner/Info.plist`**
   - Thêm CFBundleURLTypes cho Google OAuth URL scheme

### Backend API

#### Tạo Mới:
1. **`app/api/mobile/auth/google/route.ts`**
   - Endpoint xử lý Google OAuth cho mobile app
   - Verify Google ID token
   - Tự động tạo user mới hoặc login user đã tồn tại
   - Return JWT token cho mobile app
   - Email domain whitelist: `thptphuocbuu.edu.vn`, `gmail.com`

## 🚀 Cách Sử Dụng

### Build và Run App

```bash
# Install dependencies
cd mobile_app
flutter pub get

# Run on iOS
flutter run -d ios

# Build for iOS
flutter build ios --release
```

### Testing Google Sign-In

1. Mở app trên iOS device/simulator
2. Tap nút "Đăng nhập với Google"
3. Chọn tài khoản Google
4. App sẽ tự động:
   - Verify token với Google
   - Gửi token đến backend
   - Backend verify và tạo user mới (nếu chưa có)
   - Return JWT token
   - Save token và navigate đến home screen

### Testing Registration

1. Tap "Đăng ký ngay" ở login screen
2. Điền form:
   - Họ và Tên
   - Email (phải unique)
   - Password (≥ 6 ký tự)
   - Xác nhận password
   - Ngày sinh (optional)
   - Vai trò (Student/Teacher/Parent)
3. Tap "Đăng ký"
4. Nếu thành công, navigate về login screen

## 🔐 Security

### Email Domain Whitelist
Backend chỉ cho phép đăng ký từ các domain:
- `thptphuocbuu.edu.vn`
- `gmail.com`

### Token Verification
- Google ID token được verify bởi `google-auth-library`
- JWT token cho mobile app có expiry: 30 days

### User Status
- Suspended users không thể login (cả credentials và OAuth)

## 🌐 API Endpoints

### POST `/api/mobile/auth/google`
Xử lý Google OAuth login cho mobile app

**Request Body:**
```json
{
  "idToken": "Google ID token",
  "email": "user@gmail.com",
  "displayName": "User Name",
  "photoUrl": "https://..."
}
```

**Success Response:**
```json
{
  "success": true,
  "token": "JWT token",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "firstName": "User",
    "lastName": "Name",
    "fullName": "User Name",
    "role": "STUDENT",
    "avatar": "https://..."
  }
}
```

### POST `/api/auth/register`
Đăng ký tài khoản mới (dùng chung web và mobile)

**Request Body:**
```json
{
  "email": "user@gmail.com",
  "password": "password123",
  "firstName": "User",
  "lastName": "Name",
  "dateOfBirth": "2000-01-01",
  "role": "STUDENT"
}
```

**Success Response:**
```json
{
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.",
  "userId": "user_id"
}
```

## 📝 Environment Variables

Backend cần các environment variables:
```env
GOOGLE_CLIENT_ID=1069154179448-b0ffktmf1ugmufv2q7521aq1d1ikv8fi.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🎨 UI/UX

### Login Screen
- Email/Password fields
- "Đăng nhập" button
- Divider với text "Hoặc"
- "Đăng nhập với Google" button (với Google logo)
- "Đăng ký ngay" link

### Register Screen
- Họ và Tên (2 fields cạnh nhau)
- Email
- Password với toggle visibility
- Confirm Password với toggle visibility
- Date picker cho ngày sinh
- Dropdown cho vai trò
- "Đăng ký" button
- "Đăng nhập" link

## ⚠️ Lưu Ý

1. **iOS URL Scheme**: Phải match với reversed client ID từ Google Console
2. **CocoaPods**: Chạy `pod install` sau khi thêm google_sign_in package
3. **Build**: Có thể cần clean build folder nếu gặp lỗi
   ```bash
   flutter clean
   flutter pub get
   cd ios && pod install
   ```

## 🔍 Debugging

### Google Sign-In Logs
Check console logs:
- `[AuthService] Attempting Google Sign-In`
- `[AuthService] Google Sign-In successful: email@gmail.com`
- `[AuthService] Got Google ID token, sending to server`
- `[AuthService] Server response: 200`

### Common Issues

1. **"Không lấy được thông tin từ Google"**
   - Check iOS client ID configuration
   - Verify URL scheme in Info.plist

2. **"Xác thực Google thất bại"**
   - Check backend Google client ID
   - Verify token expiry

3. **"Email không được phép đăng ký"**
   - Email domain not in whitelist
   - Update whitelist trong `/api/mobile/auth/google/route.ts`

## ✅ Testing Checklist

- [ ] Google Sign-In với tài khoản mới (tạo user mới)
- [ ] Google Sign-In với tài khoản đã có (login existing user)
- [ ] Register với credentials
- [ ] Error handling: Email đã tồn tại
- [ ] Error handling: Password quá ngắn
- [ ] Error handling: Password không khớp
- [ ] Navigation giữa Login và Register screens
- [ ] Token persistence sau khi login
- [ ] Logout và login lại

## 📦 Dependencies

```yaml
dependencies:
  google_sign_in: ^6.2.1
  http: ^1.1.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
```

## 🚀 Deployment

Code đã được deploy lên Cloud Run tại: `https://thptphuocbuu.edu.vn`

API endpoints:
- Google OAuth: `https://thptphuocbuu.edu.vn/api/mobile/auth/google`
- Register: `https://thptphuocbuu.edu.vn/api/auth/register`
- Login: `https://thptphuocbuu.edu.vn/api/mobile/auth/login`

## 📞 Support

Nếu gặp vấn đề, check:
1. Console logs trong Xcode
2. Backend logs trong Cloud Run
3. Google OAuth configuration trong Google Console
