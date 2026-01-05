# 🔧 Cấu hình Google OAuth cho Custom Domain

**Domain**: `thptphuocbuu.edu.vn`  
**Ngày**: 2025-12-23  
**Mục tiêu**: Fix lỗi 500 và cấu hình OAuth để hoạt động với custom domain

---

## 📋 Tổng quan vấn đề

### Hiện tại:
- ❌ `NEXTAUTH_URL` = `https://thptphuocbuu360-1069154179448.asia-southeast1.run.app` (Cloud Run URL)
- ❌ Google OAuth chỉ được cấu hình cho Cloud Run URL
- ❌ Website chạy tại `thptphuocbuu.edu.vn` → Mismatch → Lỗi 500

### Sau khi fix:
- ✅ `NEXTAUTH_URL` = `https://thptphuocbuu.edu.vn` (Custom Domain)
- ✅ Google OAuth được cấu hình cho custom domain
- ✅ Login hoạt động bình thường

---

## 🎯 Các bước thực hiện

### **Bước 1: Cấu hình Google Cloud Console OAuth**

#### 1.1. Mở Google Cloud Console
Truy cập: https://console.cloud.google.com/apis/credentials?project=in360project

#### 1.2. Chọn đúng OAuth Client ID
Tìm và click vào client có:
- **Client ID**: `1069154179448-cghmkq9hs65g3775ogercfcj6c7sobt1`
- **Name**: "thptphuocbuu" hoặc "Web client"

#### 1.3. Thêm Authorized JavaScript origins

Trong mục **"Authorized JavaScript origins"**, thêm URL sau:

```
https://thptphuocbuu.edu.vn
```

**Checklist:**
- ✅ Bắt đầu với `https://` (KHÔNG phải `http://`)
- ✅ KHÔNG có dấu `/` ở cuối
- ✅ KHÔNG có khoảng trắng thừa
- ✅ Copy chính xác, không gõ tay

**Kết quả mong muốn:**
```
Authorized JavaScript origins:
  ✓ https://thptphuocbuu.edu.vn
  ✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app (giữ lại)
  ✓ http://localhost:3000 (nếu có, giữ lại cho dev)
```

#### 1.4. Thêm Authorized redirect URIs

Trong mục **"Authorized redirect URIs"**, thêm URL sau:

```
https://thptphuocbuu.edu.vn/api/auth/callback/google
```

**Checklist:**
- ✅ Bắt đầu với `https://`
- ✅ Kết thúc với `/api/auth/callback/google`
- ✅ KHÔNG có dấu `/` thừa ở cuối
- ✅ KHÔNG có khoảng trắng thừa
- ✅ Copy chính xác, không gõ tay

**Kết quả mong muốn:**
```
Authorized redirect URIs:
  ✓ https://thptphuocbuu.edu.vn/api/auth/callback/google
  ✓ https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/api/auth/callback/google (giữ lại)
  ✓ http://localhost:3000/api/auth/callback/google (nếu có, giữ lại cho dev)
```

#### 1.5. Lưu thay đổi

1. **Click nút "SAVE"** ở cuối trang
2. **Đợi thông báo** "OAuth client updated" xuất hiện ở góc phải màn hình
3. **Chụp màn hình** form để confirm đã lưu thành công
4. **Đợi 5-10 phút** để Google propagate changes

---

### **Bước 2: Cập nhật NEXTAUTH_URL trên Cloud Run**

Sau khi cấu hình Google OAuth xong, cập nhật environment variable trên Cloud Run:

```bash
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars NEXTAUTH_URL=https://thptphuocbuu.edu.vn
```

**Lưu ý:**
- Service sẽ tự động deploy lại với env var mới
- Quá trình này mất khoảng 1-2 phút

**Kiểm tra sau khi update:**
```bash
# Xem chi tiết service
gcloud run services describe thptphuocbuu360 \
  --region asia-southeast1 \
  --format="get(spec.template.spec.containers[0].env)"
```

**Tìm dòng:**
```
NEXTAUTH_URL=https://thptphuocbuu.edu.vn
```

---

### **Bước 3: Kiểm tra Custom Domain Mapping**

Đảm bảo custom domain đã được map đúng:

```bash
# List domain mappings
gcloud run domain-mappings list --region asia-southeast1

# Nếu chưa có, tạo mapping (optional)
gcloud run domain-mappings create \
  --service thptphuocbuu360 \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1
```

**Expected output:**
```
✔ thptphuocbuu.edu.vn    thptphuocbuu360    ACTIVE
```

