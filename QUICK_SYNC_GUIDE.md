# Hướng dẫn Nhanh: Đồng bộ Database Production → Localhost

## 🚀 Cách sử dụng nhanh nhất

### Option 1: Sync toàn bộ database (Khuyến nghị)

```bash
./sync-db-simple.sh
```

Script sẽ hỏi thông tin local database và tự động:
- Export toàn bộ data từ production
- Import vào localhost
- Verify kết quả

### Option 2: Chỉ sync bảng Users (Nhanh hơn)

```bash
./sync-users-only.sh
```

Chỉ sync:
- Bảng `User`
- Bảng `Account` (OAuth accounts)

**Thời gian:** ~1-2 phút (thay vì 5-10 phút cho full sync)

## 📋 Yêu cầu trước khi chạy

### 1. Cài đặt PostgreSQL (nếu chưa có)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
- Download từ https://www.postgresql.org/download/windows/
- Hoặc dùng Docker (xem bên dưới)

### 2. Tạo local database

```bash
# Tạo database
createdb phuocbuu_local

# Hoặc dùng psql
psql -U postgres -c "CREATE DATABASE phuocbuu_local;"
```

### 3. Push Prisma schema vào local database

```bash
# Sử dụng DATABASE_URL local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
npx prisma db push
```

## 🐳 Sử dụng Docker (Nếu không muốn cài PostgreSQL)

### Tạo file docker-compose.yml:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: phuocbuu_local
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Chạy:

```bash
# Start PostgreSQL
docker-compose up -d

# Stop khi không dùng
docker-compose down
```

Database URL sẽ là:
```
postgresql://postgres:postgres@localhost:5432/phuocbuu_local
```

## 🔧 Sau khi sync xong

### 1. Tạo file .env.local

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phuocbuu_local"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret-key"

# Google OAuth (copy từ .env)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudinary (copy từ .env)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 2. Restart development server

```bash
# Stop server hiện tại (Ctrl+C)

# Start lại với .env.local
npm run dev
```

### 3. Verify data

```bash
# Mở Prisma Studio
npx prisma studio

# Hoặc query trực tiếp
psql postgresql://postgres:postgres@localhost:5432/phuocbuu_local \
  -c "SELECT COUNT(*) FROM \"User\";"
```

## 🔍 Troubleshooting

### Lỗi: "psql: command not found"

**macOS:**
```bash
# Thêm vào PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux:**
```bash
sudo apt install postgresql-client
```

### Lỗi: "connection refused"

PostgreSQL chưa chạy:
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Lỗi: "database does not exist"

Tạo database trước:
```bash
createdb phuocbuu_local
```

### Lỗi: "permission denied"

Cấp quyền cho script:
```bash
chmod +x sync-db-simple.sh
chmod +x sync-users-only.sh
```

### Lỗi: "duplicate key value violates unique constraint"

Database local đã có data, bạn cần:

**Option A:** Xóa data cũ trước khi import
```bash
psql postgresql://postgres:postgres@localhost:5432/phuocbuu_local << EOF
TRUNCATE TABLE "User" CASCADE;
TRUNCATE TABLE "Account" CASCADE;
TRUNCATE TABLE "Session" CASCADE;
EOF
```

**Option B:** Drop và tạo lại database
```bash
dropdb phuocbuu_local
createdb phuocbuu_local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/phuocbuu_local" \
  npx prisma db push
```

## 📊 So sánh các phương pháp

| Phương pháp | Thời gian | Dữ liệu | Rủi ro |
|-------------|-----------|---------|--------|
| `sync-db-simple.sh` | 5-10 phút | Toàn bộ | Thấp |
| `sync-users-only.sh` | 1-2 phút | Users only | Rất thấp |
| Manual pg_dump | 3-5 phút | Toàn bộ | Trung bình |
| Prisma script | 10-20 phút | Toàn bộ | Thấp |

## 💡 Tips

1. **Sync định kỳ:** Tạo cronjob để sync tự động mỗi đêm
   ```bash
   # Thêm vào crontab
   0 2 * * * cd /path/to/project && ./sync-users-only.sh
   ```

2. **Backup local trước khi sync:**
   ```bash
   pg_dump postgresql://postgres:postgres@localhost:5432/phuocbuu_local \
     > backup_before_sync_$(date +%Y%m%d).sql
   ```

3. **Anonymize sensitive data:**
   ```sql
   UPDATE "User" SET
     email = CONCAT('user', id, '@example.com'),
     password = '$2b$10$...' -- hash of 'password123'
   WHERE role != 'ADMIN';
   ```

4. **Giữ admin account:**
   ```sql
   -- Đảm bảo có admin account để login
   INSERT INTO "User" (id, email, password, "firstName", "lastName", role)
   VALUES (
     'admin-local',
     'admin@localhost',
     '$2b$10$...', -- bcrypt hash
     'Admin',
     'Local',
     'ADMIN'
   )
   ON CONFLICT (email) DO NOTHING;
   ```

## 🎯 Use Cases

### Development
```bash
# Sync users only - nhanh và đủ để test
./sync-users-only.sh
```

### Testing với full data
```bash
# Sync toàn bộ
./sync-db-simple.sh
```

### Demo/Presentation
```bash
# Sync và anonymize
./sync-users-only.sh
psql postgresql://postgres:postgres@localhost:5432/phuocbuu_local \
  -f scripts/anonymize-data.sql
```

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. PostgreSQL version: `psql --version` (cần >= 12)
2. Connection string format
3. Firewall settings
4. Database permissions

Log files:
- Import log: `/tmp/phuocbuu_import.log`
- PostgreSQL log: Check với `pg_config --sysconfdir`
