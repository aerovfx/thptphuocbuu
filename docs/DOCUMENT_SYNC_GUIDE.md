# Hướng dẫn Đồng bộ Văn bản DMS với Spaces và Tổ chuyên môn

## Tổng quan

Hệ thống đồng bộ tự động quản lý việc gán văn bản từ DMS (Document Management System) vào các Spaces và Tổ chuyên môn (Departments) liên quan.

## Tính năng

### 1. Đồng bộ tự động

Khi tạo văn bản mới (văn bản đến hoặc văn bản đi), hệ thống sẽ tự động:

- ✅ Gán văn bản vào **Space "Văn bản"** (VAN_BAN_SPACE)
- ✅ Gán văn bản vào các **Tổ chuyên môn** mà người tạo là thành viên
- ✅ Gán văn bản vào **Spaces** của các Tổ chuyên môn liên quan
- ✅ Gán văn bản vào các **Spaces** được chỉ định trong `targetSpaces`

### 2. Đồng bộ thủ công

Bạn có thể đồng bộ văn bản thủ công thông qua:

- **UI Component**: `DocumentSyncManager` - Component React để quản lý đồng bộ
- **API Endpoints**: 
  - `POST /api/documents/sync` - Đồng bộ văn bản cụ thể
  - `PUT /api/documents/sync/auto` - Tự động đồng bộ văn bản
  - `POST /api/documents/sync/bulk` - Đồng bộ hàng loạt

### 3. Đồng bộ hàng loạt

Script để đồng bộ tất cả văn bản hiện có:

```bash
npx tsx app/scripts/sync-all-documents.ts
```

## Cách sử dụng

### Đồng bộ tự động khi tạo văn bản

Hệ thống tự động đồng bộ khi:
- Tạo văn bản đến mới (`POST /api/dms/incoming`)
- Tạo văn bản đi mới (`POST /api/dms/outgoing`)

Không cần thao tác gì thêm, văn bản sẽ tự động được gán vào các bộ phận liên quan.

### Đồng bộ thủ công qua UI

Sử dụng component `DocumentSyncManager`:

```tsx
import DocumentSyncManager from '@/components/Documents/DocumentSyncManager'

<DocumentSyncManager
  documentId="doc-123"
  documentType="INCOMING"
  onSyncComplete={() => {
    console.log('Đồng bộ hoàn tất!')
  }}
/>
```

### Đồng bộ thủ công qua API

#### Đồng bộ văn bản cụ thể

```typescript
const response = await fetch('/api/documents/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    documentId: 'doc-123',
    documentType: 'INCOMING',
    spaceIds: ['space-1', 'space-2'],
    departmentIds: ['dept-1'],
    removeFromSpaces: ['space-old'],
    removeFromDepartments: ['dept-old'],
  }),
})
```

#### Tự động đồng bộ

```typescript
const response = await fetch('/api/documents/sync/auto', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    documentId: 'doc-123',
    documentType: 'INCOMING',
    createdById: 'user-123',
    targetSpaces: '["space-1", "space-2"]', // JSON string hoặc null
  }),
})
```

#### Đồng bộ hàng loạt

```typescript
const response = await fetch('/api/documents/sync/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    documentType: 'INCOMING', // hoặc 'OUTGOING', hoặc không có để đồng bộ cả hai
    limit: 100, // Số lượng văn bản tối đa để đồng bộ
  }),
})
```

## Logic đồng bộ

### 1. Đồng bộ với Space "Văn bản"

Tất cả văn bản sẽ tự động được gán vào Space có `code: 'VAN_BAN_SPACE'`. Đây là space chính để quản lý tất cả văn bản trong hệ thống.

### 2. Đồng bộ với Tổ chuyên môn

Văn bản sẽ được gán vào các Tổ chuyên môn mà người tạo là thành viên (với `isActive: true`).

### 3. Đồng bộ với Spaces của Tổ chuyên môn

