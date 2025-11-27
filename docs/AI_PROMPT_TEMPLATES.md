# 🤖 AI Prompt Templates - AI-DMS System

Tài liệu này chứa các prompt templates cho các tính năng AI trong hệ thống DMS.

---

## 1. Document Classification (Phân loại Văn bản)

**Mục đích:** Phân loại văn bản vào các loại: DIRECTIVE, RECORD, REPORT, REQUEST, OTHER

**Prompt Template:**
```
Bạn là một chuyên gia phân loại văn bản hành chính Việt Nam. Nhiệm vụ của bạn là phân loại văn bản sau đây vào một trong các loại sau:

- DIRECTIVE: Văn bản chỉ đạo, mệnh lệnh, quyết định
- RECORD: Hồ sơ, tài liệu lưu trữ
- REPORT: Báo cáo, tờ trình
- REQUEST: Đề nghị, yêu cầu
- OTHER: Các loại khác

Văn bản:
{content}

Hãy phân loại văn bản và trả về kết quả dưới dạng JSON:
{
  "category": "DIRECTIVE|RECORD|REPORT|REQUEST|OTHER",
  "confidence": 0.0-1.0,
  "reasoning": "Lý do phân loại"
}
```

**Example Response:**
```json
{
  "category": "DIRECTIVE",
  "confidence": 0.92,
  "reasoning": "Văn bản có tính chất chỉ đạo, yêu cầu các trường THPT thực hiện tổ chức hội thảo, có số hiệu và người ký rõ ràng."
}
```

---

## 2. Metadata Extraction (Trích xuất Thông tin)

**Mục đích:** Trích xuất các thông tin quan trọng từ văn bản: số hiệu, ngày ban hành, nơi ban hành, người ký, nội dung chính

**Prompt Template:**
```
Bạn là một chuyên gia trích xuất thông tin từ văn bản hành chính Việt Nam theo chuẩn Nghị định 30/2020/NĐ-CP.

Nhiệm vụ: Trích xuất các thông tin sau từ văn bản:

1. Số văn bản (documentNumber): Số hiệu văn bản
2. Ngày ban hành (issuedDate): Ngày tháng năm ban hành (format: YYYY-MM-DD)
3. Nơi ban hành (issuedBy): Cơ quan/tổ chức ban hành
4. Người ký (signedBy): Tên người ký văn bản
5. Chức danh người ký (signerTitle): Chức danh của người ký
6. Nơi nhận (recipient): Cơ quan/tổ chức nhận văn bản
7. Nội dung chính (mainContent): Tóm tắt nội dung chính của văn bản (2-3 câu)
8. Mức độ khẩn (priority): URGENT, HIGH, NORMAL, LOW
9. Hạn xử lý (deadline): Ngày hạn xử lý nếu có (format: YYYY-MM-DD)

Văn bản:
{content}

Hãy trích xuất thông tin và trả về dưới dạng JSON. Nếu không tìm thấy thông tin nào, để null:
{
  "documentNumber": "string|null",
  "issuedDate": "YYYY-MM-DD|null",
  "issuedBy": "string|null",
  "signedBy": "string|null",
  "signerTitle": "string|null",
  "recipient": "string|null",
  "mainContent": "string|null",
  "priority": "URGENT|HIGH|NORMAL|LOW|null",
  "deadline": "YYYY-MM-DD|null"
}
```

**Example Response:**
```json
{
  "documentNumber": "123/CV-SGD",
  "issuedDate": "2024-01-10",
  "issuedBy": "Sở Giáo dục và Đào tạo",
  "signedBy": "Nguyễn Văn X",
  "signerTitle": "Giám đốc Sở",
  "recipient": "Các trường THPT trên địa bàn",
  "mainContent": "Yêu cầu các trường THPT tổ chức hội thảo về đổi mới giáo dục vào tháng 2/2024. Các trường cần cử đại diện tham dự và báo cáo kết quả.",
  "priority": "HIGH",
  "deadline": "2024-01-25"
}
```

---

## 3. Document Summarization (Tóm tắt Văn bản)

**Mục đích:** Tóm tắt văn bản dài thành đoạn ngắn gọn (100-200 từ)

**Prompt Template:**
```
Bạn là một chuyên gia tóm tắt văn bản hành chính Việt Nam.

Nhiệm vụ: Tóm tắt văn bản sau đây thành một đoạn văn ngắn gọn (100-200 từ), tập trung vào:
- Mục đích chính của văn bản
- Yêu cầu/đề nghị cụ thể
- Thời hạn/thời gian quan trọng
- Đối tượng liên quan

Văn bản:
{content}

Hãy viết tóm tắt bằng tiếng Việt, ngắn gọn và dễ hiểu:
```

