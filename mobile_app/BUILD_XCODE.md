# 🚀 Hướng dẫn Build iOS App với Xcode

## Bước 1: Chuẩn bị Environment

### 1.1. Set UTF-8 Encoding (Fix CocoaPods encoding error)

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Hoặc thêm vào `~/.zshrc`:
```bash
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc
```

### 1.2. Kiểm tra Flutter

```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter doctor
```

Đảm bảo:
- ✅ Flutter SDK đã cài đặt
- ✅ Xcode đã cài đặt
- ✅ iOS toolchain đã sẵn sàng

## Bước 2: Cài đặt CocoaPods Dependencies

```bash
cd /Users/vietchung/phuocbuu/mobile_app/ios
pod install --repo-update
```

Nếu gặp lỗi encoding, chạy:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
pod install --repo-update
```

## Bước 3: Mở Project trong Xcode

```bash
cd /Users/vietchung/phuocbuu/mobile_app
open ios/Runner.xcworkspace
```

**⚠️ QUAN TRỌNG**: Phải mở `.xcworkspace`, KHÔNG phải `.xcodeproj`

## Bước 4: Cấu hình trong Xcode

### 4.1. Chọn Project và Target

1. Trong Xcode Navigator (bên trái), chọn **Runner** (project root)
2. Chọn target **Runner** trong Targets list
3. Vào tab **General**

### 4.2. Cấu hình Signing & Capabilities

1. Vào tab **Signing & Capabilities**
2. **Team**: Chọn team của bạn (Team ID: `CGT5VR25M3`)
3. **Bundle Identifier**: `com.thptphuocbuu.edu.vn.social`
4. ✅ **Automatically manage signing**: Bật
5. Xcode sẽ tự động tạo provisioning profile

### 4.3. Cấu hình Build Settings (nếu cần)

1. Vào tab **Build Settings**
2. Tìm **iOS Deployment Target**: Đảm bảo là iOS 13.0 hoặc cao hơn
3. **Product Bundle Identifier**: `com.thptphuocbuu.edu.vn.social`

## Bước 5: Chọn Device/Simulator

### Option 1: iOS Simulator

1. Ở trên cùng Xcode, click vào device selector (bên cạnh Run button)
2. Chọn một iOS Simulator (ví dụ: iPhone 15 Pro, iPhone 14, etc.)
3. Nếu chưa có simulator, vào **Xcode > Settings > Platforms** để download

### Option 2: Physical Device

1. Kết nối iPhone/iPad qua USB
2. Trust computer trên device (nếu được hỏi)
3. Chọn device từ device selector trong Xcode
4. Có thể cần unlock device và trust developer certificate

## Bước 6: Build và Run

### Cách 1: Sử dụng Xcode UI

1. Nhấn **⌘R** (Command + R) hoặc click nút **Run** (▶️)
2. Xcode sẽ:
   - Build project
   - Install app lên device/simulator
   - Launch app

### Cách 2: Sử dụng Flutter CLI

```bash
cd /Users/vietchung/phuocbuu/mobile_app

# List available devices
flutter devices

# Run on iOS Simulator
flutter run -d ios

# Run on specific device
flutter run -d <device-id>
```

## Bước 7: Build cho Production (Archive)

### 7.1. Archive trong Xcode

1. Chọn **Product > Scheme > Runner** (nếu chưa chọn)
2. Chọn **Any iOS Device (arm64)** từ device selector
3. Vào **Product > Archive**
4. Đợi build và archive hoàn thành (có thể mất vài phút)

### 7.2. Distribute App

Sau khi archive xong:

1. **Organizer** window sẽ tự động mở
2. Chọn archive vừa tạo
3. Click **Distribute App**
4. Chọn distribution method:
   - **App Store Connect**: Upload lên App Store
   - **Ad Hoc**: Test trên devices cụ thể
   - **Enterprise**: Internal distribution
   - **Development**: Development build

### 7.3. Hoặc dùng Flutter CLI

```bash
cd /Users/vietchung/phuocbuu/mobile_app

# Build IPA file
flutter build ipa --release

# File sẽ được tạo tại:
# build/ios/ipa/phuocbuu_mobile.ipa
```

## Troubleshooting

### Lỗi: "No signing certificate found"

**Giải pháp**:
1. Vào **Xcode > Settings > Accounts**
2. Thêm Apple ID của bạn (nếu chưa có)
3. Click **Download Manual Profiles**
4. Trong project, chọn team trong **Signing & Capabilities**

### Lỗi: "Provisioning profile doesn't match"

**Giải pháp**:
1. Trong Xcode, vào **Signing & Capabilities**
2. Uncheck và check lại **Automatically manage signing**
3. Xcode sẽ tự động tạo profile mới

### Lỗi: "Pod install failed" hoặc encoding error

**Giải pháp**:
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd /Users/vietchung/phuocbuu/mobile_app/ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Lỗi: "Runner.entitlements not found"

**Giải pháp**:
Xcode sẽ tự động tạo file này. Nếu cần tạo thủ công:

1. Trong Xcode, right-click **Runner** folder
2. **New File > Property List**
3. Đặt tên: `Runner.entitlements`
4. Thêm vào target **Runner**

### Lỗi: "Flutter.framework not found"

**Giải pháp**:
```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter clean
flutter pub get
cd ios
pod install
```

### Lỗi: Build fails với "Undefined symbol"

**Giải pháp**:
```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter clean
flutter pub get
cd ios
rm -rf Pods Podfile.lock
pod install
```

## Quick Commands

```bash
# Setup
cd /Users/vietchung/phuocbuu/mobile_app
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Install pods
cd ios && pod install && cd ..

# Open in Xcode
open ios/Runner.xcworkspace

# Build with Flutter
flutter build ios --release

# Or build IPA
flutter build ipa --release
```

## Checklist

- [ ] Flutter đã cài đặt và hoạt động
- [ ] Xcode đã cài đặt (từ App Store)
- [ ] Apple Developer Account đã đăng nhập trong Xcode
- [ ] CocoaPods dependencies đã được cài đặt (`pod install`)
- [ ] Project đã được mở trong Xcode (`.xcworkspace`)
- [ ] Signing & Capabilities đã được cấu hình
- [ ] Device/Simulator đã được chọn
- [ ] Build thành công

## Lưu ý

1. **Luôn mở `.xcworkspace`**, không phải `.xcodeproj`
2. **Team ID**: `CGT5VR25M3`
3. **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
4. **iOS Deployment Target**: iOS 13.0+
5. Sau khi thay đổi code, có thể cần chạy `pod install` lại

## Các thay đổi mới nhất

App đã được cập nhật với:
- ✅ Theme system (light/dark mode)
- ✅ Cải thiện error handling cho login
- ✅ UI matching web app

Sau khi build, các tính năng này sẽ có trong app.

