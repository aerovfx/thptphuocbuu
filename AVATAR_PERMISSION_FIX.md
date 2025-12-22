# Sửa lỗi permission thay avatar và ảnh bìa

## Vấn đề

Chỉ admin mới có thể thay avatar và ảnh bìa, còn giáo viên và học sinh thì không thể thay avatar/ảnh bìa của chính mình.

## Nguyên nhân

### So sánh logic giữa Avatar và Cover Photo routes

**Cover Photo Route** (`/api/users/[id]/cover/route.ts`):
```typescript
// Dùng trực tiếp session.user.id
if (session.user.id !== id && session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Avatar Route (trước khi sửa)** (`/api/users/[id]/avatar/route.ts`):
```typescript
// Dùng resolveCurrentUserId() - có thể trả về null hoặc ID khác
const currentUserId = await resolveCurrentUserId(session)
if (!currentUserId) {
  return NextResponse.json({ error: 'Session không hợp lệ...' }, { status: 401 })
}

const role = session?.user?.role
const isPrivileged = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BGH'

if (currentUserId !== id && !isPrivileged) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Vấn đề với `resolveCurrentUserId()`

Hàm này có thể:
1. **Trả về null** nếu:
   - `session.user.id` không tồn tại hoặc là empty string
   - User không tồn tại trong database
   - Email không tìm thấy user

2. **Trả về ID khác** nếu:
   - `session.user.id` không tồn tại nhưng tìm được user bằng email
   - Có thể có race condition hoặc data inconsistency

3. **So sánh string không chính xác**:
   - Có thể có vấn đề với type coercion
   - Empty string vs null vs undefined

### Tại sao Admin vẫn hoạt động?

Admin hoạt động vì logic check:
```typescript
if (currentUserId !== id && !isPrivileged) {
  // Forbidden
}
```

Nếu `isPrivileged = true` (role là ADMIN/SUPER_ADMIN/BGH), thì điều kiện `!isPrivileged` sẽ là `false`, nên không vào block Forbidden.

Nhưng nếu `currentUserId` là null hoặc không khớp với `id`, và user không phải admin, thì sẽ bị Forbidden.

## Giải pháp

### Sửa Avatar Route để giống Cover Photo Route

**Sau khi sửa**:
```typescript
// Kiểm tra session.user.id trực tiếp
if (!session.user?.id) {
  return NextResponse.json(
    { error: 'Session không hợp lệ. Vui lòng đăng nhập lại.' },
    { status: 401 }
  )
}

const currentUserId = session.user.id
const role = session.user.role
const isPrivileged = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'BGH'

// Logic giống cover photo route
if (currentUserId !== id && !isPrivileged) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Lợi ích

1. **Nhất quán**: Cùng logic với cover photo route
2. **Đơn giản hơn**: Không cần query database để resolve user ID
3. **Tin cậy hơn**: Dùng trực tiếp session.user.id từ NextAuth
4. **Dễ debug**: Log rõ ràng hơn

## Logic Permission

### Cho phép thay avatar/ảnh bìa khi:

1. **User thay của chính mình**: `currentUserId === id`
   - ✅ Giáo viên thay avatar của chính mình
   - ✅ Học sinh thay avatar của chính mình
   - ✅ Bất kỳ user nào thay avatar của chính mình

2. **Admin thay của người khác**: `isPrivileged === true`
   - ✅ ADMIN thay avatar của bất kỳ ai
   - ✅ SUPER_ADMIN thay avatar của bất kỳ ai
   - ✅ BGH thay avatar của bất kỳ ai

### Không cho phép khi:

- ❌ Giáo viên thay avatar của học sinh khác
- ❌ Học sinh thay avatar của giáo viên
- ❌ User thường thay avatar của người khác

## Testing

### Test Case 1: User thay avatar của chính mình
```typescript
// User ID: user123
// Session: { user: { id: 'user123', role: 'STUDENT' } }
// Request: POST /api/users/user123/avatar
// Expected: ✅ 200 OK
```

### Test Case 2: Admin thay avatar của người khác
```typescript
// User ID: user456
// Session: { user: { id: 'admin123', role: 'ADMIN' } }
// Request: POST /api/users/user456/avatar
// Expected: ✅ 200 OK
```

### Test Case 3: User thay avatar của người khác
```typescript
// User ID: user456
// Session: { user: { id: 'user123', role: 'STUDENT' } }
// Request: POST /api/users/user456/avatar
// Expected: ❌ 403 Forbidden
```

### Test Case 4: Giáo viên thay avatar của chính mình
```typescript
// User ID: teacher123
// Session: { user: { id: 'teacher123', role: 'TEACHER' } }
// Request: POST /api/users/teacher123/avatar
// Expected: ✅ 200 OK
```

## Logging

Đã thêm logging chi tiết để debug:
```typescript
console.log('[Avatar Upload] User ID from params:', id)
console.log('[Avatar Upload] Session user ID:', session.user?.id)
console.log('[Avatar Upload] Session user role:', session.user?.role)
console.log('[Avatar Upload] Permission granted')
```

## File đã được cập nhật

- `app/api/users/[id]/avatar/route.ts` - Sửa logic permission để giống cover photo route

## Lưu ý

- Hàm `resolveCurrentUserId()` vẫn còn trong file nhưng không còn được sử dụng
- Có thể xóa hàm này trong tương lai để clean up code
- Logic permission giờ đã nhất quán giữa avatar và cover photo routes

