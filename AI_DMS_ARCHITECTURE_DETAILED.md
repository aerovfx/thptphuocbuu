# 🏗️ Kiến Trúc Chi Tiết - AI-DMS System

Tài liệu này mô tả chi tiết kiến trúc hệ thống AI-DMS cho Next.js 14 + Prisma + Tailwind.

---

## 📐 Sơ Đồ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App Router (React Server Components)         │  │
│  │  - Pages: /dashboard/dms/incoming, /outgoing, /workflow   │  │
│  │  - Components: DocumentList, ApprovalForm, Search        │  │
│  │  - Tailwind CSS for styling                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js API Routes)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ /api/dms/    │  │ /api/ai/     │  │ /api/workflow│         │
│  │  incoming    │  │  ocr         │  │  approval    │         │
│  │  outgoing    │  │  classify    │  │  signature   │         │
│  │  search      │  │  extract     │  │  pending     │         │
│  │              │  │  summarize   │  │              │         │
│  │              │  │  suggest-draft│ │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Business Logic)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Document     │  │ AI Service   │  │ Workflow     │         │
│  │ Service      │  │ - OCR        │  │ Service      │         │
│  │ - Upload     │  │ - Classify   │  │ - Approval   │         │
│  │ - Process    │  │ - Extract    │  │ - Routing    │         │
│  │ - Store      │  │ - Summarize  │  │ - Reminder   │         │
│  │ - Version    │  │ - Embedding  │  │ - Notification│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Prisma ORM)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ IncomingDoc  │  │ OutgoingDoc │  │ Approval     │         │
│  │ Assignment   │  │ Signature   │  │ Workflow     │         │
│  │ DocumentAI   │  │ Task        │  │ AuditLog     │         │
│  │ DocumentVer  │  │ OCRExtract  │  │ Embedding    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ SQLite/      │  │ File Storage │  │ Vector DB    │         │
│  │ PostgreSQL   │  │ (Local/S3)   │  │ (pgvector/   │         │
│  │ (Prisma)     │  │              │  │  Pinecone)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ OCR API      │  │ AI/LLM API   │  │ Digital      │         │
│  │ (Tesseract/  │  │ (OpenAI/     │  │ Signature    │         │
│  │  Google      │  │  Gemini/     │  │ (VNPT/       │         │
│  │  Vision)     │  │  Anthropic)  │  │  Viettel)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components Architecture

### Frontend Components Structure

```
components/
├── DMS/
│   ├── DocumentListDashboard.tsx      # List view với filters
│   ├── DocumentDetailView.tsx         # Chi tiết văn bản
│   ├── ApprovalForm.tsx                # Form phê duyệt
│   ├── CreateOutgoingDocument.tsx     # Tạo văn bản đi
│   ├── UploadIncomingDocument.tsx     # Upload văn bản đến
│   ├── WorkflowTimeline.tsx            # Timeline workflow
│   ├── AISearchBar.tsx                 # Semantic search
│   └── DocumentPreview.tsx            # Preview PDF/image
├── Common/
│   ├── Avatar.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── Toast.tsx
└── Layout/
    ├── DashboardLayout.tsx
    └── Sidebar.tsx
```

### API Routes Structure

```
app/api/
├── dms/
│   ├── incoming/
│   │   ├── route.ts                    # GET, POST list/create
│   │   └── [id]/
│   │       ├── route.ts                # GET, PUT, DELETE detail
│   │       ├── assign/route.ts          # POST assign
│   │       └── ocr/route.ts            # POST trigger OCR
│   ├── outgoing/
│   │   ├── route.ts                    # GET, POST list/create
│   │   └── [id]/
│   │       ├── route.ts                # GET, PUT, DELETE detail
│   │       ├── submit/route.ts          # POST submit for approval
│   │       └── sign/route.ts           # POST digital signature
│   └── documents/
│       └── search/route.ts             # POST semantic search
├── ai/
│   ├── ocr/route.ts                    # POST OCR processing
│   ├── classify/route.ts               # POST classification
│   ├── summarize/route.ts              # POST summarization
│   ├── extract/route.ts                # POST metadata extraction
│   └── suggest-draft/route.ts         # POST draft suggestion
└── workflow/
    ├── approval/
    │   ├── route.ts                     # POST create workflow
    │   └── [id]/
    │       ├── route.ts                 # GET detail
    │       ├── approve/route.ts         # POST approve
    │       ├── reject/route.ts          # POST reject
    │       └── return/route.ts          # POST return
    └── pending/route.ts                # GET pending approvals
```

