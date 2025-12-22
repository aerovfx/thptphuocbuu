# iOS Setup Guide

## ✅ Đã Cấu Hình

- ✅ Bundle ID: `com.thptphuocbuu.edu.vn.social`
- ✅ App ID Prefix: `CGT5VR25M3` (Team ID)
- ✅ Display Name: `PhuocBuu`
- ✅ iOS Platform: iOS 13.0+

## 📋 Yêu Cầu

1. **Xcode**: Cài đặt từ App Store (yêu cầu macOS)
2. **Apple Developer Account**: Đã có với Team ID `CGT5VR25M3`
3. **CocoaPods**: Sẽ được cài đặt tự động khi chạy `pod install`

## 🚀 Setup Steps

### 1. Cài đặt CocoaPods Dependencies

```bash
cd mobile_app/ios
pod install
cd ../..
```

### 2. Mở Project trong Xcode

```bash
cd mobile_app
open ios/Runner.xcworkspace
```

**Lưu ý**: Phải mở `.xcworkspace`, không phải `.xcodeproj`

### 3. Cấu Hình Signing & Capabilities trong Xcode

1. Chọn project **Runner** trong Navigator
2. Chọn target **Runner**
3. Vào tab **Signing & Capabilities**
4. Chọn **Team**: Chọn team của bạn (Team ID: CGT5VR25M3)
5. **Bundle Identifier**: Đã được set là `com.thptphuocbuu.edu.vn.social`
6. Xcode sẽ tự động tạo/update provisioning profile

### 4. Chạy App trên iOS Simulator

```bash
cd mobile_app
flutter run -d ios
```

Hoặc chọn simulator trong Xcode và nhấn Run (⌘R)

### 5. Chạy App trên Physical Device

1. Kết nối iPhone/iPad qua USB
2. Trust computer trên device
3. Trong Xcode, chọn device từ dropdown
4. Chạy `flutter run` hoặc nhấn Run trong Xcode

## 🔐 Code Signing

App đã được cấu hình với:
- **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
- **Team ID**: `CGT5VR25M3`

Xcode sẽ tự động:
- Tạo Development provisioning profile
- Tạo App ID nếu chưa có
- Cấu hình code signing

## 📱 Build cho Production

### Archive và Upload lên App Store

1. Trong Xcode, chọn **Product > Archive**
2. Sau khi archive xong, **Distribute App**
3. Chọn **App Store Connect**
4. Follow wizard để upload

### Hoặc dùng Flutter command:

```bash
flutter build ipa --release
```

File `.ipa` sẽ được tạo trong `build/ios/ipa/`

## 🛠️ Troubleshooting

### Lỗi "No signing certificate found"
- Đảm bảo đã đăng nhập Apple ID trong Xcode
- Vào **Xcode > Settings > Accounts** và thêm Apple ID
- Chọn team trong Signing & Capabilities

### Lỗi "Provisioning profile doesn't match"
- Xóa provisioning profile cũ trong Xcode
- Chọn **Automatically manage signing** trong Xcode
- Xcode sẽ tự động tạo profile mới

### Lỗi "Pod install failed"
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Lỗi "Runner.entitlements"
- Xcode sẽ tự động tạo file này khi cần
- Nếu thiếu, tạo file `ios/Runner/Runner.entitlements` với nội dung:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
```

## 📝 Notes

- **Development**: Có thể chạy trên simulator hoặc device với development certificate
- **Production**: Cần App Store provisioning profile để upload lên App Store
- **TestFlight**: Có thể test app trước khi release bằng TestFlight

## 🔗 Resources

- [Flutter iOS Setup](https://docs.flutter.dev/deployment/ios)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)

