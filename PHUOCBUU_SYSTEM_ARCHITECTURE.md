# KIẾN TRÚC HỆ THỐNG - THPT PHƯỚC BỬU
## School Learning Management & Social Platform

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả
THPT Phước Bửu là nền tảng quản lý giáo dục toàn diện, kết hợp Learning Management System (LMS), mạng xã hội nội bộ, hệ thống quản lý văn bản hành chính (DMS), và các công cụ cộng tác. Hệ thống được thiết kế để phục vụ toàn bộ cộng đồng trường học: học sinh, giáo viên, ban giám hiệu, phụ huynh, và nhân viên hành chính.

### 1.2 Mục tiêu
- **Số hóa toàn diện**: Chuyển đổi số hoàn toàn quy trình giáo dục và hành chính
- **Tối ưu quy trình**: Tự động hóa quy trình phê duyệt, quản lý văn bản, và báo cáo
- **Kết nối cộng đồng**: Tạo không gian giao tiếp, chia sẻ nội bộ an toàn
- **Minh bạch & Truy xuất**: Đảm bảo tính minh bạch và khả năng truy xuất thông tin
- **Bảo mật thông tin**: Bảo vệ dữ liệu nhạy cảm với hệ thống phân quyền chi tiết

### 1.3 Đối tượng sử dụng
```yaml
Người dùng:
  Administrators:
    - SUPER_ADMIN: IT quản trị hệ thống
    - BGH: Ban Giám Hiệu
    - BAN_TT: Ban Truyền Thông

  Academic Staff:
    - TEACHER: Giáo viên
    - TRUONG_TONG: Trưởng Tổ
    - QUAN_NHIEM: Giáo viên chủ nhiệm

  Administrative Staff:
    - TRUONG_HANH_CHINH: Trưởng hành chính
    - TAI_CHINH: Ban Tài chính/Kế toán
    - Y_TE: Ban Y tế

  Organization Units:
    - DOAN_TN: Đoàn Thanh Niên
    - DANG_BO: Đảng bộ

  Support Staff:
    - BAO_VE: Bảo vệ
    - LAO_CONG: Lao công

  Users:
    - STUDENT: Học sinh
    - PARENT: Phụ huynh
```

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │ Admin Panel  │          │
│  │  (Next.js)   │  │   (Flutter)  │  │  (Next.js)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           API Gateway (Cloud Run / GCP)                   │  │
│  │  - Rate Limiting    - JWT Auth         - CORS            │  │
│  │  - Request Routing  - API Versioning   - Monitoring      │  │
│  │  - XSS Protection   - CSRF Protection  - Input Sanitize  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Auth Service │  │  Core Service │  │  AI Service   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │   LMS Module    │ │  Social Module  │ │   DMS Module    │  │
│  │  - Classes      │ │  - Posts/Feed   │ │  - Documents    │  │
│  │  - Assignments  │ │  - Messages     │ │  - Workflow     │  │
│  │  - Grades       │ │  - Friends      │ │  - Approvals    │  │
│  │  - Lessons      │ │  - Bookmarks    │ │  - Signatures   │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │  Space Module   │ │  News Module    │ │  Brand Module   │  │
│  │  - Workspaces   │ │  - Articles     │ │  - Badges       │  │
│  │  - Tasks        │ │  - Departments  │ │  - Premium      │  │
│  │  - Progress     │ │  - Publishing   │ │  - Verify       │  │
│  │  - Scrum/Agile  │ │  - Categories   │ │  - Members      │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │  Collab Docs    │ │  Admin Panel    │ │  Moderation     │  │
│  │  - Real-time    │ │  - RBAC         │ │  - Content      │  │
│  │  - Yjs/CRDT     │ │  - Modules      │ │  - Filters      │  │
│  │  - Comments     │ │  - Audit Logs   │ │  - Review       │  │
│  │  - Permissions  │ │  - User Mgmt    │ │  - Analytics    │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Prisma ORM Layer                            │  │
│  │  - Query optimization  - Transaction support             │  │
│  │  - Relation loading    - Connection pooling              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │   PostgreSQL     │
                 │  (Prisma Cloud)  │
                 │   - Primary DB   │
                 │   - Accelerate   │
                 └──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Google  │ │   GCP    │ │  OpenAI  │ │  SmartCA │          │
