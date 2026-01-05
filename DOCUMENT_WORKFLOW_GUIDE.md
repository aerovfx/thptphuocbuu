# HỆ THỐNG QUẢN LÝ VĂN BẢN JIRA-STYLE
## Document Workflow Management System

---

## 📋 TỔNG QUAN

Hệ thống quản lý văn bản theo phong cách Jira được xây dựng để tối ưu hóa quy trình xử lý văn bản hành chính trong trường học. Hệ thống sử dụng Kanban board với drag-and-drop để quản lý luồng công việc (workflow) của văn bản từ khâu dự thảo đến xuất bản.

### Điểm nổi bật

✨ **Kanban Board** - Bảng quản lý trực quan với drag-and-drop
🔄 **Workflow Automation** - Tự động hóa luồng phê duyệt
👥 **Assignment System** - Phân công và theo dõi tiến độ
📊 **Analytics** - Thống kê và báo cáo chi tiết
🏷️ **Multi-level Tags** - Phân loại đa chiều
⏰ **Deadline Tracking** - Theo dõi và nhắc nhở deadline

---

## 🎯 WORKFLOW STATUS (Trạng thái luồng công việc)

### Kanban Columns (Các cột trong bảng)

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│   DỰ THẢO   │→ │ CHỜ XEM XÉT  │→ │ ĐANG XEM XÉT│→ │ CHỜ PHÊ DUYỆT │
│   (DRAFT)   │  │(PENDING_REV) │  │ (IN_REVIEW) │  │(PENDING_APP) │
└─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
       ↓                                                      ↓
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│CẦN CHỈNH SỬA│  │ ĐÃ PHÊ DUYỆT │→ │  SẴN SÀNG   │→ │ ĐÃ XUẤT BẢN  │
│(REVISION)   │  │  (APPROVED)  │  │(READY_PUB)  │  │ (PUBLISHED)  │
└─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘
```

### Chi tiết các trạng thái

#### 1. DRAFT (Dự thảo) 📝
- **Mô tả**: Văn bản đang được soạn thảo
- **Người thực hiện**: Người tạo văn bản
- **Hành động**: Hoàn thiện nội dung, chỉnh sửa
- **Chuyển tiếp**: → PENDING_REVIEW khi sẵn sàng

#### 2. PENDING_REVIEW (Chờ xem xét) ⏳
- **Mô tả**: Chờ người xem xét kiểm tra
- **Người thực hiện**: Người được phân công review
- **Hành động**: Tiếp nhận và bắt đầu xem xét
- **Chuyển tiếp**: → IN_REVIEW khi bắt đầu xem xét

#### 3. IN_REVIEW (Đang xem xét) 👀
- **Mô tả**: Đang được xem xét nội dung
- **Người thực hiện**: Reviewer
- **Hành động**: Xem xét, góp ý, đánh giá
- **Chuyển tiếp**:
  - → PENDING_APPROVAL (đạt yêu cầu)
  - → REVISION_REQUIRED (cần chỉnh sửa)

#### 4. PENDING_APPROVAL (Chờ phê duyệt) 🔔
- **Mô tả**: Chờ cấp trên phê duyệt
- **Người thực hiện**: Người có quyền phê duyệt
- **Hành động**: Xem xét và quyết định
- **Chuyển tiếp**:
  - → APPROVED (phê duyệt)
  - → REJECTED (từ chối)
  - → REVISION_REQUIRED (yêu cầu sửa)

#### 5. APPROVED (Đã phê duyệt) ✅
- **Mô tả**: Đã được phê duyệt
- **Người thực hiện**: Người xuất bản
- **Hành động**: Chuẩn bị xuất bản
- **Chuyển tiếp**: → READY_TO_PUBLISH

#### 6. REVISION_REQUIRED (Cần chỉnh sửa) 🔧
- **Mô tả**: Yêu cầu chỉnh sửa lại
- **Người thực hiện**: Người tạo văn bản
- **Hành động**: Chỉnh sửa theo góp ý
- **Chuyển tiếp**: → PENDING_REVIEW sau khi sửa

#### 7. READY_TO_PUBLISH (Sẵn sàng xuất bản) 🚀
- **Mô tả**: Sẵn sàng để xuất bản
- **Người thực hiện**: Ban truyền thông
- **Hành động**: Kiểm tra cuối cùng
- **Chuyển tiếp**: → PUBLISHED

#### 8. PUBLISHED (Đã xuất bản) 📢
- **Mô tả**: Đã xuất bản công khai
- **Người thực hiện**: Hệ thống
- **Hành động**: Lưu trữ và theo dõi
- **Chuyển tiếp**: → ARCHIVED (sau thời gian)

#### 9. REJECTED (Bị từ chối) ❌
- **Mô tả**: Văn bản bị từ chối
- **Người thực hiện**: N/A
- **Hành động**: Xem lý do từ chối
- **Chuyển tiếp**: Có thể tạo mới

#### 10. ARCHIVED (Đã lưu trữ) 🗄️
- **Mô tả**: Đã lưu trữ
- **Người thực hiện**: Hệ thống (auto)
- **Hành động**: Chỉ xem, không chỉnh sửa
- **Chuyển tiếp**: Không

---

## 🎨 PRIORITY LEVELS (Mức độ ưu tiên)

### 1. URGENT (Khẩn cấp) 🔴
- **Màu**: Đỏ
- **Icon**: AlertCircle
- **Deadline**: < 24 giờ
- **Sử dụng**: Văn bản khẩn cấp, cần xử lý ngay

### 2. HIGH (Cao) 🟠
- **Màu**: Cam
- **Icon**: ArrowUp
- **Deadline**: 1-3 ngày
- **Sử dụng**: Văn bản quan trọng, ưu tiên cao

### 3. NORMAL (Bình thường) 🟡
- **Màu**: Vàng
- **Icon**: Minus
- **Deadline**: 3-7 ngày
- **Sử dụng**: Văn bản thông thường

### 4. LOW (Thấp) 🟢
- **Màu**: Xanh
- **Icon**: ArrowDown
- **Deadline**: > 7 ngày
- **Sử dụng**: Văn bản không gấp

---

## 📄 DOCUMENT TYPES (Loại văn bản)

### 1. CV (Công văn)
- **Mã**: CV
- **Màu**: Xanh dương
- **Mô tả**: Văn bản công văn chính thức

### 2. QĐ (Quyết định)
- **Mã**: QD
- **Màu**: Tím
- **Mô tả**: Quyết định của lãnh đạo

### 3. TB (Thông báo)
- **Mã**: TB
- **Màu**: Vàng
- **Mô tả**: Thông báo chung

### 4. BC (Báo cáo)
- **Mã**: BC
- **Màu**: Xanh lá
- **Mô tả**: Báo cáo công việc

### 5. HD (Hướng dẫn)
- **Mã**: HD
- **Màu**: Cyan
- **Mô tả**: Hướng dẫn thực hiện

### 6. KH (Kế hoạch)
- **Mã**: KH
- **Màu**: Indigo
- **Mô tả**: Kế hoạch công tác

### 7. TT (Thông tin)
- **Mã**: TT
- **Màu**: Xám
- **Mô tả**: Thông tin chung

---

## 🔄 API ENDPOINTS

### Document Workflow Management

```typescript
// List documents with filters
GET /api/document-workflow?
  spaceId=xxx&
  status=DRAFT&
  priority=HIGH&
  assignedToId=xxx&
  direction=INCOMING&
  documentType=CV&
  search=keyword&
  dueDate=2025-01-10

