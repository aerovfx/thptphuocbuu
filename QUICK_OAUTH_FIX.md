# ✅ Quick Fix Guide - Google OAuth

**⏰ Thời gian**: 5 phút  
**❌ Lỗi hiện tại**: Error 500 - OAuth Configuration  
**✅ Giải pháp**: Thêm custom domain vào Google OAuth Console

---

## 🎯 Điều bạn cần làm NGAY

### Bước 1: Mở Google OAuth Console (đã mở sẵn)
Bạn đang ở tab: https://console.cloud.google.com/auth/clients/...

### Bước 2: Thêm 2 URLs

#### 📍 Phần "Authorized JavaScript origins"
**Click "ADD URI"** và thêm:
```
https://thptphuocbuu.edu.vn
```

#### 📍 Phần "Authorized redirect URIs"  
**Click "ADD URI"** và thêm:
```
https://thptphuocbuu.edu.vn/api/auth/callback/google
```

### Bước 3: Lưu
1. **Scroll xuống cuối** trang
2. **Click nút "SAVE"** 
3. **Đợi thông báo** "OAuth client updated" ✅
4. **Chụp màn hình** để confirm

### Bước 4: Đợi 5-10 phút
Google cần thời gian để cập nhật OAuth configuration.

### Bước 5: Test
Truy cập: https://thptphuocbuu.edu.vn/login  
Click "Sign in with Google" → Phải login thành công ✅

---

## ⚠️ Lưu ý quan trọng

**PHẢI copy chính xác:**
- ✅ `https://` (KHÔNG phải `http://`)
- ✅ KHÔNG có dấu `/` ở cuối JavaScript origin
- ✅ CÓ `/api/auth/callback/google` ở cuối redirect URI
- ✅ KHÔNG có khoảng trắng thừa

**Sau khi SAVE:**
- ✅ Đợi thông báo "OAuth client updated"
- ✅ Chụp màn hình form
- ✅ Đợi 5-10 phút trước khi test

---

## 🔍 Kiểm tra đã làm đúng

Form phải có:

### Authorized JavaScript origins:
```
✓ https://thptphuocbuu.edu.vn
✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
```

### Authorized redirect URIs:
```
✓ https://thptphuocbuu.edu.vn/api/auth/callback/google
✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google
```

---

**Tài liệu đầy đủ**: Xem file `CUSTOM_DOMAIN_OAUTH_SETUP.md` để biết thêm chi tiết
