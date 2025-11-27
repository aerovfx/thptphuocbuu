# 🔌 API Routes Examples - AI-DMS System

Tài liệu này mô tả 10 API routes chính với request/response examples cho hệ thống AI-DMS.

---

## 1. POST /api/dms/incoming - Upload Văn bản đến

**Mô tả:** Upload file và tạo văn bản đến mới, tự động trigger OCR và AI processing.

**Request:**
```typescript
// FormData
{
  file: File,              // PDF/Image file
  title?: string,          // Tiêu đề (optional, AI sẽ tự extract)
  sender?: string,         // Người/nơi gửi
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW",
  deadline?: string,       // ISO date string
  type?: "DIRECTIVE" | "RECORD" | "REPORT" | "REQUEST" | "OTHER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "documentNumber": null,
    "title": "Công văn về việc tổ chức hội thảo",
    "type": "DIRECTIVE",
    "status": "PENDING",
    "fileName": "cong_van_123.pdf",
    "fileUrl": "/uploads/documents/clx1234567890.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "sender": "Sở Giáo dục và Đào tạo",
    "receivedDate": "2024-01-15T10:30:00Z",
    "priority": "HIGH",
    "deadline": "2024-01-25T17:00:00Z",
    "ocrStatus": "PROCESSING",
    "aiStatus": "PENDING",
    "createdBy": {
      "id": "user123",
      "firstName": "Nguyễn",
      "lastName": "Văn A"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid file type. Only PDF, PNG, JPG are allowed."
}
```

---

## 2. GET /api/dms/incoming - List Văn bản đến

**Mô tả:** Lấy danh sách văn bản đến với filter, pagination, và sorting.