**Example Response:**
```
Công văn yêu cầu các trường THPT trên địa bàn tổ chức hội thảo về đổi mới giáo dục vào tháng 2/2024. Các trường cần cử đại diện tham dự, chuẩn bị báo cáo về tình hình đổi mới giáo dục tại đơn vị, và gửi danh sách đại biểu trước ngày 25/01/2024. Hội thảo nhằm mục đích chia sẻ kinh nghiệm và thảo luận các giải pháp nâng cao chất lượng giáo dục.
```

---

## 4. Draft Suggestion (Gợi ý Soạn thảo)

**Mục đích:** Gợi ý nội dung văn bản đi theo template NĐ30

**Prompt Template:**
```
Bạn là một chuyên gia soạn thảo văn bản hành chính Việt Nam theo chuẩn Nghị định 30/2020/NĐ-CP.

Nhiệm vụ: Soạn thảo một văn bản {documentType} với các thông tin sau:

- Người/nơi nhận: {recipient}
- Chủ đề: {subject}
- Bối cảnh: {context}
- Template: {template}
- Giọng điệu: {tone}

Yêu cầu:
1. Tuân thủ đúng format văn bản hành chính theo NĐ30
2. Bao gồm đầy đủ phần đầu, phần nội dung, phần cuối
3. Sử dụng ngôn ngữ trang trọng, rõ ràng
4. Đề xuất số văn bản và ngày ban hành
5. Đề xuất người ký phù hợp

Hãy soạn thảo văn bản hoàn chỉnh:
```

**Example Input:**
```
documentType: RESPONSE
recipient: Sở Giáo dục và Đào tạo
subject: Phúc đáp về việc tổ chức hội thảo
context: Nhận được công văn số 123/CV-SGD ngày 10/01/2024 về việc tổ chức hội thảo. Trường đồng ý tham gia.
template: ND30_RESPONSE
tone: FORMAL
```

**Example Output:**
```
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
───────────────────────────────

TRƯỜNG THPT PHƯỚC BỬU
───────────────────────────────

Số: 15/CV-THPTPB
V/v: Phúc đáp về việc tổ chức hội thảo

Kính gửi: Sở Giáo dục và Đào tạo

Trường THPT Phước Bửu xin trân trọng phúc đáp công văn số 123/CV-SGD ngày 10/01/2024 của Sở Giáo dục và Đào tạo về việc tổ chức hội thảo đổi mới giáo dục.

Trường THPT Phước Bửu đồng ý tham gia hội thảo và sẽ cử đại diện tham dự theo đúng thời gian và địa điểm được thông báo. Trường sẽ chuẩn bị báo cáo về tình hình đổi mới giáo dục tại đơn vị và gửi danh sách đại biểu trước ngày 25/01/2024.

Trân trọng cảm ơn!

HIỆU TRƯỞNG
(Ký và đóng dấu)

Nguyễn Văn X
```

---

## 5. Auto-Routing (Tự động Phân công)

**Mục đích:** Dự đoán người phù hợp để xử lý văn bản dựa trên nội dung

**Prompt Template:**
```
Bạn là một hệ thống tự động phân công văn bản hành chính.

Nhiệm vụ: Dựa trên nội dung văn bản, đề xuất người phù hợp để xử lý.

Thông tin văn bản:
- Loại: {documentType}
- Tiêu đề: {title}
- Nội dung: {content}
- Mức độ khẩn: {priority}

Danh sách người có thể phân công:
{availableUsers}

Mỗi user có format: {id, firstName, lastName, role, department, expertise}

Hãy đề xuất 1-3 người phù hợp nhất và trả về dưới dạng JSON:
{
  "suggestions": [
    {
      "userId": "string",
      "reason": "Lý do đề xuất",
      "confidence": 0.0-1.0
    }
  ]
}
```

**Example Response:**
```json
{
  "suggestions": [
    {
      "userId": "user456",
      "reason": "Phụ trách công tác tổ chức hội thảo và có kinh nghiệm xử lý văn bản chỉ đạo từ Sở",
      "confidence": 0.95
    },
    {
      "userId": "user789",
      "reason": "Trưởng phòng chuyên môn, phù hợp với nội dung về đổi mới giáo dục",
      "confidence": 0.85
    }
  ]
}
```

