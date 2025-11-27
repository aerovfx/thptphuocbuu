# 📄 Hệ thống Đồng bộ Văn bản

## 🎯 Tổng quan

Hệ thống đồng bộ văn bản đảm bảo tính nhất quán giữa:
- **Space** (Không gian làm việc)
- **Department** (Tổ chuyên môn)
- **DMS** (Hệ thống quản lý văn bản)

---

## 🔄 Cơ chế Đồng bộ

### 1. **Auto-sync khi tạo văn bản**

Khi tạo văn bản mới (Incoming/Outgoing), hệ thống tự động:
- ✅ Đồng bộ với **spaces** từ `targetSpaces` (nếu có)
- ✅ Đồng bộ với **departments** mà người tạo là thành viên
- ✅ Đồng bộ với **space của department** (nếu department có space)

**Ví dụ:**
```
Giáo viên Toán (thuộc Tổ Toán) tạo văn bản:
→ Tự động gắn với:
  - Space "TO_CHUYEN_MON_SPACE" (space của Tổ Toán)
  - Department "Tổ Toán"
```

### 2. **Manual Sync**

Người dùng có thể:
- ✅ Gắn văn bản với spaces cụ thể
- ✅ Gắn văn bản với departments cụ thể
- ✅ Xóa liên kết với space/department

**API Endpoints:**
- `POST /api/documents/[id]/spaces` - Gắn với spaces
- `POST /api/documents/[id]/departments` - Gắn với departments
- `DELETE /api/documents/[id]/spaces?spaceId=...` - Xóa liên kết space
- `DELETE /api/documents/[id]/departments?departmentId=...` - Xóa liên kết department

### 3. **Sync với Department Space**

Khi văn bản được gắn với department:
- ✅ Tự động gắn với **space của department** đó
- ✅ Đảm bảo văn bản xuất hiện trong cả department và space

---

## 📊 Cấu trúc Dữ liệu

### SpaceDocument
```prisma
model SpaceDocument {
  id          String
  spaceId     String
  documentId  String  // ID của IncomingDocument hoặc OutgoingDocument
  documentType String // "INCOMING" | "OUTGOING"
  createdAt   DateTime
}
```

### DepartmentDocument
```prisma
model DepartmentDocument {
  id           String
  departmentId String
  documentId   String  // ID của IncomingDocument hoặc OutgoingDocument
  documentType String  // "INCOMING" | "OUTGOING"
  createdAt    DateTime
}
```

---

## 🛠️ Service Functions

### `syncDocumentToSpacesAndDepartments()`
Đồng bộ văn bản với spaces và departments cụ thể.

**Parameters:**
- `documentId`: ID của văn bản
- `documentType`: "INCOMING" | "OUTGOING"
- `spaceIds`: Array các space IDs cần gắn
- `departmentIds`: Array các department IDs cần gắn
- `removeFromSpaces`: Array các space IDs cần xóa
- `removeFromDepartments`: Array các department IDs cần xóa

### `autoSyncDocument()`
Tự động đồng bộ dựa trên người tạo và targetSpaces.

**Parameters:**
- `documentId`: ID của văn bản
- `documentType`: "INCOMING" | "OUTGOING"
- `createdById`: ID của người tạo
- `targetSpaces`: JSON string hoặc array của space IDs

### `syncDocumentWithDepartmentSpace()`
Đồng bộ văn bản với department và space của department đó.

**Parameters:**
- `documentId`: ID của văn bản
- `documentType`: "INCOMING" | "OUTGOING"
- `departmentId`: ID của department

### `getDocumentSpacesAndDepartments()`
Lấy tất cả spaces và departments mà văn bản đang được gắn.

### `removeDocumentFromAllSpacesAndDepartments()`
Xóa tất cả liên kết của văn bản.

---

## 🔐 Quyền Truy cập

### Tạo văn bản
- **Incoming**: ADMIN, TEACHER
- **Outgoing**: ADMIN, TEACHER

### Liên kết với Space/Department
- **ADMIN, SUPER_ADMIN, BGH**: Có thể liên kết bất kỳ văn bản nào
- **Người tạo**: Chỉ có thể liên kết văn bản của mình

### Xem văn bản
- Theo quyền truy cập của Space/Department
- Theo RBAC của Space

---

## 📝 Quy trình Đồng bộ

### Khi tạo văn bản mới:

```
1. Tạo văn bản (IncomingDocument/OutgoingDocument)
   ↓
2. Auto-sync:
   - Parse targetSpaces (nếu có)
   - Tìm departments của người tạo
   - Gắn với spaces và departments
   ↓
3. Nếu department có space:
   - Tự động gắn với space của department
```

### Khi cập nhật văn bản:

```
1. Cập nhật thông tin văn bản
   ↓
2. Nếu targetSpaces thay đổi:
   - Đồng bộ lại với spaces mới
   - Xóa liên kết với spaces cũ (nếu cần)
```

### Khi xóa văn bản:

```
1. Xóa văn bản (cascade delete)
   ↓
2. Tự động xóa:
   - Tất cả SpaceDocument liên quan
   - Tất cả DepartmentDocument liên quan
```

---

## 🎨 UI Integration

### Space Detail Page
- Tab "Văn bản" hiển thị tất cả văn bản trong space
- Có thể thêm/xóa văn bản khỏi space

### Department Detail Page
- Tab "Văn bản" hiển thị tất cả văn bản trong department
- Có thể thêm/xóa văn bản khỏi department

### Document Detail Page
- Hiển thị spaces và departments mà văn bản đang được gắn
- Có thể quản lý liên kết

---

## ⚠️ Lưu ý

1. **Polymorphic Reference**: 
   - `documentId` có thể là ID của `IncomingDocument` hoặc `OutgoingDocument`
   - Phân biệt bằng `documentType`

2. **Cascade Delete**:
   - Khi xóa văn bản, tất cả liên kết tự động xóa
   - Khi xóa space/department, liên kết cũng tự động xóa

3. **Unique Constraint**:
   - Một văn bản chỉ có thể gắn với một space/department một lần
   - Tránh duplicate entries

4. **Performance**:
   - Sử dụng `upsert` để tránh duplicate
   - Batch operations khi có nhiều spaces/departments

---

## 📚 Files liên quan

- **Service**: `lib/document-sync.ts`
- **API Routes**:
  - `app/api/documents/[id]/spaces/route.ts`
  - `app/api/documents/[id]/departments/route.ts`
- **Schema**: `prisma/schema.prisma` (SpaceDocument, DepartmentDocument)
- **Components**:
  - `components/Spaces/SpaceDocumentsList.tsx`
  - `components/Departments/DepartmentDetailContent.tsx`

---

## 🔄 Ví dụ Sử dụng

### Tự động đồng bộ khi tạo văn bản:
```typescript
// Trong API route tạo văn bản
const document = await prisma.outgoingDocument.create({...})

// Auto-sync
await autoSyncDocument(
  document.id,
  'OUTGOING',
  session.user.id,
  document.targetSpaces
)
```

### Manual sync:
```typescript
await syncDocumentToSpacesAndDepartments({
  documentId: 'doc-123',
  documentType: 'OUTGOING',
  spaceIds: ['space-1', 'space-2'],
  departmentIds: ['dept-1'],
})
```

### Sync với department space:
```typescript
await syncDocumentWithDepartmentSpace(
  'doc-123',
  'OUTGOING',
  'dept-1'
)
// Tự động gắn với space của department 'dept-1'
```

