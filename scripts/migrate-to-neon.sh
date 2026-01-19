#!/bin/bash

# Cấu hình
NEON_DB="postgresql://neondb_owner:npg_KenJcZdU58og@ep-delicate-snow-a1gm8l2y-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

echo "🚀 Bắt đầu migrate dữ liệu từ LOCAL (SQLite) lên NEON..."
echo "======================================================"

# Step 1: Push Schema
echo "📋 Bước 1: Đồng bộ Schema lên Neon..."
DATABASE_URL="$NEON_DB" npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "❌ Schema push failed!"
    exit 1
fi

# Step 2: Migrate Data using TypeScript script (Reliable for Prisma)
echo ""
echo "📦 Bước 2: Di chuyển dữ liệu từ SQLite sang Neon..."
echo "Sử dụng scripts/migrate-sqlite-to-postgres.ts để đảm bảo toàn vẹn dữ liệu."
DATABASE_URL="$NEON_DB" npx tsx scripts/migrate-sqlite-to-postgres.ts

if [ $? -ne 0 ]; then
    echo "❌ Data migration failed!"
    exit 1
fi

echo ""
echo "======================================================"
echo "✅ Quá trình Migrate hoàn tất thành công!"
echo "📊 Kiểm tra số lượng Users trên Neon:"
psql "$NEON_DB" -c "SELECT COUNT(*) FROM users;"
