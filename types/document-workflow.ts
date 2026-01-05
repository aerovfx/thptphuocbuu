/**
 * Document Workflow Types
 * Jira-style document management system types
 */

// Document Workflow Status (Kanban columns)
export enum DocumentWorkflowStatus {
  DRAFT = "DRAFT",                    // Dự thảo - Chưa hoàn thành
  PENDING_REVIEW = "PENDING_REVIEW",  // Chờ xem xét - Cần review
  IN_REVIEW = "IN_REVIEW",            // Đang xem xét - Đang được review
  PENDING_APPROVAL = "PENDING_APPROVAL", // Chờ phê duyệt - Đã review, chờ duyệt
  APPROVED = "APPROVED",              // Đã phê duyệt - Đã được duyệt
  REJECTED = "REJECTED",              // Bị từ chối - Không được duyệt
  REVISION_REQUIRED = "REVISION_REQUIRED", // Cần chỉnh sửa - Yêu cầu sửa
  READY_TO_PUBLISH = "READY_TO_PUBLISH", // Sẵn sàng xuất bản
  PUBLISHED = "PUBLISHED",            // Đã xuất bản
  ARCHIVED = "ARCHIVED"               // Đã lưu trữ
}

// Document Priority
export enum DocumentPriority {
  URGENT = "URGENT",     // 🔴 Khẩn cấp
  HIGH = "HIGH",         // 🟠 Cao
  NORMAL = "NORMAL",     // 🟡 Bình thường
  LOW = "LOW"            // 🟢 Thấp
}

// Document Type Code (simplified from schema)
export enum DocumentTypeCode {
  CV = "CV",       // Công văn
  QD = "QD",       // Quyết định
  TB = "TB",       // Thông báo
  BC = "BC",       // Báo cáo
  HD = "HD",       // Hướng dẫn
  KH = "KH",       // Kế hoạch
  TT = "TT",       // Thông tin
  OTHER = "OTHER"  // Khác
}

// Document Direction
export enum DocumentDirection {
  INCOMING = "INCOMING", // Văn bản đến
  OUTGOING = "OUTGOING"  // Văn bản đi
}

// Approval Action
export enum ApprovalAction {
  APPROVE = "APPROVE",     // Phê duyệt
  REJECT = "REJECT",       // Từ chối
  REQUEST_REVISION = "REQUEST_REVISION", // Yêu cầu chỉnh sửa
  DELEGATE = "DELEGATE"    // Ủy quyền cho người khác
}

// Document Workflow Item (Main entity for Kanban)
export interface DocumentWorkflowItem {
  id: string;

  // Basic info
  documentNumber?: string;
  title: string;
  content?: string;
  summary?: string;

  // Type & Direction
  direction: DocumentDirection;
  documentType?: DocumentTypeCode;

  // Workflow status
  status: DocumentWorkflowStatus;
  priority: DocumentPriority;
  position: number; // For Kanban ordering

  // Assignment
  assignedToId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };

  // Dates
  dueDate?: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  spaceId?: string;
  departmentId?: string;

  // Files
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  signedFileUrl?: string;

  // Metadata
  tags?: string[];

  // Linked entities (for display)
  incomingDocumentId?: string;
  outgoingDocumentId?: string;
}

// Document Assignment with checklist
export interface DocumentAssignment {
  id: string;
  documentId: string;
  assignedToId: string;
  assignedById?: string;
  status: DocumentWorkflowStatus;
  notes?: string;
  deadline?: Date;
  checklist?: ChecklistItem[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Checklist item for assignments
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
  completedById?: string;
}

// Approval workflow
export interface DocumentApproval {
  id: string;
  documentId: string;
  level: number; // Approval level (1, 2, 3...)
  approverId: string;
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED";
  action?: ApprovalAction;
  comment?: string;
  deadline?: Date;
  approvedAt?: Date;
  createdAt: Date;
}

// Comment on document workflow
export interface DocumentWorkflowComment {
  id: string;
  documentId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Activity log entry
export interface DocumentActivity {
  id: string;
  documentId: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  action: string; // "created", "updated", "approved", "rejected", "assigned", etc.
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Kanban Column Definition
export interface KanbanColumn {
  id: DocumentWorkflowStatus;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
}

// Filter options for document list
export interface DocumentWorkflowFilters {
  spaceId?: string;
  departmentId?: string;
  status?: DocumentWorkflowStatus;
  priority?: DocumentPriority;
  assignedToId?: string;
  direction?: DocumentDirection;
  documentType?: DocumentTypeCode;
  search?: string;
  dueDate?: string;
  tags?: string[];
}

// Bulk update payload
export interface BulkUpdatePayload {
  documents: Array<{
    id: string;
    status: DocumentWorkflowStatus;
    position: number;
  }>;
}

// Create document workflow item
export interface CreateDocumentWorkflowPayload {
  title: string;
  content?: string;
  direction: DocumentDirection;
  documentType?: DocumentTypeCode;
  status: DocumentWorkflowStatus;
  priority: DocumentPriority;
  assignedToId?: string;
  dueDate?: Date;
  effectiveDate?: Date;
  spaceId?: string;
  departmentId?: string;
  tags?: string[];

