# Quick Start - Chạy Flutter App

## ✅ Đã Setup

- ✅ Dependencies đã được cài đặt (`flutter pub get`)
- ✅ Code không có lỗi (`flutter analyze` passed)
- ✅ API endpoints đã được tạo trên backend

## 🚀 Cách Chạy

### Option 1: Chạy trên Chrome (Web)
```bash
cd mobile_app
flutter run -d chrome
```

App sẽ mở tự động trên Chrome tại `http://localhost:8080`

### Option 2: Chạy trên Android Emulator

1. Khởi động Android emulator:
```bash
flutter emulators --launch <emulator-id>
```

2. Chạy app:
```bash
flutter run
```

### Option 3: Chạy trên iOS Simulator (chỉ macOS)

1. Khởi động iOS Simulator:
```bash
open -a Simulator
```

2. Chạy app:
```bash
flutter run -d ios
```

### Option 4: Chạy trên Physical Device

1. Kết nối Android/iOS device qua USB
2. Enable USB debugging (Android) hoặc Developer Mode (iOS)
3. Chạy:
```bash
flutter devices  # Kiểm tra device
flutter run       # Chạy app
```

## 📱 Test App

1. **Màn hình Login**: Nhập email và password để đăng nhập
2. **Feed Screen**: Xem danh sách bài viết từ backend
3. **Profile Screen**: Xem thông tin user và đăng xuất

## 🔧 Troubleshooting

### Lỗi "No devices found"
- Đảm bảo emulator đã được khởi động hoặc device đã kết nối
- Chạy `flutter devices` để kiểm tra

### Lỗi kết nối API
- Kiểm tra `baseUrl` trong `lib/utils/constants.dart`
- Đảm bảo backend đang chạy và accessible
- Kiểm tra network permissions

### Lỗi build
- Chạy `flutter clean` và `flutter pub get` lại
- Kiểm tra `flutter doctor` để xem thiếu gì

## 📝 Notes

- App đang chạy ở **debug mode** (hot reload enabled)
- Nhấn `r` trong terminal để hot reload
- Nhấn `R` để hot restart
- Nhấn `q` để quit

## 🔗 API Endpoints

App kết nối với:
- `POST /api/mobile/auth/login` - Đăng nhập
- `GET /api/mobile/auth/me` - Lấy thông tin user
- `GET /api/mobile/posts` - Lấy danh sách bài viết

Base URL: `https://phuocbuu-vglgngs3yq-as.a.run.app`