---

### **Bước 4: Test OAuth Login**

Sau khi đợi 5-10 phút (để Google propagate changes):

#### 4.1. Test Providers Endpoint
```bash
curl -s "https://thptphuocbuu.edu.vn/api/auth/providers" | python3 -m json.tool
```

**Expected output:**
```json
{
  "google": {
    "callbackUrl": "https://thptphuocbuu.edu.vn/api/auth/callback/google"
  }
}
```

#### 4.2. Test Login Flow
1. Mở browser **Incognito/Private** mode
2. Truy cập: https://thptphuocbuu.edu.vn/login
3. Click "Sign in with Google"
4. Chọn Google account
5. **Kết quả mong muốn**: Redirect về `/dashboard` hoặc `/` với trạng thái đã login

#### 4.3. Check Console Logs
Nếu có lỗi, xem logs:
```bash
gcloud beta run services logs tail thptphuocbuu360 --region asia-southeast1
```

---

## ✅ Checklist hoàn thành

### Google Cloud Console:
- [ ] Mở OAuth Client ID đúng credentials
- [ ] Thêm `https://thptphuocbuu.edu.vn` vào Authorized JavaScript origins
- [ ] Thêm `https://thptphuocbuu.edu.vn/api/auth/callback/google` vào Authorized redirect URIs
- [ ] Click SAVE và thấy thông báo "OAuth client updated"
- [ ] Chụp màn hình form đã lưu
- [ ] Đợi 5-10 phút

### Cloud Run:
- [ ] Update `NEXTAUTH_URL=https://thptphuocbuu.edu.vn`
- [ ] Service đã deploy lại thành công
- [ ] Verify env var bằng `gcloud run services describe`

### Testing:
- [ ] Test `/api/auth/providers` endpoint → callback URL đúng
- [ ] Test login flow → redirect về dashboard thành công
- [ ] Không còn lỗi 500 hay OAuth errors
- [ ] Session hoạt động bình thường

---

## ⚠️ Troubleshooting

### Lỗi 1: Vẫn thấy lỗi 500 sau khi update
**Nguyên nhân**: Browser cache hoặc Google chưa propagate  
**Giải pháp**:
- Đợi thêm 5-10 phút
- Dùng Incognito/Private mode
- Clear browser cache

### Lỗi 2: "redirect_uri_mismatch"
**Nguyên nhân**: Chưa thêm redirect URI vào Google Console hoặc chưa lưu  
**Giải pháp**:
- Kiểm tra lại Google Console
- Đảm bảo đã click SAVE
- Copy chính xác URL (không gõ tay)

### Lỗi 3: "Configuration error"
**Nguyên nhân**: `NEXTAUTH_URL` chưa được update  
**Giải pháp**:
- Chạy lại lệnh `gcloud run services update`
- Verify bằng `gcloud run services describe`

### Lỗi 4: Custom domain không hoạt động
**Nguyên nhân**: Domain mapping chưa được tạo hoặc DNS chưa đúng  
**Giải pháp**:
- Check `gcloud run domain-mappings list`
- Kiểm tra DNS records (A/CNAME) trỏ đúng Cloud Run

---

## 📊 URLs sau khi hoàn thành

### Production (Custom Domain):
- **Homepage**: https://thptphuocbuu.edu.vn
- **Login**: https://thptphuocbuu.edu.vn/login
- **Dashboard**: https://thptphuocbuu.edu.vn/dashboard
- **API**: https://thptphuocbuu.edu.vn/api/auth/providers

### Backup (Cloud Run URL - vẫn hoạt động):
- **Homepage**: https://thptphuocbuu360-1069154179448.asia-southeast1.run.app
- **Login**: https://thptphuocbuu360-1069154179448.asia-southeast1.run.app/login

---

## 📞 Hỗ trợ

Nếu sau khi làm đầy đủ các bước trên mà vẫn gặp lỗi:

1. **Chụp màn hình**:
   - Google OAuth Console form (cả 2 phần: origins và redirect URIs)
   - Error message đầy đủ từ browser console
   - Output của lệnh `gcloud run services describe`

2. **Thu thập logs**:
   ```bash
   gcloud beta run services logs tail thptphuocbuu360 \
     --region asia-southeast1 \
     --limit 50 > oauth-error-logs.txt
   ```

3. **Gửi thông tin** để troubleshoot tiếp

---

**Created**: 2025-12-23  
**Status**: Ready to execute  
**Estimated time**: 15-20 phút (bao gồm thời gian đợi Google propagate)
