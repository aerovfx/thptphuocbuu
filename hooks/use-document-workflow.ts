/**
 * React Hooks for Document Workflow
 * Client-side data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DocumentWorkflowItem,
  DocumentWorkflowFilters,
  CreateDocumentWorkflowPayload,
  UpdateDocumentWorkflowPayload,
  BulkUpdatePayload,
  DocumentWorkflowStats,
  KanbanBoardData
} from "@/types/document-workflow";

const API_BASE = "/api/document-workflow";

// Fetch documents with filters
export function useDocumentWorkflow(filters?: DocumentWorkflowFilters) {
  return useQuery({
    queryKey: ["document-workflow", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, JSON.stringify(value));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const result = await response.json();
      return result.data as DocumentWorkflowItem[];
    }
  });
}

// Fetch single document
export function useDocumentWorkflowItem(id: string) {
  return useQuery({
    queryKey: ["document-workflow", id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const result = await response.json();
      return result.data as DocumentWorkflowItem;
    },
    enabled: !!id
  });
}

// Create document
export function useCreateDocumentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDocumentWorkflowPayload) => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflow"] });
      toast.success("Đã tạo văn bản thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi tạo văn bản");
    }
  });
}

// Update document
export function useUpdateDocumentWorkflow(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateDocumentWorkflowPayload) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflow"] });
      queryClient.invalidateQueries({ queryKey: ["document-workflow", id] });
      toast.success("Đã cập nhật văn bản thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi cập nhật văn bản");
    }
  });
}

// Delete document
export function useDeleteDocumentWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflow"] });
      toast.success("Đã xóa văn bản thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi xóa văn bản");
    }
  });
}

// Bulk update documents (for Kanban drag-and-drop)
export function useBulkUpdateDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BulkUpdatePayload) => {
      const response = await fetch(`${API_BASE}/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update documents");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflow"] });
      // Don't show toast for every drag-and-drop
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi cập nhật văn bản");
    }
  });
}

// Get Kanban board data
export function useDocumentKanbanBoard(filters?: DocumentWorkflowFilters) {
  const { data: documents, ...rest } = useDocumentWorkflow(filters);

  const kanbanData: KanbanBoardData | undefined = documents
    ? groupDocumentsByStatus(documents)
    : undefined;

  return {
    data: kanbanData,
    ...rest
  };
}

// Helper function to group documents by status
function groupDocumentsByStatus(documents: DocumentWorkflowItem[]): KanbanBoardData {
  const grouped: Record<string, DocumentWorkflowItem[]> = {};

  // Initialize all columns
  const allStatuses = [
    "DRAFT",
    "PENDING_REVIEW",
    "IN_REVIEW",
    "PENDING_APPROVAL",
    "APPROVED",
    "REVISION_REQUIRED",
    "READY_TO_PUBLISH",
    "PUBLISHED"
  ];

  allStatuses.forEach(status => {
    grouped[status] = [];
  });

  // Group documents
  documents.forEach(doc => {
    if (!grouped[doc.status]) {
      grouped[doc.status] = [];
    }
    grouped[doc.status].push(doc);
  });

  // Sort by position within each column
  Object.keys(grouped).forEach(status => {
    grouped[status].sort((a, b) => a.position - b.position);
  });

  // Calculate stats
  const stats: DocumentWorkflowStats = {
    total: documents.length,
    byStatus: {} as any,
    byPriority: {} as any,
    overdue: 0,
    dueThisWeek: 0,
    completedThisMonth: 0
  };

  const now = new Date();
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  documents.forEach(doc => {
    // Count by status
    stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;

    // Count by priority
    stats.byPriority[doc.priority] = (stats.byPriority[doc.priority] || 0) + 1;

    // Count overdue
    if (doc.dueDate && new Date(doc.dueDate) < now && doc.status !== "PUBLISHED") {
      stats.overdue++;
    }

    // Count due this week
    if (doc.dueDate && new Date(doc.dueDate) <= oneWeek && new Date(doc.dueDate) >= now) {
      stats.dueThisWeek++;
    }

    // Count completed this month
    if (doc.status === "PUBLISHED" && doc.updatedAt >= monthStart) {
      stats.completedThisMonth++;
    }
  });

  return {
    columns: [], // Will be populated from constant
    documents: grouped as any,
    stats
  };
}

// Assign document to user
export function useAssignDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, userId }: { documentId: string; userId: string }) => {
      const response = await fetch(`${API_BASE}/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign document");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-workflow"] });
      toast.success("Đã phân công văn bản thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi phân công văn bản");
    }
  });
}
