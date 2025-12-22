# Phân tích lỗi đăng nhập Mobile App

## Các vấn đề đã được phát hiện và sửa

### 1. **Không có timeout cho HTTP requests**
**Vấn đề**: Requests có thể bị treo vô thời hạn nếu server không phản hồi.

**Giải pháp**: 
- Thêm timeout 30 giây cho tất cả HTTP requests
- Sử dụng `HttpClient` với `connectionTimeout` và `idleTimeout`
- Thêm `.timeout()` cho mỗi request

### 2. **Không xử lý các exception cụ thể**
**Vấn đề**: Tất cả lỗi được bắt chung chung, không phân biệt loại lỗi.

**Giải pháp**: Xử lý riêng các exception:
- `SocketException`: Không có kết nối mạng
- `HttpException`: Lỗi HTTP protocol
- `TimeoutException`: Request quá thời gian chờ
- `FormatException`: Lỗi parse JSON

### 3. **Thiếu logging chi tiết**
**Vấn đề**: Khó debug khi có lỗi vì không có thông tin chi tiết.

**Giải pháp**: 
- Thêm logging cho mọi bước trong quá trình đăng nhập
- Log URL, request body, response status, response body
- Log các exception với stack trace

### 4. **Thông báo lỗi không rõ ràng**
**Vấn đề**: Người dùng không biết lỗi cụ thể là gì.

**Giải pháp**: 
- Thông báo lỗi chi tiết, hướng dẫn cách khắc phục
- Phân biệt các loại lỗi (mạng, server, authentication, etc.)
- Hiển thị URL server để người dùng kiểm tra

## Các loại lỗi có thể xảy ra

### 1. **Lỗi kết nối mạng (SocketException)**
```
Không thể kết nối đến server.
Vui lòng kiểm tra:
1. Kết nối internet của bạn
2. URL server: https://phuocbuu-vglgngs3yq-as.a.run.app
3. Firewall hoặc VPN có chặn kết nối không
```

**Nguyên nhân**:
- Không có internet
- URL server sai
- Firewall/VPN chặn
- Server không hoạt động

**Cách khắc phục**:
- Kiểm tra kết nối internet
- Kiểm tra URL trong `lib/utils/constants.dart`
- Tắt VPN/Firewall tạm thời
- Kiểm tra server có đang chạy không

### 2. **Lỗi timeout (TimeoutException)**
```
Kết nối quá thời gian chờ.
Vui lòng kiểm tra:
1. Kết nối mạng của bạn
2. Server có đang hoạt động không
3. Thử lại sau
```

**Nguyên nhân**:
- Mạng chậm
- Server quá tải
- Server không phản hồi

**Cách khắc phục**:
- Kiểm tra tốc độ mạng
- Thử lại sau vài phút
- Kiểm tra server status

### 3. **Lỗi server trả về HTML thay vì JSON**
```
Không thể kết nối đến server. Vui lòng kiểm tra:
1. Kết nối mạng của bạn
2. URL server có đúng không
3. Server có đang hoạt động không
```

**Nguyên nhân**:
- Server trả về error page (404, 500, etc.)
- Server redirect đến trang khác
- URL endpoint sai

**Cách khắc phục**:
- Kiểm tra endpoint: `/api/mobile/auth/login`
- Kiểm tra server logs
- Test endpoint bằng Postman/curl

### 4. **Lỗi parse JSON (FormatException)**
```
Lỗi định dạng dữ liệu từ server.
Vui lòng thử lại sau.
```

**Nguyên nhân**:
- Server trả về dữ liệu không phải JSON
- Response body bị lỗi format
- Encoding issues

**Cách khắc phục**:
- Kiểm tra server response
- Kiểm tra Content-Type header
- Xem logs trong console

### 5. **Lỗi authentication (401)**
```
Email hoặc mật khẩu không đúng
```

**Nguyên nhân**:
- Email/password sai
- Tài khoản không tồn tại
- Tài khoản chỉ đăng nhập bằng Google

**Cách khắc phục**:
- Kiểm tra lại email/password
- Thử đăng nhập trên web
- Kiểm tra tài khoản có password không

### 6. **Lỗi server (500+)**
```
Server đang gặp sự cố. Vui lòng thử lại sau.
```

**Nguyên nhân**:
- Server error
- Database error
- Internal server error

**Cách khắc phục**:
- Thử lại sau vài phút
- Kiểm tra server logs
- Liên hệ admin

## Cách debug

### 1. **Xem logs trong console**
Khi chạy app, mở console và xem logs:
```
[API] POST https://phuocbuu-vglgngs3yq-as.a.run.app/api/mobile/auth/login
[API] Body: {"email":"...","password":"..."}
[API] Response status: 200
[API] Response body: {...}
[AuthService] Login successful
```

### 2. **Kiểm tra URL và endpoint**
Mở `lib/utils/constants.dart`:
```dart
static const String baseUrl = 'https://phuocbuu-vglgngs3yq-as.a.run.app';
static const String loginEndpoint = '/api/mobile/auth/login';
```

URL đầy đủ sẽ là: `https://phuocbuu-vglgngs3yq-as.a.run.app/api/mobile/auth/login`

### 3. **Test endpoint bằng curl**
```bash
curl -X POST https://phuocbuu-vglgngs3yq-as.a.run.app/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 4. **Kiểm tra network trong Flutter DevTools**
- Mở Flutter DevTools
- Vào tab Network
- Xem request/response details

### 5. **Kiểm tra server logs**
- Xem logs của Cloud Run service
- Kiểm tra có request đến không
- Xem error logs

## Checklist khi gặp lỗi

- [ ] Kiểm tra kết nối internet
- [ ] Kiểm tra URL server trong `constants.dart`
- [ ] Kiểm tra endpoint có đúng không (`/api/mobile/auth/login`)
- [ ] Xem logs trong console để biết lỗi cụ thể
- [ ] Test endpoint bằng Postman/curl
- [ ] Kiểm tra server có đang chạy không
- [ ] Kiểm tra CORS headers (server phải trả về `Access-Control-Allow-Origin: *`)
- [ ] Kiểm tra email/password có đúng không
- [ ] Thử đăng nhập trên web để xác nhận tài khoản

## Cải thiện đã thực hiện

1. ✅ Thêm timeout 30 giây cho tất cả requests
2. ✅ Xử lý riêng các exception (SocketException, TimeoutException, HttpException, FormatException)
3. ✅ Thêm logging chi tiết cho mọi bước
4. ✅ Cải thiện thông báo lỗi với hướng dẫn cụ thể
5. ✅ Kiểm tra response status code và xử lý phù hợp
6. ✅ Kiểm tra Content-Type để phát hiện HTML response
7. ✅ Validate token và user data trước khi lưu

## File đã được cập nhật

1. `lib/services/api_service.dart` - Thêm timeout và logging
2. `lib/services/auth_service.dart` - Cải thiện error handling và logging