│  │  OAuth   │ │  Storage │ │   API    │ │  (Đ/Ký)  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  VNPT    │ │ Viettel  │ │   MISA   │ │  Gmail   │          │
│  │   Sign   │ │   Sign   │ │   Sign   │ │  SMTP    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Cloud Run (GCP) - Container Deployment          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           GCP Cloud Storage (File Storage)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      Monitoring & Logging (Cloud Logging, Analytics)      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           WebSocket Server (Real-time Features)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. CHI TIẾT CÁC MODULE

### 3.1 Authentication & Authorization Module

#### 3.1.1 Authentication Service
```typescript
Service: Auth Service
Technology: Next.js API Routes, NextAuth.js, JWT, bcrypt

Responsibilities:
  - User registration/login
  - Google OAuth integration
  - JWT token generation/validation
  - Session management
  - Password reset (Email + Token)
  - Account lockout (Failed login attempts)
  - 2FA (Two-Factor Authentication) - planned

Endpoints:
  POST   /api/auth/register
  POST   /api/auth/[...nextauth] (NextAuth handler)
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password
  POST   /api/auth/validate-reset-token
  GET    /api/auth/verify-email
  POST   /api/auth/check-lockout
  POST   /api/mobile/auth/login
  POST   /api/mobile/auth/google
  GET    /api/mobile/auth/me

Security Features:
  - Password hashing (bcrypt)
  - JWT with secure signing
  - Rate limiting on login endpoints
  - Account lockout after 5 failed attempts
  - CSRF protection
  - XSS sanitization

Database Tables:
  - users
  - accounts (OAuth)
  - sessions
  - verification_tokens
```

#### 3.1.2 RBAC (Role-Based Access Control)
```typescript
Service: Admin RBAC Service
Technology: Prisma, Custom middleware

Features:
  - Dynamic role creation
  - Permission management
  - User role assignment
  - Module-based access control
  - Attribute-based access control (ABAC)
  - Audit logging

Endpoints:
  GET    /api/admin/roles
  POST   /api/admin/roles
  PUT    /api/admin/roles/[id]
  DELETE /api/admin/roles/[id]
  POST   /api/admin/roles/[id]/permissions
  GET    /api/admin/permissions
  GET    /api/admin/permissions/me

Database Tables:
  - roles
  - permissions
  - role_permissions
  - user_roles
  - modules
  - module_permissions
  - user_module_accesses
  - admin_audit_logs
```

---

### 3.2 Learning Management System (LMS)

#### 3.2.1 Class Management Service
```typescript
Service: Class Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Class creation and management
  - Student enrollment
  - Teacher assignment
  - Course content organization
  - Class announcements

Endpoints:
  GET    /api/classes
  POST   /api/classes
  GET    /api/classes/[id]
  PUT    /api/classes/[id]
  DELETE /api/classes/[id]
  POST   /api/classes/[id]/enroll
  GET    /api/classes/[id]/students

Database Tables:
  - classes
  - class_enrollments
  - chapters
  - lessons
  - announcements
```

#### 3.2.2 Assignment & Grading Service
```typescript
Service: Assignment Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Assignment creation
  - Submission management
  - Grading and feedback
  - Due date tracking
  - File uploads

Endpoints:
  GET    /api/assignments
  POST   /api/assignments
  GET    /api/assignments/[id]
  PUT    /api/assignments/[id]
  DELETE /api/assignments/[id]
  POST   /api/assignments/[id]/submit
  GET    /api/assignments/[id]/submissions
  POST   /api/assignments/[id]/grade

Database Tables:
  - assignments
  - submissions
  - grades
```

---

### 3.3 Social Media Module

