# 🚀 MVP Plan - Phiên bản 1

Tài liệu này mô tả chi tiết kế hoạch triển khai MVP trong 3-4 tháng với đội 4 developers.

---

## 📋 Tổng Quan MVP

### Timeline
- **Thời gian**: 3-4 tháng
- **Đội ngũ**: 4 developers
- **Mục tiêu**: Xây dựng nền tảng cơ bản với các tính năng core để validate product-market fit

### Scope MVP

1. ✅ **Authentication & Profiles** - Đăng nhập, đăng ký, quản lý hồ sơ
2. ✅ **Feed cơ bản** - Tạo bài viết, đăng bài, bình luận
3. ✅ **Groups & Documents Upload** - Nhóm và upload tài liệu lên S3
4. ✅ **Chat 1-1 (Basic)** - Tin nhắn trực tiếp giữa 2 người
5. ✅ **Assignment** - Tạo bài tập, nộp bài, chấm điểm đơn giản
6. ✅ **Admin Panel cơ bản** - Quản lý người dùng, hệ thống

---

## 🛠️ Tech Stack MVP

### Frontend
- **Next.js 14** (App Router) - Web application
- **React Native** (Optional) - Mobile app (Phase 2 nếu có thời gian)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - UI components

### Backend
- **Next.js API Routes** - API endpoints (Phase 1)
- **Node.js/TypeScript Microservices** (NestJS/Express) - Service layer (Phase 2)
- **NextAuth.js** - Authentication
- **Socket.IO** - Real-time communication

### Database & Storage
- **PostgreSQL** - Primary database (production)
- **Prisma ORM** - Database access layer
- **Redis** - Caching & session storage
- **AWS S3** (hoặc MinIO) - File storage cho documents

### Infrastructure
- **Docker** - Containerization
- **Vercel/Railway** - Hosting (Next.js)
- **Supabase/Neon** - PostgreSQL hosting
- **Upstash** - Redis hosting

---

## 🏗️ Kiến Trúc Hệ Thống MVP

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Next.js Web     │  │  React Native    │                │
│  │  (Primary)       │  │  (Optional)      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Next.js API     │  │  Microservices   │                │
│  │  Routes          │  │  (NestJS/Express)│                │
│  │  (Phase 1)       │  │  (Phase 2)       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │  Feed    │  │  Chat    │  │  File    │   │
│  │  Service │  │  Service │  │  Service │  │  Service │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │   S3     │                  │
│  │ (Prisma) │  │ (Cache)  │  │ (Files)  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    REAL-TIME LAYER                           │
│  ┌──────────────────────────────────────────┐               │
│  │         Socket.IO Server                  │               │
│  │  - Chat messages                          │               │
│  │  - Notifications                          │               │
│  │  - Feed updates                           │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Chi Tiết Tính Năng MVP

### 1. Authentication & Profiles

#### Features
- ✅ Đăng ký với email/password
- ✅ Đăng nhập với email/password
- ✅ OAuth (Google) - Optional
- ✅ Quản lý profile (avatar, cover, bio)
- ✅ Đổi mật khẩu
- ✅ Quên mật khẩu (reset password)

