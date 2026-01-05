# 🔴 CRITICAL: Database Connection Error

**Ngày**: 2025-12-25 22:00 UTC
**Trạng thái**: ❌ **CRITICAL - Website DOWN**

---

## 🚨 VẤN ĐỀ

**Toàn bộ website không hoạt động** do không thể kết nối database.

### Lỗi:
```
Can't reach database server at `db.prisma.io:5432`

Please make sure your database server is running at `db.prisma.io:5432`.
```

### Ảnh hưởng:
- ❌ Homepage: Error (Server Components crash)
- ❌ API /api/posts: 500 Internal Server Error
- ❌ Mọi trang khác: Không load được
- ❌ Mobile app feed: Không load

---

## 🔍 NGUYÊN NHÂN

Database connection string (`DATABASE_URL`) đang trỏ tới **Prisma Accelerate** (`db.prisma.io`) nhưng không thể kết nối.

**Có thể do:**
1. Prisma Accelerate key hết hạn
2. Prisma Accelerate service down
3. Database credential không đúng
4. Network issue

---

## ✅ GIẢI PHÁP

### Option 1: Check Prisma Accelerate Console (Recommended)

1. **Login vào Prisma Console:**
   ```
   https://console.prisma.io
   ```

2. **Check project status:**
   - Verify project có đang active không
   - Check connection string còn hợp lệ không
   - Xem có error nào trong dashboard không

3. **Nếu cần → Generate new connection string:**
   - Tạo connection string mới từ Prisma Console
   - Copy connection string
   - Update vào Secret Manager (xem bước tiếp theo)

---

### Option 2: Update DATABASE_URL Secret

#### Bước 1: Verify current DATABASE_URL
```bash
gcloud secrets versions access latest --secret="database-url"
```

**Expected format**:
```
prisma+postgres://accelerate.prisma-data.net/?api_key=...
```

hoặc

```
postgres://username:password@db.prisma.io:5432/dbname
```

#### Bước 2: Nếu URL không đúng → Update

**Cách 1: Update bằng gcloud**
```bash
# Tạo new version với URL mới
echo "NEW_DATABASE_URL_HERE" | gcloud secrets versions add database-url --data-file=-
```

**Cách 2: Update qua Console**
1. Vào: https://console.cloud.google.com/security/secret-manager?project=in360project
2. Click vào secret `database-url`
3. Click "NEW VERSION"
4. Paste new DATABASE_URL
5. Click "ADD NEW VERSION"

#### Bước 3: Restart Cloud Run service
```bash
# Force restart để pick up secret mới
gcloud run services update-traffic thptphuocbuu360 \
  --region asia-southeast1 \
  --to-latest
```

Hoặc trigger deploy mới để restart:
```bash
# Fast restart - chỉ update env (không rebuild)
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --update-env-vars TRIGGER_RESTART=true

# Sau đó remove env var
gcloud run services update thptphuocbuu360 \
  --region asia-southeast1 \
  --remove-env-vars TRIGGER_RESTART
```

---

### Option 3: Test Database Connection Locally

Để verify DATABASE_URL trước khi update:

```bash
# Get current URL
DB_URL=$(gcloud secrets versions access latest --secret="database-url")

# Test connection locally
DATABASE_URL="$DB_URL" npx prisma db execute --stdin <<< "SELECT 1;"
```

Nếu test thành công → URL OK, vấn đề có thể là Cloud Run network
Nếu test failed → URL không đúng, cần update

---

### Option 4: Migrate to New Database (Nếu Option 1-3 không work)

Nếu Prisma Accelerate không thể phục hồi, migrate sang database khác:

#### A. Prisma Postgres (Recommended)
1. Tạo database mới tại: https://console.prisma.io
2. Copy connection string
3. Update secret `database-url`
4. Chạy migration:
   ```bash
   DATABASE_URL="new_url" npx prisma migrate deploy
   ```

#### B. Neon.tech (Free tier)
1. Tạo project: https://neon.tech
2. Copy Postgres connection string
3. Update secret
4. Run migration

#### C. Railway (Free tier)
1. Tạo project: https://railway.app
2. Add Postgres service
3. Copy connection string
4. Update secret
5. Run migration

---

## 🧪 TESTING

Sau khi fix, test các endpoints:

### 1. Test Homepage
```bash
curl -s "https://thptphuocbuu.edu.vn" | grep -i "error\|digest"
```

Nếu không thấy "error" hoặc "digest" → OK ✅

### 2. Test API Posts
```bash
curl -s "https://thptphuocbuu.edu.vn/api/posts" | python3 -m json.tool
```

Expect: Array of posts hoặc empty array `[]`
NOT: `{"error": "Internal server error"}`

### 3. Test với browser
```
https://thptphuocbuu.edu.vn
```

Phải load bình thường, không có error trong console.

---

## 📊 CURRENT STATUS

### Database URL (in Secret Manager):
```bash
postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_JNJiGX_5Pqmrs0fgNQ-1V@db.prisma.io:5432/postgres?sslmode=require
```

**Format**: Standard Postgres connection string
**Host**: `db.prisma.io:5432`
**Status**: ❌ **CANNOT CONNECT**

### Impact:
- Homepage: ❌ Down
- API endpoints: ❌ 500 errors
- Mobile app: ❌ Cannot load feed
- Web login: ⚠️ May work (NextAuth uses separate session storage)

---

## 🚀 QUICK FIX STEPS

### If you have new DATABASE_URL ready:

```bash
# Step 1: Update secret
echo "YOUR_NEW_DATABASE_URL" | gcloud secrets versions add database-url --data-file=-

# Step 2: Verify
gcloud secrets versions access latest --secret="database-url"

# Step 3: Restart service
gcloud run services update-traffic thptphuocbuu360 \
  --region asia-southeast1 \
  --to-latest

# Step 4: Wait 30 seconds, then test
sleep 30
curl -s "https://thptphuocbuu.edu.vn/api/posts" | python3 -m json.tool
```

---

## ⏰ TIMELINE

- **21:50 UTC**: Discovered database connection error
- **22:00 UTC**: Confirmed Prisma Accelerate cannot connect
- **22:00 UTC**: Created this fix guide
- **Pending**: Database connection restore

---

## 📞 SUPPORT

### Prisma Support:
- Console: https://console.prisma.io
- Docs: https://www.prisma.io/docs/accelerate
- Discord: https://pris.ly/discord

### Alternative Database Providers:
- Neon: https://neon.tech (Free PostgreSQL)
- Railway: https://railway.app (Free tier)
- Supabase: https://supabase.com (Free tier)

---

**Priority**: 🔴 **CRITICAL**
**Action Required**: Fix database connection ASAP
**Next Step**: Check Prisma Console or update DATABASE_URL

---

**Created**: 2025-12-25 22:00 UTC
**Status**: Waiting for database connection fix