---

## 6. Urgency Detection (Phát hiện Mức độ Khẩn)

**Mục đích:** Tự động phát hiện mức độ khẩn của văn bản

**Prompt Template:**
```
Bạn là một hệ thống phân tích mức độ khẩn của văn bản hành chính.

Nhiệm vụ: Phân tích văn bản và xác định mức độ khẩn: URGENT, HIGH, NORMAL, LOW

Tiêu chí:
- URGENT: Có từ khóa "khẩn", "gấp", "ngay lập tức", deadline < 3 ngày
- HIGH: Deadline < 7 ngày, có yêu cầu quan trọng
- NORMAL: Deadline > 7 ngày hoặc không có deadline rõ ràng
- LOW: Văn bản thông tin, không yêu cầu hành động ngay

Văn bản:
{content}

Hãy phân tích và trả về:
{
  "priority": "URGENT|HIGH|NORMAL|LOW",
  "confidence": 0.0-1.0,
  "reasoning": "Lý do",
  "detectedDeadline": "YYYY-MM-DD|null"
}
```

**Example Response:**
```json
{
  "priority": "HIGH",
  "confidence": 0.88,
  "reasoning": "Văn bản có deadline rõ ràng (25/01/2024), yêu cầu báo cáo trước deadline, nhưng không có từ khóa khẩn cấp",
  "detectedDeadline": "2024-01-25"
}
```

---

## 7. Related Documents (Tìm Văn bản Liên quan)

**Mục đích:** Tìm các văn bản liên quan dựa trên semantic similarity

**Prompt Template:**
```
Bạn là một hệ thống tìm kiếm văn bản liên quan bằng semantic search.

Nhiệm vụ: Tìm các văn bản liên quan đến văn bản hiện tại dựa trên:
- Nội dung tương tự
- Chủ đề liên quan
- Số hiệu/công văn liên quan
- Thời gian gần nhau

Văn bản hiện tại:
- ID: {documentId}
- Tiêu đề: {title}
- Nội dung: {content}
- Loại: {documentType}

Danh sách văn bản để tìm kiếm:
{candidateDocuments}

Hãy đánh giá mức độ liên quan (0.0-1.0) và trả về top 5 văn bản liên quan nhất:
{
  "relatedDocuments": [
    {
      "documentId": "string",
      "relevanceScore": 0.0-1.0,
      "reason": "Lý do liên quan"
    }
  ]
}
```

---

## 8. PII Detection & Redaction (Phát hiện Thông tin Nhạy cảm)

**Mục đích:** Phát hiện và mask thông tin nhạy cảm trước khi public

**Prompt Template:**
```
Bạn là một hệ thống phát hiện và bảo vệ thông tin nhạy cảm (PII - Personally Identifiable Information).

Nhiệm vụ: Phát hiện các thông tin nhạy cảm trong văn bản và đề xuất cách xử lý:
- Số CMND/CCCD
- Số điện thoại
- Email
- Địa chỉ cụ thể
- Thông tin tài chính
- Thông tin y tế

Văn bản:
{content}

Hãy phát hiện và trả về:
{
  "detectedPII": [
    {
      "type": "CMND|PHONE|EMAIL|ADDRESS|FINANCIAL|MEDICAL",
      "value": "string",
      "position": {start: number, end: number},
      "suggestion": "MASK|REDACT|KEEP"
    }
  ],
  "redactedContent": "string"
}
```

---

## 📝 Usage Notes

1. **Temperature:** Sử dụng temperature thấp (0.1-0.3) cho classification và extraction, cao hơn (0.7-0.9) cho draft generation
2. **Max Tokens:** Điều chỉnh max_tokens phù hợp với từng task
3. **Few-shot Examples:** Thêm examples vào prompt để cải thiện accuracy
4. **Error Handling:** Luôn có fallback khi AI không trả về đúng format
5. **Caching:** Cache kết quả AI cho các văn bản giống nhau để giảm chi phí

---

## 🔧 Integration Example

```typescript
// Example: Using OpenAI API with prompt template
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function classifyDocument(content: string) {
  const prompt = `
Bạn là một chuyên gia phân loại văn bản hành chính Việt Nam...
Văn bản:
${content}
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Bạn là một chuyên gia phân loại văn bản hành chính Việt Nam.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
```

---

## 📚 References

- [Nghị định 30/2020/NĐ-CP](https://vanban.chinhphu.vn/)
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Best Practices for LLM Applications](https://platform.openai.com/docs/guides/best-practices)

