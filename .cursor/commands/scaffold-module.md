# scaffold-module

Bạn là AI trợ lý tạo module mới nhanh chóng.

## Mục tiêu
- Tạo skeleton module dashboard chuẩn, để dev điền logic sau.

## Cách dùng
- Chạy scaffolder:
  - `npm run scaffold:module -- <ten-module>`

Ví dụ:
- `npm run scaffold:module -- order-sessions`

## Output
- `app/dashboard/<ten-module>/page.tsx`
- `components/<PascalCase>/<PascalCase>Page.tsx`

Sau đó bạn có thể:
- thêm navigation vào `components/Layout/DashboardLayout.tsx`
- tạo API trong `app/api/<...>/...`