// Get single document
GET /api/document-workflow/[id]

// Create new document
POST /api/document-workflow
Body: {
  title: string;
  content?: string;
  direction: "INCOMING" | "OUTGOING";
  documentType?: DocumentTypeCode;
  status: DocumentWorkflowStatus;
  priority: DocumentPriority;
  assignedToId?: string;
  dueDate?: Date;
  effectiveDate?: Date;
  spaceId?: string;
  departmentId?: string;
  tags?: string[];
}

// Update document
PATCH /api/document-workflow/[id]
Body: {
  title?: string;
  content?: string;
  status?: DocumentWorkflowStatus;
  priority?: DocumentPriority;
  assignedToId?: string;
  dueDate?: Date;
  tags?: string[];
}

// Delete document
DELETE /api/document-workflow/[id]

// Bulk update (for Kanban drag-and-drop)
POST /api/document-workflow/bulk-update
Body: {
  documents: Array<{
    id: string;
    status: DocumentWorkflowStatus;
    position: number;
  }>;
}
```

---

## ⚛️ REACT HOOKS

### 1. useDocumentWorkflow (Fetch documents)

```typescript
import { useDocumentWorkflow } from "@/hooks/use-document-workflow";

function MyComponent() {
  const { data, isLoading, error } = useDocumentWorkflow({
    spaceId: "space123",
    status: DocumentWorkflowStatus.PENDING_REVIEW,
    priority: DocumentPriority.HIGH
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return <DocumentList documents={data} />;
}
```

### 2. useDocumentWorkflowItem (Fetch single document)

```typescript
import { useDocumentWorkflowItem } from "@/hooks/use-document-workflow";

function DocumentDetail({ id }: { id: string }) {
  const { data: document, isLoading } = useDocumentWorkflowItem(id);

  if (isLoading) return <LoadingSpinner />;

  return <DocumentView document={document} />;
}
```

### 3. useCreateDocumentWorkflow (Create document)

```typescript
import { useCreateDocumentWorkflow } from "@/hooks/use-document-workflow";

function CreateDocumentForm() {
  const { mutate: createDocument, isPending } = useCreateDocumentWorkflow();

  const handleSubmit = (data: CreateDocumentWorkflowPayload) => {
    createDocument(data);
  };

  return <Form onSubmit={handleSubmit} />;
}
```

### 4. useUpdateDocumentWorkflow (Update document)

```typescript
import { useUpdateDocumentWorkflow } from "@/hooks/use-document-workflow";

function EditDocumentForm({ id }: { id: string }) {
  const { mutate: updateDocument, isPending } = useUpdateDocumentWorkflow(id);

  const handleUpdate = (data: UpdateDocumentWorkflowPayload) => {
    updateDocument(data);
  };

  return <Form onSubmit={handleUpdate} />;
}
```

### 5. useBulkUpdateDocuments (Kanban drag-and-drop)

```typescript
import { useBulkUpdateDocuments } from "@/hooks/use-document-workflow";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function KanbanBoard() {
  const { mutate: bulkUpdate } = useBulkUpdateDocuments();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const updates = calculateUpdates(result);
    bulkUpdate({ documents: updates });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Kanban columns */}
    </DragDropContext>
  );
}
```

### 6. useDocumentKanbanBoard (Kanban board data)

```typescript
import { useDocumentKanbanBoard } from "@/hooks/use-document-workflow";

