# Authentication Documentation

## Tổng quan

Hệ thống authentication sử dụng NextAuth.js (Auth.js) với hỗ trợ:
- Email/Password authentication
- Google OAuth
- JWT-based sessions
- Role-based access control (RBAC)

## Cấu hình

### Environment Variables

Thêm vào file `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Thiết lập Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable Google+ API
4. Tạo OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID và Client Secret vào `.env`

## Authentication Providers

### 1. Credentials Provider (Email/Password)

**Sử dụng:**
```typescript
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false,
})
```

**Xử lý lỗi:**
- Invalid credentials → "Email hoặc mật khẩu không đúng"
- OAuth-only user → "Tài khoản này chỉ đăng nhập bằng Google"
- Missing credentials → Form validation error

### 2. Google OAuth Provider

**Sử dụng:**
```typescript
await signIn('google', {
  callbackUrl: '/dashboard',
  redirect: true,
})
```

**Xử lý:**
- Tự động tạo user mới nếu chưa tồn tại
- Liên kết với tài khoản hiện có nếu email đã tồn tại
- Mặc định role: STUDENT

## Session Management

### JWT Configuration

- **Max Age**: 30 days
- **Update Age**: 24 hours (tự động refresh)
- **Strategy**: JWT (stateless)

### Session Structure

```typescript
{
  user: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
    image?: string
  }
}
```

### Token Expiration Handling

Token tự động được kiểm tra trong JWT callback:
- Nếu expired → throw error "Token đã hết hạn"
- NextAuth tự động refresh token khi cần

## Role-Based Access Control (RBAC)

### Roles

1. **ADMIN**: Toàn quyền truy cập
2. **TEACHER**: Tạo lớp học, upload văn bản, chấm điểm
3. **STUDENT**: Xem lớp học đã đăng ký, nộp bài tập
4. **PARENT**: Xem thông tin con em

### Middleware Protection

File `middleware.ts` tự động bảo vệ routes:

```typescript
// Admin-only routes
/dashboard/admin/*

// Teacher-only routes
/dashboard/classes/new
/dashboard/documents/upload
```

### API Route Protection

Sử dụng helpers trong `lib/auth-helpers.ts`:

```typescript
import { requireRoleAPI } from '@/lib/auth-helpers'

export async function POST(request: Request) {
  const { session, error } = await requireRoleAPI(['TEACHER', 'ADMIN'])
  if (error) return error
  
  // Your code here
}
```

## Edge Cases Handling

### 1. Expired Tokens

**Xử lý:**
- JWT callback kiểm tra `token.exp`
- Nếu expired → throw error
- User được redirect về login page

**Test:**
```bash
# Token sẽ tự động expire sau 30 ngày
# Có thể test bằng cách manually set exp trong token
```

### 2. Invalid Credentials

**Xử lý:**
- Credentials provider validate input
- Bcrypt compare password
- Return generic error để tránh user enumeration

**Error Messages:**
- "Email hoặc mật khẩu không đúng" (không phân biệt email/password sai)

### 3. OAuth-Only User Attempting Password Login

**Xử lý:**
- Check `user.password === null`
- Return specific error: "Tài khoản này chỉ đăng nhập bằng Google"

### 4. Missing/Invalid Session

**Xử lý:**
- Middleware check `token` existence
- API routes check `session` via `requireAuth()`
- Redirect to `/login` if not authenticated

### 5. Concurrent Sessions

**Behavior:**
- NextAuth cho phép multiple sessions
- Mỗi device có session riêng
- Logout từ một device không ảnh hưởng device khác

## Testing

### Test Endpoints

#### 1. Authentication Status
```bash
GET /api/auth/test?type=auth
```

Response:
```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "STUDENT"
  }
}
```

#### 2. Role-Based Access
```bash
GET /api/auth/test?type=role&role=ADMIN
```

Response:
```json
{
  "userRole": "STUDENT",
  "requiredRole": "ADMIN",
  "hasAccess": false,
  "message": "Access denied: Insufficient permissions"
}
```

#### 3. Session Expiration
```bash
GET /api/auth/test?type=expired
```

### Manual Testing Checklist

- [x] Login với email/password hợp lệ
- [x] Login với email/password không hợp lệ
- [x] Login với Google OAuth
- [x] Truy cập protected route không đăng nhập
- [x] Truy cập admin route với role student
- [x] Truy cập teacher route với role student
- [x] Logout functionality
- [x] Session persistence sau refresh
- [x] Error messages hiển thị đúng

## Security Best Practices

### 1. Password Hashing
- Sử dụng bcrypt với salt rounds = 10
- Password không bao giờ lưu plain text

### 2. JWT Security
- Secret key trong environment variable
- Token expiration (30 days)
- HTTPS trong production

### 3. Input Validation
- Email format validation
- Password strength requirements (min 6 chars)
- SQL injection protection (Prisma)

### 4. Error Handling
- Generic error messages (tránh user enumeration)
- Logging errors server-side
- User-friendly error messages

## Troubleshooting

### Lỗi "OAuthSignin"
- Kiểm tra GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET
- Kiểm tra redirect URI trong Google Console

### Lỗi "Token đã hết hạn"
- User cần đăng nhập lại
- Kiểm tra NEXTAUTH_SECRET

### Lỗi "Session không hợp lệ"
- Clear cookies và đăng nhập lại
- Kiểm tra database connection

## Migration Notes

Khi update Prisma schema (thêm OAuth models):
```bash
npm run db:generate
npm run db:push
```

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

