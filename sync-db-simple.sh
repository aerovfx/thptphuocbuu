#!/bin/bash

# Script đồng bộ database từ Prisma Postgres production xuống localhost
# Tác giả: Auto-generated
# Ngày: 2026-01-05

set -e  # Exit on error

PROD_URL="postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Đồng bộ Database: Production → Localhost                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Kiểm tra PostgreSQL client
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) chưa được cài đặt!"
    echo "   Hãy cài đặt: brew install postgresql (macOS)"
    exit 1
fi

# Kiểm tra pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump chưa được cài đặt!"
    echo "   Hãy cài đặt: brew install postgresql (macOS)"
    exit 1
fi

# Nhập thông tin local database
echo "📝 Vui lòng nhập thông tin Local PostgreSQL:"
echo ""
read -p "   Database host [localhost]: " LOCAL_HOST
LOCAL_HOST=${LOCAL_HOST:-localhost}

read -p "   Database port [5432]: " LOCAL_PORT
LOCAL_PORT=${LOCAL_PORT:-5432}

read -p "   Database username [postgres]: " LOCAL_USER
LOCAL_USER=${LOCAL_USER:-postgres}

read -sp "   Database password: " LOCAL_PASS
echo ""

read -p "   Database name [phuocbuu_local]: " LOCAL_DB
LOCAL_DB=${LOCAL_DB:-phuocbuu_local}

LOCAL_URL="postgresql://${LOCAL_USER}:${LOCAL_PASS}@${LOCAL_HOST}:${LOCAL_PORT}/${LOCAL_DB}"

echo ""
echo "🔍 Kiểm tra kết nối local database..."
if psql "$LOCAL_URL" -c "SELECT 1" &> /dev/null; then
    echo "✅ Kết nối local database thành công"

    # Hỏi có muốn xóa database cũ không
    read -p "⚠️  Database '${LOCAL_DB}' đã tồn tại. Xóa và tạo lại? (y/N): " RECREATE
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        echo "🗑️  Đang xóa database cũ..."
        dropdb -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" "$LOCAL_DB" 2>/dev/null || true
        echo "🆕 Đang tạo database mới..."
        createdb -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" "$LOCAL_DB"
    fi
else
    echo "⚠️  Database chưa tồn tại. Đang tạo mới..."
    createdb -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" "$LOCAL_DB"
    echo "✅ Database đã được tạo"
fi

echo ""
echo "📊 Kiểm tra production database..."
PROD_COUNT=$(psql "$PROD_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs)
if [ -z "$PROD_COUNT" ]; then
    echo "❌ Không thể kết nối đến production database"
    exit 1
fi
echo "✅ Production database có ${PROD_COUNT} users"

echo ""
echo "📤 Bước 1/3: Export dữ liệu từ production..."
pg_dump "$PROD_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    -f /tmp/phuocbuu_backup.sql

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h /tmp/phuocbuu_backup.sql | cut -f1)
    echo "✅ Export thành công (${BACKUP_SIZE})"
else
    echo "❌ Export thất bại"
    exit 1
fi

echo ""
echo "📥 Bước 2/3: Import vào localhost..."
psql "$LOCAL_URL" -f /tmp/phuocbuu_backup.sql &> /tmp/phuocbuu_import.log

if [ $? -eq 0 ]; then
    echo "✅ Import thành công"
else
    echo "⚠️  Import có warnings. Kiểm tra log tại /tmp/phuocbuu_import.log"
fi

echo ""
echo "🧹 Bước 3/3: Dọn dẹp..."
rm -f /tmp/phuocbuu_backup.sql

echo ""
echo "📊 Kiểm tra kết quả..."
LOCAL_COUNT=$(psql "$LOCAL_URL" -t -c "SELECT COUNT(*) FROM \"User\";" | xargs)
echo "   Users trong local DB: ${LOCAL_COUNT}"

if [ "$PROD_COUNT" == "$LOCAL_COUNT" ]; then
    echo "✅ Số lượng users khớp!"
else
    echo "⚠️  Số lượng users không khớp (Production: ${PROD_COUNT}, Local: ${LOCAL_COUNT})"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✅ Đồng bộ hoàn tất!                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Để sử dụng local database, cập nhật file .env.local:"
echo ""
echo "DATABASE_URL=\"${LOCAL_URL}\""
echo ""
echo "🔄 Sau đó restart development server:"
echo "   npm run dev"
echo ""
