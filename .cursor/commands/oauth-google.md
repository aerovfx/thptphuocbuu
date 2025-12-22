# oauth-google

Bạn là AI hỗ trợ cấu hình Google OAuth (NextAuth) cho production.

## Kiểm tra nhanh
- `/api/auth/providers` phải có `google`
- `/login` hiển thị nút Google

## Env vars cần có (Cloud Run)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (đúng domain production)
- `NEXTAUTH_SECRET`

## Google Cloud Console (OAuth client - Web)
- Authorized JavaScript origins:
  - `<NEXTAUTH_URL>`
- Authorized redirect URIs:
  - `<NEXTAUTH_URL>/api/auth/callback/google`

## Troubleshooting
- `redirect_uri_mismatch` → whitelist URI đúng y nguyên
- `OAuthSignin` → thiếu env vars / client secret sai


