# 📋 Hướng Dẫn Sử Dụng Mã Loại Văn Bản Hành Chính

## 🎯 Tổng Quan

Hệ thống sử dụng **Bảng Mã Loại Văn Bản Hành Chính** chuẩn hóa theo Nghị định 30/2020/NĐ-CP với 41+ loại văn bản được phân thành 5 nhóm chính.

## 📦 Cài Đặt

### 1. Chạy Migration

```bash
npx prisma migrate dev --name add_document_types
```

### 2. Seed Document Types

```bash
npx tsx scripts/seed-document-types.ts
```

Hoặc sử dụng Prisma Studio để import thủ công từ `lib/document-types.json`

## 🗂️ Cấu Trúc Database

### DocumentType Model

```prisma
model DocumentType {
  code        String   @id
  name        String
  group       String   // inbound, outbound, administrative, internal, legal
  description String?
  active      Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Sử Dụng trong IncomingDocument & OutgoingDocument

```prisma
documentTypeCode String?
documentType     DocumentType? @relation(fields: [documentTypeCode], references: [code])
```

## 🔧 Sử Dụng trong Code

### 1. Phân Loại Văn Bản với AI

```typescript
import { classifyDocumentType } from '@/lib/ai-service'

const result = await classifyDocumentType(
  'Công văn số 123/2024 về việc triển khai kế hoạch',
  'Nội dung văn bản...',
  'incoming' // optional: 'incoming' | 'outgoing' | 'internal'
)

console.log(result)
// {
//   code: 'CVĐ',
//   name: 'Công văn đến',
//   group: 'inbound',
//   confidence: 0.95,
//   reasoning: 'Phát hiện từ khóa: công văn, đến'
// }
```

### 2. Phân Loại bằng Keyword Matching (Fallback)

```typescript
import { classifyDocumentByKeywords } from '@/lib/document-type-classifier'

const result = classifyDocumentByKeywords(
  'Quyết định số 456/2024',
  'Về việc bổ nhiệm...',
  'outgoing'
)
```

### 3. Lấy Thông Tin Loại Văn Bản

```typescript
import { 
  getDocumentTypeByCode,
  getDocumentTypesByGroup,
  getAllDocumentTypes 
} from '@/lib/document-type-classifier'

// Lấy theo mã
const docType = getDocumentTypeByCode('CV')
// { code: 'CV', name: 'Công văn', group: 'administrative', ... }

// Lấy theo nhóm
const inboundTypes = getDocumentTypesByGroup('inbound')
// [CVĐ, GMĐ, TBĐ, BCĐ, KTĐ]

// Lấy tất cả
const allTypes = getAllDocumentTypes()
```

### 4. Tìm Kiếm Loại Văn Bản

```typescript
import { searchDocumentTypes } from '@/lib/document-type-classifier'