**Query Parameters:**
```
?page=1                    // Page number (default: 1)
&limit=20                  // Items per page (default: 20)
&status=PENDING            // Filter by status
&type=DIRECTIVE            // Filter by type
&priority=HIGH             // Filter by priority
&search=keyword            // Search in title/content
&sortBy=receivedDate      // Sort field
&sortOrder=desc            // asc | desc
&assignedTo=userId         // Filter by assigned user
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "clx1234567890",
        "documentNumber": "123/CV-SGD",
        "title": "Công văn về việc tổ chức hội thảo",
        "type": "DIRECTIVE",
        "status": "PENDING",
        "priority": "HIGH",
        "sender": "Sở Giáo dục và Đào tạo",
        "receivedDate": "2024-01-15T10:30:00Z",
        "deadline": "2024-01-25T17:00:00Z",
        "summary": "Công văn yêu cầu các trường THPT tổ chức hội thảo về đổi mới giáo dục...",
        "ocrConfidence": 0.95,
        "aiCategory": "DIRECTIVE",
        "aiConfidence": 0.92,
        "assignments": [
          {
            "id": "assign123",
            "assignedTo": {
              "id": "user456",
              "firstName": "Trần",
              "lastName": "Thị B"
            },
            "status": "PENDING",
            "deadline": "2024-01-25T17:00:00Z"
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

---

## 3. GET /api/dms/incoming/[id] - Chi tiết Văn bản đến

**Mô tả:** Lấy thông tin chi tiết văn bản đến bao gồm OCR text, AI results, workflow, và history.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "documentNumber": "123/CV-SGD",
    "documentCode": "CV-2024-001",
    "title": "Công văn về việc tổ chức hội thảo",
    "content": "Nội dung đầy đủ từ OCR...",
    "summary": "Công văn yêu cầu các trường THPT tổ chức hội thảo về đổi mới giáo dục...",
    "type": "DIRECTIVE",
    "status": "PROCESSING",
    "priority": "HIGH",
    "sender": "Sở Giáo dục và Đào tạo",
    "receivedDate": "2024-01-15T10:30:00Z",
    "deadline": "2024-01-25T17:00:00Z",
    "fileName": "cong_van_123.pdf",
    "fileUrl": "/uploads/documents/clx1234567890.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "ocrText": "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n...",
    "ocrConfidence": 0.95,
    "aiCategory": "DIRECTIVE",
    "aiConfidence": 0.92,
    "aiExtractedData": {
      "documentNumber": "123/CV-SGD",
      "issuedDate": "2024-01-10",
      "issuedBy": "Sở Giáo dục và Đào tạo",
      "signedBy": "Nguyễn Văn X",
      "mainContent": "Yêu cầu tổ chức hội thảo...",
      "deadline": "2024-01-25"
    },
    "assignments": [
      {
        "id": "assign123",
        "assignedTo": {
          "id": "user456",
          "firstName": "Trần",
          "lastName": "Thị B",
          "email": "tran.thi.b@example.com"
        },
        "assignedBy": {
          "id": "user123",
          "firstName": "Nguyễn",
          "lastName": "Văn A"
        },
        "notes": "Xử lý và báo cáo trước deadline",
        "status": "PENDING",
        "deadline": "2024-01-25T17:00:00Z",
        "createdAt": "2024-01-15T11:00:00Z"
      }
    ],
    "approvals": [
      {
        "id": "approval123",
        "level": 1,
        "approver": {
          "id": "user789",
          "firstName": "Lê",
          "lastName": "Văn C"
        },
        "status": "PENDING",
        "deadline": "2024-01-20T17:00:00Z"
      }
    ],
    "workflows": [
      {
        "id": "workflow123",
        "name": "Phê duyệt văn bản đến",
        "currentStep": 0,
        "status": "IN_PROGRESS",
        "steps": [
          {
            "stepNumber": 0,
            "title": "Phân công xử lý",
            "assignee": "Trần Thị B",
            "status": "COMPLETED"
          },
          {
            "stepNumber": 1,
            "title": "Phê duyệt cấp 1",
            "assignee": "Lê Văn C",
            "status": "PENDING"
          }
        ]
      }
    ],
    "aiResults": [
      {
        "id": "ai123",
        "aiType": "OCR",
        "result": "{\"text\": \"...\", \"confidence\": 0.95}",
        "confidence": 0.95,
        "model": "Google Vision API",
        "processingTime": 1234,
        "createdAt": "2024-01-15T10:31:00Z"
      },
      {
        "id": "ai456",
        "aiType": "CLASSIFY",
        "result": "{\"category\": \"DIRECTIVE\", \"confidence\": 0.92}",
        "confidence": 0.92,
        "model": "gpt-4",
        "processingTime": 567,
        "createdAt": "2024-01-15T10:32:00Z"
      }
    ],
    "versions": [
      {
        "id": "version123",
        "versionNumber": 1,
        "fileUrl": "/uploads/documents/clx1234567890.pdf",
        "fileName": "cong_van_123.pdf",
        "createdAt": "2024-01-15T10:30:00Z",
        "createdBy": {
          "id": "user123",
          "firstName": "Nguyễn",
          "lastName": "Văn A"
        }
      }
    ],
    "createdBy": {
      "id": "user123",
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyen.van.a@example.com"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## 4. POST /api/dms/incoming/[id]/assign - Phân công Xử lý

**Mô tả:** Phân công văn bản đến cho người xử lý.

**Request Body:**
```json
{
  "assignedToId": "user456",
  "notes": "Xử lý và báo cáo trước deadline",
  "deadline": "2024-01-25T17:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "assign123",
    "documentId": "clx1234567890",
    "assignedTo": {
      "id": "user456",
      "firstName": "Trần",
      "lastName": "Thị B",
      "email": "tran.thi.b@example.com"
    },
    "assignedBy": {
      "id": "user123",
      "firstName": "Nguyễn",
      "lastName": "Văn A"
    },
    "notes": "Xử lý và báo cáo trước deadline",
    "status": "PENDING",
    "deadline": "2024-01-25T17:00:00Z",
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## 5. POST /api/dms/incoming/[id]/ocr - Trigger OCR Processing

**Mô tả:** Trigger OCR processing cho văn bản (thường tự động, nhưng có thể trigger thủ công).

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "OCR processing started",
  "data": {
    "jobId": "ocr-job-123",
    "status": "PROCESSING",
    "estimatedTime": 30
  }
}
```

---

## 6. POST /api/dms/outgoing - Tạo Văn bản đi

**Mô tả:** Tạo văn bản đi mới (có thể dùng AI để gợi ý draft).

**Request Body:**
```json
{
  "title": "Công văn phúc đáp về việc tổ chức hội thảo",
  "content": "Nội dung văn bản...",
  "recipient": "Sở Giáo dục và Đào tạo",
  "type": "RESPONSE",
  "priority": "NORMAL",
  "template": "ND30_RESPONSE",
  "useAIDraft": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "outgoing123",
    "documentNumber": null,
    "title": "Công văn phúc đáp về việc tổ chức hội thảo",
    "content": "Nội dung văn bản...",
    "aiDraft": "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n...",
    "template": "ND30_RESPONSE",
    "recipient": "Sở Giáo dục và Đào tạo",
    "status": "DRAFT",
    "priority": "NORMAL",
    "createdBy": {
      "id": "user123",
      "firstName": "Nguyễn",
      "lastName": "Văn A"
    },
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

## 7. POST /api/workflow/approval - Tạo Luồng Phê duyệt

**Mô tả:** Tạo luồng phê duyệt cho văn bản đi hoặc văn bản đến.

**Request Body:**
```json
{
  "documentType": "OUTGOING",
  "documentId": "outgoing123",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Phê duyệt cấp 1 - Trưởng phòng",
      "assigneeId": "user789",
      "deadline": "2024-01-18T17:00:00Z"
    },
    {
      "stepNumber": 2,
      "title": "Phê duyệt cấp 2 - Hiệu trưởng",
      "assigneeId": "user999",
      "deadline": "2024-01-20T17:00:00Z"
    }
  ],
  "autoAssign": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "workflow123",
    "name": "Phê duyệt văn bản đi",
    "documentType": "OUTGOING",
    "documentId": "outgoing123",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Phê duyệt cấp 1 - Trưởng phòng",
        "assignee": {
          "id": "user789",
          "firstName": "Lê",
          "lastName": "Văn C"
        },
        "status": "PENDING",
        "deadline": "2024-01-18T17:00:00Z"
      },
      {
        "stepNumber": 2,
        "title": "Phê duyệt cấp 2 - Hiệu trưởng",
        "assignee": {
          "id": "user999",
          "firstName": "Phạm",
          "lastName": "Văn D"
        },
        "status": "PENDING",
        "deadline": "2024-01-20T17:00:00Z"
      }
    ],
    "currentStep": 0,
    "status": "PENDING",
    "createdAt": "2024-01-15T12:30:00Z"
  }
}
```

---

## 8. POST /api/workflow/approval/[id]/approve - Phê duyệt

**Mô tả:** Phê duyệt một bước trong workflow.

**Request Body:**
```json
{
  "comment": "Đồng ý phê duyệt",
  "nextAction": "APPROVE" // APPROVE | REJECT | RETURN
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "approval123",
    "level": 1,
    "status": "APPROVED",
    "comment": "Đồng ý phê duyệt",
    "approvedAt": "2024-01-16T10:00:00Z",
    "workflow": {
      "id": "workflow123",
      "currentStep": 1,
      "status": "IN_PROGRESS",
      "nextStep": {
        "stepNumber": 2,
        "title": "Phê duyệt cấp 2 - Hiệu trưởng",
        "assignee": {
          "id": "user999",
          "firstName": "Phạm",
          "lastName": "Văn D"
        },
        "status": "PENDING"
      }
    }
  }
}
```

---

## 9. GET /api/workflow/pending - Danh sách Chờ Phê duyệt

**Mô tả:** Lấy danh sách các văn bản đang chờ phê duyệt của user hiện tại.

**Query Parameters:**
```
?page=1
&limit=20
&priority=HIGH
&deadline=2024-01-25
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pendingApprovals": [
      {
        "id": "approval123",
        "level": 1,
        "document": {
          "id": "outgoing123",
          "type": "OUTGOING",
          "title": "Công văn phúc đáp về việc tổ chức hội thảo",
          "documentNumber": null,
          "status": "PENDING"
        },
        "workflow": {
          "id": "workflow123",
          "name": "Phê duyệt văn bản đi",
          "currentStep": 0
        },
        "deadline": "2024-01-18T17:00:00Z",
        "daysUntilDeadline": 2,
        "priority": "NORMAL",
        "createdAt": "2024-01-15T12:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## 10. POST /api/ai/search - Semantic Search

**Mô tả:** Tìm kiếm văn bản bằng semantic search (AI-powered).

**Request Body:**
```json
{
  "query": "hội thảo về đổi mới giáo dục",
  "filters": {
    "type": ["DIRECTIVE", "REPORT"],
    "status": ["APPROVED", "COMPLETED"],
    "dateFrom": "2024-01-01",
    "dateTo": "2024-01-31"
  },
  "topK": 10,
  "minScore": 0.7
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "clx1234567890",
        "title": "Công văn về việc tổ chức hội thảo",
        "type": "DIRECTIVE",
        "status": "APPROVED",
        "summary": "Công văn yêu cầu các trường THPT tổ chức hội thảo về đổi mới giáo dục...",
        "relevanceScore": 0.92,
        "matchedSnippets": [
          "hội thảo về đổi mới giáo dục",
          "tổ chức hội thảo tại các trường THPT"
        ],
        "documentNumber": "123/CV-SGD",
        "receivedDate": "2024-01-15T10:30:00Z",
        "fileUrl": "/uploads/documents/clx1234567890.pdf"
      },
      {
        "id": "clx9876543210",
        "title": "Báo cáo kết quả hội thảo đổi mới giáo dục",
        "type": "REPORT",
        "status": "COMPLETED",
        "summary": "Báo cáo tổng kết hội thảo đổi mới giáo dục được tổ chức vào tháng 12/2023...",
        "relevanceScore": 0.88,
        "matchedSnippets": [
          "hội thảo đổi mới giáo dục",
          "kết quả hội thảo"
        ],
        "documentNumber": "456/BC-THPT",
        "receivedDate": "2023-12-20T10:00:00Z",
        "fileUrl": "/uploads/documents/clx9876543210.pdf"
      }
    ],
    "totalResults": 2,
    "query": "hội thảo về đổi mới giáo dục",
    "processingTime": 234
  }
}
```

---

## 11. POST /api/ai/suggest-draft - AI Gợi ý Soạn thảo

**Mô tả:** AI gợi ý nội dung văn bản đi theo template NĐ30.

**Request Body:**
```json
{
  "documentType": "RESPONSE",
  "recipient": "Sở Giáo dục và Đào tạo",
  "subject": "Phúc đáp về việc tổ chức hội thảo",
  "context": "Nhận được công văn số 123/CV-SGD ngày 10/01/2024 về việc tổ chức hội thảo. Trường đồng ý tham gia.",
  "template": "ND30_RESPONSE",
  "tone": "FORMAL"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "draft": "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\n───────────────\n\nTRƯỜNG THPT PHƯỚC BỬU\n───────────────\n\nSố: .../CV-THPTPB\nV/v: Phúc đáp về việc tổ chức hội thảo\n\nKính gửi: Sở Giáo dục và Đào tạo\n\nTrường THPT Phước Bửu xin trân trọng phúc đáp công văn số 123/CV-SGD ngày 10/01/2024 của Sở Giáo dục và Đào tạo về việc tổ chức hội thảo đổi mới giáo dục.\n\nTrường THPT Phước Bửu đồng ý tham gia hội thảo và sẽ cử đại diện tham dự theo đúng thời gian và địa điểm được thông báo.\n\nTrân trọng cảm ơn!\n\nHIỆU TRƯỞNG\n(Ký và đóng dấu)\n\nNguyễn Văn X",
    "confidence": 0.95,
    "suggestedFields": {
      "documentNumber": ".../CV-THPTPB",
      "issuedDate": "2024-01-15",
      "signedBy": "Nguyễn Văn X"
    },
    "processingTime": 1234
  }
}
```

---

## 🔐 Authentication

Tất cả API routes yêu cầu authentication thông qua NextAuth session:

```typescript
// Example: Check authentication in API route
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // ... rest of the code
}
```

---

## 📝 Error Handling

Tất cả API routes trả về format chuẩn:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `202` - Accepted (async processing)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Next Steps

1. Implement các API routes này trong `/app/api/`
2. Add validation với Zod
3. Add rate limiting
4. Add logging và monitoring
5. Add unit tests