#### 3.3.1 Social Feed Service
```typescript
Service: Social Service
Technology: Next.js API Routes, Prisma, WebSocket

Responsibilities:
  - Post creation (text, images, videos, links)
  - Multi-image posts (up to 10 images)
  - Post scheduling
  - Location tagging (GPS coordinates)
  - Feed generation (personalized)
  - Real-time feed updates
  - Interaction scoring algorithm

Endpoints:
  GET    /api/posts/feed
  POST   /api/posts
  GET    /api/posts/[id]
  PUT    /api/posts/[id]
  DELETE /api/posts/[id]
  POST   /api/posts/[postId]/like
  POST   /api/posts/[postId]/bookmark
  POST   /api/posts/[postId]/remix (repost)
  POST   /api/posts/[postId]/comments
  POST   /api/posts/upload (media upload)
  POST   /api/posts/scheduled/publish

Features:
  - Multi-image carousel support
  - Post scheduling (scheduledAt field)
  - Location metadata (locationName, lat, long)
  - Real-time feed via WebSocket
  - User interaction scoring

Database Tables:
  - posts
  - comments
  - likes
  - bookmarks
  - reposts
```

#### 3.3.2 Friendship & Messaging Service
```typescript
Service: Social Connection Service
Technology: Next.js API Routes, Prisma, WebSocket

Responsibilities:
  - Friend request management
  - Friendship connections
  - Direct messaging (1-on-1)
  - Message read status
  - Unread counts
  - Real-time messaging

Endpoints:
  GET    /api/friends
  POST   /api/friends/request
  POST   /api/friends/accept
  POST   /api/friends/reject
  DELETE /api/friends/[id]

  GET    /api/messages
  POST   /api/messages
  GET    /api/messages/[conversationId]
  PUT    /api/messages/[messageId]/read

Database Tables:
  - friend_requests
  - friendships
  - conversations
  - messages
```

#### 3.3.3 Notifications Service
```typescript
Service: Notification Service
Technology: Next.js API Routes, WebSocket

Responsibilities:
  - Real-time notifications
  - Notification history
  - Read/unread status
  - Push notifications (planned)
  - Email notifications

Endpoints:
  GET    /api/notifications
  PUT    /api/notifications/[id]/read
  PUT    /api/notifications/mark-all-read

Database Tables:
  - notifications (planned - currently in-app only)
```

---

### 3.4 Document Management System (DMS)

#### 3.4.1 Incoming Documents Service
```typescript
Service: DMS Incoming Service
Technology: Next.js API Routes, Prisma, OpenAI

Responsibilities:
  - Incoming document registration
  - OCR text extraction
  - AI classification and summarization
  - Document assignment
  - Assignment tracking with checklist
  - Workflow automation

Endpoints:
  GET    /api/dms/incoming
  POST   /api/dms/incoming
  GET    /api/dms/incoming/[id]
  PUT    /api/dms/incoming/[id]
  DELETE /api/dms/incoming/[id]
  POST   /api/dms/incoming/[id]/assign
  PUT    /api/dms/incoming/[id]/assign/[assignmentId]
  POST   /api/dms/incoming/[id]/assign/[assignmentId]/checklist
  POST   /api/dms/incoming/[id]/generate-plan

AI Features:
  - Auto-classification (document type detection)
  - AI summarization
  - Related document suggestions
  - Automatic workflow routing

Database Tables:
  - incoming_documents
  - incoming_document_assignments
  - document_ai
  - document_versions
  - workflows
  - tasks
```

#### 3.4.2 Outgoing Documents Service
```typescript
Service: DMS Outgoing Service
Technology: Next.js API Routes, Prisma, AI Draft

Responsibilities:
  - Outgoing document creation
  - Document templates (NĐ 30)
  - AI draft generation
  - Multi-level approval workflow
  - Document publishing
  - Space targeting
  - Version control
  - PDF archiving

Endpoints:
  GET    /api/dms/outgoing
  POST   /api/dms/outgoing
  GET    /api/dms/outgoing/[id]
  PUT    /api/dms/outgoing/[id]
  DELETE /api/dms/outgoing/[id]
  POST   /api/dms/outgoing/[id]/submit
  POST   /api/dms/outgoing/[id]/send
  POST   /api/ai/suggest-draft

Features:
  - AI-powered draft generation
  - Template-based creation
  - Multi-target space publishing
  - Automatic document numbering
  - PDF archive on publish
  - Effective/expiry date management

Database Tables:
  - outgoing_documents
  - document_types
  - approvals
  - digital_signatures
```

