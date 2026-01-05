# Hướng dẫn đồng bộ Database từ Production xuống Localhost

## Yêu cầu
- PostgreSQL đã cài đặt trên máy local
- Node.js và npm đã cài đặt

## Bước 1: Chuẩn bị Local Database

### Tạo local PostgreSQL database:
```bash
# Tạo database mới
createdb phuocbuu_local

# Hoặc sử dụng psql
psql -U postgres -c "CREATE DATABASE phuocbuu_local;"
```

### Tạo file .env.local với connection string local:
```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/phuocbuu_local"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## Bước 2: Đồng bộ Schema

```bash
# Push schema từ Prisma sang local database
npx prisma db push

# Hoặc chạy migrations
npx prisma migrate deploy
```

## Bước 3: Export Data từ Production

### Option 1: Sử dụng pg_dump (Khuyến nghị)
```bash
# Export toàn bộ database
pg_dump "postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require" \
  --no-owner --no-acl \
  -f backup_production.sql

# Import vào local
psql "postgresql://postgres:password@localhost:5432/phuocbuu_local" \
  -f backup_production.sql
```

### Option 2: Export chỉ bảng User
```bash
# Export chỉ bảng User
pg_dump "postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require" \
  --table='"User"' \
  --table='"Account"' \
  --table='"Session"' \
  --data-only \
  --column-inserts \
  -f users_backup.sql

# Import vào local
psql "postgresql://postgres:password@localhost:5432/phuocbuu_local" \
  -f users_backup.sql
```

### Option 3: Sử dụng Script TypeScript (scripts/sync-users.ts)

Script đã được tạo tại `scripts/sync-users.ts`. Để chạy:

```bash
# Cài đặt tsx nếu chưa có
npm install -D tsx

# Chạy script
npx tsx scripts/sync-users.ts
```

## Bước 4: Verify Data

```bash
# Kiểm tra số lượng users
npx prisma db execute --stdin <<EOF
SELECT COUNT(*) FROM "User";
EOF

# Hoặc mở Prisma Studio
npx prisma studio
```

## Bước 5: Cập nhật .env để dùng local database

```bash
# Đổi tên .env thành .env.production
mv .env .env.production

# Copy .env.local thành .env
cp .env.local .env
```

## Troubleshooting

### Nếu gặp lỗi connection:
1. Kiểm tra PostgreSQL đang chạy: `pg_isready`
2. Kiểm tra credentials trong connection string
3. Kiểm tra firewall settings

### Nếu gặp lỗi schema:
```bash
# Reset database và chạy lại migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### Nếu gặp lỗi foreign key constraints:
```bash
# Tắt foreign key checks khi import
psql "postgresql://postgres:password@localhost:5432/phuocbuu_local" <<EOF
SET session_replication_role = 'replica';
\i users_backup.sql
SET session_replication_role = 'origin';
EOF
```

## Script Nhanh (All-in-One)

Tạo file `sync-db.sh`:

```bash
#!/bin/bash

PROD_URL="postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require"
LOCAL_URL="postgresql://postgres:password@localhost:5432/phuocbuu_local"

echo "🔄 Syncing database from production to localhost..."

# 1. Export from production
echo "📤 Exporting from production..."
pg_dump "$PROD_URL" --no-owner --no-acl -f backup.sql

# 2. Drop and recreate local database
echo "🗑️  Recreating local database..."
dropdb phuocbuu_local 2>/dev/null
createdb phuocbuu_local

# 3. Import to local
echo "📥 Importing to localhost..."
psql "$LOCAL_URL" -f backup.sql

# 4. Cleanup
rm backup.sql

echo "✅ Sync completed!"
echo "📊 User count:"
psql "$LOCAL_URL" -c "SELECT COUNT(*) FROM \"User\";"
```

Chạy script:
```bash
chmod +x sync-db.sh
./sync-db.sh
```

## Lưu ý quan trọng

1. **Backup trước khi sync**: Luôn backup local database trước khi ghi đè
2. **Sensitive data**: Cân nhắc xóa hoặc anonymize dữ liệu nhạy cảm trong local
3. **Connection pooling**: Local database có thể không cần connection pooling như production
4. **Environment variables**: Đảm bảo các biến môi trường khác cũng được cập nhật phù hợp với local environment

## Dữ liệu cần sync

- ✅ Users (bảng User)
- ✅ OAuth Accounts (bảng Account)
- ✅ Sessions (bảng Session)
- ⚠️  Posts, Comments, Messages (tùy chọn - có thể rất lớn)
- ⚠️  Files, Documents (thường không sync vì dung lượng lớn)
- ✅ Configuration data (Settings, Roles, etc.)

Chọn bảng nào cần sync dựa trên mục đích development của bạn.