const results = searchDocumentTypes('công văn')
// [CV, CVĐ, CVD]
```

## 📊 Bảng Mã Loại Văn Bản

### I. Văn bản hành chính (administrative)

| Mã | Tên | Mô tả |
|---|---|---|
| CV | Công văn | Văn bản điều hành chung, phổ biến nhất |
| QĐ | Quyết định | Quyết định nhân sự, tài chính, thành lập |
| CT | Chỉ thị | Văn bản chỉ đạo trực tiếp |
| TB | Thông báo | Kết luận, kết quả, lịch họp |
| BC | Báo cáo | Báo cáo kết quả, đánh giá, tổng kết |
| TT | Tờ trình | Trình cấp trên phê duyệt |
| KH | Kế hoạch | Kế hoạch công tác, triển khai |
| ... | ... | Xem đầy đủ trong `lib/document-types.json` |

### II. Văn bản đến (inbound)

- **CVĐ**: Công văn đến
- **GMĐ**: Giấy mời đến
- **TBĐ**: Thông báo đến
- **BCĐ**: Báo cáo đến
- **KTĐ**: Kiến nghị - Đề xuất đến

### III. Văn bản đi (outbound)

- **CVD**: Công văn đi
- **QĐD**: Quyết định đi
- **TBD**: Thông báo đi
- **KHD**: Kế hoạch đi
- **BCD**: Báo cáo đi

### IV. Văn bản pháp lý (legal)

- **NQ**: Nghị quyết
- **TTg**: Thông tư
- **NĐ**: Nghị định
- **L**: Luật

### V. Văn bản nội bộ (internal)

- **TBn**: Thông báo nội bộ
- **BBh**: Biên bản họp
- **YC**: Yêu cầu xử lý
- **DX**: Đề xuất nội bộ
- **KT**: Kiểm tra - Checklist

## 🔌 API Usage

### Filter by Document Type

```typescript
// GET /api/dms/incoming?documentTypeCode=CV
// GET /api/dms/outgoing?documentTypeCode=QĐD
// GET /api/documents?group=inbound
```

### Create Document with Type

```typescript
POST /api/dms/incoming
{
  "title": "...",
  "documentTypeCode": "CVĐ",
  ...
}
```

## 🎨 UI Components

### Select Dropdown Example

```tsx
import { getAllDocumentTypes, getDocumentTypesByGroup } from '@/lib/document-type-classifier'

function DocumentTypeSelect({ group, value, onChange }) {
  const types = group 
    ? getDocumentTypesByGroup(group)
    : getAllDocumentTypes()

  return (
    <select value={value} onChange={onChange}>
      <option value="">Chọn loại văn bản</option>
      {types.map(type => (
        <option key={type.code} value={type.code}>
          {type.code} - {type.name}
        </option>
      ))}
    </select>
  )
}
```

## 🤖 AI Classification

### System Prompt

Xem chi tiết trong `lib/ai-document-classification-prompt.md`

### Classification Flow

1. **AI Classification** (nếu có OpenAI API Key)
   - Sử dụng GPT-4 với prompt template chuẩn
   - Phân tích tiêu đề + nội dung + ngữ cảnh
   - Trả về mã loại văn bản với confidence score

2. **Keyword Matching** (fallback)
   - So khớp synonyms và keywords
   - Tính điểm dựa trên số lần xuất hiện
   - Xem xét ngữ cảnh (incoming/outgoing/internal)

3. **Default**
   - Nếu không phân loại được → "CV" (Công văn)
   - Confidence tối thiểu: 0.3

## 📝 Best Practices

1. **Luôn validate mã loại văn bản** trước khi lưu vào database
2. **Sử dụng AI classification** cho độ chính xác cao
3. **Fallback về keyword matching** khi không có AI
4. **Hiển thị mã + tên** trong UI để user dễ hiểu
5. **Group theo nhóm** trong dropdown để dễ tìm

## 🔄 Migration từ Old System

Nếu bạn đang sử dụng enum `IncomingDocumentType` cũ:

```typescript
// Mapping từ old enum sang new codes
const typeMapping = {
  DIRECTIVE: 'CT',
  RECORD: 'HS',
  REPORT: 'BC',
  REQUEST: 'KTĐ',
  OTHER: 'CV'
}
```

## 📚 Tài Liệu Tham Khảo

- `lib/document-types.json` - Bảng mã đầy đủ
- `lib/ai-document-classification-prompt.md` - AI Prompt Template
- `lib/document-type-classifier.ts` - Helper functions
- `lib/ai-service.ts` - AI Classification service

## ❓ FAQ

**Q: Làm sao thêm loại văn bản mới?**
A: Thêm vào `lib/document-types.json`, sau đó chạy seed script.

**Q: Có thể dùng cả old enum và new codes không?**
A: Có, hệ thống hỗ trợ backward compatibility.

**Q: Làm sao tùy chỉnh AI prompt?**
A: Chỉnh sửa `lib/ai-document-classification-prompt.md` và cập nhật `ai-service-openai.ts`.