  // Link to existing document
  incomingDocumentId?: string;
  outgoingDocumentId?: string;
}

// Update document workflow item
export interface UpdateDocumentWorkflowPayload {
  title?: string;
  content?: string;
  summary?: string;
  status?: DocumentWorkflowStatus;
  priority?: DocumentPriority;
  assignedToId?: string;
  dueDate?: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  tags?: string[];
}

// Document statistics
export interface DocumentWorkflowStats {
  total: number;
  byStatus: Record<DocumentWorkflowStatus, number>;
  byPriority: Record<DocumentPriority, number>;
  overdue: number;
  dueThisWeek: number;
  completedThisMonth: number;
}

// Analytics data
export interface DocumentAnalytics {
  totalDocuments: number;
  averageCompletionTime: number; // in days
  statusDistribution: Array<{
    status: DocumentWorkflowStatus;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: DocumentPriority;
    count: number;
    percentage: number;
  }>;
  assigneeWorkload: Array<{
    userId: string;
    userName: string;
    documentCount: number;
    overdueCount: number;
  }>;
  completionTrend: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}

// Kanban board data
export interface KanbanBoardData {
  columns: KanbanColumn[];
  documents: Record<DocumentWorkflowStatus, DocumentWorkflowItem[]>;
  stats: DocumentWorkflowStats;
}

// Export constants
export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: DocumentWorkflowStatus.DRAFT,
    title: "Dự thảo",
    description: "Văn bản đang soạn thảo",
    color: "gray",
    icon: "FileEdit",
    order: 1
  },
  {
    id: DocumentWorkflowStatus.PENDING_REVIEW,
    title: "Chờ xem xét",
    description: "Chờ người xem xét",
    color: "yellow",
    icon: "Clock",
    order: 2
  },
  {
    id: DocumentWorkflowStatus.IN_REVIEW,
    title: "Đang xem xét",
    description: "Đang được xem xét",
    color: "blue",
    icon: "Eye",
    order: 3
  },
  {
    id: DocumentWorkflowStatus.PENDING_APPROVAL,
    title: "Chờ phê duyệt",
    description: "Chờ cấp trên phê duyệt",
    color: "orange",
    icon: "AlertCircle",
    order: 4
  },
  {
    id: DocumentWorkflowStatus.APPROVED,
    title: "Đã phê duyệt",
    description: "Đã được phê duyệt",
    color: "green",
    icon: "CheckCircle",
    order: 5
  },
  {
    id: DocumentWorkflowStatus.REVISION_REQUIRED,
    title: "Cần chỉnh sửa",
    description: "Cần chỉnh sửa lại",
    color: "red",
    icon: "AlertTriangle",
    order: 6
  },
  {
    id: DocumentWorkflowStatus.READY_TO_PUBLISH,
    title: "Sẵn sàng",
    description: "Sẵn sàng xuất bản",
    color: "purple",
    icon: "Rocket",
    order: 7
  },
  {
    id: DocumentWorkflowStatus.PUBLISHED,
    title: "Đã xuất bản",
    description: "Đã xuất bản",
    color: "green",
    icon: "Send",
    order: 8
  }
];

export const PRIORITY_CONFIG = {
  [DocumentPriority.URGENT]: {
    label: "Khẩn cấp",
    color: "red",
    icon: "AlertCircle"
  },
  [DocumentPriority.HIGH]: {
    label: "Cao",
    color: "orange",
    icon: "ArrowUp"
  },
  [DocumentPriority.NORMAL]: {
    label: "Bình thường",
    color: "yellow",
    icon: "Minus"
  },
  [DocumentPriority.LOW]: {
    label: "Thấp",
    color: "green",
    icon: "ArrowDown"
  }
};

export const DOCUMENT_TYPE_CONFIG = {
  [DocumentTypeCode.CV]: { label: "Công văn", color: "blue" },
  [DocumentTypeCode.QD]: { label: "Quyết định", color: "purple" },
  [DocumentTypeCode.TB]: { label: "Thông báo", color: "yellow" },
  [DocumentTypeCode.BC]: { label: "Báo cáo", color: "green" },
  [DocumentTypeCode.HD]: { label: "Hướng dẫn", color: "cyan" },
  [DocumentTypeCode.KH]: { label: "Kế hoạch", color: "indigo" },
  [DocumentTypeCode.TT]: { label: "Thông tin", color: "gray" },
  [DocumentTypeCode.OTHER]: { label: "Khác", color: "gray" }
};
