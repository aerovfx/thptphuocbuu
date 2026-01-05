# Database Sync: Production → Localhost

## TL;DR - Cách nhanh nhất

```bash
# Bước 1: Cài PostgreSQL
brew install postgresql@15  # macOS
brew services start postgresql@15

# Bước 2: Tạo database local
createdb phuocbuu_local

# Bước 3: Push schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
  npx prisma db push

# Bước 4: Sync users (1-2 phút)
./sync-users-only.sh

# Hoặc sync toàn bộ (5-10 phút)
./sync-db-simple.sh

# Bước 5: Cập nhật .env.local
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phuocbuu_local"' > .env.local

# Bước 6: Restart dev server
npm run dev
```

## Scripts có sẵn

| Script | Mục đích | Thời gian |
|--------|----------|-----------|
| **sync-users-only.sh** | Sync chỉ Users & Accounts | 1-2 phút ⚡ |
| **sync-db-simple.sh** | Sync toàn bộ database | 5-10 phút |
| **scripts/sync-users.ts** | Sync qua Prisma API | 10-20 phút |

## Tài liệu chi tiết

- [📘 Hướng dẫn đầy đủ](SYNC_DATABASE_GUIDE.md) - Chi tiết mọi option
- [🚀 Hướng dẫn nhanh](QUICK_SYNC_GUIDE.md) - Quickstart & troubleshooting

## Production Database Info

```
Host: db.prisma.io
Port: 5432
Database: postgres
SSL: Required
```

**Connection String:**
```
postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require
```

⚠️ **Lưu ý:** Đây là production database. Chỉ READ, không write từ local!

## Recommended Workflow

### Cho Development thông thường:
```bash
./sync-users-only.sh  # Sync users để test login/auth
```

### Cho Testing features:
```bash
./sync-db-simple.sh   # Sync toàn bộ để test với real data
```

### Cho Demo/Presentation:
```bash
./sync-db-simple.sh
# Sau đó anonymize sensitive data
```

## Quick Commands

```bash
# Kiểm tra số lượng users
psql "postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
  -c "SELECT COUNT(*) FROM \"User\";"

# Mở Prisma Studio
npx prisma studio

# Backup local database
pg_dump "postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
  > backup_$(date +%Y%m%d).sql

# Restore từ backup
psql "postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
  < backup_20260105.sql
```

## Troubleshooting One-Liners

```bash
# PostgreSQL không chạy?
brew services start postgresql@15

# Database không tồn tại?
createdb phuocbuu_local

# Quên mật khẩu PostgreSQL?
# macOS: Không cần password với user postgres local
# Linux: sudo -u postgres psql

# Connection refused?
# Check: lsof -i :5432
```

## Support

- 📖 [Full Documentation](SYNC_DATABASE_GUIDE.md)
- 🚀 [Quick Guide](QUICK_SYNC_GUIDE.md)
- 💬 Issues: Contact admin

---

**Last Updated:** 2026-01-05
**Tested on:** macOS Sequoia, PostgreSQL 15