Nếu Tổ chuyên môn có `spaceId`, văn bản cũng sẽ được gán vào Space đó.

### 4. Đồng bộ với targetSpaces

Nếu văn bản có `targetSpaces` (JSON string hoặc array), các spaces này sẽ được thêm vào danh sách đồng bộ.

## Cấu trúc dữ liệu

### SpaceDocument

```prisma
model SpaceDocument {
  id          String   @id @default(cuid())
  spaceId     String
  documentId  String
  documentType String  // "OUTGOING" | "INCOMING"
  visibility  SpaceVisibility @default(INTERNAL)
  assignedAt  DateTime @default(now())
  
  @@unique([spaceId, documentId, documentType])
}
```

### DepartmentDocument

```prisma
model DepartmentDocument {
  id           String   @id @default(cuid())
  departmentId String
  documentId   String
  documentType String   // "OUTGOING" | "INCOMING"
  assignedAt   DateTime @default(now())
  
  @@unique([departmentId, documentId, documentType])
}
```

## Quyền truy cập

- **Đồng bộ thủ công**: ADMIN, SUPER_ADMIN, BGH, TEACHER
- **Đồng bộ hàng loạt**: Chỉ ADMIN và SUPER_ADMIN

## Lưu ý

1. **Đồng bộ tự động** chỉ xảy ra khi tạo văn bản mới. Văn bản cũ cần được đồng bộ thủ công hoặc chạy script đồng bộ hàng loạt.

2. **Không trùng lặp**: Hệ thống sử dụng `upsert` để tránh tạo bản ghi trùng lặp.

3. **Xóa đồng bộ**: Bạn có thể xóa văn bản khỏi space/department bằng cách sử dụng `removeFromSpaces` và `removeFromDepartments`.

4. **Hiệu suất**: Đồng bộ hàng loạt có giới hạn mặc định là 100 văn bản mỗi lần để tránh quá tải.

## Troubleshooting

### Văn bản không được đồng bộ tự động

1. Kiểm tra xem Space "Văn bản" có tồn tại không:
   ```sql
   SELECT * FROM spaces WHERE code = 'VAN_BAN_SPACE';
   ```

2. Kiểm tra xem người tạo có thuộc Tổ chuyên môn nào không:
   ```sql
   SELECT * FROM department_members WHERE userId = 'user-id' AND isActive = 1;
   ```

3. Kiểm tra logs trong console để xem lỗi cụ thể.

### Lỗi khi đồng bộ hàng loạt

- Kiểm tra số lượng văn bản: Có thể cần tăng `limit` hoặc chạy nhiều lần
- Kiểm tra quyền truy cập: Chỉ ADMIN và SUPER_ADMIN mới có thể đồng bộ hàng loạt
- Kiểm tra database connection: Đảm bảo database đang hoạt động

## Ví dụ sử dụng

### Đồng bộ tất cả văn bản hiện có

```bash
# Chạy script đồng bộ
npx tsx app/scripts/sync-all-documents.ts
```

Script sẽ:
1. Tìm tất cả văn bản đến và văn bản đi
2. Đồng bộ từng văn bản với spaces và departments
3. Đồng bộ tất cả văn bản vào Space "Văn bản"
4. Hiển thị thống kê kết quả

### Tích hợp vào trang quản lý văn bản

```tsx
import DocumentSyncManager from '@/components/Documents/DocumentSyncManager'

export default function DocumentDetailPage({ documentId, documentType }) {
  return (
    <div>
      {/* Nội dung văn bản */}
      
      {/* Component đồng bộ */}
      <DocumentSyncManager
        documentId={documentId}
        documentType={documentType}
        onSyncComplete={() => {
          // Refresh data
          router.refresh()
        }}
      />
    </div>
  )
}
```

## API Reference

Xem chi tiết trong:
- `app/api/documents/sync/route.ts`
- `app/api/documents/sync/bulk/route.ts`
- `lib/document-sync.ts`

