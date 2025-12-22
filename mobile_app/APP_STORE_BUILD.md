# Hướng Dẫn Build và Submit App lên App Store

## Thông Tin App

- **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
- **Apple ID**: 6756784269
- **SKU**: phuocbuuapp
- **App Name**: phuocbuuapp
- **Primary Language**: Vietnamese

## Bước 1: Chuẩn Bị

### 1.1. Cập nhật Version Number

Trong `pubspec.yaml`, đảm bảo version đúng:
```yaml
version: 1.0.0+1
```
- `1.0.0` = Version hiển thị trên App Store
- `1` = Build number (tăng mỗi lần submit)

### 1.2. Kiểm tra Bundle ID

Đảm bảo Bundle ID trong Xcode khớp với App Store Connect:
- Mở Xcode: `mobile_app/ios/Runner.xcworkspace`
- Chọn target "Runner"
- Tab "Signing & Capabilities"
- Bundle Identifier: `com.thptphuocbuu.edu.vn.social`

## Bước 2: Mở Xcode và Cấu Hình

### 2.1. Mở Project

```bash
cd /Users/vietchung/phuocbuu/mobile_app
open ios/Runner.xcworkspace
```

**Lưu ý**: Phải mở `.xcworkspace`, KHÔNG phải `.xcodeproj`

### 2.2. Cấu Hình Signing

1. Trong Xcode, chọn project "Runner" ở sidebar trái
2. Chọn target "Runner"
3. Tab **"Signing & Capabilities"**
4. Chọn **"Automatically manage signing"**
5. Chọn **Team** của bạn (Apple Developer Account)
6. Xcode sẽ tự động tạo Provisioning Profile

### 2.3. Cấu Hình Build Settings

1. Tab **"Build Settings"**
2. Tìm **"Code Signing Identity"**
   - Debug: `Apple Development`
   - Release: `Apple Distribution`
3. Tìm **"Provisioning Profile"**
   - Để Xcode tự động chọn

## Bước 3: Build Archive

### 3.1. Chọn Device

- Trong Xcode, chọn **"Any iOS Device (arm64)"** hoặc **"Generic iOS Device"**
- KHÔNG chọn simulator

### 3.2. Tạo Archive

1. Menu: **Product** → **Archive**
2. Đợi build hoàn tất (có thể mất 5-10 phút)
3. Window "Organizer" sẽ tự động mở

### 3.3. Validate Archive (Tùy chọn)

1. Trong Organizer, chọn archive vừa tạo
2. Click **"Validate App"**
3. Chọn distribution method: **"App Store Connect"**
4. Điền thông tin và validate

## Bước 4: Upload lên App Store Connect

### 4.1. Distribute App

1. Trong Organizer, chọn archive
2. Click **"Distribute App"**
3. Chọn **"App Store Connect"**
4. Click **"Next"**

### 4.2. Distribution Options

1. Chọn **"Upload"** (không phải Export)
2. Click **"Next"**
3. Chọn **"Automatically manage signing"**
4. Click **"Next"**
5. Review thông tin
6. Click **"Upload"**

### 4.3. Đợi Upload Hoàn Tất

- Upload có thể mất 10-30 phút tùy kích thước app
- Kiểm tra progress trong Organizer

## Bước 5: Hoàn Tất trên App Store Connect

### 5.1. Đăng nhập App Store Connect

1. Truy cập: https://appstoreconnect.apple.com
2. Đăng nhập với Apple ID của bạn

### 5.2. Tạo App (Nếu chưa có)

1. Vào **"My Apps"**
2. Click **"+"** → **"New App"**
3. Điền thông tin:
   - **Platform**: iOS
   - **Name**: PhuocBuu
   - **Primary Language**: Vietnamese
   - **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
   - **SKU**: `thptphuocbuu`
4. Click **"Create"**

### 5.3. Chờ Build Processing

1. Vào tab **"TestFlight"** hoặc **"App Store"**
2. Chờ build được process (thường 10-30 phút)
3. Khi build sẵn sàng, sẽ hiển thị trong danh sách

### 5.4. Cấu Hình App Information

1. Tab **"App Information"**
   - Category: Chọn category phù hợp
   - Content Rights: Đã set up
   - License Agreement: Apple's Standard License Agreement

2. Tab **"Pricing and Availability"**
   - Chọn giá (hoặc Free)
   - Chọn countries/regions

3. Tab **"App Privacy"**
   - Điền Privacy Policy URL (nếu có)
   - Khai báo data collection practices

### 5.5. Tạo Version và Submit

1. Tab **"App Store"**
2. Click **"+"** để tạo version mới (ví dụ: 1.0.0)
3. Điền thông tin:
   - **What's New in This Version**: Mô tả các tính năng mới
   - **Description**: Mô tả app
   - **Keywords**: Từ khóa tìm kiếm
   - **Support URL**: URL hỗ trợ
   - **Marketing URL**: URL marketing (nếu có)
   - **Privacy Policy URL**: URL privacy policy

4. Upload **Screenshots**:
   - iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
   - iPhone 6.5" (iPhone 11 Pro Max, XS Max)
   - iPhone 5.5" (iPhone 8 Plus)
   - iPad Pro 12.9" (nếu hỗ trợ iPad)

5. Upload **App Icon** (1024x1024px)

6. Chọn build từ dropdown

7. Click **"Submit for Review"**

## Bước 6: Review Process

- Apple thường review trong 24-48 giờ
- Có thể bị reject nếu:
  - Thiếu privacy policy
  - App không hoạt động đúng
  - Vi phạm App Store Guidelines
  - Thiếu thông tin bắt buộc

## Troubleshooting

### Lỗi Code Signing

- Đảm bảo đã đăng nhập đúng Apple ID trong Xcode
- Kiểm tra Team đã được chọn
- Xóa và tạo lại Provisioning Profile

### Lỗi Upload

- Kiểm tra kết nối internet
- Thử lại sau vài phút
- Kiểm tra logs trong Organizer

### Build Failed

- Clean build folder: **Product** → **Clean Build Folder** (Shift+Cmd+K)
- Xóa Derived Data
- Chạy `pod install` lại trong terminal

## Script Tự Động (Tùy chọn)

Có thể sử dụng command line để build và upload:

```bash
# Build Flutter app
cd /Users/vietchung/phuocbuu/mobile_app
flutter build ipa --release

# Upload lên App Store Connect (cần cài fastlane)
fastlane deliver
```

## Lưu Ý Quan Trọng

1. **Version Number**: Mỗi lần submit phải tăng build number
2. **Bundle ID**: Phải khớp chính xác với App Store Connect
3. **Signing**: Phải có Apple Developer Account ($99/năm)
4. **Privacy Policy**: Bắt buộc nếu app thu thập dữ liệu
5. **TestFlight**: Có thể test trước khi submit lên App Store

## Liên Kết Hữu Ích

- [App Store Connect](https://appstoreconnect.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

