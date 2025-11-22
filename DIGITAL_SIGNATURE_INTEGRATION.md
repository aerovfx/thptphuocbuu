# 🔐 Tích hợp Ký số (Digital Signature Integration)

Hệ thống đã được tích hợp với các dịch vụ ký số phổ biến tại Việt Nam.

## 📋 Nhà cung cấp được hỗ trợ

### 1. **VNPT Smart CA** ✅
- Ký số từ xa, không cần USB Token
- API tích hợp đầy đủ
- Hỗ trợ OTP xác thực

### 2. **Viettel CA** (Sẵn sàng tích hợp)
- Cấu trúc API đã sẵn sàng
- Cần cấu hình API key

### 3. **FPT CA** (Sẵn sàng tích hợp)
- Cấu trúc API đã sẵn sàng
- Cần cấu hình API key

### 4. **MISA** (Sẵn sàng tích hợp)
- Cấu trúc API đã sẵn sàng
- Cần cấu hình API key

### 5. **Ký nội bộ** ✅
- Ký số nội bộ (hash-based)
- Không cần cấu hình
- Dùng cho mục đích nội bộ

## 🔧 Cấu hình

### Environment Variables

Thêm vào `.env.local`:

```env
# VNPT Smart CA
VNPT_SMARTCA_API_URL=https://api.smartca.vnpt.vn
VNPT_SMARTCA_API_KEY=your_api_key_here
VNPT_SMARTCA_API_SECRET=your_api_secret_here

# Viettel CA (khi cần)
VIETTEL_CA_API_URL=https://api.viettelca.vn
VIETTEL_CA_API_KEY=your_api_key_here
VIETTEL_CA_API_SECRET=your_api_secret_here

# FPT CA (khi cần)
FPT_CA_API_URL=https://api.fptca.vn
FPT_CA_API_KEY=your_api_key_here
FPT_CA_API_SECRET=your_api_secret_here

# MISA (khi cần)
MISA_API_URL=https://api.misa.vn
MISA_API_KEY=your_api_key_here
MISA_API_SECRET=your_api_secret_here
```

## 📝 Quy trình ký số

### 1. VNPT Smart CA

```
1. User click "Ký số"
2. Chọn VNPT Smart CA
3. Nhập lý do ký số (optional)
4. System tạo transaction với VNPT API
5. VNPT gửi OTP đến user
6. User nhập OTP
7. System xác nhận transaction
8. VNPT trả về file đã ký
9. System lưu chữ ký vào database
```

### 2. Ký nội bộ

```
1. User click "Ký số"
2. Chọn "Ký nội bộ"
3. System tạo hash signature
4. Lưu vào database
```

## 🔌 API Endpoints

### POST `/api/signature/sign`
Ký số văn bản

**Request:**
```json
{
  "documentId": "doc_123",
  "documentType": "outgoing",
  "provider": "VNPT",
  "signingReason": "Phê duyệt văn bản",
  "signingLocation": "Việt Nam",
  "otp": "123456", // Nếu cần OTP
  "transactionId": "txn_123" // Nếu đang xác nhận transaction
}
```

**Response:**
```json
{
  "success": true,
  "signatureId": "sig_123",
  "signedFileUrl": "/uploads/signed/document.pdf",
  "signatureHash": "abc123..."
}
```

### GET `/api/signature/verify/[id]`
Xác thực chữ ký

**Response:**
```json
{
  "valid": true,
  "certificateInfo": {
    "serial": "123456",
    "issuer": "VNPT Smart CA",
    "subject": "Nguyễn Văn A",
    "validFrom": "2024-01-01",
    "validTo": "2025-01-01"
  }
}
```

## 🎨 UI Components

### DigitalSignatureModal
Modal để ký số văn bản với:
- Chọn nhà cung cấp
- Nhập lý do ký số
- Nhập OTP (nếu cần)
- Hiển thị trạng thái

## 📚 Tài liệu tham khảo

- [VNPT Smart CA Documentation](https://doitac-smartca.vnpt.vn/help/document/)
- [Viettel CA Documentation](https://viettelca.vn)
- [FPT CA Documentation](https://fptca.vn)

## 🔒 Bảo mật

- API keys được lưu trong environment variables
- OTP được yêu cầu cho các dịch vụ bên ngoài
- Chữ ký được lưu với hash để xác thực
- Certificate info được lưu để audit

## 🚀 Sử dụng

1. Cấu hình API keys trong `.env.local`
2. User chọn văn bản cần ký
3. Click "Ký số"
4. Chọn nhà cung cấp
5. Nhập thông tin (nếu cần)
6. Nhập OTP (nếu VNPT Smart CA)
7. Hoàn tất ký số

## 📝 Lưu ý

- VNPT Smart CA yêu cầu OTP từ SMS/Email
- Ký nội bộ chỉ dùng cho mục đích nội bộ
- File đã ký sẽ được lưu riêng (`signedFileUrl`)
- Chữ ký có thể xác thực lại bất cứ lúc nào

