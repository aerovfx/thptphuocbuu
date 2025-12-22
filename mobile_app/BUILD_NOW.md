# 🚀 Build App với Xcode - Hướng Dẫn Nhanh

## Đã Thực Hiện

✅ Đã mở Xcode workspace  
✅ Đã clean Flutter project  
✅ Đã get dependencies  

## Các Bước Tiếp Theo Trong Xcode

### 1. Kiểm tra Signing & Capabilities

1. Trong Xcode, chọn project **"Runner"** ở sidebar trái
2. Chọn target **"Runner"**
3. Tab **"Signing & Capabilities"**
4. ✅ Check **"Automatically manage signing"**
5. Chọn **Team** của bạn (Apple Developer Account)
6. Kiểm tra Bundle Identifier: `com.thptphuocbuu.edu.vn.social` ✅

### 2. Chọn Device

- Ở toolbar trên cùng, chọn **"Any iOS Device (arm64)"** hoặc **"Generic iOS Device"**
- ❌ **KHÔNG** chọn simulator (iPhone 15 Pro, etc.)

### 3. Clean Build Folder (Nếu cần)

- Menu: **Product** → **Clean Build Folder** (hoặc `Shift + Cmd + K`)
- Đợi clean hoàn tất

### 4. Build Archive

1. Menu: **Product** → **Archive**
2. Đợi build hoàn tất (có thể mất 5-10 phút)
3. Window **"Organizer"** sẽ tự động mở khi build xong

### 5. Validate Archive (Khuyến nghị)

1. Trong Organizer, chọn archive vừa tạo
2. Click **"Validate App"**
3. Chọn distribution method: **"App Store Connect"**
4. Điền thông tin và validate
5. Sửa lỗi nếu có

### 6. Distribute App

1. Trong Organizer, chọn archive
2. Click **"Distribute App"**
3. Chọn **"App Store Connect"**
4. Click **"Next"**
5. Chọn **"Upload"** (không phải Export)
6. Click **"Next"**
7. Chọn **"Automatically manage signing"**
8. Click **"Next"**
9. Review thông tin
10. Click **"Upload"**

### 7. Đợi Upload Hoàn Tất

- Upload có thể mất 10-30 phút tùy kích thước app
- Kiểm tra progress trong Organizer
- Khi upload xong, sẽ hiển thị "Upload Successful"

## Lưu Ý Quan Trọng

⚠️ **Device**: Phải chọn "Any iOS Device", không chọn simulator

⚠️ **Signing**: Phải có Apple Developer Account và Team đã được chọn

⚠️ **Version**: Kiểm tra version trong `pubspec.yaml` là `1.0.0+1`

⚠️ **Bundle ID**: Phải khớp với App Store Connect: `com.thptphuocbuu.edu.vn.social`

## Nếu Gặp Lỗi

### Lỗi Code Signing
- Kiểm tra Team đã chọn đúng chưa
- Xóa và chọn lại Team
- Clean Build Folder và thử lại

### Lỗi Build Failed
- Clean Build Folder: `Shift + Cmd + K`
- Xóa Derived Data:
  - Menu: **Xcode** → **Preferences** → **Locations**
  - Click mũi tên bên cạnh Derived Data path
  - Xóa thư mục `DerivedData`
- Chạy `pod install` trong terminal:
  ```bash
  cd /Users/vietchung/phuocbuu/mobile_app/ios
  pod install
  ```

### Lỗi Upload Failed
- Kiểm tra kết nối internet
- Thử lại sau vài phút
- Kiểm tra logs trong Organizer

## Sau Khi Upload Thành Công

1. Đăng nhập App Store Connect: https://appstoreconnect.apple.com
2. Vào **My Apps** → **PhuocBuu**
3. Tab **"App Store"** hoặc **"TestFlight"**
4. Đợi build được process (10-30 phút)
5. Khi build sẵn sàng, sẽ hiển thị trong danh sách
6. Chọn build và submit for review

## Thông Tin App

- **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
- **Apple ID**: 6756784269
- **SKU**: phuocbuuapp
- **App Name**: phuocbuuapp
- **Version**: 1.0.0+1
- **Subtitle**: "Ứng dụng mạng xã hội trường học"