#### 3.4.3 Digital Signature Service
```typescript
Service: Digital Signature Service
Technology: Next.js API Routes, SmartCA, VNPT, Viettel, MISA

Responsibilities:
  - Digital signature integration
  - Certificate management
  - Signature verification
  - Multi-provider support
  - Internal signing

Endpoints:
  GET    /api/signature/providers
  POST   /api/signature/sign
  GET    /api/signature/verify/[id]
  POST   /api/smartca/callback
  GET    /api/smartca/status/[requestId]

Providers:
  - VNPT (CA)
  - Viettel (CA)
  - MISA (CA)
  - SmartCA
  - Internal signing

Database Tables:
  - digital_signatures
```

#### 3.4.4 Approval Workflow Service
```typescript
Service: Workflow Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Multi-level approval workflow
  - Auto-routing based on roles
  - Deadline management
  - Approval reminders
  - Workflow history

Endpoints:
  GET    /api/workflow/pending
  GET    /api/workflow/approval
  POST   /api/workflow/approval
  PUT    /api/workflow/approval/[id]
  GET    /api/dms/workflows

Database Tables:
  - workflows
  - approvals
  - tasks
  - audit_logs
```

---

### 3.5 Organizational Structure Module (Spaces & Departments)

#### 3.5.1 Space Management Service
```typescript
Service: Space Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Workspace creation and management
  - Hierarchical space structure
  - Space types (BGH, Ban TT, Tổ Chuyên Môn, etc.)
  - Member management with roles
  - Scrum/Agile framework support
  - Academic year management
  - Progress tracking and archiving

Space Types:
  - SCHOOL_HUB: Public hub
  - BGH_SPACE: Ban Giám Hiệu (private)
  - BAN_TT: Ban Truyền Thông (semi-public)
  - TO_CHUYEN_MON: Tổ Chuyên Môn (private)
  - TO_HANH_CHINH: Tổ Hành chính
  - LOP: Lớp học (per-class)
  - DOAN_DANG: Đoàn/Đảng bộ
  - TAI_CHINH: Ban Tài chính
  - Y_TE: Ban Y tế
  - PUBLIC_NEWS: Public News/Gallery

Endpoints:
  GET    /api/spaces
  POST   /api/spaces
  GET    /api/spaces/[id]
  PUT    /api/spaces/[id]
  DELETE /api/spaces/[id]
  GET    /api/spaces/archived
  POST   /api/spaces/[id]/members
  GET    /api/spaces/[id]/members
  POST   /api/spaces/[id]/apply-scrum

Database Tables:
  - spaces
  - space_members
  - space_missions
  - space_workflows
  - space_tools
  - space_rules
  - space_kpis
  - space_kpi_history
  - space_resources
  - space_timelines
  - space_sprints
  - space_securities
```

#### 3.5.2 Space 8 Core Criteria
```yaml
8 Core Criteria Framework:
  1. Mission & Scope:
    - Vision, mission, objectives
    - Expected outputs
    - Values and principles
    Table: space_missions

  2. Workflow/SOP:
    - Scrum/Kanban/Custom workflows
    - Standard operating procedures
    - Process diagrams
    Table: space_workflows

  3. Tools:
    - Development tools
    - Communication tools
    - Project management tools
    Table: space_tools

  4. Rules:
    - Communication standards
    - File management rules
    - Code review policies
    - Meeting protocols
    Table: space_rules

  5. KPIs:
    - Velocity tracking
    - Quality metrics
    - Efficiency metrics
    - Satisfaction scores
    Table: space_kpis, space_kpi_history

  6. Resources:
    - Templates and documents
    - Brand guidelines
    - Policy references
    Table: space_resources

  7. Timeline:
    - Milestones
    - Deadlines
    - Recurring schedules
    - Sprint planning
    Table: space_timelines

  8. Sprints (Agile):
    - Sprint planning
    - Burndown tracking
    - Velocity measurement
    - Retrospectives
    Table: space_sprints

  Additional:
    - Security & Access Control
    - Activity Logs
    Tables: space_securities, space_activity_logs
```

