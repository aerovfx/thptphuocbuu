# ERD - Entity Relationship Diagram

## Tổng quan Database Schema

```mermaid
erDiagram
    User ||--o{ UserRoleAssignment : has
    User ||--o{ Post : creates
    User ||--o{ Comment : writes
    User ||--o{ OutgoingDocument : creates
    User ||--o{ IncomingDocument : receives
    User ||--o{ Assignment : assigned_to
    User ||--o{ AdminAuditLog : performs
    
    Role ||--o{ RolePermission : has
    Role ||--o{ UserRoleAssignment : assigned_to
    
    Permission ||--o{ RolePermission : granted_to
    
    Module ||--o{ ModuleConfig : configures
    
    OutgoingDocument ||--o{ Approval : requires
    OutgoingDocument ||--o{ DocumentVersion : has
    OutgoingDocument ||--o{ DocumentComment : has
    
    IncomingDocument ||--o{ IncomingDocumentAssignment : assigned_to
    IncomingDocument ||--o{ Approval : requires
    
    Post ||--o{ Comment : has
    Post ||--o{ Like : receives
    Post ||--o{ Bookmark : bookmarked_by
    
    Event ||--o{ EventRegistration : has
    Event ||--o{ EventMedia : contains
    
    Media ||--o{ MediaThumbnail : has
    Media ||--o{ MediaMetadata : has
```

## Chi tiết các bảng chính