#### API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session
POST   /api/auth/reset-password
GET    /api/users/[id]
PUT    /api/users/[id]
POST   /api/users/[id]/avatar
POST   /api/users/[id]/cover
```

#### Database Models
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // Hashed with bcrypt
  firstName     String
  lastName      String
  avatar        String?   // S3 URL
  coverPhoto    String?   // S3 URL
  role          UserRole  @default(STUDENT)
  bio           String?
  phone         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

#### UI Pages
- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký
- `/users/[id]` - Trang profile
- `/dashboard/settings` - Cài đặt tài khoản

---

### 2. Feed Cơ Bản

#### Features
- ✅ Tạo bài viết (text, image)
- ✅ Xem feed (timeline)
- ✅ Bình luận trên bài viết
- ✅ Like/Unlike bài viết
- ✅ Xóa bài viết của mình
- ✅ Xem chi tiết bài viết

#### API Endpoints
```
GET    /api/posts/feed          # Get feed posts
POST   /api/posts               # Create post
GET    /api/posts/[id]          # Get post detail
PUT    /api/posts/[id]          # Update post
DELETE /api/posts/[id]          # Delete post
POST   /api/posts/[id]/like     # Like/Unlike
POST   /api/posts/[id]/comment  # Add comment
GET    /api/posts/[id]/comments # Get comments
```

#### Database Models
```prisma
model Post {
  id        String   @id @default(cuid())
  content   String
  images    String[] // S3 URLs
  authorId  String
  author    User     @relation("AuthorPosts", fields: [authorId], references: [id])
  likes     Like[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
}
```

#### UI Pages
- `/dashboard/social` - Feed page
- `/posts/[id]` - Post detail page

---

### 3. Groups & Documents Upload

#### Features
- ✅ Tạo nhóm (group/class)
- ✅ Upload tài liệu lên S3
- ✅ Xem danh sách tài liệu
- ✅ Tải xuống tài liệu
- ✅ Xóa tài liệu (admin/owner)
- ✅ Phân quyền xem tài liệu

#### API Endpoints
```
GET    /api/groups              # List groups
POST   /api/groups              # Create group
GET    /api/groups/[id]         # Get group detail
POST   /api/groups/[id]/join    # Join group
POST   /api/groups/[id]/leave   # Leave group

GET    /api/documents           # List documents
POST   /api/documents           # Upload document
GET    /api/documents/[id]      # Get document
DELETE /api/documents/[id]      # Delete document
GET    /api/documents/[id]/download # Download file
```

#### Database Models
```prisma
model Group {
  id          String       @id @default(cuid())
  name        String
  description String?
  avatar      String?      // S3 URL
  ownerId     String
  owner       User         @relation(fields: [ownerId], references: [id])
  members     GroupMember[]
  documents   Document[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model GroupMember {
  id        String   @id @default(cuid())
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String   @default("MEMBER") // MEMBER, ADMIN
  joinedAt  DateTime @default(now())
  
  @@unique([groupId, userId])
}

model Document {
  id          String   @id @default(cuid())
  title       String
  description String?
  fileUrl     String   // S3 URL
  fileName    String
  fileSize    Int      // bytes
  mimeType    String
  groupId     String?
  group       Group?   @relation(fields: [groupId], references: [id])
  uploaderId String
  uploader   User      @relation(fields: [uploaderId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### UI Pages
- `/dashboard/classes` - List groups/classes
- `/dashboard/classes/[id]` - Group detail
- `/dashboard/documents` - Documents list
- `/dashboard/documents/upload` - Upload document

---

### 4. Chat 1-1 (Basic)

#### Features
- ✅ Gửi tin nhắn text
- ✅ Xem danh sách cuộc trò chuyện
- ✅ Real-time messaging với Socket.IO
- ✅ Đánh dấu đã đọc
- ✅ Hiển thị "đang gõ"
- ✅ Thông báo tin nhắn mới

#### API Endpoints
```
GET    /api/messages            # Get conversations list
GET    /api/messages/[userId]   # Get messages with user
POST   /api/messages            # Send message
PUT    /api/messages/[id]/read  # Mark as read
```

#### Socket.IO Events
```typescript
// Client → Server
socket.emit('message:send', { toUserId, content })
socket.emit('typing:start', { toUserId })
socket.emit('typing:stop', { toUserId })

// Server → Client
socket.on('message:new', (message) => {})
socket.on('message:read', ({ messageId }) => {})
socket.on('typing:status', ({ userId, isTyping }) => {})
```

#### Database Models
```prisma
model Conversation {
  id        String   @id @default(cuid())
  user1Id   String
  user1     User     @relation("User1Conversations", fields: [user1Id], references: [id])
  user2Id   String
  user2     User     @relation("User2Conversations", fields: [user2Id], references: [id])
  messages  Message[]
  updatedAt DateTime @updatedAt
  
  @@unique([user1Id, user2Id])
}

model Message {
  id             String       @id @default(cuid())
  content        String
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  readAt         DateTime?
  createdAt      DateTime     @default(now())
}
```

#### UI Pages
- `/messages` - Conversations list
- `/messages/[userId]` - Chat with user

---

### 5. Assignment (Create/Submit + Simple Grading)

#### Features
- ✅ Giáo viên tạo bài tập
- ✅ Học sinh nộp bài (upload file)
- ✅ Giáo viên chấm điểm
- ✅ Xem danh sách bài tập
- ✅ Xem chi tiết bài tập và điểm số

#### API Endpoints
```
GET    /api/assignments              # List assignments
POST   /api/assignments              # Create assignment (teacher)
GET    /api/assignments/[id]         # Get assignment detail
PUT    /api/assignments/[id]         # Update assignment
DELETE /api/assignments/[id]         # Delete assignment

POST   /api/assignments/[id]/submit  # Submit assignment (student)
GET    /api/assignments/[id]/submissions # Get submissions (teacher)
POST   /api/submissions/[id]/grade   # Grade submission (teacher)
```

#### Database Models
```prisma
model Assignment {
  id          String       @id @default(cuid())
  title       String
  description String?
  classId     String
  class       Class        @relation(fields: [classId], references: [id])
  teacherId   String
  teacher     User         @relation(fields: [teacherId], references: [id])
  dueDate     DateTime
  maxScore    Int          @default(100)
  submissions Submission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Submission {
  id           String     @id @default(cuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  studentId    String
  student      User       @relation(fields: [studentId], references: [id])
  fileUrl      String     // S3 URL
  fileName     String
  grade        Int?
  feedback     String?
  gradedAt     DateTime?
  submittedAt  DateTime   @default(now())
}
```

#### UI Pages
- `/dashboard/classes/[id]/assignments` - Assignments list
- `/dashboard/classes/[id]/assignments/[id]` - Assignment detail
- `/dashboard/classes/[id]/assignments/new` - Create assignment

---

### 6. Admin Panel Cơ Bản

#### Features
- ✅ Quản lý người dùng (xem, khóa/mở khóa)
- ✅ Xem thống kê cơ bản (số users, posts, documents)
- ✅ Quản lý roles
- ✅ Xem logs cơ bản

#### API Endpoints
```
GET    /api/admin/users            # List users
GET    /api/admin/users/[id]       # Get user detail
PUT    /api/admin/users/[id]       # Update user (role, status)
DELETE /api/admin/users/[id]       # Delete user

GET    /api/admin/stats            # Get statistics
GET    /api/admin/logs             # Get system logs
```

#### UI Pages
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/users` - User management
- `/dashboard/admin/stats` - Statistics

---

## 📅 Lộ Trình Triển Khai (3-4 tháng)

### Tháng 1: Foundation & Core Features

#### Tuần 1-2: Setup & Authentication
- [ ] Setup project structure (Next.js, Prisma, PostgreSQL)
- [ ] Setup S3 storage
- [ ] Setup Redis
- [ ] Implement authentication (register, login, session)
- [ ] User profile management
- [ ] Basic UI components

**Deliverable**: Users có thể đăng ký, đăng nhập, quản lý profile

#### Tuần 3-4: Feed & Posts
- [ ] Post creation (text + images)
- [ ] Feed timeline
- [ ] Comments system
- [ ] Like/Unlike functionality
- [ ] Image upload to S3

**Deliverable**: Users có thể đăng bài, xem feed, comment, like

---

### Tháng 2: Groups, Documents & Chat

#### Tuần 5-6: Groups & Documents
- [ ] Group/Class creation
- [ ] Group membership
- [ ] Document upload to S3
- [ ] Document listing & download
- [ ] File permissions

**Deliverable**: Users có thể tạo nhóm, upload và quản lý tài liệu

#### Tuần 7-8: Chat 1-1
- [ ] Socket.IO setup
- [ ] Message model & API
- [ ] Real-time messaging
- [ ] Conversation list
- [ ] Read receipts
- [ ] Typing indicators

**Deliverable**: Users có thể chat real-time 1-1

---

### Tháng 3: Assignments & Admin

#### Tuần 9-10: Assignments
- [ ] Assignment creation (teacher)
- [ ] Assignment submission (student)
- [ ] File upload for submissions
- [ ] Grading system
- [ ] Grade display

**Deliverable**: Teachers tạo bài tập, students nộp bài, teachers chấm điểm

#### Tuần 11-12: Admin Panel
- [ ] Admin dashboard
- [ ] User management
- [ ] Statistics & analytics
- [ ] Basic logging
- [ ] Role management

**Deliverable**: Admins có thể quản lý users và xem thống kê

---

### Tháng 4: Polish & Testing

#### Tuần 13-14: Testing & Bug Fixes
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Bug fixes
- [ ] Performance optimization

#### Tuần 15-16: Deployment & Documentation
- [ ] Production deployment
- [ ] CI/CD setup
- [ ] Documentation
- [ ] User guide
- [ ] Final testing

**Deliverable**: MVP sẵn sàng cho production

---

## 👥 Phân Công Đội Ngũ (4 Developers)

### Developer 1: Frontend Lead
- **Trách nhiệm**:
  - Next.js app structure
  - UI components (Tailwind + Radix)
  - Pages & routing
  - State management
- **Focus**: Feed, Posts, UI/UX

### Developer 2: Backend Lead
- **Trách nhiệm**:
  - API routes
  - Database schema (Prisma)
  - Business logic
  - Authentication
- **Focus**: Auth, Groups, Documents, Assignments

### Developer 3: Real-time & Infrastructure
- **Trách nhiệm**:
  - Socket.IO setup
  - Chat system
  - S3 integration
  - Redis caching
  - Deployment
- **Focus**: Chat, File storage, Infrastructure

### Developer 4: Full-stack (Support)
- **Trách nhiệm**:
  - Admin panel
  - Testing
  - Bug fixes
  - Documentation
  - Support các features khác
- **Focus**: Admin, Testing, Support

---

## 🗄️ Database Schema MVP

### Core Models

```prisma
// User & Auth
model User { ... }
model Account { ... }  // OAuth
model Session { ... }  // NextAuth

// Social
model Post { ... }
model Comment { ... }
model Like { ... }

// Groups & Documents
model Group { ... }
model GroupMember { ... }
model Document { ... }

// Chat
model Conversation { ... }
model Message { ... }

// Assignments
model Class { ... }
model ClassEnrollment { ... }
model Assignment { ... }
model Submission { ... }
model Grade { ... }
```

### Indexes for Performance

```prisma
// User
@@index([email])
@@index([role])

// Post
@@index([authorId, createdAt])
@@index([createdAt])

// Message
@@index([conversationId, createdAt])
@@index([senderId])

// Assignment
@@index([classId, createdAt])
@@index([teacherId])
```

---

## 🔐 Security & Authentication

### Authentication Flow
1. User registers → Hash password (bcrypt)
2. User logs in → Verify password → Create session (NextAuth)
3. API routes check session → `getServerSession()`
4. Role-based access control (RBAC)

### Authorization Matrix

| Feature | ADMIN | TEACHER | STUDENT | PARENT |
|---------|-------|---------|---------|--------|
| View Feed | ✅ | ✅ | ✅ | ✅ |
| Create Post | ✅ | ✅ | ✅ | ✅ |
| Create Group | ✅ | ✅ | ❌ | ❌ |
| Upload Document | ✅ | ✅ | ❌ | ❌ |
| Chat | ✅ | ✅ | ✅ | ✅ |
| Create Assignment | ✅ | ✅ | ❌ | ❌ |
| Submit Assignment | ❌ | ❌ | ✅ | ❌ |
| Grade Assignment | ✅ | ✅ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ | ❌ |

---

## 📦 Dependencies MVP

### package.json (Core)

```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^6.19.0",
    "next-auth": "^4.24.5",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    "@aws-sdk/client-s3": "^3.0.0",
    "ioredis": "^5.3.2",
    "date-fns": "^3.0.6"
  }
}
```

---

## 🚀 Deployment Strategy

### Development
- **Next.js**: `npm run dev` (localhost:3000)
- **PostgreSQL**: Local hoặc Supabase
- **Redis**: Local hoặc Upstash (free tier)
- **S3**: MinIO local hoặc AWS S3

### Production
- **Next.js**: Vercel hoặc Railway
- **PostgreSQL**: Supabase, Neon, hoặc Railway
- **Redis**: Upstash
- **S3**: AWS S3 hoặc Cloudflare R2
- **Socket.IO**: Same server hoặc separate service

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="..."

# S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."

# Redis
REDIS_URL="redis://..."

# OAuth (Optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 📊 Success Metrics MVP

### Technical Metrics
- ✅ API response time < 500ms (p95)
- ✅ Page load time < 2s
- ✅ Uptime > 99%
- ✅ Zero critical security vulnerabilities

### User Metrics
- ✅ 100+ registered users
- ✅ 500+ posts created
- ✅ 1000+ messages sent
- ✅ 50+ assignments created

---

## 🧪 Testing Strategy MVP

### Unit Tests
- Service functions
- Utility functions
- API route handlers

### Integration Tests
- API endpoints
- Database operations
- S3 upload/download

### E2E Tests (Critical Paths)
- User registration → Login → Create post
- Upload document → Download document
- Send message → Receive message
- Create assignment → Submit → Grade

---

## 📝 Documentation Requirements

### Technical Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Development setup guide

### User Documentation
- [ ] User guide (basic)
- [ ] Admin guide
- [ ] FAQ

---

## 🎯 Out of Scope (Post-MVP)

### Features NOT in MVP
- ❌ Video posts
- ❌ Group chat
- ❌ Advanced search
- ❌ Notifications system (email/push)
- ❌ Mobile app (React Native) - Optional
- ❌ AI features
- ❌ Analytics dashboard
- ❌ Export/Import data
- ❌ Multi-language support

### These will be added in v2 based on user feedback

---

## 🔗 Related Documents

- [AI_DMS_ARCHITECTURE_DETAILED.md](./AI_DMS_ARCHITECTURE_DETAILED.md) - Detailed DMS architecture
- [DMS_ARCHITECTURE.md](./DMS_ARCHITECTURE.md) - DMS overview
- [README.md](./README.md) - Project overview
- [SETUP.md](./SETUP.md) - Setup instructions

---

## ✅ Checklist MVP Launch

### Pre-Launch
- [ ] All core features implemented
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Documentation complete
- [ ] Production environment setup
- [ ] Monitoring & logging setup
- [ ] Backup strategy in place

### Launch Day
- [ ] Deploy to production
- [ ] Smoke tests
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] User acceptance testing

### Post-Launch (Week 1)
- [ ] Monitor user feedback
- [ ] Fix critical bugs
- [ ] Performance tuning
- [ ] Collect metrics

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Planning Phase

