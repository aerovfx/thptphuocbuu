# sql-schema

Bạn là AI coding agent trong Cursor. Nhiệm vụ: hỗ trợ thiết kế/triển khai thay đổi **database schema** cho dự án này (Next.js + Prisma + Postgres).

## Mục tiêu
- Thay đổi schema an toàn, có migration rõ ràng.
- Không làm “vỡ” production; ưu tiên backward-compatible.
- Luôn giữ **Prisma schema** là source of truth: `prisma/schema.prisma`.

## Thông tin cần bạn hỏi lại (nếu user chưa đưa)
- **Mô tả nghiệp vụ** + ví dụ dữ liệu.
- **Entity/Model** cần thêm/sửa/xóa.
- **Ràng buộc**: unique, FK, cascade, index, enum, nullable.
- **Kế hoạch migrate dữ liệu** (nếu đổi cột/đổi kiểu).

## Quy tắc triển khai
- **Không sửa trực tiếp DB production** bằng tay.
- Migration phải chạy được trong CI/Cloud Build:
  - `npx prisma generate`
  - `npx prisma migrate deploy` (prod)
- Tránh breaking change:
  - Thêm cột nullable trước → backfill → mới set NOT NULL.
  - Tránh drop/rename trực tiếp nếu có traffic (dùng add + dual write nếu cần).

## Checklist bắt buộc
- Cập nhật `prisma/schema.prisma`.
- Nếu có quan hệ mới: thêm `@@index` cho FK thường query.
- Nếu có field lookup nhiều: thêm index phù hợp.
- Update code Prisma queries bị ảnh hưởng.
- Nếu cần seed/dev script: thêm trong `app/scripts/` hoặc `scripts/`.

## Output mong muốn
- Danh sách file thay đổi (Prisma schema + migrations + code usage).
- Lý do thiết kế (constraints/indexes).
- Hướng dẫn deploy/migrate production ngắn gọn.


