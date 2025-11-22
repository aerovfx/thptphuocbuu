# Hướng dẫn tắt logs trong production

Đã tạo utility logger tại `lib/logger.ts` để tự động tắt các debug logs trong production.

## Các file đã được cập nhật:
- ✅ `lib/logger.ts` - Logger utility mới
- ✅ `lib/prisma.ts` - Đã xóa DATABASE_URL log
- ✅ `lib/auth.ts` - Đã thay thế tất cả console.log bằng logger
- ✅ `app/api/auth/forgot-password/route.ts` - Đã thay thế console.log bằng logger

## Cách sử dụng logger:

```typescript
import { logger } from '@/lib/logger'

// Chỉ log trong development
logger.log('Debug message')
logger.debug('Debug info')
logger.info('Info message')

// Luôn log errors (nhưng sanitize trong production)
logger.error('Error message', error)

// Chỉ log warnings trong development
logger.warn('Warning message')
```

## Các file còn lại cần cập nhật (tùy chọn):

Các API routes và components vẫn sử dụng `console.error` trực tiếp. Điều này ổn vì:
- `console.error` vẫn cần thiết để log errors trong production
- Chỉ cần tắt các debug logs (console.log, console.debug)

Nếu muốn tắt hoàn toàn, có thể thay thế `console.error` bằng `logger.error` trong các file quan trọng.

