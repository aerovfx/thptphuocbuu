# Setup Guide - PhuocBuu Mobile App

## Yêu cầu

1. **Flutter SDK**: Cài đặt Flutter từ https://flutter.dev/docs/get-started/install
2. **Android Studio** hoặc **VS Code** với Flutter extension
3. **Android SDK** (cho Android) hoặc **Xcode** (cho iOS - chỉ trên macOS)

## Cài đặt

### 1. Kiểm tra Flutter installation

```bash
flutter doctor
```

Đảm bảo tất cả các dependencies đã được cài đặt đúng.

### 2. Cài đặt dependencies

```bash
cd mobile_app
flutter pub get
```

### 3. Cấu hình API Base URL

Mở file `lib/utils/constants.dart` và cập nhật `baseUrl`:

```dart
static const String baseUrl = 'https://phuocbuu-vglgngs3yq-as.a.run.app';
```

Hoặc cho local development:
```dart
static const String baseUrl = 'http://localhost:3000';
```

### 4. Chạy app

#### Android
```bash
flutter run
```

#### iOS (chỉ trên macOS)
```bash
flutter run -d ios
```

#### Chọn device cụ thể
```bash
flutter devices  # Xem danh sách devices
flutter run -d <device-id>
```

## Cấu trúc Project

```
mobile_app/
├── lib/
│   ├── main.dart                 # Entry point
│   ├── models/                   # Data models
│   ├── services/                 # API services
│   ├── screens/                  # UI screens
│   ├── widgets/                  # Reusable widgets
│   └── utils/                    # Utilities
├── pubspec.yaml                  # Dependencies
└── README.md
```

## API Endpoints

App kết nối với các endpoints sau:

- `POST /api/mobile/auth/login` - Đăng nhập
- `GET /api/mobile/auth/me` - Lấy thông tin user hiện tại
- `GET /api/mobile/posts` - Lấy danh sách bài viết

## Authentication

App sử dụng JWT token-based authentication:
- Token được lưu trong secure storage
- Tự động thêm vào header `Authorization: Bearer <token>` của mọi request
- Token có thời hạn 30 ngày

## Troubleshooting

### Lỗi "Unable to find a suitable device"
- Đảm bảo đã khởi động Android emulator hoặc kết nối physical device
- Chạy `flutter devices` để kiểm tra

### Lỗi "Package not found"
- Chạy `flutter pub get` lại
- Xóa `pubspec.lock` và chạy lại `flutter pub get`

### Lỗi kết nối API
- Kiểm tra `baseUrl` trong `lib/utils/constants.dart`
- Đảm bảo backend đang chạy và accessible
- Kiểm tra network permissions trong AndroidManifest.xml (cho Android)

## Build cho Production

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle (cho Google Play)
```bash
flutter build appbundle --release
```

### iOS (chỉ trên macOS)
```bash
flutter build ios --release
```

