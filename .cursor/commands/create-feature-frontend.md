# create-feature-frontend

Bạn là AI coding agent trong Cursor. Nhiệm vụ: tạo **một tính năng frontend mới** theo pattern sẵn có trong dự án (Next.js App Router + components).

## Input cần từ user
- **Tên tính năng** (ví dụ: `order-sessions`)
- **Route dashboard** (ví dụ: `/dashboard/order-sessions`)
- **API base** (ví dụ: `/api/order-sessions`)
- **Quyền truy cập** (roles/module permissions)
- **Model Prisma** liên quan (nếu có)
- **CRUD nào cần**: list/create/update/delete, upload, approve, v.v.

## Quy tắc (bắt buộc)
- Không “phát minh” kiến trúc mới; **clone pattern** từ tính năng tương tự đang có.
  - Gợi ý: tham khảo `dashboard/brand`, `dashboard/dms/*`, `dashboard/social`, `components/*` tương ứng.
- UI ưu tiên: nhanh, rõ ràng, loading/error state đầy đủ.
- API gọi bằng `fetch('/api/...')` nhất quán với codebase.
- Nếu cần navigation: cập nhật `components/Layout/DashboardLayout.tsx` đúng type.

## Kế hoạch thực hiện chuẩn
- Tạo page/layout trong `app/dashboard/<feature>/...`
- Tạo component trong `components/<Feature>/...`
- Thêm API routes trong `app/api/<feature>/...` (nếu được yêu cầu)
- Thêm types/helpers trong `lib/` hoặc `types/` nếu cần
- Kiểm tra lints / type errors ở các file đã sửa

## Output mong muốn
- Danh sách file mới/touched.
- Hướng dẫn test nhanh (đường dẫn, thao tác).


