# Tài liệu Kiến trúc Hệ thống - Admin Panel THPT Phước Bửu

## 📚 Mục lục

1. [Tổng quan Kiến trúc](./ARCHITECTURE.md) - Kiến trúc tổng quan, tech stack, security, scaling
2. [ERD - Entity Relationship Diagram](./ERD.md) - Sơ đồ database schema chi tiết
3. [Sequence Diagrams](./SEQUENCE_DIAGRAMS.md) - Luồng xử lý cho các use cases chính

## 🚀 Cách xem Diagrams

### Xem trong GitHub/GitLab
- Các file `.md` với Mermaid diagrams sẽ tự động render trong GitHub/GitLab
- Chỉ cần mở file và xem

### Xem trong VS Code
1. Cài extension: **Markdown Preview Mermaid Support**
2. Mở file `.md` và nhấn `Cmd+Shift+V` (Mac) hoặc `Ctrl+Shift+V` (Windows) để preview

### Xem online
1. Copy nội dung Mermaid code
2. Paste vào [Mermaid Live Editor](https://mermaid.live/)
3. Export thành PNG/SVG nếu cần

### Export thành hình ảnh
```bash
# Sử dụng Mermaid CLI
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/ERD.md -o docs/ERD.png
mmdc -i docs/SEQUENCE_DIAGRAMS.md -o docs/SEQUENCE_DIAGRAMS.png
```

## 📋 Nội dung các tài liệu

### ARCHITECTURE.md
- Kiến trúc tổng quan (Client → API Gateway → Services → Data Layer)
- Tech stack chi tiết
- Security & Compliance
- Scaling & Availability
- CI/CD pipeline

### ERD.md
- Entity Relationship Diagrams cho tất cả modules:
  - User Management & RBAC
  - Document Management System (DMS)
  - Content Management (Posts, Comments, Media)
  - Events & Calendar
  - Learning Management System (LMS)
- Indexes & Performance optimization
- Data types & Constraints

### SEQUENCE_DIAGRAMS.md
- 8 sequence diagrams cho các use cases chính:
  1. Đăng bài / Tạo văn bản (DMS)
  2. Duyệt văn bản (Approval Workflow)
  3. Media Upload & Processing
  4. Realtime Collaborative Editor
  5. AI Content Processing (OCR, Summarization)
  6. User Management & RBAC
  7. Search Documents (Full-text Search)
  8. Notification Flow

## 🔄 Cập nhật tài liệu

Khi có thay đổi về:
- Database schema → Cập nhật `ERD.md`
- API flows → Cập nhật `SEQUENCE_DIAGRAMS.md`
- Infrastructure → Cập nhật `ARCHITECTURE.md`

## 📝 Ghi chú

- Tất cả diagrams sử dụng [Mermaid](https://mermaid.js.org/) syntax
- Diagrams có thể được export thành PNG/SVG
- Tài liệu được viết bằng tiếng Việt để dễ hiểu cho team

## 🔗 Liên kết hữu ích

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js Documentation](https://nextjs.org/docs)

