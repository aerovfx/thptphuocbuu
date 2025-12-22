# Phân tích và sửa lỗi 403 khi tải Avatar

## Lỗi
```
/api/users/cmi3f654a0002gqci0tqrw1vl/avatar:1  Failed to load resource: the server responded with a status of 403 ()
```

## Nguyên nhân

### Vấn đề chính
Endpoint `/api/users/[id]/avatar` **chỉ có POST method** để upload avatar, nhưng **không có GET method** để tải avatar. Khi browser hoặc Next.js Image component cố gắng tải avatar từ URL này, nó gửi GET request và nhận lỗi 403 (Forbidden) hoặc 405 (Method Not Allowed).

### Các tình huống có thể xảy ra:

1. **Avatar URL trong database bị sai format**
   - Thay vì lưu GCS URL: `https://storage.googleapis.com/...`
   - Lại lưu API endpoint: `/api/users/[id]/avatar`
   - → Browser cố tải từ API endpoint → 403

2. **Next.js Image component tự động optimize**
   - Next.js Image component có thể tự động thử optimize image từ API endpoint
   - Nếu endpoint không hỗ trợ GET → 403

3. **Missing GET handler**
   - Endpoint chỉ có POST, không có GET
   - Khi có request GET → Next.js trả về 403 hoặc 405

## Giải pháp đã thực hiện

### 1. Thêm GET handler cho endpoint `/api/users/[id]/avatar`

GET handler sẽ:
- Lấy avatar URL từ database
- Nếu avatar là GCS URL (http/https), redirect đến đó
- Nếu không có avatar, trả về 404
- Không yêu cầu authentication (public access)

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user avatar from database
    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user has an avatar URL, redirect to it
    if (user.avatar) {
      // If it's already a full URL (GCS URL), redirect to it
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        return NextResponse.redirect(user.avatar)
      }
      // If it's a relative path, construct full URL
      return NextResponse.json({ avatar: user.avatar })
    }

    // No avatar found
    return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}
```

### 2. Kiểm tra và sửa avatar URLs trong database

Nếu có avatar URLs bị lưu sai (lưu API endpoint thay vì GCS URL), cần sửa:

```sql
-- Kiểm tra avatars bị lưu sai
SELECT id, email, avatar 
FROM "User" 
WHERE avatar LIKE '/api/users/%/avatar';

-- Nếu có, cần update lại với GCS URL đúng
-- (Cần tìm lại GCS URL từ logs hoặc upload lại)
```

### 3. Đảm bảo Avatar component sử dụng đúng URL

Avatar component nên nhận GCS URL trực tiếp, không phải API endpoint:

```tsx
// ✅ Đúng
<Avatar src="https://storage.googleapis.com/thptphuocbuu360/avatars/xxx.jpg" />

// ❌ Sai
<Avatar src="/api/users/userId/avatar" />
```

## Cách kiểm tra

### 1. Kiểm tra avatar URL trong database
```sql
SELECT id, email, avatar FROM "User" WHERE id = 'cmi3f654a0002gqci0tqrw1vl';
```

### 2. Kiểm tra response từ API
```bash
curl -I https://your-domain.com/api/users/cmi3f654a0002gqci0tqrw1vl/avatar
```

### 3. Kiểm tra trong browser console
- Mở DevTools → Network tab
- Tìm request đến `/api/users/[id]/avatar`
- Xem response status và headers

### 4. Kiểm tra trong code
Tìm nơi sử dụng avatar và đảm bảo dùng GCS URL:
```bash
grep -r "avatar" components/ --include="*.tsx" | grep "src\|url"
```

## Các trường hợp đặc biệt

### Trường hợp 1: Avatar URL là relative path
Nếu avatar được lưu dưới dạng relative path (không phải full URL), GET handler sẽ trả về JSON với avatar URL. Frontend cần xử lý trường hợp này.

**Giải pháp tốt hơn**: Luôn lưu full GCS URL trong database.

### Trường hợp 2: CORS issues với GCS
Nếu GCS bucket không cho phép CORS từ domain của bạn, browser sẽ chặn request.

**Giải pháp**: Cấu hình CORS cho GCS bucket:
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

### Trường hợp 3: GCS file permissions
Nếu file trên GCS không public, sẽ không thể truy cập trực tiếp.

**Giải pháp**: Đảm bảo file được upload với `public: true`:
```typescript
const result = await uploadFileFromFormData(file, 'avatars', {
  public: true,
  cacheControl: 'public, max-age=31536000',
})
```

## Best Practices

1. **Luôn lưu full GCS URL trong database**
   ```typescript
   avatar: "https://storage.googleapis.com/bucket-name/path/to/file.jpg"
   ```

2. **Sử dụng GCS URL trực tiếp trong frontend**
   ```tsx
   <Image src={user.avatar} /> // GCS URL
   ```

3. **API endpoint chỉ dùng để upload, không dùng để serve**
   - POST `/api/users/[id]/avatar` → Upload
   - GET `/api/users/[id]/avatar` → Redirect to GCS (fallback)

4. **Validate avatar URL format khi upload**
   ```typescript
   if (!result.publicUrl.startsWith('http')) {
     throw new Error('Invalid avatar URL format')
   }
   ```

## Testing

### Test GET endpoint
```bash
# Should redirect to GCS URL
curl -I http://localhost:3000/api/users/USER_ID/avatar

# Should return 404 if no avatar
curl http://localhost:3000/api/users/NONEXISTENT_ID/avatar
```

### Test trong browser
1. Mở DevTools → Network
2. Tải trang có avatar
3. Kiểm tra request đến avatar URL
4. Đảm bảo không có lỗi 403

## File đã được cập nhật

- `app/api/users/[id]/avatar/route.ts` - Thêm GET handler

