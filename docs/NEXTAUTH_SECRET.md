# NEXTAUTH_SECRET

## Secret Key đã được tạo

**NEXTAUTH_SECRET** (cho production):
```
NEXTAUTH_SECRET=NtGmEZ26lPBtdSIXlMae/+JTk1yJXio3+IehmbqCxK4=
```

**NEXTAUTH_SECRET** (backup - có thể dùng cho development):
```
NEXTAUTH_SECRET=fBtWYjRuGoiXviIimklMHY6TKLMjDf8BMSemAagyoho=
```

## Cách sử dụng

### 1. Thêm vào file `.env.local`

```env
NEXTAUTH_SECRET=NtGmEZ26lPBtdSIXlMae/+JTk1yJXio3+IehmbqCxK4=
```

### 2. Hoặc thêm vào file `.env` (nếu không dùng .env.local)

```env
NEXTAUTH_SECRET=NtGmEZ26lPBtdSIXlMae/+JTk1yJXio3+IehmbqCxK4=
```

### 3. Cho Production (Vercel, Railway, etc.)

Thêm vào Environment Variables trong dashboard của hosting provider:
- Key: `NEXTAUTH_SECRET`
- Value: `NtGmEZ26lPBtdSIXlMae/+JTk1yJXio3+IehmbqCxK4=`

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- **KHÔNG** commit file `.env.local` hoặc `.env` vào git
- **KHÔNG** chia sẻ secret key này công khai
- Mỗi môi trường (development, staging, production) nên có secret key riêng
- Rotate secret key định kỳ (mỗi 3-6 tháng)

## Tạo secret key mới

Nếu cần tạo secret key mới:

### Cách 1: Sử dụng OpenSSL
```bash
openssl rand -base64 32
```

### Cách 2: Sử dụng Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Cách 3: Sử dụng online generator
- [Generate Secret](https://generate-secret.vercel.app/32)

## Kiểm tra secret key

Sau khi thêm vào `.env.local`, restart server và kiểm tra:

```bash
# Restart server
npm run dev

# Kiểm tra trong logs (không nên hiển thị secret key)
# Nếu có lỗi về NEXTAUTH_SECRET, sẽ thấy trong console
```

## Troubleshooting

### Lỗi: "NEXTAUTH_SECRET is not set"
- Đảm bảo đã thêm `NEXTAUTH_SECRET` vào `.env.local`
- Restart server sau khi thêm
- Kiểm tra không có typo trong tên biến

### Lỗi: "Invalid NEXTAUTH_SECRET"
- Secret key phải là base64 string
- Độ dài tối thiểu: 32 bytes (khi encode base64 sẽ dài hơn)
- Không có khoảng trắng ở đầu/cuối

### Session không hoạt động
- Kiểm tra `NEXTAUTH_SECRET` giống nhau giữa các instances (nếu có nhiều server)
- Clear cookies và thử lại
- Kiểm tra `NEXTAUTH_URL` cũng đã được set đúng

