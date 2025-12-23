# 🔍 Báo Cáo Kiểm Tra OAuth Client ID

**Ngày**: 2025-12-23  
**Thời gian**: 08:04 GMT+7  
**Phương pháp**: Sử dụng Antigravity Browser để kiểm tra Google Cloud Console

---

## 📊 Kết Quả Kiểm Tra

### ❌ Vấn Đề Phát Hiện

**Cloud Run đang sử dụng SAI OAuth Client ID!**

| Vị trí | Client ID | Trạng thái |
|--------|-----------|------------|
| **Google Cloud Console** | `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com` | ✅ **ĐÚNG** |
| **Cloud Run Env Vars** | `442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com` | ❌ **SAI** |
| **Documentation Files** | `442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com` | ❌ **SAI** (đã sửa) |

### ✅ OAuth Configuration trên Google Cloud Console

**OAuth Client Name**: `thptphuocbuu`  
**Client ID**: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com`

#### Authorized JavaScript Origins (4 origins):
- ✅ `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app` ← Cloud Run URL
- ✅ `https://thptphuocbuu.edu.vn`
- ✅ `https://www.thptphuocbuu.edu.vn`
- ✅ `http://localhost:3000`

#### Authorized Redirect URIs (4 URIs):
- ✅ `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google` ← Cloud Run Callback
- ✅ `https://thptphuocbuu.edu.vn/api/auth/callback/google`
- ✅ `https://www.thptphuocbuu.edu.vn/api/auth/callback/google`
- ✅ `http://localhost:3000/api/auth/callback/google`

**Kết luận OAuth Console**: CẤU HÌNH HOÀN TOÀN ĐÚNG! ✅

---

## 🔧 Hành Động Đã Thực Hiện

### 1. ✅ Cập nhật Documentation Files

Đã sửa Client ID sai thành đúng trong các file:
- [x] `CURRENT_STATUS.md`
- [x] `GOOGLE_OAUTH_FIX_STEPS.md`
- [x] `FIX_GOOGLE_OAUTH_REDIRECT.md`

### 2. ✅ Tạo Script Cập Nhật

Đã tạo script mới: [`update-oauth-clientid.sh`](file:///Users/vietchung/phuocbuu/update-oauth-clientid.sh)

Script này sẽ:
- Cập nhật `GOOGLE_CLIENT_ID` trên Cloud Run
- Giữ nguyên `GOOGLE_CLIENT_SECRET`
- Verify sau khi cập nhật
- Hiển thị next steps

---

## 🚀 Cách Chạy Script Cập Nhật

```bash
# Chạy script để cập nhật OAuth Client ID
./update-oauth-clientid.sh
```

Script sẽ:
1. Hiển thị Client ID cũ (sai) và mới (đúng)
2. Hỏi xác nhận trước khi cập nhật
3. Cập nhật environment variables trên Cloud Run
4. Verify kết quả
5. Hiển thị hướng dẫn test

---

## 🎯 Nguyên Nhân Lỗi OAuth

**Tại sao Google OAuth bị lỗi `redirect_uri_mismatch`?**

1. **OAuth Console Configuration**: ✅ ĐÚNG
   - Đã có đầy đủ Authorized JavaScript Origins
   - Đã có đầy đủ Authorized Redirect URIs

2. **Cloud Run Environment Variables**: ❌ SAI
   - Đang dùng sai Client ID: `442514522574-...`
   - Client ID này **không tồn tại** trong Google Cloud Console
   - NextAuth gửi request với Client ID sai → Google từ chối

**Kết luận**: Cloud Run đang authenticate với Client ID không tồn tại, nên Google trả về lỗi.

---

## 📋 Timeline Sự Cố

1. ⏱️ **Ban đầu**: Deploy Cloud Run với Client ID sai
2. ⏱️ **User gặp lỗi**: Error 400: redirect_uri_mismatch
3. ⏱️ **User fix OAuth Console**: Thêm đầy đủ URIs (nhưng không fix được vì lỗi ở chỗ khác)
4. 🔍 **2025-12-23 08:04**: Antigravity Browser kiểm tra → Phát hiện Cloud Run dùng sai Client ID
5. ✅ **Hành động**: Tạo script `update-oauth-clientid.sh` để fix

---

## 📝 Environment Variables Hiện Tại (Cloud Run)

```bash
✅ NODE_ENV=production
✅ DATABASE_URL=postgres://... (Prisma)
✅ NEXTAUTH_URL=https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
✅ NEXTAUTH_SECRET=2T1gOERwim4ZCVXTbUwVn68Whcec7dg32x4x6CuPEAM=
❌ GOOGLE_CLIENT_ID=442514522574-46kbkh43f32gahs1bafmt8c62lqvrnu1.apps.googleusercontent.com
✅ GOOGLE_CLIENT_SECRET=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
✅ GCS_BUCKET_NAME=thptphuocbuu360
✅ GOOGLE_CLOUD_PROJECT_ID=in360project
```

Chỉ cần sửa `GOOGLE_CLIENT_ID` là xong!

---

## 🧪 Test Sau Khi Fix

### 1. Chạy Script
```bash
./update-oauth-clientid.sh
```

### 2. Đợi Cloud Run Reload (~1-2 phút)

### 3. Test Login
```bash
# Mở trong browser
https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/login
```

### 4. Monitor Logs
```bash
gcloud beta run services logs tail thptphuocbuu360 --region asia-southeast1 --project in360project
```

### 5. Verify Env Vars
```bash
gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --project in360project \
  --format="value(spec.template.spec.containers[0].env)" | \
  grep GOOGLE_CLIENT_ID
```

Kết quả phải là:
```
{'name': 'GOOGLE_CLIENT_ID', 'value': '1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1.apps.googleusercontent.com'}
```

---

## 🎬 Recording

Browser recording của quá trình kiểm tra OAuth Client ID đã được lưu tại:

![OAuth Console Check](file:///Users/vietchung/.gemini/antigravity/brain/f76ef628-9250-4c53-b6b1-00f6c5f7cee2/oauth_console_check_1766451783065.webp)

---

## ✅ Checklist

- [x] Kiểm tra Google Cloud Console OAuth configuration
- [x] Xác định Client ID đúng: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1`
- [x] Phát hiện Cloud Run dùng sai Client ID
- [x] Cập nhật documentation files
- [x] Tạo script `update-oauth-clientid.sh`
- [ ] **Chạy script để cập nhật Cloud Run** ⬅️ CẦN LÀM
- [ ] Test Google OAuth login
- [ ] Verify lỗi đã được fix

---

## 📞 Tổng Kết

**Root Cause**: Cloud Run đang sử dụng OAuth Client ID không tồn tại (`442514522574-...`) thay vì Client ID thực tế (`1069154179448-...`).

**Solution**: Chạy script `update-oauth-clientid.sh` để cập nhật Client ID đúng trên Cloud Run.

**ETA**: < 5 phút (bao gồm cả thời gian Cloud Run reload)

---

**Next Step**: Chạy `./update-oauth-clientid.sh` để fix OAuth
