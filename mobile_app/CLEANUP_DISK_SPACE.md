# 🧹 Dọn Dẹp Dung Lượng Ổ Cứng - Giải Quyết "No Space Left on Device"

## Vấn Đề

Lỗi **"No space left on device"** xảy ra khi ổ cứng hết dung lượng. Cần dọn dẹp các file không cần thiết.

## Giải Pháp

### 1. Xóa DerivedData (Xcode Build Cache)

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

Hoặc trong Xcode:
- Menu: **Xcode** → **Preferences** → **Locations**
- Click mũi tên bên cạnh **Derived Data** path
- Xóa tất cả thư mục bên trong

### 2. Xóa CocoaPods Cache

```bash
rm -rf ~/Library/Caches/CocoaPods
pod cache clean --all
```

### 3. Xóa Flutter Build Cache

```bash
cd /Users/vietchung/phuocbuu/mobile_app
flutter clean
rm -rf build/
rm -rf ios/Pods/
rm -rf ios/.symlinks/
rm -rf ios/Flutter/Flutter.framework
rm -rf ios/Flutter/Flutter.podspec
```

### 4. Xóa Pub Cache (Cẩn thận - sẽ phải download lại packages)

```bash
# Chỉ xóa nếu thực sự cần
flutter pub cache clean
```

### 5. Xóa Xcode Archives (Nếu có nhiều)

```bash
rm -rf ~/Library/Developer/Xcode/Archives/*
```

Hoặc trong Xcode:
- Menu: **Window** → **Organizer**
- Xóa các archive cũ không cần thiết

### 6. Xóa iOS Simulator Data (Nếu không dùng)

```bash
xcrun simctl delete unavailable
xcrun simctl erase all
```

### 7. Xóa System Cache (Cẩn thận)

```bash
# Xóa system cache (cần sudo)
sudo rm -rf /Library/Caches/*
sudo rm -rf ~/Library/Caches/*
```

## Script Tự Động

Chạy script sau để dọn dẹp tự động:

```bash
#!/bin/bash

echo "🧹 Bắt đầu dọn dẹp..."

# Xóa DerivedData
echo "Xóa DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Xóa CocoaPods cache
echo "Xóa CocoaPods cache..."
rm -rf ~/Library/Caches/CocoaPods
pod cache clean --all 2>/dev/null || true

# Xóa Flutter build
echo "Xóa Flutter build..."
cd /Users/vietchung/phuocbuu/mobile_app
flutter clean
rm -rf build/
rm -rf ios/Pods/
rm -rf ios/.symlinks/

# Xóa Xcode Archives cũ
echo "Xóa Xcode Archives cũ..."
rm -rf ~/Library/Developer/Xcode/Archives/*

# Xóa iOS Simulator data
echo "Xóa iOS Simulator data..."
xcrun simctl delete unavailable 2>/dev/null || true

echo "✅ Dọn dẹp hoàn tất!"
echo ""
echo "Dung lượng còn lại:"
df -h / | tail -1
```

## Kiểm Tra Dung Lượng Sau Khi Dọn Dẹp

```bash
df -h /
```

## Sau Khi Dọn Dẹp

1. **Rebuild dependencies:**
   ```bash
   cd /Users/vietchung/phuocbuu/mobile_app
   flutter pub get
   cd ios
   pod install
   ```

2. **Mở lại Xcode:**
   ```bash
   open ios/Runner.xcworkspace
   ```

3. **Clean Build Folder trong Xcode:**
   - Menu: **Product** → **Clean Build Folder** (`Shift + Cmd + K`)

4. **Build lại:**
   - Menu: **Product** → **Archive**

## Lưu Ý

⚠️ **Xóa DerivedData**: Sẽ phải rebuild lại tất cả, nhưng an toàn

⚠️ **Xóa Archives**: Chỉ xóa các archive cũ, giữ lại archive mới nhất nếu cần

⚠️ **Xóa Pub Cache**: Sẽ phải download lại tất cả packages, nhưng tiết kiệm nhiều dung lượng

⚠️ **Xóa System Cache**: Cẩn thận, chỉ xóa nếu chắc chắn

## Dung Lượng Khuyến Nghị

Để build iOS app, nên có ít nhất:
- **10GB** dung lượng trống
- **20GB+** để build thoải mái

## Kiểm Tra Dung Lượng Chi Tiết

```bash
# Xem dung lượng từng thư mục lớn
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/Archives
du -sh ~/Library/Caches
du -sh ~/.pub-cache
du -sh /Users/vietchung/phuocbuu/mobile_app/build
```

