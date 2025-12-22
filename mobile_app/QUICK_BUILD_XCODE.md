# ⚡ Quick Build với Xcode

## Cách nhanh nhất

### 1. Chạy script setup

```bash
cd /Users/vietchung/phuocbuu/mobile_app
./build-ios.sh
```

Script sẽ:
- ✅ Cài đặt CocoaPods dependencies
- ✅ Clean Flutter project
- ✅ Get Flutter dependencies
- ✅ Mở Xcode workspace

### 2. Hoặc làm thủ công

```bash
# Set encoding (fix CocoaPods error)
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Install pods
cd /Users/vietchung/phuocbuu/mobile_app/ios
pod install

# Open Xcode
cd ..
open ios/Runner.xcworkspace
```

## Trong Xcode

### 1. Cấu hình Signing

1. Chọn **Runner** project (bên trái)
2. Chọn target **Runner**
3. Tab **Signing & Capabilities**
4. Chọn **Team**: Team của bạn
5. ✅ **Automatically manage signing**

### 2. Chọn Device

- Click device selector (trên cùng, bên cạnh Run button)
- Chọn iOS Simulator hoặc Physical Device

### 3. Build và Run

- Nhấn **⌘R** (Command + R)
- Hoặc click nút **Run** (▶️)

## Build cho Production

### Archive trong Xcode

1. Chọn **Any iOS Device (arm64)**
2. **Product > Archive**
3. Đợi archive xong
4. **Distribute App**

### Hoặc dùng Flutter CLI

```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter build ipa --release
```

File `.ipa` sẽ ở: `build/ios/ipa/phuocbuu_mobile.ipa`

## Troubleshooting

### Lỗi encoding với CocoaPods

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
cd ios
pod install
```

### Lỗi signing

- Đảm bảo đã đăng nhập Apple ID trong Xcode
- Chọn đúng team trong Signing & Capabilities
- Bật "Automatically manage signing"

### Lỗi "Flutter.framework not found"

```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter clean
flutter pub get
cd ios
pod install
```

## Thông tin App

- **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
- **Display Name**: `PhuocBuu`
- **Team ID**: `CGT5VR25M3`
- **iOS Deployment Target**: iOS 13.0+

