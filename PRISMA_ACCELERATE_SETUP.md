# 🚀 Prisma Accelerate Setup Guide

## Tổng quan

Prisma Accelerate là một service của Prisma giúp:
- **Connection Pooling**: Quản lý kết nối database hiệu quả
- **Query Caching**: Cache các queries thường dùng
- **Global Edge Network**: Giảm latency với edge locations
- **Auto-scaling**: Tự động scale theo traffic

## Connection String

Connection string đã được cấu hình:

```
prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19lWWt0anpQSVBHWWxuQkZtZ2c4M20iLCJhcGlfa2V5IjoiMDFLQ1AxUDhFUU04WEYwUlMyQzZaTjlQREciLCJ0ZW5hbnRfaWQiOiIzYzE1ZTgwZjcwMTU1Njg1NjQwZWVmY2Q1YjFjMTQ4NWVjNzcwYzYyYThjNWRlZjU5YjkzNTIyN2FiNDI5ZWY4IiwiaW50ZXJuYWxfc2VjcmV0IjoiNTM4MTFiMDMtYmY2My00MjgyLTg0OTYtMjlmNDEzNTcyOTQ2In0.ZUNycMMaqGyeTjPDuzZrjbiNbZJ3qtPFBwIWa6J99jA
```

## Cấu hình

### 1. Environment Variables

Thêm vào file `.env`:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

### 2. Code Configuration

Code đã được cấu hình tự động trong `lib/prisma.ts`:

```typescript
import { withAccelerate } from '@prisma/extension-accelerate'

// Tự động detect Prisma Accelerate connection string
const isAccelerate = databaseUrl.startsWith('prisma+')

export const prisma = isAccelerate
  ? basePrisma.$extends(withAccelerate())
  : basePrisma
```

### 3. Dependencies

Package `@prisma/extension-accelerate` đã được cài đặt trong `package.json`.

## Sử dụng

### Development

1. Copy `.env.example` thành `.env`
2. Set `DATABASE_URL` với Prisma Accelerate connection string
3. Chạy migrations:

```bash
npx prisma generate
npx prisma db push
```

### Production (Cloud Run)

Set environment variable trong Cloud Run:

```bash
gcloud run services update phuocbuu \
  --region=asia-southeast1 \
  --update-env-vars \
    DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

## Lợi ích

### 1. Connection Pooling
- Tự động quản lý connection pool
- Giảm số lượng connections đến database
- Tối ưu cho serverless environments (Cloud Run)

### 2. Query Caching
- Cache các queries thường dùng
- Giảm load trên database
- Tăng tốc độ response

### 3. Global Edge Network
- Edge locations gần users
- Giảm latency
- Cải thiện performance

### 4. Auto-scaling
- Tự động scale theo traffic
- Không cần cấu hình thủ công
- Phù hợp với Cloud Run

## Migration từ Direct Connection

Nếu đang dùng direct PostgreSQL connection:

### Before:
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

### After:
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY"
```

Code sẽ tự động detect và sử dụng Accelerate extension.

## Troubleshooting

### Lỗi: "Invalid connection string"
- Kiểm tra connection string có đúng format `prisma+postgres://...`
- Đảm bảo API key còn valid

### Lỗi: "Extension not found"
```bash
npm install @prisma/extension-accelerate
```

### Lỗi: "Connection timeout"
- Kiểm tra network connectivity
- Verify API key permissions
- Check Prisma Accelerate dashboard

### Switch về Direct Connection

Nếu cần switch về direct connection:

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

Code sẽ tự động không sử dụng Accelerate extension.

## Monitoring

### Prisma Accelerate Dashboard

1. Đăng nhập vào [Prisma Cloud](https://cloud.prisma.io/)
2. Chọn project
3. Xem metrics:
   - Query performance
   - Cache hit rate
   - Connection pool usage
   - Error rates

### Logs

Prisma Accelerate logs sẽ xuất hiện trong:
- Cloud Run logs
- Prisma Cloud dashboard
- Application logs (nếu enable)

## Best Practices

1. **Always use Accelerate in Production**
   - Tối ưu cho serverless
   - Connection pooling tự động
   - Better performance

2. **Monitor Cache Hit Rate**
   - Optimize queries nếu cache hit rate thấp
   - Review slow queries

3. **Set Appropriate Timeouts**
   - Default timeouts đã được optimize
   - Adjust nếu cần

4. **Use Direct Connection for Migrations**
   - Migrations nên chạy với direct connection
   - Accelerate chỉ cho queries

## Tài liệu tham khảo

- [Prisma Accelerate Documentation](https://www.prisma.io/docs/accelerate)
- [Prisma Cloud Dashboard](https://cloud.prisma.io/)
- [Connection String Format](https://www.prisma.io/docs/accelerate/getting-started)

