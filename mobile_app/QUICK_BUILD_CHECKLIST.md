# ✅ Checklist Build App Store - Quick Guide

## Trong Xcode (Đã mở)

### 1. Kiểm tra Signing ✅
- [ ] Chọn project "Runner" ở sidebar
- [ ] Chọn target "Runner" 
- [ ] Tab **"Signing & Capabilities"**
- [ ] ✅ Check **"Automatically manage signing"**
- [ ] Chọn **Team** của bạn (Apple Developer Account)
- [ ] Bundle ID: `com.thptphuocbuu.edu.vn.social` ✅ (đã đúng)

### 2. Chọn Device ✅
- [ ] Ở toolbar trên, chọn **"Any iOS Device (arm64)"** hoặc **"Generic iOS Device"**
- [ ] ❌ KHÔNG chọn simulator

### 3. Build Archive 🚀
- [ ] Menu: **Product** → **Archive**
- [ ] Đợi build (5-10 phút)
- [ ] Window "Organizer" sẽ tự động mở

### 4. Distribute App 📤
- [ ] Trong Organizer, chọn archive vừa tạo
- [ ] Click **"Distribute App"**
- [ ] Chọn **"App Store Connect"**
- [ ] Click **"Next"**
- [ ] Chọn **"Upload"**
- [ ] Click **"Next"**
- [ ] Chọn **"Automatically manage signing"**
- [ ] Click **"Next"**
- [ ] Review → Click **"Upload"**

### 5. Đợi Upload ⏳
- [ ] Upload có thể mất 10-30 phút
- [ ] Kiểm tra progress trong Organizer

## Trên App Store Connect

### 6. Tạo App (Nếu chưa có)
- [ ] Đăng nhập: https://appstoreconnect.apple.com
- [ ] **My Apps** → **"+"** → **New App**
- [ ] Điền:
  - Platform: **iOS**
  - Name: **PhuocBuu**
  - Primary Language: **Vietnamese**
  - Bundle ID: **com.thptphuocbuu.edu.vn.social**
  - SKU: **thptphuocbuu**

### 7. Chờ Build Processing
- [ ] Vào tab **"App Store"** hoặc **"TestFlight"**
- [ ] Đợi build được process (10-30 phút)

### 8. Cấu Hình App Information
- [ ] **App Information**: Category, Content Rights ✅
- [ ] **Pricing**: Chọn Free hoặc giá
- [ ] **App Privacy**: Privacy Policy URL (nếu có)

### 9. Tạo Version và Submit
- [ ] Tab **"App Store"** → **"+"** tạo version 1.0.0
- [ ] Điền:
  - What's New
  - Description
  - Keywords
  - Support URL
  - Privacy Policy URL
- [ ] Upload **Screenshots** (bắt buộc)
- [ ] Upload **App Icon** 1024x1024px
- [ ] Chọn build từ dropdown
- [ ] **Submit for Review** ✅

## Lưu Ý

⚠️ **Version Number**: Mỗi lần submit phải tăng build number trong `pubspec.yaml`

⚠️ **Privacy Policy**: Bắt buộc nếu app thu thập dữ liệu

⚠️ **Screenshots**: Cần ít nhất 1 set screenshots cho iPhone

## Nếu Gặp Lỗi

### Code Signing Error
- Kiểm tra Team đã chọn đúng chưa
- Xóa Derived Data: **Product** → **Clean Build Folder** (Shift+Cmd+K)

### Upload Failed
- Thử lại sau vài phút
- Kiểm tra kết nối internet
- Xem logs trong Organizer

## Thông Tin App

- **Bundle ID**: `com.thptphuocbuu.edu.vn.social` ✅
- **Apple ID**: 6756784269
- **SKU**: phuocbuuapp
- **App Name**: phuocbuuapp