#### 3.5.3 Task Management Service (Jira-style)
```typescript
Service: Space Task Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Kanban board management
  - Task creation and assignment
  - Drag-and-drop column management
  - Rich task content (images, attachments, checklist)
  - Task comments
  - Due date tracking
  - Priority management

Endpoints:
  GET    /api/spaces/[id]/tasks
  POST   /api/spaces/[id]/tasks
  GET    /api/spaces/[id]/tasks/[taskId]
  PUT    /api/spaces/[id]/tasks/[taskId]
  DELETE /api/spaces/[id]/tasks/[taskId]
  POST   /api/spaces/[id]/tasks/[taskId]/comments
  POST   /api/spaces/[id]/tasks/[taskId]/upload

Database Tables:
  - space_tasks
  - space_task_comments
```

#### 3.5.4 Progress Tracking Service
```typescript
Service: Space Progress Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Progress log creation
  - Milestone tracking
  - Checklist management
  - Progress board visualization
  - Auto-archiving at 100%

Endpoints:
  GET    /api/spaces/[id]/progress
  POST   /api/spaces/[id]/progress
  GET    /api/spaces/[id]/progress/[logId]
  PUT    /api/spaces/[id]/progress/[logId]
  DELETE /api/spaces/[id]/progress/[logId]

Database Tables:
  - space_progress_logs
```

#### 3.5.5 Department Management Service
```typescript
Service: Department Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Department (Tổ) creation
  - Leader assignment
  - Member management
  - Subject-based departments
  - Department documents

Department Types:
  - TO_CHUYEN_MON: Tổ Chuyên Môn (Toán, Văn, Lý, Hóa, etc.)
  - TO_HANH_CHINH: Tổ Hành chính
  - BAN_TT: Ban Truyền Thông
  - BAN_TAI_CHINH: Ban Tài chính
  - BAN_Y_TE: Ban Y tế
  - DOAN_DANG: Đoàn/Đảng bộ

Endpoints:
  GET    /api/departments
  POST   /api/departments
  GET    /api/departments/[id]
  PUT    /api/departments/[id]
  DELETE /api/departments/[id]
  POST   /api/departments/[id]/members
  GET    /api/departments/[id]/members

Database Tables:
  - departments
  - department_members
  - department_documents
```

---

### 3.6 Collaborative Documents Module

#### 3.6.1 Real-time Collaborative Editor
```typescript
Service: Collaborative Document Service
Technology: Next.js API Routes, Yjs, WebSocket, TipTap

Responsibilities:
  - Google Docs-like real-time collaboration
  - CRDT (Conflict-free Replicated Data Type)
  - Operational Transform
  - Document versioning
  - Comments and suggestions
  - Permission management (Owner, Editor, Commenter, Viewer)

Endpoints:
  GET    /api/docs
  POST   /api/docs
  GET    /api/docs/[id]
  PUT    /api/docs/[id]
  DELETE /api/docs/[id]
  GET    /api/docs/[id]/revisions
  POST   /api/docs/[id]/revert
  POST   /api/docs/[id]/comments
  DELETE /api/docs/[id]/comments/[commentId]
  POST   /api/docs/[id]/share
  PUT    /api/docs/[id]/permissions/[userId]

Features:
  - Real-time cursor tracking
  - Presence awareness
  - Version history
  - Comment threads
  - Granular permissions

Database Tables:
  - collaborative_documents
  - document_revisions
  - document_comments
  - document_permissions
```

---

### 3.7 News & Media Module

#### 3.7.1 News Article Service
```typescript
Service: News Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - News article creation
  - Category management
  - Department-based news
  - Featured articles
  - Top news highlighting
  - View tracking
  - SEO optimization

Categories:
  - EDUCATION
  - RESEARCH
  - INNOVATION
  - CAMPUS_LIFE
  - ALUMNI
  - EVENTS
  - ANNOUNCEMENTS
  - GENERAL

Endpoints:
  GET    /api/news
  POST   /api/news
  GET    /api/news/[slug]
  PUT    /api/news/[id]
  DELETE /api/news/[id]
  GET    /api/news/department/[departmentId]
  GET    /api/news/featured

Database Tables:
  - news_articles
  - news_departments
```

---

### 3.8 Brand & Premium Module

