# 🗺️ Roadmap Phát triển (THPT Phước Bửu LMS & MXH)

Dự án **THPT Phước Bửu** được phát triển nhằm mang đến một hệ sinh thái chuyển đổi số trọn vẹn cho trường học: vừa đáp ứng nghiệp vụ học tập/đào tạo khô khan, vừa là một sân chơi mạng xã hội kết nối cực "cháy" dành riêng cho lứa tuổi học sinh.

Dưới đây là một cái nhìn tổng quan về lộ trình phát triển (Roadmap) của team:

---

## ✅ Giai đoạn 1: MVP - Đặt Nền Móng (Đã hoàn thành)
**Mục tiêu:** Xây dựng khung kiến trúc cốt lõi, cơ sở dữ liệu và các nền tảng bảo mật vững chắc. Xây dựng giao diện Web chuẩn Responsive.

- [x] **Database & ORM:** Thiết lập sơ đồ ERD chi tiết, dùng Prisma, Cloud SQL (PostgreSQL).
- [x] **Authentication:** Triển khai NextAuth (Credential + JWT + Cookie cho web/mobile), Google OAuth2.
- [x] **Quản lý Users & Roles:** Cấp quyền phân cấp bậc (ADMIN, TEACHER, STUDENT, PARENT).
- [x] **File Storage (GCP):** Thiết lập Google Cloud Storage (Bucket `gen-lang-client-...`) với Uniform Access, phân phối hình ảnh/video công khai cho MXH và bảo mật đối với Tài liệu nội bộ.
- [x] **Deploy Pipeline gốc:** Viết shell script quy chuẩn để cấu hình deploy tự động lên GCP Cloud Run + Cloud Build.

---

## ✅ Giai đoạn 2: Xây Dựng MXH Nội Bộ (Đã hoàn thành phần lõi)
**Mục tiêu:** Mang "News Feed" phong cách trẻ trung vào App, tạo thói quen online mỗi ngày cho User.

- [x] **Timeline Feed:** Giao diện lướt mượt mà, phân loại bài dạng `TEXT`, `IMAGE`, `VIDEO`, `DOCUMENT`.
- [x] **Media Support:** Upload nhiều ảnh (Swipe Layout), upload Video và auto-embed short-links.
- [x] **Tương tác căn bản:** Like (Thả tim), Bookmark, Xem hồ sơ/Profile người khác.
- [x] **Remix (Repost):** Tính năng "Remix" (chế tác/share) bài post của bạn bè.
- [x] **Tìm kiếm đa dạng:** Chức năng Explore (Trending, hashtag, user search).

---

## 🚀 Giai đoạn 3: Hệ Sinh Thái LMS & Hành Chính Công Khởi Chạy (Đang ở đây)
**Mục tiêu:** Tích hợp bộ công cụ dùng riêng cho học tập và quản lý văn bản, đáp ứng quy trình thực tiễn của trường học.

- [x] **Trang Văn Bản (DMS):** Đưa toàn bộ tài liệu hành chính (Mật, Phổ biến, Kế hoạch đào tạo) lên hệ thống, quản lý quyền truy cập.
- [ ] **Hệ thống Lớp Học (Classes):** Phân chia môn học, thời khóa biểu, điểm danh, chức năng tạo mã mời join lớp.
- [ ] **Giao & Chấm Bài Tập (Assignments):** Học sinh nộp bài gắn file/video, Giảng viên đánh giá và chấm điểm (chế độ feedback riêng tư).
- [ ] **Tổ Chuyên Môn / Spaces:** Các trang thảo luận riêng dành cho tổ Toán, tổ Lý, CLB Ngoại Khóa v.v.

---

## 🔮 Giai đoạn 4: Chat RT, Mobile App & Trí Tuệ Nhân Tạo (Q3 - Q4)
**Mục tiêu:** "Mượt - Nhanh - Tiện", đưa dự án lên màn hình di động chạy đa nền tảng.

- [ ] **Hệ thống Chat Real-time:** Box chat học sinh - giáo viên, chat group lớp (Sử dụng WebSockets / Socket.io / Pusher).
- [ ] **Notifications PUSH Realtime:** Báo Notification pop-up qua Firebase Cloud Messaging.
- [ ] **Flutter Mobile App:** Chính thức phát hành bản iOS & Android đồng bộ với web, lướt siêu "cuốn".
- [ ] **Khám phá sức mạnh AI:**
    - Bot tự động tóm tắt nội dung văn bản dài (áp dụng cho báo cáo).
    - AI Moderator: Tự động filter các từ chửi thề, ngôn ngữ thù ghét hoặc ảnh nhạy cảm khi upload lên mạng xã hội.

---

## 📈 Giai đoạn 5: Vận Hành & Mở Rộng 
- Di chuyển (Migration) từ Cloud Run lên **Kubernetes (GKE)** khi DAU (Daily Active Users) vượt ngưỡng.
- Tích hợp Chữ ký số điện tử (DMS) nếu ban giám hiệu cần duyệt báo cáo văn bản pháp lý.
- Video Streaming / Họp trực tuyến bằng WebRTC ngay trên nền web.

---
*Roadmap là một dạng tư liệu sống, tớ sẽ liên tục cập nhật/sửa đổi dựa theo tốc độ phát triển và góp ý từ các bạn User "GenZ" sử dụng thật nhaaa! ✨🍓*
