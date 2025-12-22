# Hướng dẫn Debug lỗi thay avatar

## Các bước kiểm tra

### 1. Kiểm tra Console Logs

Sau khi thử upload avatar, kiểm tra server logs để xem lỗi cụ thể:

```
[Avatar Upload] Starting upload process...
[Avatar Upload] User ID: xxx
[Avatar Upload] Parsing form data...
[Avatar Upload] File info: { name: '...', type: '...', size: ... }
[Avatar Upload] Uploading to GCS...
[Avatar Upload] Upload successful: https://...
[Avatar Upload] Database updated successfully: https://...
```

### 2. Các lỗi thường gặp

#### Lỗi 401: Unauthorized
**Nguyên nhân**: Không có session hoặc session không hợp lệ

**Giải pháp**:
- Đăng nhập lại
- Kiểm tra cookies/session
- Xem log: `[Avatar Upload] No session found` hoặc `[Avatar Upload] Could not resolve current user ID`

#### Lỗi 403: Forbidden
**Nguyên nhân**: Cố gắng thay avatar của người khác (không phải admin)

**Giải pháp**:
- Chỉ có thể thay avatar của chính mình
- Admin/SUPER_ADMIN/BGH có thể thay avatar của người khác
- Xem log: `[Avatar Upload] Forbidden: currentUserId: xxx targetId: yyy`

#### Lỗi 400: No file provided
**Nguyên nhân**: Không có file trong request

**Giải pháp**:
- Kiểm tra frontend code có gửi file đúng không
- Kiểm tra FormData có append file với key `'file'` không
- Xem log: `[Avatar Upload] No file provided`

#### Lỗi 400: File must be an image
**Nguyên nhân**: File không phải là image

**Giải pháp**:
- Chọn file ảnh (jpg, png, gif, webp, etc.)
- Xem log: `[Avatar Upload] Invalid file type: ...`

#### Lỗi 400: File size must be less than 5MB
**Nguyên nhân**: File quá lớn

**Giải pháp**:
- Nén ảnh hoặc chọn ảnh nhỏ hơn 5MB
- Xem log: `[Avatar Upload] File too large: ...`

#### Lỗi 500: GCS upload error
**Nguyên nhân**: Lỗi khi upload lên Google Cloud Storage

**Giải pháp**:
- Kiểm tra GCS credentials (GOOGLE_APPLICATION_CREDENTIALS)
- Kiểm tra GCS bucket permissions
- Kiểm tra network connection
- Xem log: `[Avatar Upload] GCS upload error: ...`

#### Lỗi 500: Database update error
**Nguyên nhân**: Lỗi khi cập nhật database

**Giải pháp**:
- Kiểm tra database connection
- Kiểm tra Prisma schema
- Xem log: `[Avatar Upload] Database update error: ...`

### 3. Kiểm tra Frontend

#### Kiểm tra request được gửi đúng không

Mở DevTools → Network tab → Tìm request POST đến `/api/users/[id]/avatar`:

- **Request Headers**: 
  - Phải có `Content-Type: multipart/form-data`
  - Phải có cookies/session

- **Request Payload**:
  - Phải có field `file` với file được chọn

- **Response**:
  - Status code: 200 nếu thành công
  - Body: `{ success: true, avatar: "...", url: "..." }`

#### Kiểm tra code frontend

```typescript
// ✅ Đúng
const formData = new FormData()
formData.append('file', file) // Key phải là 'file'

const res = await fetch(`/api/users/${userId}/avatar`, {
  method: 'POST',
  body: formData, // Không set Content-Type header, browser sẽ tự set
})

// ❌ Sai
formData.append('avatar', file) // Key sai
// hoặc
headers: { 'Content-Type': 'multipart/form-data' } // Không nên set header này
```

### 4. Kiểm tra GCS Configuration

#### Kiểm tra environment variables

```bash
# Phải có các biến sau:
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
# hoặc
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=thptphuocbuu360
```

#### Kiểm tra GCS bucket permissions

Bucket phải cho phép:
- Upload files (write permission)
- Public read access (nếu muốn avatar public)
- CORS configuration (nếu cần)

### 5. Test thủ công

#### Test bằng curl

```bash
# Lấy session token từ browser cookies
curl -X POST https://your-domain.com/api/users/USER_ID/avatar \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

#### Test trong browser console

```javascript
const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = 'image/*'
fileInput.onchange = async (e) => {
  const file = e.target.files[0]
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await fetch('/api/users/USER_ID/avatar', {
    method: 'POST',
    body: formData,
  })
  
  const data = await res.json()
  console.log('Response:', data)
}
fileInput.click()
```

### 6. Checklist Debug

- [ ] Kiểm tra đã đăng nhập chưa
- [ ] Kiểm tra file có phải là image không
- [ ] Kiểm tra file size < 5MB
- [ ] Kiểm tra server logs có lỗi gì không
- [ ] Kiểm tra Network tab xem request có được gửi không
- [ ] Kiểm tra response status và body
- [ ] Kiểm tra GCS credentials và permissions
- [ ] Kiểm tra database connection
- [ ] Kiểm tra frontend code có đúng không

## Các cải thiện đã thực hiện

1. ✅ Thêm logging chi tiết cho mọi bước
2. ✅ Cải thiện error messages với thông tin cụ thể
3. ✅ Xử lý lỗi riêng cho từng bước (upload, database)
4. ✅ Validate input kỹ hơn
5. ✅ Trả về `success: true` khi thành công

## File đã được cập nhật

- `app/api/users/[id]/avatar/route.ts` - Cải thiện error handling và logging

