# 🔴 URGENT: Prisma Accelerate Quota Exceeded

**Ngày**: 2025-12-25 22:10 UTC
**Vấn đề**: Database queries usage blocked - monthly limit reached

---

## 🚨 VẤN ĐỀ

Prisma Accelerate đã hết quota miễn phí trong tháng này:

```
Database queries usage blocked: monthly limit reached
```

**Ảnh hưởng:**
- ❌ Website hoàn toàn DOWN
- ❌ Không thể query database
- ❌ Mọi API đều trả về 500 error

---

## ✅ GIẢI PHÁP NHANH: Migrate sang Neon PostgreSQL (FREE)

Neon.tech cung cấp PostgreSQL miễn phí với generous limits:
- ✅ 0.5 GB storage (free tier)
- ✅ 300 hours compute/month
- ✅ Không giới hạn queries
- ✅ Connection pooling built-in

### BƯỚC 1: Tạo Database trên Neon

1. **Truy cập:** https://console.neon.tech/signup
2. **Đăng ký** (dùng GitHub hoặc email)
3. **Tạo project mới:**
   - Project name: `thptphuocbuu360`
   - Region: Singapore hoặc Tokyo (gần nhất với asia-southeast1)
   - Postgres version: 16 (latest)
4. **Copy connection string:**
   - Format: `postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require`
   - **LƯU Ý**: Chọn "Pooled connection" cho production

---

### BƯỚC 2: Update DATABASE_URL

```bash
# Update secret với Neon connection string
echo "postgresql://your_neon_connection_string" | \
  gcloud secrets versions add database-url --data-file=-

# Verify
gcloud secrets versions access latest --secret="database-url"
```

---

### BƯỚC 3: Run Prisma Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://your_neon_connection_string"

# Push schema to new database
npx prisma db push

# Hoặc run migrations
npx prisma migrate deploy
```

**Lưu ý:** Database mới sẽ TRỐNG. Cần:
- Tạo lại users (admin account)
- Import data nếu cần

---

### BƯỚC 4: Deploy lại Cloud Run

```bash
# Deploy với DATABASE_URL mới (từ Secret Manager)
./deploy-phuocbuu-cloud-run.sh
```

Hoặc chỉ restart service:
```bash
gcloud run services update-traffic thptphuocbuu360 \
  --region asia-southeast1 \
  --to-latest
```

---

### BƯỚC 5: Verify

```bash
# Test API
curl -s "https://thptphuocbuu.edu.vn/api/posts" | python3 -m json.tool

# Test homepage
curl -s "https://thptphuocbuu.edu.vn" | grep -i "error"
```

Nếu không thấy error → ✅ Success!

---

## 🎯 QUICK START COMMANDS

**Full setup trong 5 phút:**

```bash
# 1. Tạo Neon database tại: https://console.neon.tech
# 2. Copy connection string (pooled)

# 3. Update secret
echo "YOUR_NEON_CONNECTION_STRING" | \
  gcloud secrets versions add database-url --data-file=-

# 4. Push schema to new DB
export DATABASE_URL="YOUR_NEON_CONNECTION_STRING"
npx prisma db push

# 5. Restart Cloud Run
gcloud run services update-traffic thptphuocbuu360 \
  --region asia-southeast1 \
  --to-latest

