# 🔒 Hướng dẫn Cấu hình Custom Domain với SSL cho Cloud Run

## 🎯 Mục tiêu
Cấu hình domain `thptphuocbuu.edu.vn` với SSL certificate cho Cloud Run service để khắc phục lỗi `ERR_CERT_COMMON_NAME_INVALID`.

## 📋 Yêu cầu
- ✅ Service đã deploy thành công trên Cloud Run
- ✅ Có quyền truy cập vào DNS provider của domain `thptphuocbuu.edu.vn`
- ✅ Quyền Admin trên GCP project `in360project`

---

## Bước 1: Map Custom Domain vào Cloud Run

### 1.1. Truy cập Cloud Run Console
```bash
# Mở Cloud Run console
https://console.cloud.google.com/run?project=in360project
```

Hoặc sử dụng CLI:

```bash
# Set project
gcloud config set project in360project

# Kiểm tra service hiện tại
gcloud run services describe thptphuocbuu360 \
  --region=asia-southeast1 \
  --format='value(status.url)'
```

### 1.2. Add Custom Domain Mapping

#### Option A: Sử dụng Console UI (Khuyến nghị cho lần đầu)

1. Truy cập: https://console.cloud.google.com/run/domains?project=in360project
2. Click **"ADD MAPPING"**
3. Chọn service: `thptphuocbuu360`
4. Region: `asia-southeast1`
5. Nhập domain: `thptphuocbuu.edu.vn`
6. Click **"CONTINUE"**

#### Option B: Sử dụng gcloud CLI

```bash
gcloud run domain-mappings create \
  --service thptphuocbuu360 \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1
```

---

## Bước 2: Cấu hình DNS Records

Sau khi tạo domain mapping, Google sẽ cung cấp các DNS records cần thiết.

### 2.1. Lấy DNS Records từ Cloud Run

```bash
gcloud run domain-mappings describe \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1
```

Output sẽ chứa:
- **TXT record** để verify domain ownership
- **A record** và **AAAA record** để map traffic

### 2.2. Cập nhật DNS tại Domain Provider

Truy cập DNS management của domain provider (ví dụ: GoDaddy, Namecheap, Cloudflare, etc.) và thêm các records sau:

#### ✅ Verification Record (TXT)
```
Type: TXT
Name: @ (hoặc thptphuocbuu.edu.vn)
Value: [Giá trị từ Google, ví dụ: google-site-verification=...]
TTL: 3600
```

#### ✅ IPv4 Address (A Record)
```
Type: A
Name: @ (hoặc thptphuocbuu.edu.vn)
Value: [IP từ Google, ví dụ: 216.239.32.21]
TTL: 3600
```

#### ✅ IPv6 Address (AAAA Record)
```
Type: AAAA
Name: @ (hoặc thptphuocbuu.edu.vn)
Value: [IPv6 từ Google, ví dụ: 2001:db8::1]
TTL: 3600
```

> [!IMPORTANT]
> **Nếu có www subdomain**, thêm CNAME record:
> ```
> Type: CNAME
> Name: www
> Value: ghs.googlehosted.com
> TTL: 3600
> ```

### 2.3. Verify DNS Propagation

```bash
# Kiểm tra TXT record
dig TXT thptphuocbuu.edu.vn +short

# Kiểm tra A record
dig A thptphuocbuu.edu.vn +short

# Kiểm tra AAAA record
dig AAAA thptphuocbuu.edu.vn +short
```

Hoặc sử dụng online tool: https://dnschecker.org/

---

## Bước 3: Chờ SSL Certificate Provisioning

### 3.1. Kiểm tra trạng thái Domain Mapping

```bash
gcloud run domain-mappings describe \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1
```

Tìm field `certificateMode` và `status`:
- `certificateMode: AUTOMATIC` - Google sẽ tự động tạo SSL certificate
- `status.conditions` - Xem trạng thái hiện tại

### 3.2. Monitor Certificate Status

```bash
# Xem chi tiết certificate
gcloud run domain-mappings describe \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1 \
  --format='value(status.resourceRecords, status.conditions)'
```

> [!NOTE]
> **Thời gian provisioning SSL certificate**:
> - Thường mất **15-30 phút** sau khi DNS records được verify
> - Có thể mất lâu hơn nếu DNS propagation chậm (tối đa 48 giờ)

### 3.3. Check Certificate Status qua Browser

```bash
# Mở browser và kiểm tra
https://thptphuocbuu.edu.vn
```

Nếu vẫn thấy lỗi `ERR_CERT_COMMON_NAME_INVALID`, chờ thêm vài phút và refresh.

---

## Bước 4: Update Environment Variables

Sau khi SSL certificate active, cập nhật `NEXTAUTH_URL` để sử dụng custom domain:

```bash
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --update-env-vars NEXTAUTH_URL=https://thptphuocbuu.edu.vn
```

Hoặc update tất cả env vars cùng lúc:

```bash
gcloud run services update thptphuocbuu360 \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA",\
    NEXTAUTH_URL="https://thptphuocbuu.edu.vn",\
    NEXTAUTH_SECRET="your-secret-key-here",\
    GCS_BUCKET_NAME="thptphuocbuu360",\
    GOOGLE_CLOUD_PROJECT_ID="in360project"
```

---

## Bước 5: Update OAuth Redirect URLs (Nếu sử dụng Google OAuth)

Nếu app sử dụng Google OAuth, cần update Authorized Redirect URIs:

1. Truy cập: https://console.cloud.google.com/apis/credentials?project=in360project
2. Click vào OAuth 2.0 Client ID
3. Thêm vào **Authorized redirect URIs**:
   ```
   https://thptphuocbuu.edu.vn/api/auth/callback/google
   ```
4. Thêm vào **Authorized JavaScript origins**:
   ```
   https://thptphuocbuu.edu.vn
   ```
5. Click **SAVE**

---

## Bước 6: Verification & Testing

### 6.1. Test HTTPS Access

```bash
# Test với curl
curl -I https://thptphuocbuu.edu.vn

# Expected: HTTP/2 200
```

### 6.2. Verify SSL Certificate

```bash
# Check certificate details
openssl s_client -connect thptphuocbuu.edu.vn:443 -servername thptphuocbuu.edu.vn </dev/null 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject:"
```

Hoặc sử dụng online tool: https://www.ssllabs.com/ssltest/

### 6.3. Test Application Functionality

1. ✅ Truy cập https://thptphuocbuu.edu.vn
2. ✅ Check không có SSL warning
3. ✅ Test login/authentication
4. ✅ Test các tính năng chính

---

## 🔍 Troubleshooting

### Lỗi: Domain mapping không được create

**Nguyên nhân**: Chưa verify domain ownership

**Giải pháp**:
```bash
# Verify domain bằng Search Console
https://search.google.com/search-console

# Add property với domain thptphuocbuu.edu.vn
# Upload verification file hoặc add TXT record
```

### Lỗi: Certificate vẫn Invalid sau 30 phút

**Nguyên nhân**: DNS records chưa propagate đúng

**Giải pháp**:
```bash
# 1. Verify DNS records
dig A thptphuocbuu.edu.vn +short
dig AAAA thptphuocbuu.edu.vn +short
dig TXT thptphuocbuu.edu.vn +short

# 2. Nếu không thấy records, kiểm tra lại DNS configuration
# 3. Xóa domain mapping và tạo lại
gcloud run domain-mappings delete \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1

# Tạo lại sau khi DNS đã correct
gcloud run domain-mappings create \
  --service thptphuocbuu360 \
  --domain thptphuocbuu.edu.vn \
  --region asia-southeast1
```

### Lỗi: Mixed Content (HTTP/HTTPS)

**Nguyên nhân**: Một số resources vẫn load qua HTTP

**Giải pháp**: Check và update tất cả URLs trong code

```bash
# Find hardcoded HTTP URLs
grep -r "http://" --include="*.tsx" --include="*.ts" --include="*.js"
```

### Lỗi: Redirect Loop

**Nguyên nhân**: NextAuth configuration không đúng

**Giải pháp**: Đảm bảo `NEXTAUTH_URL` khớp với custom domain

---

## 📊 Quick Status Check Script

Tạo script để kiểm tra nhanh:

```bash
#!/bin/bash
# check-domain-status.sh

DOMAIN="thptphuocbuu.edu.vn"
SERVICE="thptphuocbuu360"
REGION="asia-southeast1"

echo "🔍 Checking DNS Records..."
echo "A Record: $(dig +short A $DOMAIN)"
echo "AAAA Record: $(dig +short AAAA $DOMAIN)"
echo "TXT Record: $(dig +short TXT $DOMAIN)"

echo ""
echo "🔍 Checking Domain Mapping..."
gcloud run domain-mappings describe \
  --domain $DOMAIN \
  --region $REGION \
  --format='value(status.conditions)'

echo ""
echo "🔍 Checking SSL Certificate..."
curl -sI https://$DOMAIN | head -1

echo ""
echo "✅ Test complete!"
```

---

## 📝 Next Steps After SSL Setup

1. ✅ **Update documentation** với new domain
2. ✅ **Configure monitoring** cho custom domain
3. ✅ **Setup Google Analytics** với new domain
4. ✅ **Update SEO settings** (sitemap, robots.txt)
5. ✅ **Test performance** trên custom domain

---

## 🎯 Expected Timeline

| Step | Time Required |
|------|---------------|
| Create domain mapping | 2-5 minutes |
| DNS propagation | 5-30 minutes |
| SSL certificate provisioning | 15-30 minutes |
| Update env vars | 2-3 minutes |
| Testing & verification | 5-10 minutes |
| **Total** | **~30-60 minutes** |

> [!WARNING]
> **Trong một số trường hợp**, DNS propagation có thể mất **tối đa 48 giờ** tùy thuộc vào DNS provider. Tuy nhiên, thường chỉ mất 15-30 phút.