---

## 🗄️ Database Schema Overview

### Core Models Relationship

```
User
├── incomingDocumentsCreated (IncomingDocument[])
├── incomingDocumentsAssigned (IncomingDocumentAssignment[])
├── outgoingDocumentsCreated (OutgoingDocument[])
├── workflowApprovals (Approval[])
├── digitalSignatures (DigitalSignature[])
└── auditLogs (AuditLog[])

IncomingDocument
├── assignments (IncomingDocumentAssignment[])
├── approvals (Approval[])
├── aiResults (DocumentAI[])
├── versions (DocumentVersion[])
└── workflows (Workflow[])

OutgoingDocument
├── approvals (Approval[])
├── signatures (DigitalSignature[])
└── workflows (Workflow[])

Workflow
├── tasks (Task[])
└── (polymorphic) → IncomingDocument | OutgoingDocument

DocumentVersion
├── ocrExtract (OCRExtract?)
└── embeddings (DocumentEmbedding[])

Approval
└── (polymorphic) → IncomingDocument | OutgoingDocument | WorkItem
```

### Key Indexes

```prisma
// Performance indexes
@@index([status, createdAt])
@@index([type, status])
@@index([priority, deadline])
@@index([assignedToId, status])
@@index([userId, timestamp]) // AuditLog
```

---

## 🔄 Data Flow Diagrams

### 1. Incoming Document Flow

```
User Uploads File
    │
    ▼
POST /api/dms/incoming
    │
    ▼
Document Service
    ├── Save file to storage
    ├── Create IncomingDocument record
    └── Enqueue OCR job
    │
    ▼
Background Worker (OCR)
    ├── Call OCR API (Tesseract/Google Vision)
    ├── Save OCR text to OCRExtract
    └── Update IncomingDocument.ocrText
    │
    ▼
Background Worker (AI Processing)
    ├── Classify document (AI Service)
    ├── Extract metadata (AI Service)
    ├── Summarize content (AI Service)
    └── Generate embeddings (AI Service)
    │
    ▼
Auto-Assignment (Optional)
    ├── AI suggests assignee
    └── Create IncomingDocumentAssignment
    │
    ▼
Notification Service
    └── Send email/push to assignee
```

### 2. Outgoing Document Flow

```
User Creates Draft
    │
    ▼
POST /api/dms/outgoing
    │
    ├── Option 1: Manual draft
    │   └── Save as-is
    │
    └── Option 2: AI-assisted draft
        ├── POST /api/ai/suggest-draft
        ├── AI generates draft
        └── Save draft
    │
    ▼
User Reviews & Edits
    │
    ▼
POST /api/dms/outgoing/[id]/submit
    │
    ▼
Workflow Service
    ├── Create Workflow
    ├── Create Approval steps
    └── Create Tasks
    │
    ▼
Notification Service
    └── Notify approvers
    │
    ▼
Approval Process (Multi-level)
    ├── Approver 1 approves
    ├── Move to next step
    ├── Approver 2 approves
    └── All approved
    │
    ▼
Digital Signature Service
    ├── Call signature API (VNPT/Viettel)
    ├── Sign PDF
    └── Save signed file
    │
    ▼
Document Status → COMPLETED
```

### 3. Semantic Search Flow

