# 🔧 Sửa Lỗi: App Name Đã Được Sử Dụng

## Vấn Đề

```
App Record Creation failed due to request containing an attribute already in use. 
The App Name you entered is already being used.
```

## Giải Pháp Nhanh

### Bước 1: Chọn Tên Mới

Thử các tên sau (theo thứ tự ưu tiên):

1. **THPT Phước Bửu** ⭐ (Khuyến nghị)
2. **THPT Phước Bửu Social**
3. **PhuocBuu Social**
4. **PhuocBuu School**
5. **THPT PhuocBuu**

### Bước 2: Tạo App Mới trên App Store Connect

1. Đăng nhập: https://appstoreconnect.apple.com
2. **My Apps** → **"+"** → **New App**
3. Điền thông tin:
   - **Platform**: iOS
   - **Name**: `THPT Phước Bửu` (hoặc tên bạn chọn)
   - **Primary Language**: Vietnamese
   - **Bundle ID**: `com.thptphuocbuu.edu.vn.social`
   - **SKU**: `thptphuocbuu`
4. Click **"Create"**

### Bước 3: Giữ Nguyên Code

**KHÔNG CẦN** thay đổi code! 

- Tên hiển thị trên thiết bị (CFBundleDisplayName) vẫn là `PhuocBuu`
- Chỉ tên trên App Store Connect là `THPT Phước Bửu`
- Điều này hoàn toàn hợp lệ và được Apple cho phép

## Lưu Ý

✅ **App Store Name** ≠ **Display Name**

- **App Store Name**: Tên trên App Store Connect (phải unique)
- **Display Name**: Tên trên home screen (có thể giữ nguyên)

## Nếu Tất Cả Tên Đều Bị Trùng

1. Thử thêm số hoặc năm: `PhuocBuu 2024`
2. Thử thêm domain: `PhuocBuu.edu.vn`
3. Thử tên viết tắt: `PB Social`
4. Kiểm tra trên App Store xem app nào đang dùng tên đó

## Sau Khi Tạo App Thành Công

Tiếp tục với các bước:
1. Upload build
2. Điền thông tin app
3. Submit for review

## Thông Tin Cần Nhớ

- **Bundle ID**: `com.thptphuocbuu.edu.vn.social` (không đổi)
- **SKU**: `thptphuocbuu` (không đổi)
- **Apple ID**: 6756763216 (không đổi)
- **App Name**: Thay đổi thành tên mới trên App Store Connect

