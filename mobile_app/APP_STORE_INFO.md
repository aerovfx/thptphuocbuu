# Thông Tin App Store Connect

## Thông Tin Cơ Bản

### Bundle ID
```
com.thptphuocbuu.edu.vn.social
```

### SKU
```
phuocbuuapp
```

### Apple ID
```
6756784269
```

### SKU
```
thptphuocbuu
```

### App Name
```
phuocbuuapp
```

### Subtitle (Tối đa 30 ký tự)
```
Ứng dụng mạng xã hội trường học
```
*Đếm: 30 ký tự ✅*

### Primary Language
```
Vietnamese
```

## Kiểm Tra Bundle ID trong Xcode

Bundle ID đã được cấu hình đúng trong project:
- File: `ios/Runner.xcodeproj/project.pbxproj`
- Value: `com.thptphuocbuu.edu.vn.social` ✅

## Content Rights Information

### Content Rights Setup

Khi set up Content Rights trên App Store Connect, bạn cần khai báo:

1. **Export Compliance**
   - App có sử dụng encryption không?
   - Nếu chỉ dùng HTTPS (standard encryption), chọn "No"
   - Nếu có custom encryption, cần khai báo chi tiết

2. **Content Rights**
   - App có chứa nội dung được bảo vệ bởi bản quyền không?
   - Có sử dụng third-party content không?
   - Có cần license agreement không?

### Thông Tin Cần Chuẩn Bị

1. **Privacy Policy URL** (Bắt buộc nếu app thu thập dữ liệu)
   - Ví dụ: `https://thptphuocbuu.edu.vn/privacy-policy`
   - Hoặc: `https://phuocbuu-vglgngs3yq-as.a.run.app/privacy`

2. **Support URL** (Bắt buộc)
   - Ví dụ: `https://thptphuocbuu.edu.vn/support`
   - Hoặc: `https://phuocbuu-vglgngs3yq-as.a.run.app/support`

3. **Marketing URL** (Tùy chọn)
   - Website chính thức của app

## App Store Connect Checklist

### General Information ✅
- [x] Bundle ID: `com.thptphuocbuu.edu.vn.social`
- [x] SKU: `phuocbuuapp`
- [x] Apple ID: `6756784269`
- [x] App Name: `phuocbuuapp`
- [x] Primary Language: Vietnamese
- [x] Subtitle: "Ứng dụng mạng xã hội trường học" (30 ký tự) ✅
- [ ] Content Rights: Set Up (cần điền)

### App Information
- [ ] Category: Chọn category phù hợp
- [ ] Subcategory: (nếu có)
- [ ] Content Rights Information: Set Up
- [ ] License Agreement: Apple's Standard License Agreement ✅

### Pricing and Availability
- [ ] Price: Free hoặc Paid
- [ ] Availability: Chọn countries/regions

### App Privacy
- [ ] Privacy Policy URL: (bắt buộc)
- [ ] Data Collection: Khai báo các loại dữ liệu thu thập
  - User ID
  - Email
  - Location (nếu có)
  - Photos/Media (nếu có)
  - etc.

### Version Information
- [ ] Version: 1.0.0
- [ ] What's New: Mô tả tính năng mới
- [ ] Description: Mô tả app chi tiết
- [ ] Keywords: Từ khóa tìm kiếm (tối đa 100 ký tự)
- [ ] Support URL: URL hỗ trợ
- [ ] Marketing URL: (tùy chọn)
- [ ] Privacy Policy URL: URL privacy policy

### Screenshots (Bắt buộc)
- [ ] iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
- [ ] iPhone 6.5" (iPhone 11 Pro Max, XS Max)
- [ ] iPhone 5.5" (iPhone 8 Plus)
- [ ] iPad Pro 12.9" (nếu hỗ trợ iPad)

### App Icon
- [ ] 1024x1024px PNG
- [ ] Không có alpha channel
- [ ] Không bo góc (Apple sẽ tự động bo)

## Export Compliance

### Câu hỏi thường gặp:

**Q: App có sử dụng encryption không?**
- A: Nếu chỉ dùng HTTPS (standard SSL/TLS), chọn **"No"**
- A: Nếu có custom encryption hoặc cryptographic functions, chọn **"Yes"** và điền thêm thông tin

**Q: App có tuân thủ Export Administration Regulations (EAR) không?**
- A: Hầu hết app consumer đều tuân thủ, chọn **"Yes"**

## Content Rights

### Export Compliance
- **Does your app use encryption?**: **No**
  - Lý do: App chỉ sử dụng HTTPS (standard SSL/TLS encryption). Không có custom encryption.

### Content Rights

1. **App có chứa nội dung được bảo vệ bởi bản quyền không?**
   - **Answer: No**
   - Lý do: App chỉ hiển thị nội dung do user tạo (user-generated content). Không có music, video, images có bản quyền từ bên thứ ba.

2. **App có sử dụng third-party content không?**
   - **Answer: No**
   - Lý do: Không sử dụng third-party content có bản quyền.

3. **App có cần license agreement không?**
   - **Answer: No**
   - Sử dụng: Apple's Standard License Agreement

## Lưu Ý Quan Trọng

⚠️ **Privacy Policy**: Bắt buộc nếu app:
- Thu thập email, tên, hoặc thông tin cá nhân
- Sử dụng analytics
- Sử dụng third-party SDKs
- Thu thập location data

⚠️ **Support URL**: Bắt buộc cho tất cả app

⚠️ **Content Rights**: Cần khai báo chính xác để tránh bị reject

## Liên Kết

- [App Store Connect](https://appstoreconnect.apple.com)
- [Export Compliance Information](https://developer.apple.com/documentation/security/compiling_encrypted_binaries)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

