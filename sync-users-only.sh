#!/bin/bash

# Script đồng bộ CHỈ bảng Users từ production xuống localhost
# Nhanh hơn và ít rủi ro hơn khi chỉ cần test với user data

set -e

PROD_URL="postgres://3c15e80f70155685640eefcd5b1c1485ec770c62a8c5def59b935227ab429ef8:sk_jKy33UZCNenW-Ud0LGwAk@db.prisma.io:5432/postgres?sslmode=require"

echo "════════════════════════════════════════════"
echo "  Sync CHỈ Users: Production → Localhost"
echo "════════════════════════════════════════════"
echo ""

# Nhập thông tin local database
read -p "Local Database URL [postgresql://postgres:postgres@localhost:5432/phuocbuu_local]: " LOCAL_URL
LOCAL_URL=${LOCAL_URL:-postgresql://postgres:postgres@localhost:5432/phuocbuu_local}

echo ""
echo "🔍 Kiểm tra kết nối..."

# Test production connection
PROD_COUNT=$(psql "$PROD_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs)
if [ -z "$PROD_COUNT" ]; then
    echo "❌ Không thể kết nối production database"
    exit 1
fi
echo "✅ Production: ${PROD_COUNT} users"

# Test local connection
if ! psql "$LOCAL_URL" -c "SELECT 1" &> /dev/null; then
    echo "❌ Không thể kết nối local database"
    echo "   Hãy đảm bảo PostgreSQL đang chạy và database đã được tạo"
    exit 1
fi
echo "✅ Local database OK"

echo ""
echo "📤 Export Users từ production..."

# Export User table
pg_dump "$PROD_URL" \
    --table='"User"' \
    --data-only \
    --column-inserts \
    --on-conflict-do-nothing \
    -f /tmp/users_only.sql

# Export Account table (OAuth)
pg_dump "$PROD_URL" \
    --table='"Account"' \
    --data-only \
    --column-inserts \
    -f /tmp/accounts_only.sql

echo "✅ Export hoàn tất"

echo ""
echo "📥 Import vào localhost..."

# Import với conflict handling
psql "$LOCAL_URL" << 'EOF'
-- Tạm tắt constraints để import nhanh hơn
SET session_replication_role = 'replica';
EOF

# Import users
cat /tmp/users_only.sql | psql "$LOCAL_URL" 2>&1 | grep -v "ERROR.*duplicate key" || true

# Import accounts
cat /tmp/accounts_only.sql | psql "$LOCAL_URL" 2>&1 | grep -v "ERROR.*duplicate key" || true

# Bật lại constraints
psql "$LOCAL_URL" << 'EOF'
SET session_replication_role = 'origin';
EOF

echo "✅ Import hoàn tất"

echo ""
echo "🧹 Dọn dẹp..."
rm -f /tmp/users_only.sql /tmp/accounts_only.sql

echo ""
echo "📊 Kết quả:"
LOCAL_COUNT=$(psql "$LOCAL_URL" -t -c "SELECT COUNT(*) FROM \"User\";" | xargs)
echo "   Production: ${PROD_COUNT} users"
echo "   Localhost:  ${LOCAL_COUNT} users"

echo ""
echo "✅ Hoàn tất! Database localhost đã được cập nhật."
echo ""
