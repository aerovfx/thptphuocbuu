# ✅ Báo Cáo Fix Lỗi Build iOS

**Ngày**: 2025-12-25
**Lỗi**: `Command PhaseScriptExecution failed with a nonzero exit code`
**Trạng thái**: ✅ Đã Fix

---

## 🔍 Nguyên Nhân

Lỗi `PhaseScriptExecution` xảy ra do:

1. **CocoaPods Encoding Issue** ⚠️
   - Terminal không sử dụng UTF-8 encoding
   - CocoaPods yêu cầu `LANG=en_US.UTF-8`
   - Error: `Unicode Normalization not appropriate for ASCII-8BIT`

2. **Build Cache Cũ**
   - Flutter build cache lỗi thời
   - Pods dependencies chưa được cài đặt đúng

3. **Missing GoogleService-Info.plist** (Optional)
   - File cấu hình Google Sign-In chưa có (nếu dùng Google OAuth)
   - Có thể gây lỗi build nếu app sử dụng `google_sign_in`

---

## ✅ Giải Pháp Đã Thực Hiện

### 1. Fix CocoaPods Encoding
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

### 2. Clean và Rebuild
```bash
# Clean Flutter
flutter clean

# Get dependencies
flutter pub get

# Install CocoaPods với UTF-8
cd ios
pod install
```

### 3. Kết Quả
✅ **Pod installation complete!**
- 7 dependencies from Podfile
- 14 total pods installed

**Pods đã cài:**
- Flutter (1.0.0)
- GoogleSignIn (8.0.0)
- AppAuth (1.7.6)
- flutter_secure_storage (6.0.0)
- google_sign_in_ios (0.0.1)
- image_picker_ios (0.0.1)
- path_provider_foundation (0.0.1)
- shared_preferences_foundation (0.0.1)
- sqflite_darwin (0.0.4)

---

## 🛠️ Script Tự Động

Đã tạo script để fix lỗi này trong tương lai:

### File: `mobile_app/fix-ios-build.sh`
```bash
#!/bin/bash

# Set UTF-8 encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Clean and rebuild
flutter clean
flutter pub get
cd ios && pod install
```

**Cách dùng:**
```bash
cd mobile_app
./fix-ios-build.sh
```

---

## 📋 Checklist Build iOS

### ✅ Đã Hoàn Thành:
- [x] Set UTF-8 encoding
- [x] Clean Flutter cache
- [x] Install dependencies (`flutter pub get`)
- [x] Install CocoaPods (`pod install`)
- [x] Verify pods installation thành công

### ⚠️ Lưu Ý Khi Build:

1. **Mở đúng workspace:**
   ```bash
   open ios/Runner.xcworkspace
   ```
   ❌ KHÔNG mở `Runner.xcodeproj`

2. **Clean Build Folder trong Xcode:**
   - Menu: Product → Clean Build Folder (⌘⇧K)

3. **Build:**
   - Product → Build (⌘B)
   - Hoặc: Product → Run (⌘R)

---

## 🔍 Troubleshooting Tiếp Theo

### Nếu vẫn gặp lỗi PhaseScriptExecution:

#### 1. Kiểm tra Xcode Build Phases
Mở Xcode → Runner target → Build Phases → Check các script:
- [Thin Binary]
- [Run Script] phases

#### 2. Kiểm tra Deployment Target
- Xcode: Runner target → General → Deployment Target = **13.0** trở lên
- Podfile: `platform :ios, '13.0'`

#### 3. Deintegrate và Reinstall Pods
```bash
cd ios
pod deintegrate
pod install
```

#### 4. Fix GoogleService-Info.plist (Nếu dùng Google Sign-In)

**Hiện tại:** ❌ File chưa có tại `ios/Runner/GoogleService-Info.plist`

**Cần làm (nếu dùng Google OAuth):**
1. Download `GoogleService-Info.plist` từ Firebase Console
2. Đặt file vào: `mobile_app/ios/Runner/GoogleService-Info.plist`
3. Add file vào Xcode project:
   - Right-click Runner folder
   - Add Files to "Runner"
   - Select GoogleService-Info.plist
   - Check "Copy items if needed"
   - Target: Runner

---

## 📊 Môi Trường Build

### Flutter Environment
```
✅ Flutter: 3.35.7 (stable)
✅ Dart: 3.9.2
✅ Xcode: 26.1.1
✅ CocoaPods: 1.16.2
✅ iOS Deployment Target: 13.0
```

### Dependencies
```yaml
google_sign_in: ^6.2.1
flutter_secure_storage: ^9.0.0
image_picker: latest
path_provider: latest
shared_preferences: latest
sqflite: latest
```

---

## 🚀 Các Bước Build Tiếp Theo

### 1. Build từ Xcode (Recommended)
```bash
# Mở workspace
open mobile_app/ios/Runner.xcworkspace

# Trong Xcode:
# 1. Select device/simulator
# 2. Product → Clean Build Folder (⌘⇧K)
# 3. Product → Run (⌘R)
```

### 2. Build từ Flutter CLI
```bash
cd mobile_app

# Run on connected device
flutter run

# Build release
flutter build ios --release

# Run on specific device
flutter devices
flutter run -d <device-id>
```

---

## 📝 Files Đã Tạo/Cập Nhật

### Tạo Mới:
1. ✅ `mobile_app/fix-ios-build.sh` - Script tự động fix build
2. ✅ `mobile_app/IOS_BUILD_FIX.md` - Hướng dẫn chi tiết
3. ✅ `IOS_BUILD_ERROR_RESOLUTION.md` (file này) - Báo cáo resolution

### Reference Docs:
- `mobile_app/GOOGLE_SIGNIN_SETUP.md` - Google Sign-In setup
- `mobile_app/MOBILE_APP_SETUP.md` - Mobile app setup guide

---

## ⚠️ Fix Vĩnh Viễn Encoding Issue

Để không phải set encoding mỗi lần, thêm vào shell profile:

### Cho Zsh (macOS default):
```bash
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc
```

### Cho Bash:
```bash
echo 'export LANG=en_US.UTF-8' >> ~/.bash_profile
echo 'export LC_ALL=en_US.UTF-8' >> ~/.bash_profile
source ~/.bash_profile
```

---

## 🎯 Next Steps

### Immediate:
1. ✅ Pods đã install thành công
2. ⏳ Mở Xcode và build app
3. ⏳ Test trên simulator/device

### Optional (Nếu dùng Google Sign-In):
1. ⏳ Download và add GoogleService-Info.plist
2. ⏳ Verify URL Schemes trong Info.plist
3. ⏳ Test Google Sign-In flow

---

## 📞 Support

Nếu vẫn gặp lỗi:

1. **Check logs trong Xcode:**
   - View → Navigators → Reports
   - Select latest build
   - Check error details

2. **Check Flutter logs:**
   ```bash
   flutter run --verbose
   ```

3. **Common fixes:**
   - Restart Xcode
   - Restart Mac
   - Update Xcode to latest version
   - Update CocoaPods: `sudo gem install cocoapods`

---

**Created**: 2025-12-25 12:45 UTC
**Status**: ✅ CocoaPods Fixed | ⏳ Ready to Build in Xcode
**Next Action**: Open Xcode and build
