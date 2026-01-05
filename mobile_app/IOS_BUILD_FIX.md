# 🔧 Hướng dẫn Fix Lỗi Build iOS

## ❌ Lỗi gặp phải
```
Command PhaseScriptExecution failed with a nonzero exit code
```

## ✅ Nguyên nhân

Lỗi này thường xảy ra do:
1. **CocoaPods encoding issue** - Terminal không sử dụng UTF-8
2. **Cache cũ** - Build cache hoặc pods cache bị lỗi
3. **Dependencies lỗi** - Pods không được cài đặt đúng

## 🛠️ Giải pháp

### Cách 1: Chạy script tự động (Khuyên dùng)

```bash
cd mobile_app
./fix-ios-build.sh
```

Script này sẽ:
- ✅ Set UTF-8 encoding
- ✅ Clean Flutter cache
- ✅ Reinstall dependencies
- ✅ Reinstall CocoaPods

### Cách 2: Chạy từng lệnh thủ công

```bash
# 1. Set encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 2. Clean Flutter
cd mobile_app
flutter clean

# 3. Get Flutter dependencies
flutter pub get

# 4. Reinstall CocoaPods
cd ios
pod deintegrate  # Optional: nếu vẫn lỗi
pod install
cd ..
```

### Cách 3: Fix trong Xcode

1. Mở **Runner.xcworkspace** (KHÔNG phải Runner.xcodeproj):
   ```bash
   open ios/Runner.xcworkspace
   ```

2. Clean Build Folder:
   - Menu: **Product → Clean Build Folder** (⌘⇧K)

3. Build lại:
   - Menu: **Product → Build** (⌘B)
   - Hoặc: **Product → Run** (⌘R)

## 🔍 Checklist troubleshooting

### ✅ Kiểm tra trước khi build:

- [ ] Đang mở **Runner.xcworkspace** (KHÔNG phải Runner.xcodeproj)
- [ ] Đã chạy `flutter pub get`
- [ ] Đã chạy `pod install` với UTF-8 encoding
- [ ] Đã clean build folder trong Xcode
- [ ] Xcode version >= 13.0
- [ ] iOS deployment target = 13.0 hoặc cao hơn

### ⚠️ Các lỗi thường gặp:

#### 1. Lỗi UTF-8 encoding khi chạy pod install
```
Unicode Normalization not appropriate for ASCII-8BIT
```

**Fix:**
```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
pod install
```

**Fix vĩnh viễn** (thêm vào `~/.zshrc` hoặc `~/.bash_profile`):
```bash
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
echo 'export LC_ALL=en_US.UTF-8' >> ~/.zshrc
source ~/.zshrc
```

#### 2. Lỗi "No Podfile found"
```bash
cd mobile_app/ios
pod install
```

#### 3. Lỗi "Unable to find a specification for..."
```bash
cd ios
pod repo update
pod install
```

#### 4. Lỗi "The sandbox is not in sync with the Podfile.lock"
```bash
cd ios
pod deintegrate
pod install
```

#### 5. Lỗi PhaseScriptExecution với Google Sign In
Nếu lỗi liên quan đến `google_sign_in_ios`, kiểm tra:
- [ ] `GoogleService-Info.plist` đã được thêm vào project chưa
- [ ] URL Schemes đã được cấu hình trong Info.plist
- [ ] Bundle ID khớp với Google Console

## 📝 Cấu hình Google Sign-In (nếu cần)

### 1. Kiểm tra GoogleService-Info.plist
File này phải được đặt tại: `mobile_app/ios/Runner/GoogleService-Info.plist`

### 2. Kiểm tra Info.plist
Mở `mobile_app/ios/Runner/Info.plist` và đảm bảo có:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Replace with your REVERSED_CLIENT_ID from GoogleService-Info.plist -->
            <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

### 3. Verify URL Scheme
Lấy REVERSED_CLIENT_ID từ `GoogleService-Info.plist`:
```bash
grep -A 1 "REVERSED_CLIENT_ID" ios/Runner/GoogleService-Info.plist
```

## 🚀 Build từ command line

### Debug build:
```bash
flutter build ios --debug
```

### Release build:
```bash
flutter build ios --release
```

### Run on simulator:
```bash
flutter run
```

### Run on device:
```bash
flutter run -d <device-id>
# List devices: flutter devices
```

## 📊 Kiểm tra môi trường

```bash
flutter doctor -v
```

**Yêu cầu:**
- ✅ Flutter: Channel stable, version >= 3.0
- ✅ Xcode: Version >= 13.0
- ✅ CocoaPods: Version >= 1.11.0
- ✅ iOS deployment target: >= 13.0

## 🔗 Tài liệu liên quan

- [Flutter iOS Setup](https://docs.flutter.dev/get-started/install/macos#ios-setup)
- [CocoaPods Installation](https://guides.cocoapods.org/using/getting-started.html)
- [Google Sign-In for iOS](https://developers.google.com/identity/sign-in/ios/start-integrating)

## 💡 Tips

1. **Luôn mở `.xcworkspace` chứ không phải `.xcodeproj`** khi dùng CocoaPods
2. **Clean build folder** trong Xcode trước khi build
3. **Set UTF-8 encoding** trong terminal profile để tránh lỗi CocoaPods
4. **Restart Xcode** nếu vẫn gặp lỗi sau khi fix

---

**Created**: 2025-12-25
**Status**: Ready to use
**Script**: `fix-ios-build.sh`