# 6. Wait 30s and test
sleep 30
curl -s "https://thptphuocbuu.edu.vn/api/posts"
```

---

## 🔄 Alternative Options

### Option 2: Railway PostgreSQL (Free)

1. Sign up: https://railway.app
2. New Project → Add PostgreSQL
3. Copy connection string
4. Update secret
5. Run `npx prisma db push`

**Free tier:**
- $5 credit/month
- Up to 1GB storage
- 500 hours/month

### Option 3: Supabase (Free)

1. Sign up: https://supabase.com
2. Create project
3. Go to Settings → Database
4. Copy connection string (Pooler, port 6543)
5. Update secret
6. Run `npx prisma db push`

**Free tier:**
- 500MB database
- Unlimited API requests
- Built-in auth & storage

### Option 4: Upgrade Prisma Accelerate

Nếu muốn tiếp tục dùng Prisma Accelerate:

1. Login: https://console.prisma.io
2. Upgrade to paid plan ($29/month)
3. Không cần thay đổi gì

**Nhưng Neon free tier đủ cho production nhỏ!**

---

## 📊 COMPARISON

| Provider | Free Tier | Queries Limit | Speed | Recommend |
|----------|-----------|---------------|-------|-----------|
| **Neon** | 0.5GB, 300h compute | ∞ | Fast (Edge) | ⭐⭐⭐⭐⭐ |
| Railway | $5 credit/month | ∞ | Fast | ⭐⭐⭐⭐ |
| Supabase | 500MB | ∞ | Fast | ⭐⭐⭐⭐ |
| Prisma Accelerate | Limited queries | ❌ Hit limit | Very Fast | ⭐⭐⭐ |

**Recommendation:** **Neon PostgreSQL** - Best free option, no query limits

---

## ⚠️ IMPORTANT NOTES

### 1. Data Migration

Nếu có data quan trọng trong database cũ (Prisma Accelerate):

```bash
# Export data từ old DB
pg_dump OLD_DATABASE_URL > backup.sql

# Import vào new DB
psql NEW_DATABASE_URL < backup.sql
```

**NHƯNG** nếu database đã hết quota, không thể export được!

### 2. Prisma Schema

Code hiện tại đã có `prisma/schema.prisma`. Không cần sửa gì, chỉ cần:
```bash
npx prisma db push
```

### 3. Connection Pooling

Neon có built-in pooling, không cần Prisma Accelerate.

**Connection string format:**
```
# Direct connection (for migrations)
postgresql://user:pass@ep-xxx.neon.tech/db

# Pooled connection (for production) - USE THIS
postgresql://user:pass@ep-xxx.neon.tech/db?pgbouncer=true
```

---

## 🚀 RECOMMENDED SETUP

### Final DATABASE_URL format:

```
postgresql://username:password@ep-xxx-xxx.region.neon.tech/neondb?sslmode=require&pgbouncer=true
```

**Giải thích:**
- `sslmode=require`: Force SSL connection
- `pgbouncer=true`: Use connection pooling (for Cloud Run)

---

## ✅ POST-MIGRATION CHECKLIST

- [ ] Neon database created
- [ ] Connection string copied
- [ ] Secret `database-url` updated
- [ ] `npx prisma db push` completed
- [ ] Cloud Run restarted
- [ ] Homepage loads without error
- [ ] `/api/posts` returns data (or empty array)
- [ ] Login works
- [ ] Can create posts

---

## 🎯 IMMEDIATE ACTION

**3 bước ngay lập tức:**

1. **Tạo Neon database:** https://console.neon.tech/signup (2 phút)
2. **Update secret:**
   ```bash
   echo "neon_connection_string" | \
     gcloud secrets versions add database-url --data-file=-
   ```
3. **Push schema và restart:**
   ```bash
   DATABASE_URL="neon_string" npx prisma db push
   gcloud run services update-traffic thptphuocbuu360 --region asia-southeast1 --to-latest
   ```

**Total time:** ~10 phút

---

## 📞 Support

### Neon Support:
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon
- Support: support@neon.tech

### If stuck:
Tôi có thể giúp bạn:
- Generate Prisma migration commands
- Debug connection issues
- Import data if needed

---

**Status:** ⏰ **WAITING FOR DATABASE SETUP**
**Next Step:** Tạo Neon database ngay
**ETA:** ~10 phút để website hoạt động lại

---

**Created**: 2025-12-25 22:10 UTC
**Priority**: 🔴 CRITICAL
**Action**: Migrate to Neon PostgreSQL
