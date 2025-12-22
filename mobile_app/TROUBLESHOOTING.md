# Troubleshooting - Mobile App Login Error

## Vấn Đề Hiện Tại

App đang gặp lỗi khi đăng nhập:
- **Lỗi**: `FormatException: Unexpected character (at line 2, character 1) <html><head>`
- **Nguyên nhân**: API trả về HTML (403 Forbidden) thay vì JSON

## Giải Pháp Tạm Thời

### Option 1: Test với Local Backend

1. Chạy backend local:
```bash
cd /Users/vietchung/phuocbuu
npm run dev
```

2. Cập nhật `mobile_app/lib/utils/constants.dart`:
```dart
static const String baseUrl = 'http://localhost:3000';
```

3. Chạy Flutter app với local backend:
```bash
cd mobile_app
flutter run
```

**Lưu ý**: Với iOS Simulator, dùng `http://localhost:3000`. Với Android emulator, dùng `http://10.0.2.2:3000`.

### Option 2: Kiểm Tra Cloud Run Service

Có thể Cloud Run service chưa được update với routes mới. Thử:

1. **Kiểm tra service đang chạy**:
```bash
gcloud run services describe phuocbuu --region asia-southeast1 --project in360project
```

2. **Force redeploy**:
```bash
cd /Users/vietchung/phuocbuu
gcloud builds submit --config cloudbuild.yaml --project in360project
```

3. **Đợi 2-3 phút** sau khi deploy xong để service update

### Option 3: Sử dụng API Endpoint Khác

Tạm thời có thể test với endpoint web hiện có:

1. Sử dụng NextAuth endpoint thay vì mobile endpoint
2. Hoặc tạo proxy endpoint

## Debug Steps

1. **Kiểm tra API response**:
```bash
curl -X POST https://phuocbuu-vglgngs3yq-as.a.run.app/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

2. **Kiểm tra Flutter logs**:
- Xem console output khi chạy `flutter run`
- Check network requests trong DevTools

3. **Test với Postman/Insomnia**:
- Verify API endpoint hoạt động
- Check headers và response format

## Next Steps

1. ✅ Đã thêm CORS headers vào API endpoints
2. ✅ Đã cải thiện error handling trong Flutter
3. ⏳ Cần verify Cloud Run service đã update routes mới
4. ⏳ Có thể cần thêm time delay sau deploy

## Workaround

Nếu vẫn không hoạt động, có thể:
1. Sử dụng local backend để test
2. Hoặc đợi vài phút sau khi deploy để Cloud Run update
3. Hoặc kiểm tra Cloud Run logs để xem có lỗi gì không

