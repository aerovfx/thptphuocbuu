# Sửa lỗi cập nhật ngày sinh

## Vấn đề

Thông tin ngày sinh không thể cập nhật được trong trang cài đặt tài khoản.

## Nguyên nhân

### Schema Validation Issue

Schema validation ban đầu:
```typescript
dateOfBirth: z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable(),
```

**Vấn đề**: 
- Khi frontend gửi `dateOfBirth: ''` (empty string), validation sẽ fail vì:
  1. `.trim()` vẫn giữ empty string
  2. `.regex(/^\d{4}-\d{2}-\d{2}$/)` không match với empty string
  3. `.optional()` chỉ cho phép field không có hoặc `undefined`, không phải empty string
  4. `.nullable()` cho phép `null`, nhưng không phải empty string

### Flow của dữ liệu

1. **Frontend** (`AccountSettingsClient.tsx`):
   ```typescript
   dateOfBirth: dateOfBirth ? dateOfBirth : null,
   ```
   - Nếu `dateOfBirth` là empty string `''`, nó sẽ gửi `null`
   - Nhưng nếu có giá trị, nó sẽ gửi string `'YYYY-MM-DD'`

2. **API Route** (`/api/users/me`):
   - Nhận body và parse với schema
   - Nếu validation fail → trả về 400 với error details

3. **Vấn đề**: 
   - Có thể frontend gửi empty string thay vì null
   - Hoặc có edge case khác với date format

## Giải pháp

### 1. Sửa Schema Validation

**Trước**:
```typescript
dateOfBirth: z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable(),
```

**Sau**:
```typescript
dateOfBirth: z
  .union([
    z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/), // Valid date format
    z.string().trim().length(0), // Empty string
    z.null(), // Null
  ])
  .transform((val) => {
    // Transform empty string to null
    if (val === '' || val === null) return null
    return val
  })
  .optional()
  .nullable(),
```

### 2. Cải thiện Logging

Thêm logging chi tiết để debug:
```typescript
console.log('[Update Profile] Request body:', JSON.stringify(body, null, 2))
console.log('[Update Profile] Parsed data:', JSON.stringify(data, null, 2))
console.log('[Update Profile] Parsed dateOfBirth:', dobDate?.toISOString())
console.log('[Update Profile] Setting dateOfBirth in updateData:', updateData.dateOfBirth)
```

### 3. Cải thiện Logic Xử lý

**Trước**:
```typescript
if (data.dateOfBirth) {
  dobDate = new Date(`${data.dateOfBirth}T12:00:00.000Z`)
  // ...
}
```

**Sau**:
```typescript
if (data.dateOfBirth && data.dateOfBirth !== null && data.dateOfBirth.trim() !== '') {
  dobDate = new Date(`${data.dateOfBirth}T12:00:00.000Z`)
  // ...
} else {
  console.log('[Update Profile] dateOfBirth is null or empty, will set to null')
}
```

## Cách Test

### Test Case 1: Cập nhật với ngày sinh hợp lệ
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15"
}
```
**Expected**: ✅ 200 OK, dateOfBirth được cập nhật

### Test Case 2: Xóa ngày sinh (set null)
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": null
}
```
**Expected**: ✅ 200 OK, dateOfBirth được set thành null

### Test Case 3: Gửi empty string
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": ""
}
```
**Expected**: ✅ 200 OK, dateOfBirth được transform thành null

### Test Case 4: Format không hợp lệ
```json
{
  "dateOfBirth": "1990/01/15"
}
```
**Expected**: ❌ 400 Bad Request, validation error

## Debug Steps

1. **Kiểm tra Request Body**:
   - Mở DevTools → Network tab
   - Tìm request PUT đến `/api/users/me`
   - Xem Request Payload

2. **Kiểm tra Server Logs**:
   - Xem console logs với prefix `[Update Profile]`
   - Kiểm tra parsed data và update data

3. **Kiểm tra Response**:
   - Xem response status và body
   - Nếu 400, xem error details

4. **Kiểm tra Database**:
   ```sql
   SELECT id, email, firstName, lastName, dateOfBirth 
   FROM "User" 
   WHERE id = 'USER_ID';
   ```

## File đã được cập nhật

- `app/api/users/me/route.ts`:
  - Sửa schema validation để cho phép empty string
  - Thêm transform để convert empty string thành null
  - Cải thiện logging
  - Cải thiện logic xử lý dateOfBirth

## Lưu ý

- Schema validation giờ cho phép:
  - Valid date format: `'YYYY-MM-DD'`
  - Empty string: `''` (sẽ được transform thành null)
  - Null: `null`
  - Undefined: field không có trong request

- Date được lưu ở UTC noon để tránh timezone issues:
  ```typescript
  dobDate = new Date(`${data.dateOfBirth}T12:00:00.000Z`)
  ```

- Response trả về date dưới dạng `YYYY-MM-DD`:
  ```typescript
  dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.toISOString().slice(0, 10) : null
  ```