#### 3.8.1 Brand Management Service
```typescript
Service: Brand Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Brand registration (Organizations)
  - Brand verification
  - Member management
  - Badge assignment (Gold, Silver, Blue)
  - Email domain verification

Endpoints:
  POST   /api/brand/create
  GET    /api/brand/[id]
  PUT    /api/brand/[id]
  POST   /api/brand/[id]/member/[userId]
  DELETE /api/brand/[id]/member/[userId]
  POST   /api/brand/[id]/assign-badge

Badge Types:
  - GOLD: Verified Organization (Brand Premium)
  - SILVER: Education/Non-profit
  - BLUE: Premium Individual

Database Tables:
  - brands
  - brand_members
  - brand_badges
```

#### 3.8.2 Premium Subscription Service
```typescript
Service: Premium Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Subscription management
  - Task-based premium activation
  - Module access control
  - Auto-expiry checking

Endpoints:
  POST   /api/premium/subscribe
  POST   /api/premium/cancel
  GET    /api/premium/auto-activate
  POST   /api/premium/check-expiry
  POST   /api/premium/completed-tasks

Plans:
  - STANDARD: Basic features
  - PRO: Advanced features
  - ENTERPRISE: Full features

Database Tables:
  - premium_subscriptions
  - user_module_accesses
```

---

### 3.9 Content Moderation Module

#### 3.9.1 Content Filter Service
```typescript
Service: Content Moderation Service
Technology: Next.js API Routes, Prisma

Responsibilities:
  - Keyword filtering
  - Content category detection
  - Severity-based blocking
  - Context-aware filtering
  - Moderation logging
  - Admin review system

Categories:
  - PROFANITY: Tục tĩu - chửi thề
  - OFFENSIVE: Xúc phạm cá nhân
  - DISCRIMINATION: Kỳ thị - phân biệt
  - SEXUAL: Tình dục - khiêu dâm
  - VIOLENCE: Bạo lực - tự hại
  - DRUGS: Ma túy - chất cấm
  - POLITICAL: Chính trị - cực đoan
  - MISINFORMATION: Tin giả
  - SENSATIONAL: Giật gân - câu view

Severity Levels:
  - FORBIDDEN (🔴): Cấm tuyệt đối
  - RESTRICTED (🟠): Hạn chế mạnh
  - CONDITIONAL (🟡): Có điều kiện
  - ALLOWED (🟢): Cho phép

Database Tables:
  - content_filters
  - moderation_logs
```

---

### 3.10 AI & Search Module

#### 3.10.1 AI Service
```typescript
Service: AI Service
Technology: OpenAI API, Next.js API Routes

Responsibilities:
  - Document draft generation
  - Content summarization
  - Semantic search
  - Text classification
  - Auto-categorization

Endpoints:
  POST   /api/ai/suggest-draft
  POST   /api/ai/search
  POST   /api/dms/documents/[id]/ai/classify
  POST   /api/dms/documents/[id]/ai/summarize

AI Features:
  - GPT-4 powered draft generation
  - Semantic document search
  - Auto-classification
  - Content summarization

Database Tables:
  - document_ai
```

---

## 4. DATABASE ARCHITECTURE

### 4.1 Database Technology
```yaml
Database: PostgreSQL
ORM: Prisma
Hosting: Prisma Cloud (Accelerate)
Connection: Connection pooling with Prisma Accelerate
Optimization: Query optimization, relation preloading
```

### 4.2 Core Data Models

#### 4.2.1 User & Authentication
```prisma
User {
  - Authentication: email, password, OAuth accounts
  - Profile: firstName, lastName, avatar, coverPhoto, bio
  - Security: failedLoginAttempts, lockedUntil
  - Status: isOnline, lastActivityAt
  - Interaction: interactionScore, scoreUpdatedAt
}

Account (OAuth)
Session
VerificationToken
```

#### 4.2.2 LMS Models
```prisma
Class → ClassEnrollment ← User
Class → Assignment → Submission → Grade
Class → Chapter → Lesson
Announcement
```

#### 4.2.3 Social Models
```prisma
Post → Comment, Like, Bookmark, Repost
FriendRequest → Friendship
Conversation → Message
```

#### 4.2.4 DMS Models
```prisma
IncomingDocument → IncomingDocumentAssignment
                 → DocumentAI
                 → DocumentVersion
                 → Workflow → Task

OutgoingDocument → Approval
                 → DigitalSignature
                 → Workflow

AdministrativeDocumentType
WorkItem → Approval
```

