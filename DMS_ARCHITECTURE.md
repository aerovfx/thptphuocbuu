# 🏛️ Kiến trúc Hệ thống Quản lý Văn bản Hành chính (AI-DMS)

## 📋 Tổng quan

Hệ thống DMS được thiết kế dựa trên chuẩn Nghị định 30/2020 về công tác văn thư, tích hợp AI để tự động hóa quy trình xử lý văn bản hành chính cho trường học THPT Phước Bửu.

---

## 🏗️ Kiến trúc Tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Văn bản đến │  │  Văn bản đi  │  │  Hồ sơ công   │      │
│  │   (Incoming) │  │  (Outgoing)   │  │    việc      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Phê duyệt   │  │   Ký số      │  │  Tìm kiếm AI │      │
│  │  (Approval)  │  │  (Signature) │  │  (Semantic)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/dms/    │  │ /api/ai/     │  │ /api/workflow│      │
│  │  incoming    │  │  ocr         │  │  approval    │      │
│  │  outgoing    │  │  classify   │  │  signature   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Document     │  │ AI Service   │  │ Workflow     │      │
│  │ Service      │  │ - OCR        │  │ Service      │      │
│  │ - Upload     │  │ - Classify   │  │ - Approval   │      │
│  │ - Process    │  │ - Summarize  │  │ - Routing    │      │
│  │ - Store      │  │ - Extract    │  │ - Reminder   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (Prisma + SQLite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ IncomingDoc  │  │ OutgoingDoc  │  │ Approval     │      │
│  │ Assignment   │  │ Signature    │  │ WorkItem     │      │
│  │ DocumentAI   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ OCR API      │  │ AI/LLM API   │  │ Digital      │      │
│  │ (Tesseract/  │  │ (OpenAI/     │  │ Signature    │      │
│  │  Google)     │  │  Gemini)     │  │ (VNPT/       │      │
│  │              │  │              │  │  Viettel)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Sơ đồ Database

### Core Models

#### 1. IncomingDocument (Văn bản đến)
```
┌─────────────────────────────────────────┐
│      IncomingDocument                   │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ documentNumber: String?                 │
│ documentCode: String?                   │
│ title: String                           │
│ content: String? (OCR extracted)        │
│ summary: String? (AI summary)           │
│ type: IncomingDocumentType               │
│ status: DocumentStatus                   │
│ fileName, fileUrl, fileSize, mimeType   │
│ originalFileUrl: String?                │
│ ocrText: String?                        │
│ ocrConfidence: Float?                   │
│ aiCategory: String?                     │
│ aiConfidence: Float?                    │
│ aiExtractedData: String? (JSON)         │
│ sender: String?                         │
│ receivedDate: DateTime                  │
│ priority: String (URGENT/HIGH/NORMAL)   │
│ deadline: DateTime?                     │
│ createdById: String (FK → User)        │
└─────────────────────────────────────────┘
         │
         ├─── assignments: IncomingDocumentAssignment[]
         ├─── approvals: Approval[]
         └─── aiResults: DocumentAI[]
```

#### 2. OutgoingDocument (Văn bản đi)
```
┌─────────────────────────────────────────┐
│      OutgoingDocument                   │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ documentNumber: String? (auto-generated) │
│ documentCode: String?                   │
│ title: String                           │
│ content: String                         │
│ aiDraft: String? (AI suggested)         │
│ template: String? (NĐ 30 template)     │
│ fileName, fileUrl, fileSize, mimeType  │
│ signedFileUrl: String?                 │
│ recipient: String?                      │
│ status: DocumentStatus                  │
│ priority: String                        │
│ sendDate: DateTime?                     │
│ createdById: String (FK → User)         │
└─────────────────────────────────────────┘
         │
         ├─── approvals: Approval[]
         └─── signatures: DigitalSignature[]
```

#### 3. Approval (Phê duyệt)
```
┌─────────────────────────────────────────┐
│      Approval                           │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ incomingDocumentId: String? (FK)        │
│ outgoingDocumentId: String? (FK)        │
│ workItemId: String? (FK)                │
│ level: Int (1, 2, 3...)                 │
│ approverId: String (FK → User)         │
│ status: ApprovalStatus                  │
│ comment: String?                        │
│ approvedAt: DateTime?                   │
│ deadline: DateTime?                     │
│ reminderSent: Boolean                   │
│ reminderSentAt: DateTime?               │
└─────────────────────────────────────────┘
```

#### 4. WorkItem (Hồ sơ công việc)
```
┌─────────────────────────────────────────┐
│      WorkItem                           │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ title: String                           │
│ description: String?                     │
│ content: String?                        │
│ status: DocumentStatus                  │
│ priority: String                        │
│ deadline: DateTime?                     │
│ reminderDays: Int?                      │
│ lastReminderAt: DateTime?               │
│ createdById: String (FK → User)        │
│ completedAt: DateTime?                  │
└─────────────────────────────────────────┘
         │
         └─── approvals: Approval[]
```

#### 5. DigitalSignature (Ký số)
```
┌─────────────────────────────────────────┐
│      DigitalSignature                   │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ outgoingDocumentId: String? (FK)        │
│ provider: SignatureProvider             │
│ certificateId: String?                   │
│ certificateInfo: String? (JSON)          │
│ signedBy: String                        │
│ signedById: String (FK → User)          │
│ signatureHash: String?                  │
│ signatureFileUrl: String?                │
│ timestamp: DateTime?                     │
│ isValid: Boolean                        │
│ verifiedAt: DateTime?                    │
│ errorMessage: String?                   │
└─────────────────────────────────────────┘
```

#### 6. DocumentAI (Kết quả AI)
```
┌─────────────────────────────────────────┐
│      DocumentAI                        │
├─────────────────────────────────────────┤
│ id: String (PK)                         │
│ documentId: String (FK)                │
│ aiType: String (OCR/CLASSIFY/EXTRACT)   │
│ result: String (JSON)                   │
│ confidence: Float?                      │
│ model: String?                          │
│ processingTime: Int? (ms)               │
│ relatedDocIds: String? (JSON array)     │
└─────────────────────────────────────────┘
```

---

## 🔄 Quy trình Xử lý Văn bản

### 1. Văn bản đến (Incoming Document Flow)

```
┌─────────────┐
│   Upload    │
│   File      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   OCR       │ ◄─── AI Service
│ Processing  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   AI        │ ◄─── AI Service
│ Classify    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   AI        │ ◄─── AI Service
│ Extract     │
│ Metadata    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Auto      │
│ Assignment  │ ◄─── Workflow Service
│ (Optional)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Create    │
│ Approval    │
│ Workflow    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Notify    │
│ Assignees   │
└─────────────┘
```

### 2. Văn bản đi (Outgoing Document Flow)

```
┌─────────────┐
│   Create    │
│   Draft     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   AI        │ ◄─── AI Service
│ Suggest     │
│ Template    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Review    │
│   & Edit    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Submit    │
│   for       │
│   Approval  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Multi-level │
│ Approval    │ ◄─── Workflow Service
│ Workflow    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Digital   │
│   Signature │ ◄─── Signature Service
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Send      │
│   Document  │
└─────────────┘
```

---

## 🔌 API Routes

### Incoming Documents

```
POST   /api/dms/incoming              - Upload văn bản đến
GET    /api/dms/incoming              - List văn bản đến
GET    /api/dms/incoming/[id]         - Chi tiết văn bản đến
PUT    /api/dms/incoming/[id]         - Cập nhật văn bản đến
DELETE /api/dms/incoming/[id]         - Xóa văn bản đến
POST   /api/dms/incoming/[id]/assign  - Phân công xử lý
POST   /api/dms/incoming/[id]/ocr    - Trigger OCR
GET    /api/dms/incoming/[id]/ai     - Lấy kết quả AI
```

### Outgoing Documents

```
POST   /api/dms/outgoing              - Tạo văn bản đi
GET    /api/dms/outgoing              - List văn bản đi
GET    /api/dms/outgoing/[id]         - Chi tiết văn bản đi
PUT    /api/dms/outgoing/[id]         - Cập nhật văn bản đi
DELETE /api/dms/outgoing/[id]         - Xóa văn bản đi
POST   /api/dms/outgoing/[id]/submit  - Gửi phê duyệt
POST   /api/dms/outgoing/[id]/sign    - Ký số
```

### Approval Workflow

```
POST   /api/workflow/approval         - Tạo luồng phê duyệt
GET    /api/workflow/approval/[id]   - Chi tiết phê duyệt
POST   /api/workflow/approval/[id]/approve  - Phê duyệt
POST   /api/workflow/approval/[id]/reject   - Từ chối
POST   /api/workflow/approval/[id]/return   - Trả lại
GET    /api/workflow/pending         - Danh sách chờ phê duyệt
```

### AI Services

```
POST   /api/ai/ocr                   - OCR processing
POST   /api/ai/classify              - Phân loại văn bản
POST   /api/ai/extract               - Trích xuất metadata
POST   /api/ai/summarize             - Tóm tắt văn bản
POST   /api/ai/suggest-draft         - Gợi ý soạn thảo
POST   /api/ai/search                - Semantic search
GET    /api/ai/related/[id]         - Tài liệu liên quan
```

### Digital Signature

```
POST   /api/signature/sign           - Ký số
GET    /api/signature/verify/[id]    - Xác thực chữ ký
GET    /api/signature/history/[docId] - Lịch sử ký
```

---

## 🤖 AI Features

### 1. OCR (Optical Character Recognition)
- **Service**: Tesseract.js (local) hoặc Google Cloud Vision API
- **Input**: PDF/Image file
- **Output**: Extracted text + confidence score
- **Use Case**: Đọc văn bản scan, công văn giấy

### 2. Document Classification
- **Service**: OpenAI GPT-4 hoặc Gemini Pro
- **Input**: Document content
- **Output**: Category (DIRECTIVE, RECORD, REPORT, REQUEST, OTHER) + confidence
- **Use Case**: Tự động phân loại văn bản đến

### 3. Metadata Extraction
- **Service**: OpenAI GPT-4 hoặc Gemini Pro
- **Input**: Document content
- **Output**: JSON với các trường:
  - Số văn bản
  - Ngày ban hành
  - Nơi ban hành
  - Người ký
  - Nội dung chính
- **Use Case**: Tự động điền form từ văn bản

### 4. Document Summarization
- **Service**: OpenAI GPT-4 hoặc Gemini Pro
- **Input**: Long document content
- **Output**: Short summary (100-200 words)
- **Use Case**: Tóm tắt văn bản dài cho người xử lý

### 5. Draft Suggestion
- **Service**: OpenAI GPT-4 hoặc Gemini Pro
- **Input**: Document type, recipient, purpose
- **Output**: Draft document following NĐ 30 format
- **Use Case**: Gợi ý soạn thảo văn bản đi

### 6. Semantic Search
- **Service**: OpenAI Embeddings hoặc Vector DB
- **Input**: Search query
- **Output**: Related documents ranked by relevance
- **Use Case**: Tìm kiếm văn bản theo nội dung, không cần nhớ tên file

---

## 🔐 Phân quyền (Role-Based Access)

| Role      | Incoming | Outgoing | Approval | Signature | Admin |
|-----------|----------|----------|----------|-----------|-------|
| ADMIN     | ✅ Full  | ✅ Full  | ✅ Full  | ✅ Full   | ✅    |
| TEACHER   | ✅ View  | ✅ Create| ✅ Approve| ✅ Sign   | ❌    |
| STUDENT   | ❌       | ❌       | ❌       | ❌        | ❌    |
| PARENT    | ❌       | ❌       | ❌       | ❌        | ❌    |

---

## 📱 UI Pages

### Dashboard Routes

```
/dashboard/dms
├── /incoming                    # Danh sách văn bản đến
│   ├── /[id]                    # Chi tiết văn bản đến
│   └── /upload                  # Upload văn bản đến
├── /outgoing                    # Danh sách văn bản đi
│   ├── /[id]                    # Chi tiết văn bản đi
│   └── /create                  # Tạo văn bản đi
├── /workflow                    # Quản lý luồng phê duyệt
│   └── /pending                 # Chờ phê duyệt
└── /search                      # Tìm kiếm AI
```

---

## 🚀 Lộ trình Triển khai

### Phase 1: Core DMS (Tuần 1-2)
- ✅ Database schema (đã có)
- ⏳ API routes cho văn bản đến/đi
- ⏳ UI pages cơ bản
- ⏳ Upload & storage

### Phase 2: Workflow (Tuần 3)
- ⏳ Approval workflow
- ⏳ Assignment system
- ⏳ Notification system

### Phase 3: AI Integration (Tuần 4-5)
- ⏳ OCR service
- ⏳ Classification
- ⏳ Summarization
- ⏳ Metadata extraction

### Phase 4: Advanced Features (Tuần 6-7)
- ⏳ Semantic search
- ⏳ Draft suggestion
- ⏳ Digital signature integration
- ⏳ Analytics & reporting

---

## 💰 Chi phí AI Services (Ước tính)

| Service           | Provider      | Cost per 1K requests | Monthly (1K docs) |
|-------------------|---------------|----------------------|-------------------|
| OCR               | Google Vision | $1.50                | $1.50             |
| Classification    | OpenAI GPT-4  | $30                  | $30               |
| Summarization     | OpenAI GPT-4  | $30                  | $30               |
| Embeddings        | OpenAI        | $0.10                | $0.10             |
| **Total**         |               |                      | **~$62/month**     |

*Note: Có thể dùng Gemini Pro để giảm chi phí (~50% rẻ hơn)*

---

## 📚 Tài liệu Tham khảo

1. **Nghị định 30/2020/NĐ-CP** - Về công tác văn thư
2. **Trục liên thông văn bản quốc gia** - VPCP
3. **VNPT eOffice** - Best practices
4. **MISA AMIS** - Workflow design
5. **Microsoft SharePoint** - AI integration patterns

---

## 🔗 Next Steps

1. ✅ Review và approve architecture
2. ⏳ Implement API routes
3. ⏳ Build UI components
4. ⏳ Integrate AI services
5. ⏳ Testing & deployment

