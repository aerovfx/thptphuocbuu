# PhuocBuu Mobile App (Flutter)

Ứng dụng mobile Flutter kết nối với backend web.

## Cấu trúc Project

```
mobile_app/
├── lib/
│   ├── main.dart                 # Entry point
│   ├── models/                   # Data models
│   │   ├── user.dart
│   │   ├── post.dart
│   │   └── api_response.dart
│   ├── services/                 # API services
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   └── post_service.dart
│   ├── screens/                  # UI screens
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   ├── feed/
│   │   │   └── feed_screen.dart
│   │   └── profile/
│   │       └── profile_screen.dart
│   ├── widgets/                  # Reusable widgets
│   │   ├── post_card.dart
│   │   └── user_avatar.dart
│   └── utils/                    # Utilities
│       ├── constants.dart
│       └── storage.dart
├── pubspec.yaml                  # Dependencies
└── README.md
```

## Setup

1. Cài đặt Flutter: https://flutter.dev/docs/get-started/install

2. Cài đặt dependencies:
```bash
cd mobile_app
flutter pub get
```

3. Cấu hình API base URL trong `lib/utils/constants.dart`

4. Chạy app:
```bash
flutter run
```

## API Endpoints

- `POST /api/mobile/auth/login` - Đăng nhập
- `GET /api/mobile/auth/me` - Lấy thông tin user hiện tại
- `GET /api/mobile/posts` - Lấy danh sách bài viết

## Authentication

App sử dụng JWT token-based authentication. Token được lưu trong secure storage và tự động thêm vào header của mọi request.