#### 4.2.5 Organizational Models
```prisma
Space → SpaceMember
      → SpaceMission (1:1)
      → SpaceWorkflow
      → SpaceTool
      → SpaceRule
      → SpaceKPI → SpaceKPIHistory
      → SpaceResource
      → SpaceTimeline
      → SpaceSprint
      → SpaceSecurity (1:1)
      → SpaceTask → SpaceTaskComment
      → SpaceProgressLog
      → SpaceActivityLog
      → SpaceDocument

Department → DepartmentMember
           → DepartmentDocument
```

#### 4.2.6 Collaborative Documents
```prisma
CollaborativeDocument → DocumentRevision
                      → DocumentComment
                      → DocumentPermission
```

#### 4.2.7 Admin & RBAC
```prisma
Role → RolePermission ← Permission
Role → UserRoleAssignment ← User
Module → ModulePermission ← Permission, Role
Module → UserModuleAccess ← User
AdminAuditLog
```

### 4.3 Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_user_lastActivityAt ON users(lastActivityAt);
CREATE INDEX idx_user_interactionScore ON users(interactionScore);
CREATE INDEX idx_post_createdAt ON posts(createdAt);
CREATE INDEX idx_space_academicYear ON spaces(academicYear);
CREATE INDEX idx_space_archivedAt ON spaces(archivedAt);
CREATE INDEX idx_document_status ON outgoing_documents(status);
CREATE INDEX idx_document_publishedAt ON outgoing_documents(publishedAt);
```

---

## 5. SECURITY ARCHITECTURE

### 5.1 Authentication & Authorization
```yaml
Authentication:
  - NextAuth.js with JWT
  - Google OAuth 2.0
  - Password hashing (bcrypt)
  - Session management
  - Mobile JWT authentication

Authorization:
  - Role-Based Access Control (RBAC)
  - Attribute-Based Access Control (ABAC)
  - Module-level permissions
  - Resource-level permissions
  - Space-level access control
```

### 5.2 Data Protection
```yaml
Input Validation:
  - XSS protection (DOMPurify)
  - SQL injection prevention (Prisma ORM)
  - CSRF protection
  - File upload validation
  - Content moderation

Data Encryption:
  - HTTPS/TLS encryption
  - Password hashing
  - Sensitive data encryption at rest (planned)
  - Digital signatures
```

### 5.3 Security Features
```yaml
Rate Limiting:
  - API rate limiting
  - Login attempt limiting (5 attempts)
  - Account lockout mechanism

Audit & Logging:
  - Admin audit logs
  - Document audit logs (immutable)
  - User activity tracking
  - Change history tracking

Content Security:
  - Content moderation system
  - Keyword filtering
  - Severity-based blocking
  - Admin review workflow
```

---

## 6. DEPLOYMENT ARCHITECTURE

### 6.1 Infrastructure
```yaml
Cloud Platform: Google Cloud Platform (GCP)
Deployment: Cloud Run (Containerized)
Database: Prisma Cloud (PostgreSQL)
Storage: Google Cloud Storage
CDN: CloudFlare (planned)
Domain: Custom domain with SSL
```

### 6.2 CI/CD Pipeline
```yaml
Source Control: Git
Build: Docker
Deployment Script: deploy-phuocbuu-cloud-run.sh
Build Config: cloudbuild.yaml
Container Registry: Google Container Registry (GCR)
```

### 6.3 Monitoring & Logging
```yaml
Logging: GCP Cloud Logging
Analytics: Vercel Analytics, Speed Insights
Error Tracking: Console logging (Sentry planned)
Performance: Real-time metrics
```

---

## 7. MOBILE APPLICATION

### 7.1 Mobile Architecture
```yaml
Platform: Flutter
Features:
  - Authentication (JWT + Google Sign-In)
  - Social Feed
  - Messaging
  - Notifications
  - Profile Management
  - Bookmarks
  - Document Access
  - News Reading

API Integration:
  - REST API endpoints
  - JWT authentication
  - Signed URL uploads
  - Real-time updates (planned)
