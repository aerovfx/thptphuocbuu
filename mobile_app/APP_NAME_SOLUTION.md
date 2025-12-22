# Giải Pháp: Tên App Đã Được Sử Dụng

## Vấn Đề

Tên app **"PhuocBuu"** đã được sử dụng trên App Store Connect.

## Giải Pháp

### Option 1: "THPT Phước Bửu" (Khuyến nghị)
- **Tên App Store**: `THPT Phước Bửu`
- **Tên hiển thị trên thiết bị**: `PhuocBuu` (giữ nguyên)
- **Lý do**: Tên chính thức, unique, rõ ràng

### Option 2: "PhuocBuu Social"
- **Tên App Store**: `PhuocBuu Social`
- **Tên hiển thị trên thiết bị**: `PhuocBuu` (giữ nguyên)
- **Lý do**: Mô tả rõ tính năng

### Option 3: "THPT Phước Bửu Social"
- **Tên App Store**: `THPT Phước Bửu Social`
- **Tên hiển thị trên thiết bị**: `PhuocBuu` (giữ nguyên)
- **Lý do**: Đầy đủ, unique

## Lưu Ý Quan Trọng

⚠️ **Tên App Store** (trong App Store Connect) có thể **KHÁC** với **Tên hiển thị trên thiết bị** (CFBundleDisplayName trong Info.plist)

- **App Store Name**: Tên hiển thị trên App Store, phải unique
- **Display Name**: Tên hiển thị trên home screen của iPhone, có thể giữ nguyên "PhuocBuu"

## Cách Thực Hiện

### Trên App Store Connect

1. Tạo app mới với tên: **"THPT Phước Bửu"** (hoặc tên khác bạn chọn)
2. Các thông tin khác giữ nguyên:
   - Bundle ID: `com.thptphuocbuu.edu.vn.social`
   - SKU: `thptphuocbuu`
   - Primary Language: Vietnamese

### Trong Code (Không cần thay đổi)

- **CFBundleDisplayName** trong `Info.plist` có thể giữ nguyên `PhuocBuu`
- Điều này cho phép app vẫn hiển thị tên ngắn gọn trên thiết bị

## Khuyến Nghị

**Sử dụng tên: "THPT Phước Bửu"**

- ✅ Unique và chưa được sử dụng
- ✅ Tên chính thức của trường
- ✅ Rõ ràng, dễ nhận biết
- ✅ Vẫn có thể giữ tên ngắn "PhuocBuu" trên thiết bị

## Các Tên Khác Có Thể Thử

Nếu "THPT Phước Bửu" vẫn bị trùng, thử:
- `THPT Phước Bửu Social`
- `PhuocBuu School`
- `PhuocBuu Edu`
- `THPT PhuocBuu`
- `PhuocBuu App`

