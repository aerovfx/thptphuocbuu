# 📱 Hướng dẫn cho Users sau khi nâng cấp hệ thống

**Ngày cập nhật**: 26/12/2025

---

## 🎉 Hệ thống đã được nâng cấp!

Chào mừng bạn quay lại! Hệ thống LMS THPT Phước Bửu đã được nâng cấp lên cơ sở dữ liệu mới để cải thiện hiệu suất và độ ổn định.

---

## ❓ Tại sao tôi cần đăng nhập lại?

Hệ thống đã chuyển sang database mới (Neon PostgreSQL) vào ngày **26/12/2025** do database cũ (Prisma Accelerate) đã hết quota miễn phí.

**Ảnh hưởng:**
- ⚠️ Bạn cần tạo tài khoản mới hoặc đăng nhập lại
- ⚠️ Dữ liệu cũ (posts, comments) không thể khôi phục
- ✅ Hệ thống hiện hoạt động tốt hơn với database mới

---

## 🔑 Cách đăng nhập

### Option 1: Đăng nhập với Google (Khuyến nghị) ⭐

1. Vào trang login: https://thptphuocbuu.edu.vn/login
2. Click nút **"Sign in with Google"**
3. Chọn tài khoản Google của bạn
4. Cho phép quyền truy cập
5. ✅ Hoàn tất! Hệ thống tự động tạo tài khoản mới

**Lợi ích:**
- ⚡ Nhanh chóng (không cần nhập password)
- 🔒 An toàn (Google xác thực)
- 🎯 Tự động tạo tài khoản

### Option 2: Đăng ký tài khoản mới

1. Vào trang đăng ký: https://thptphuocbuu.edu.vn/register
2. Nhập thông tin:
   - Email (@thptphuocbuu.edu.vn hoặc @gmail.com)
   - Họ và tên
   - Mật khẩu
3. Click **"Đăng ký"**
4. ✅ Hoàn tất!

---

## 👥 Tài khoản mẫu (để test)

Nếu bạn muốn test hệ thống trước:

### Admin
- **Email**: admin@thptphuocbuu.edu.vn
- **Password**: admin123

### Giáo viên
- **Email**: teacher@thptphuocbuu.edu.vn
- **Password**: teacher123

### Học sinh
- **Email**: student@thptphuocbuu.edu.vn
- **Password**: student123

---

## 📱 Mobile App

### Android/iOS App vẫn hoạt động bình thường!

**Cách đăng nhập:**
1. Mở app
2. Đăng nhập với:
   - Email mới của bạn, HOẶC
   - Google account

**Lưu ý:** Nếu bạn đã đăng nhập trước đó, hãy **logout** và **login lại** với tài khoản mới.

---

## 🆘 Tôi gặp vấn đề

### 1. Không thể đăng nhập với Google

**Nguyên nhân**: Google OAuth cần vài phút để cập nhật.

**Giải pháp:**
- Đợi 5-10 phút và thử lại
- Hoặc dùng Option 2 (đăng ký với email/password)

### 2. Link cũ không hoạt động

Ví dụ: `https://thptphuocbuu.edu.vn/users/108045041507245050240`

**Nguyên nhân**: User ID cũ không tồn tại trong database mới.

**Giải pháp:**
- Bạn sẽ thấy trang hướng dẫn migration
- Click **"Đăng nhập với Google"** hoặc **"Đăng ký ngay"**
- Tạo tài khoản mới

### 3. Không nhớ email cũ

**Giải pháp:**
- Đăng ký với email mới (@gmail.com hoặc @thptphuocbuu.edu.vn)
- Hoặc đăng nhập bằng Google

### 4. Tôi muốn khôi phục dữ liệu cũ

**Rất tiếc**, do database cũ đã bị khóa (hết quota), chúng tôi không thể truy cập để export data.

**Khuyến nghị:**
- Bắt đầu lại với tài khoản mới
- Hệ thống hiện hoạt động tốt hơn

---

## 📞 Liên hệ hỗ trợ

### Cần trợ giúp?

- 📧 **Email**: admin@thptphuocbuu.edu.vn
- 💬 **Trong hệ thống**: Liên hệ admin sau khi đăng nhập
- 🌐 **Website**: https://thptphuocbuu.edu.vn

---

## ✅ Checklist sau khi đăng nhập

- [ ] Đăng nhập thành công
- [ ] Cập nhật thông tin cá nhân (avatar, bio)
- [ ] Thêm bạn bè (nếu có)
- [ ] Tạo bài viết mới
- [ ] Tham gia lớp học (nếu là học sinh/giáo viên)

---

## 🎯 Tính năng mới

Hệ thống với database mới có:

- ⚡ **Tốc độ nhanh hơn** - Query không giới hạn
- 🔒 **Ổn định hơn** - Neon PostgreSQL reliable hơn
- 🌐 **Connection pooling** - Tối ưu cho nhiều user đồng thời
- 📊 **Monitoring tốt hơn** - Admin có thể theo dõi performance

---

## 📚 FAQ

### Q: Tại sao không thể khôi phục data cũ?

**A:** Database cũ (Prisma Accelerate) đã hết quota miễn phí và bị khóa hoàn toàn. Để mở khóa cần trả $29/month. Chúng tôi quyết định migrate sang Neon (miễn phí vĩnh viễn, không giới hạn queries) thay vì trả phí.

### Q: Dữ liệu nào bị mất?

**A:**
- Users (accounts)
- Posts (bài viết)
- Comments (bình luận)
- Likes & Bookmarks
- Messages (tin nhắn)
- Documents (tài liệu)

Tất cả đều cần tạo lại sau khi đăng nhập.

### Q: Hệ thống có ổn định không?

**A:** ✅ **CÓ!** Neon PostgreSQL là một trong những database provider tốt nhất hiện nay, với free tier rất generous (không giới hạn queries).

### Q: Có mất phí không?

**A:** ❌ **KHÔNG!** Hệ thống vẫn hoàn toàn miễn phí cho users.

---

## 🌟 Cảm ơn bạn

Cảm ơn bạn đã kiên nhẫn trong quá trình nâng cấp hệ thống. Chúng tôi cam kết mang đến trải nghiệm tốt nhất cho cộng đồng THPT Phước Bửu!

---

**Cập nhật**: 26/12/2025
**Version**: 2.0 (Database Migration)
**Status**: ✅ Hoạt động bình thường
