# DATABASE SCHEMA STRUCTURE RULE

## Source of truth
- Dự án này dùng **Prisma** → schema chuẩn nằm ở: `prisma/schema.prisma`
- Migrations nằm ở: `prisma/migrations/`

## Nguyên tắc thay đổi schema
- Ưu tiên **backward-compatible**:
  - add column nullable → backfill → set NOT NULL
  - add index/constraint có kế hoạch rollout
- Tránh “drop/rename” trực tiếp khi đang có traffic (nếu cần, làm theo 2-phase).
- Mọi thay đổi phải đi kèm update code (queries, API payloads).

## Thực thi migration
- Local/dev: `npx prisma migrate dev`
- Production/Cloud Run: `npx prisma migrate deploy`
- Luôn chạy `npx prisma generate` sau khi đổi schema.

## Indexing (gợi ý)
- Thêm `@@index([<foreignKey>])` cho các FK hay query.
- Thêm `@@unique([...])` cho constraint nghiệp vụ.

## Error handling
Các lỗi Prisma hay gặp cần handle trong API:
- `P2002` (unique violation) → trả 409
- `P2003` (foreign key violation) → trả 400/409 + message rõ ràng