function KanbanPage() {
  const { data: kanbanData, isLoading } = useDocumentKanbanBoard({
    spaceId: "space123"
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <KanbanBoard
      columns={kanbanData.columns}
      documents={kanbanData.documents}
      stats={kanbanData.stats}
    />
  );
}
```

### 7. useAssignDocument (Assign to user)

```typescript
import { useAssignDocument } from "@/hooks/use-document-workflow";

function AssignDocumentButton({ documentId }: { documentId: string }) {
  const { mutate: assign, isPending } = useAssignDocument();

  const handleAssign = (userId: string) => {
    assign({ documentId, userId });
  };

  return <UserSelector onSelect={handleAssign} />;
}
```

---

## 🎨 UI COMPONENTS (Cần tạo)

### 1. KanbanBoard Component

```tsx
// components/DocumentWorkflow/KanbanBoard.tsx
interface KanbanBoardProps {
  spaceId?: string;
  departmentId?: string;
  initialFilters?: DocumentWorkflowFilters;
}

export function KanbanBoard({ spaceId, departmentId, initialFilters }: KanbanBoardProps) {
  const { data, isLoading } = useDocumentKanbanBoard({
    spaceId,
    departmentId,
    ...initialFilters
  });

  const { mutate: bulkUpdate } = useBulkUpdateDocuments();

  const handleDragEnd = (result: DropResult) => {
    // Calculate position updates
    // Call bulkUpdate mutation
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {KANBAN_COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            documents={data?.documents[column.id] || []}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
```

### 2. KanbanColumn Component

```tsx
// components/DocumentWorkflow/KanbanColumn.tsx
interface KanbanColumnProps {
  column: KanbanColumn;
  documents: DocumentWorkflowItem[];
}

export function KanbanColumn({ column, documents }: KanbanColumnProps) {
  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "min-w-[300px] bg-gray-50 rounded-lg p-4",
            snapshot.isDraggingOver && "bg-blue-50"
          )}
        >
          <ColumnHeader column={column} count={documents.length} />

          <div className="space-y-2 mt-4">
            {documents.map((doc, index) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
```

### 3. DocumentCard Component

```tsx
// components/DocumentWorkflow/DocumentCard.tsx
interface DocumentCardProps {
  document: DocumentWorkflowItem;
  index: number;
}

export function DocumentCard({ document, index }: DocumentCardProps) {
  return (
    <Draggable draggableId={document.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow",
            snapshot.isDragging && "shadow-lg"
          )}
        >
          <DocumentCardHeader document={document} />
          <DocumentCardContent document={document} />
          <DocumentCardFooter document={document} />
        </div>
      )}
    </Draggable>
  );
}
```

### 4. CreateDocumentModal Component

```tsx
// components/DocumentWorkflow/CreateDocumentModal.tsx
export function CreateDocumentModal({
  isOpen,
  onClose,
  defaultDirection = DocumentDirection.OUTGOING
}: CreateDocumentModalProps) {
  const { mutate: createDocument, isPending } = useCreateDocumentWorkflow();

  const form = useForm<CreateDocumentWorkflowPayload>({
    defaultValues: {
      direction: defaultDirection,
      status: DocumentWorkflowStatus.DRAFT,
      priority: DocumentPriority.NORMAL
    }
  });

  const onSubmit = (data: CreateDocumentWorkflowPayload) => {
    createDocument(data, {
      onSuccess: () => {
        onClose();
        form.reset();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Form fields */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 ANALYTICS & STATISTICS

### Document Statistics

```typescript
interface DocumentWorkflowStats {
  total: number;
  byStatus: Record<DocumentWorkflowStatus, number>;
  byPriority: Record<DocumentPriority, number>;
  overdue: number;
  dueThisWeek: number;
  completedThisMonth: number;
}
```

### Usage Example

```tsx
function DocumentStatsWidget() {
  const { data: kanbanData } = useDocumentKanbanBoard();

  const stats = kanbanData?.stats;

  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Tổng văn bản"
        value={stats?.total}
        icon={FileText}
      />
      <StatCard
        title="Quá hạn"
        value={stats?.overdue}
        icon={AlertCircle}
        variant="danger"
      />
      <StatCard
        title="Đến hạn tuần này"
        value={stats?.dueThisWeek}
        icon={Clock}
        variant="warning"
      />
      <StatCard
        title="Hoàn thành tháng này"
        value={stats?.completedThisMonth}
        icon={CheckCircle}
        variant="success"
      />
    </div>
  );
}
```

---

## 🔍 FILTERS & SEARCH

### Filter Options

```typescript
interface DocumentWorkflowFilters {
  spaceId?: string;            // Filter by space
  departmentId?: string;       // Filter by department
  status?: DocumentWorkflowStatus;  // Filter by status
  priority?: DocumentPriority; // Filter by priority
  assignedToId?: string;       // Filter by assignee
  direction?: DocumentDirection; // INCOMING or OUTGOING
  documentType?: DocumentTypeCode; // CV, QD, TB, etc.
  search?: string;             // Full-text search
  dueDate?: string;            // Filter by due date
  tags?: string[];             // Filter by tags
}
```

### Filter Component Example

```tsx
function DocumentFilters({ onFilterChange }: DocumentFiltersProps) {
  const [filters, setFilters] = useState<DocumentWorkflowFilters>({});

  const handleChange = (key: keyof DocumentWorkflowFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex gap-4 mb-6">
      <Select
        value={filters.status}
        onValueChange={(v) => handleChange("status", v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(DocumentWorkflowStatus).map(status => (
            <SelectItem key={status} value={status}>
              {KANBAN_COLUMNS.find(c => c.id === status)?.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(v) => handleChange("priority", v)}
      >
        {/* Priority options */}
      </Select>

      <Input
        placeholder="Tìm kiếm..."
        value={filters.search}
        onChange={(e) => handleChange("search", e.target.value)}
      />
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT

### Required Packages

```json
{
  "dependencies": {
    "@hello-pangea/dnd": "^17.0.0",
    "@tanstack/react-query": "^5.59.0",
    "sonner": "^1.5.0",
    "date-fns": "^4.1.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2"
  }
}
```

### Setup Steps

1. **Create Types**
   ```bash
   # types/document-workflow.ts đã tạo
   ```

2. **Create API Routes**
   ```bash
   # app/api/document-workflow/route.ts
   # app/api/document-workflow/[id]/route.ts
   # app/api/document-workflow/bulk-update/route.ts
   ```

3. **Create Hooks**
   ```bash
   # hooks/use-document-workflow.ts
   ```

4. **Create UI Components**
   ```bash
   # components/DocumentWorkflow/KanbanBoard.tsx
   # components/DocumentWorkflow/KanbanColumn.tsx
   # components/DocumentWorkflow/DocumentCard.tsx
   # components/DocumentWorkflow/CreateDocumentModal.tsx
   ```

5. **Create Page**
   ```bash
   # app/document-workflow/page.tsx
   ```

---

## 📝 USAGE EXAMPLES

### Complete Kanban Page

```tsx
// app/document-workflow/page.tsx
"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/DocumentWorkflow/KanbanBoard";
import { CreateDocumentModal } from "@/components/DocumentWorkflow/CreateDocumentModal";
import { DocumentFilters } from "@/components/DocumentWorkflow/DocumentFilters";
import { DocumentStatsWidget } from "@/components/DocumentWorkflow/DocumentStatsWidget";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DocumentWorkflowFilters } from "@/types/document-workflow";

export default function DocumentWorkflowPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentWorkflowFilters>({});

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý văn bản</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo văn bản mới
        </Button>
      </div>

      <DocumentStatsWidget />

      <DocumentFilters onFilterChange={setFilters} />

      <KanbanBoard initialFilters={filters} />

      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
```

---

## 🎯 ROADMAP & TODO

### Phase 1: Core Features ✅
- [x] Document workflow types
- [x] API endpoints (GET, POST, PATCH, DELETE, bulk-update)
- [x] React hooks for data fetching and mutations
- [ ] Kanban UI components
- [ ] Create/Edit document modals

### Phase 2: Advanced Features 🚧
- [ ] Assignment system with checklist
- [ ] Multi-level approval workflow
- [ ] Comments and activity log
- [ ] File attachments
- [ ] Digital signatures integration
- [ ] Email notifications

### Phase 3: Analytics & Reporting 📊
- [ ] Advanced statistics
- [ ] Charts and visualizations
- [ ] Performance metrics
- [ ] Export reports (PDF, Excel)

### Phase 4: Mobile & Optimization 📱
- [ ] Mobile-responsive Kanban
- [ ] Offline mode support
- [ ] Performance optimization
- [ ] Real-time updates (WebSocket)

---

## 📚 REFERENCES

- **Next14 Jira Clone**: `/next14-jira` - Tham khảo implementation
- **Prisma Schema**: `/prisma/schema.prisma` - Database models
- **ViewCreator Architecture**: `/viewcreator_architecture.md` - Architecture reference

---

## 📞 SUPPORT

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng tham khảo:
- [System Architecture](PHUOCBUU_SYSTEM_ARCHITECTURE.md)
- [Database Schema](prisma/schema.prisma)
- [API Documentation](#-api-endpoints)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-05
**Author**: Development Team