```

---

## 8. FUTURE ENHANCEMENTS

### 8.1 Planned Features
```yaml
Real-time Collaboration:
  - WebSocket for live updates
  - Real-time notifications
  - Live chat
  - Collaborative editing enhancements

Performance:
  - Redis caching
  - CDN integration
  - Image optimization
  - Lazy loading

AI Enhancements:
  - Advanced AI classification
  - Auto-tagging
  - Content recommendations
  - Chatbot support

Mobile:
  - Push notifications
  - Offline mode
  - File sync
  - Camera integration

Analytics:
  - Advanced reporting
  - Dashboard visualizations
  - User behavior analytics
  - Performance metrics

Security:
  - 2FA implementation
  - Enhanced encryption
  - Biometric authentication (mobile)
  - Security audit reports
```

---

## 9. TECHNOLOGY STACK SUMMARY

### 9.1 Frontend
```yaml
Web Application:
  - Framework: Next.js 16 (App Router)
  - Language: TypeScript
  - Styling: Tailwind CSS
  - UI Components: Radix UI
  - Icons: Lucide React
  - Rich Text: TipTap
  - Real-time: Yjs, WebSocket
  - Analytics: Vercel Analytics

Mobile Application:
  - Framework: Flutter
  - State Management: Provider/Riverpod
  - HTTP Client: Dio
```

### 9.2 Backend
```yaml
API:
  - Framework: Next.js API Routes
  - Language: TypeScript
  - ORM: Prisma
  - Database: PostgreSQL
  - File Upload: Multer
  - Image Processing: Sharp (planned)
  - PDF Generation: jsPDF, pdf-lib

Authentication:
  - NextAuth.js
  - JWT
  - bcrypt
  - OAuth 2.0 (Google)

External Services:
  - OpenAI API (GPT-4)
  - Google Cloud Storage
  - SmartCA (Digital Signature)
  - VNPT/Viettel/MISA CA
```

### 9.3 Infrastructure
```yaml
Hosting: Google Cloud Run
Database: Prisma Cloud (PostgreSQL + Accelerate)
Storage: Google Cloud Storage
Container: Docker
CI/CD: Cloud Build
Monitoring: Cloud Logging
```

---

## 10. API VERSIONING & DOCUMENTATION

### 10.1 API Structure
```
/api/v1/
  ├── auth/           # Authentication endpoints
  ├── classes/        # LMS class management
  ├── assignments/    # Assignment management
  ├── posts/          # Social media posts
  ├── messages/       # Direct messaging
  ├── dms/            # Document management
  ├── spaces/         # Workspace management
  ├── departments/    # Department management
  ├── docs/           # Collaborative documents
  ├── news/           # News articles
  ├── brand/          # Brand management
  ├── premium/        # Premium subscriptions
  ├── admin/          # Admin panel
  ├── ai/             # AI services
  └── mobile/         # Mobile-specific endpoints
```

### 10.2 Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "error": null,
  "timestamp": "2025-01-05T10:00:00Z"
}
```

---

## 11. PERFORMANCE OPTIMIZATION

### 11.1 Database Optimization
```yaml
Strategies:
  - Connection pooling (Prisma Accelerate)
  - Indexed queries
  - Relation preloading
  - Query optimization
  - Pagination
  - Selective field loading
```

### 11.2 Caching Strategy (Planned)
```yaml
Levels:
  - Browser caching
  - CDN caching
  - Application caching (Redis)
  - Database query caching
  - Static page generation
```

---

## 12. COMPLIANCE & STANDARDS

### 12.1 Data Privacy
```yaml
Compliance:
  - GDPR-ready architecture
  - User data protection
  - Right to be forgotten
  - Data export capability
  - Audit trail maintenance
```

### 12.2 Educational Standards
```yaml
Features:
  - Student data protection
  - Role-based access
  - Content moderation
  - Safe communication
  - Parent access (planned)
```

---

## DOCUMENT METADATA

```yaml
Document: THPT Phước Bửu - System Architecture
Version: 1.0.0
Last Updated: 2025-01-05
Author: System Architecture Team
Status: Active
Project: school-lms-platform
```

---

**Note**: This architecture document is a living document and will be updated as the system evolves. For the latest version, please refer to the project repository.