```
User Enters Query
    │
    ▼
POST /api/dms/documents/search
    │
    ├── Generate query embedding (AI Service)
    │
    ▼
Vector DB Search
    ├── Find similar embeddings (cosine similarity)
    ├── Filter by metadata (type, status, date)
    └── Rank by relevance score
    │
    ▼
Post-processing
    ├── Extract matched snippets
    ├── Calculate final scores
    └── Format results
    │
    ▼
Return Results to User
```

---

## 🔐 Security & Authentication

### Authentication Flow

```
User Login
    │
    ▼
NextAuth.js
    ├── Credentials (email/password)
    ├── OAuth (Google)
    └── Magic Link
    │
    ▼
Session Management
    ├── JWT token
    └── Database session
    │
    ▼
API Route Protection
    ├── getServerSession()
    ├── Check role/permissions
    └── RBAC middleware
```

### Authorization Matrix

| Action | ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------|---------|---------|--------|
| View Incoming | ✅ | ✅ | ❌ | ❌ |
| Upload Incoming | ✅ | ✅ | ❌ | ❌ |
| Assign Document | ✅ | ✅ | ❌ | ❌ |
| Approve Document | ✅ | ✅ | ❌ | ❌ |
| Create Outgoing | ✅ | ✅ | ❌ | ❌ |
| Sign Document | ✅ | ✅ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Deployment Architecture

### Development

```
┌─────────────┐
│   Next.js   │
│   Dev Server│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SQLite    │
│   (Local)   │
└─────────────┘
```

### Production

```
┌─────────────────┐
│   Vercel/       │
│   Next.js App   │
│   (Edge/Server)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Supabase/    │
│    Railway)     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   S3/MinIO      │
│   (File Storage)│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   OpenAI API    │
│   (External)    │
└─────────────────┘
```

---

## 📊 Performance Optimization

### 1. Database Optimization

- **Indexes:** Add indexes on frequently queried fields
- **Pagination:** Always paginate large lists
- **Selective Fields:** Only fetch needed fields
- **Connection Pooling:** Use Prisma connection pooling

### 2. API Optimization

- **Caching:** Cache AI results, document metadata
- **Batch Processing:** Process multiple documents together
- **Async Jobs:** Move heavy tasks to background workers
- **Rate Limiting:** Prevent API abuse

### 3. Frontend Optimization

- **Server Components:** Use RSC for better performance
- **Code Splitting:** Lazy load heavy components
- **Image Optimization:** Use Next.js Image component
- **Debouncing:** Debounce search inputs

---

## 🔍 Monitoring & Observability

### Logging

```typescript
// Structured logging
logger.info("Document uploaded", {
  documentId: doc.id,
  userId: user.id,
  fileSize: file.size,
  timestamp: new Date(),
});
```

### Metrics

- Document upload rate
- OCR processing time
- AI API response time
- Approval workflow duration
- Error rates

### Alerts

- High error rate (> 5%)
- Slow API responses (> 2s)
- OCR failures
- AI API quota exceeded

---

## 🧪 Testing Strategy

### Unit Tests

- Service layer functions
- AI prompt templates
- Utility functions

### Integration Tests

- API routes
- Database operations
- External API integrations

### E2E Tests

- User workflows
- Document upload → approval → signature
- Search functionality

---

## 📚 Next Steps

1. ✅ Architecture design
2. ⏳ Implement API routes
3. ⏳ Build UI components
4. ⏳ Integrate AI services
5. ⏳ Add tests
6. ⏳ Deploy to production

---

## 🔗 Related Documents

- [SYSTEM_COMPARISON.md](./SYSTEM_COMPARISON.md) - So sánh hệ thống có sẵn
- [API_ROUTES_EXAMPLES.md](./API_ROUTES_EXAMPLES.md) - API routes examples
- [AI_PROMPT_TEMPLATES.md](./AI_PROMPT_TEMPLATES.md) - AI prompt templates
- [DMS_ARCHITECTURE.md](./DMS_ARCHITECTURE.md) - Architecture overview

