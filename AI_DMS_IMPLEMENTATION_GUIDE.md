# 📘 Hướng Dẫn Triển Khai AI-DMS System

Tài liệu tổng hợp này hướng dẫn bạn triển khai hệ thống AI-DMS từ đầu đến cuối.

---

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Tài Liệu Đã Tạo](#tài-liệu-đã-tạo)
3. [Bắt Đầu Nhanh](#bắt-đầu-nhanh)
4. [Các Bước Triển Khai](#các-bước-triển-khai)
5. [Tích Hợp AI](#tích-hợp-ai)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🎯 Tổng Quan

Hệ thống AI-DMS được xây dựng với:
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Prisma + SQLite/PostgreSQL
- **AI Services:** OpenAI/Gemini/Anthropic
- **File Storage:** Local/S3/MinIO
- **Vector DB:** pgvector/Pinecone (cho semantic search)

---

## 📚 Tài Liệu Đã Tạo

### 1. **SYSTEM_COMPARISON.md**
Bảng so sánh chi tiết các hệ thống DMS có sẵn:
- MISA eOffice
- VNPT eOffice
- SharePoint + Copilot
- Mayan EDMS

**Sử dụng khi:** Cần quyết định giữa hệ thống có sẵn vs tự xây.

### 2. **AI_DMS_ARCHITECTURE_DETAILED.md**
Kiến trúc chi tiết hệ thống:
- Sơ đồ kiến trúc tổng thể
- Components structure
- API routes structure
- Database schema overview
- Data flow diagrams
- Security & authentication
- Deployment architecture

**Sử dụng khi:** Cần hiểu rõ kiến trúc hệ thống.

### 3. **API_ROUTES_EXAMPLES.md**
10+ API routes với request/response examples:
- POST /api/dms/incoming - Upload văn bản đến
- GET /api/dms/incoming - List văn bản đến
- GET /api/dms/incoming/[id] - Chi tiết văn bản
- POST /api/workflow/approval - Tạo luồng phê duyệt
- POST /api/ai/search - Semantic search
- Và nhiều routes khác...

**Sử dụng khi:** Implement API routes.

### 4. **AI_PROMPT_TEMPLATES.md**
Prompt templates cho các tính năng AI:
- Document Classification
- Metadata Extraction
- Document Summarization
- Draft Suggestion
- Auto-Routing
- Urgency Detection
- Related Documents
- PII Detection

**Sử dụng khi:** Tích hợp AI services.

### 5. **components/DMS/DocumentListDashboard.tsx**
Sample UI component cho Dashboard Document List:
- List view với filters
- Status badges
- Priority indicators
- Pagination
- Search functionality

**Sử dụng khi:** Xây dựng UI components.

---

## 🚀 Bắt Đầu Nhanh

### 1. Kiểm Tra Prerequisites

```bash
# Node.js 18+
node --version

# npm hoặc yarn
npm --version

# Git
git --version
```

### 2. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed data
npm run db:seed
```

### 3. Setup Environment Variables

Tạo file `.env.local`:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OpenAI (cho AI features)
OPENAI_API_KEY="sk-..."

# File Storage (nếu dùng S3)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."

# Digital Signature (nếu tích hợp)
VNPT_SIGNATURE_API_KEY="..."
```

### 4. Chạy Development Server

```bash
npm run dev
```

Truy cập: http://localhost:3000

---

## 📝 Các Bước Triển Khai

### Phase 1: Core DMS (Tuần 1-2)

#### 1.1. Database Setup
- ✅ Schema đã có trong `prisma/schema.prisma`
- ⏳ Chạy migrations
- ⏳ Seed test data

#### 1.2. API Routes - Incoming Documents
- ⏳ POST /api/dms/incoming - Upload
- ⏳ GET /api/dms/incoming - List
- ⏳ GET /api/dms/incoming/[id] - Detail
- ⏳ POST /api/dms/incoming/[id]/assign - Assign

**Tham khảo:** `API_ROUTES_EXAMPLES.md`

#### 1.3. UI Components
- ⏳ DocumentListDashboard (đã có sample)
- ⏳ DocumentDetailView
- ⏳ UploadIncomingDocument
- ⏳ ApprovalForm (đã có)

#### 1.4. File Upload & Storage
- ⏳ Setup file upload handler
- ⏳ Save files to local/S3
- ⏳ Generate file URLs

### Phase 2: Workflow Engine (Tuần 3)

#### 2.1. Workflow API
- ⏳ POST /api/workflow/approval - Create workflow
- ⏳ POST /api/workflow/approval/[id]/approve - Approve
- ⏳ POST /api/workflow/approval/[id]/reject - Reject
- ⏳ GET /api/workflow/pending - Pending approvals

#### 2.2. Workflow UI
- ⏳ WorkflowTimeline component
- ⏳ ApprovalForm enhancements
- ⏳ Notification system

### Phase 3: AI Integration (Tuần 4-5)

#### 3.1. OCR Service
- ⏳ Setup OCR API (Tesseract/Google Vision)
- ⏳ POST /api/ai/ocr - Process OCR
- ⏳ Background worker cho OCR

**Tham khảo:** `AI_PROMPT_TEMPLATES.md`

#### 3.2. AI Classification & Extraction
- ⏳ POST /api/ai/classify - Classify document
- ⏳ POST /api/ai/extract - Extract metadata
- ⏳ POST /api/ai/summarize - Summarize document

#### 3.3. Semantic Search
- ⏳ Setup vector DB (pgvector/Pinecone)
- ⏳ Generate embeddings
- ⏳ POST /api/dms/documents/search - Semantic search

#### 3.4. Draft Suggestion
- ⏳ POST /api/ai/suggest-draft - AI draft suggestion
- ⏳ Integrate vào CreateOutgoingDocument

### Phase 4: Advanced Features (Tuần 6-7)

#### 4.1. Digital Signature
- ⏳ Integrate VNPT/Viettel signature API
- ⏳ POST /api/dms/outgoing/[id]/sign - Sign document
- ⏳ Signature verification

#### 4.2. Analytics & Reporting
- ⏳ Dashboard statistics
- ⏳ Document analytics
- ⏳ Workflow performance metrics

#### 4.3. Notifications
- ⏳ Email notifications
- ⏳ Push notifications
- ⏳ In-app notifications

---

## 🤖 Tích Hợp AI

### 1. Setup OpenAI

```typescript
// lib/ai-service.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function classifyDocument(content: string) {
  // Sử dụng prompt từ AI_PROMPT_TEMPLATES.md
  const prompt = `...`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  
  return response.choices[0].message.content;
}
```

### 2. Background Workers

Sử dụng BullMQ hoặc Next.js API routes với queue:

```typescript
// app/api/ai/ocr/route.ts
export async function POST(req: Request) {
  // Enqueue OCR job
  await ocrQueue.add("process-ocr", {
    documentId: doc.id,
    fileUrl: doc.fileUrl,
  });
  
  return Response.json({ success: true, jobId: job.id });
}
```

### 3. Vector Embeddings

```typescript
// Generate embeddings
const embedding = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: documentText,
});

// Save to vector DB
await prisma.documentEmbedding.create({
  data: {
    documentVersionId: version.id,
    vector: JSON.stringify(embedding.data[0].embedding),
    model: "text-embedding-ada-002",
  },
});
```

---

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/services/document-service.test.ts
import { classifyDocument } from "@/lib/ai-service";

describe("Document Classification", () => {
  it("should classify directive document", async () => {
    const result = await classifyDocument("Công văn chỉ đạo...");
    expect(result.category).toBe("DIRECTIVE");
  });
});
```

### Integration Tests

```typescript
// __tests__/api/dms/incoming.test.ts
describe("POST /api/dms/incoming", () => {
  it("should upload document", async () => {
    const response = await fetch("/api/dms/incoming", {
      method: "POST",
      body: formData,
    });
    expect(response.status).toBe(201);
  });
});
```

### E2E Tests

Sử dụng Playwright hoặc Cypress:

```typescript
// e2e/document-workflow.spec.ts
test("complete document workflow", async ({ page }) => {
  // Upload document
  await page.click("text=Upload văn bản");
  // ... test workflow
});
```

---

## 🚢 Deployment

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Database Migration

```bash
# Production database
DATABASE_URL="postgresql://..." npm run db:push
```

### 3. Environment Variables

Set trong Vercel dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- etc.

### 4. File Storage

Setup S3 hoặc Vercel Blob Storage cho production.

---

## 📊 Monitoring

### 1. Error Tracking

Sử dụng Sentry:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 2. Analytics

Sử dụng Vercel Analytics hoặc Google Analytics.

### 3. Logging

Structured logging với Pino hoặc Winston.

---

## 🔗 Tài Liệu Tham Khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Nghị định 30/2020/NĐ-CP](https://vanban.chinhphu.vn/)

---

## ❓ FAQ

### Q: Nên dùng SQLite hay PostgreSQL?
**A:** SQLite cho development, PostgreSQL cho production.

### Q: Chi phí AI services?
**A:** Xem `SYSTEM_COMPARISON.md` phần chi phí. Ước tính ~$62/tháng cho 1K documents.

### Q: Có thể dùng Gemini thay OpenAI?
**A:** Có, Gemini rẻ hơn ~50%. Cần điều chỉnh API calls trong `lib/ai-service.ts`.

### Q: Làm sao tích hợp ký số VNPT?
**A:** Cần API key từ VNPT, sau đó tích hợp vào `POST /api/dms/outgoing/[id]/sign`.

---

## 🎉 Kết Luận

Bạn đã có đầy đủ tài liệu và code samples để bắt đầu xây dựng hệ thống AI-DMS. Bắt đầu với Phase 1 và từng bước triển khai các tính năng.

**Chúc bạn thành công! 🚀**