### 1. User Management & RBAC

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string firstName
        string lastName
        string avatar
        enum role
        enum status
        datetime lastLogin
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Role {
        string id PK
        string name UK
        string description
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    Permission {
        string id PK
        string resource
        string action
        string description
        datetime createdAt
    }
    
    RolePermission {
        string id PK
        string roleId FK
        string permissionId FK
        json attributes
        datetime createdAt
    }
    
    UserRoleAssignment {
        string id PK
        string userId FK
        string roleId FK
        string assignedById FK
        datetime assignedAt
    }
    
    Module {
        string id PK
        string key UK
        string name
        string description
        boolean enabled
        json config
        string version
        datetime createdAt
        datetime updatedAt
    }
    
    AdminAuditLog {
        string id PK
        string actorId FK
        string action
        string targetType
        string targetId
        json details
        string ipAddress
        string userAgent
        datetime createdAt
    }
    
    User ||--o{ UserRoleAssignment : "has roles"
    Role ||--o{ UserRoleAssignment : "assigned to users"
    Role ||--o{ RolePermission : "has permissions"
    Permission ||--o{ RolePermission : "granted to roles"
    User ||--o{ AdminAuditLog : "performs actions"
```

### 2. Document Management System (DMS)

```mermaid
erDiagram
    OutgoingDocument {
        string id PK
        string title
        string content
        string recipient
        enum priority
        enum status
        datetime sendDate
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    IncomingDocument {
        string id PK
        string title
        string content
        string sender
        enum documentType
        enum status
        datetime receivedDate
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    IncomingDocumentAssignment {
        string id PK
        string documentId FK
        string assignedToId FK
        enum status
        datetime deadline
        datetime completedAt
        datetime createdAt
    }
    
    Approval {
        string id PK
        string documentId FK
        string approverId FK
        enum status
        string comment
        datetime createdAt
        datetime updatedAt
    }
    
    DocumentVersion {
        string id PK
        string documentId FK
        int versionNumber
        string content
        string s3Path
        string createdById FK
        datetime createdAt
    }
    
    DocumentComment {
        string id PK
        string documentId FK
        string userId FK
        string content
        datetime createdAt
    }
    
    OutgoingDocument ||--o{ Approval : "requires approval"
    OutgoingDocument ||--o{ DocumentVersion : "has versions"
    OutgoingDocument ||--o{ DocumentComment : "has comments"
    IncomingDocument ||--o{ IncomingDocumentAssignment : "assigned to users"
    IncomingDocument ||--o{ Approval : "requires approval"
```

### 3. Content Management (Posts, Comments, Media)

```mermaid
erDiagram
    Post {
        string id PK
        string authorId FK
        string content
        enum postType
        string location
        datetime scheduledAt
        datetime createdAt
        datetime updatedAt
    }
    
    Comment {
        string id PK
        string postId FK
        string authorId FK
        string content
        string parentId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Like {
        string id PK
        string postId FK
        string userId FK
        datetime createdAt
    }
    
    Bookmark {
        string id PK
        string postId FK
        string userId FK
        datetime createdAt
    }
    
    Media {
        string id PK
        string s3Path
        string mimeType
        int size
        string uploadedById FK
        json metadata
        datetime createdAt
    }
    
    MediaThumbnail {
        string id PK
        string mediaId FK
        string s3Path
        int width
        int height
        datetime createdAt
    }
    
    Post ||--o{ Comment : "has comments"
    Post ||--o{ Like : "receives likes"
    Post ||--o{ Bookmark : "bookmarked by users"
    Post ||--o{ Media : "contains media"
    Media ||--o{ MediaThumbnail : "has thumbnails"
```

### 4. Events & Calendar

```mermaid
erDiagram
    Event {
        string id PK
        string title
        string description
        datetime startDate
        datetime endDate
        string location
        int capacity
        string organizerId FK
        enum status
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    EventRegistration {
        string id PK
        string eventId FK
        string userId FK
        enum status
        datetime registeredAt
        datetime checkedInAt
    }
    
    EventMedia {
        string id PK
        string eventId FK
        string mediaId FK
        datetime createdAt
    }
    
    Event ||--o{ EventRegistration : "has registrations"
    Event ||--o{ EventMedia : "contains media"
```

### 5. Learning Management System (LMS)

```mermaid
erDiagram
    Class {
        string id PK
        string name
        string code UK
        string teacherId FK
        string description
        datetime createdAt
        datetime updatedAt
    }
    
    ClassEnrollment {
        string id PK
        string classId FK
        string userId FK
        datetime enrolledAt
    }
    
    Assignment {
        string id PK
        string classId FK
        string title
        string description
        datetime dueDate
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }
    
    Submission {
        string id PK
        string assignmentId FK
        string studentId FK
        string content
        string filePath
        enum status
        datetime submittedAt
        datetime gradedAt
    }
    
    Grade {
        string id PK
        string submissionId FK
        string teacherId FK
        float score
        string feedback
        datetime createdAt
    }
    
    Class ||--o{ ClassEnrollment : "has students"
    Class ||--o{ Assignment : "has assignments"
    Assignment ||--o{ Submission : "receives submissions"
    Submission ||--o{ Grade : "has grade"
```

## Relationships Summary

### User Relationships
- **User → UserRoleAssignment**: Một user có nhiều role assignments
- **User → Post**: Một user tạo nhiều posts
- **User → OutgoingDocument**: Một user tạo nhiều outgoing documents
- **User → IncomingDocumentAssignment**: Một user được assign nhiều incoming documents
- **User → AdminAuditLog**: Một user thực hiện nhiều audit logs

### Document Relationships
- **OutgoingDocument → Approval**: Một document cần nhiều approvals
- **OutgoingDocument → DocumentVersion**: Một document có nhiều versions
- **IncomingDocument → IncomingDocumentAssignment**: Một document được assign cho nhiều users

### Content Relationships
- **Post → Comment**: Một post có nhiều comments
- **Post → Like**: Một post nhận nhiều likes
- **Post → Media**: Một post chứa nhiều media files

### RBAC Relationships
- **Role → RolePermission**: Một role có nhiều permissions
- **Role → UserRoleAssignment**: Một role được assign cho nhiều users
- **Permission → RolePermission**: Một permission được grant cho nhiều roles

## Indexes & Performance

### Critical Indexes
```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Document indexes
CREATE INDEX idx_outgoing_docs_created_by ON outgoing_documents(createdById);
CREATE INDEX idx_outgoing_docs_status ON outgoing_documents(status);
CREATE INDEX idx_incoming_docs_assignments ON incoming_document_assignments(assignedToId);

-- Post indexes
CREATE INDEX idx_posts_author ON posts(authorId);
CREATE INDEX idx_posts_created_at ON posts(createdAt DESC);

-- RBAC indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(roleId);
CREATE INDEX idx_user_roles_user ON user_roles(userId);
CREATE INDEX idx_audit_logs_actor ON admin_audit_logs(actorId);
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(createdAt DESC);
```

## Data Types & Constraints

### Enums
- **UserRole**: ADMIN, TEACHER, STUDENT, PARENT
- **UserStatus**: ACTIVE, SUSPENDED, DELETED, PENDING
- **DocumentStatus**: PENDING, PROCESSING, APPROVED, REJECTED, COMPLETED, ARCHIVED
- **PostType**: TEXT, IMAGE, VIDEO, LINK
- **ApprovalStatus**: PENDING, APPROVED, REJECTED, RETURNED

### Constraints
- Email must be unique
- Role name must be unique
- Permission (resource, action) must be unique
- User-Role assignment must be unique
- Document version number must be unique per document

