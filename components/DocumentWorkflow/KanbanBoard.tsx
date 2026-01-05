"use client";

import { useDocumentKanbanBoard, useBulkUpdateDocuments } from "@/hooks/use-document-workflow";
import { DocumentWorkflowFilters, DocumentWorkflowStatus, KANBAN_COLUMNS } from "@/types/document-workflow";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface KanbanBoardProps {
  spaceId?: string;
  departmentId?: string;
  initialFilters?: DocumentWorkflowFilters;
}

export function KanbanBoard({
  spaceId,
  departmentId,
  initialFilters,
}: KanbanBoardProps) {
  const { data: kanbanData, isLoading, error } = useDocumentKanbanBoard({
    spaceId,
    departmentId,
    ...initialFilters,
  });

  const { mutate: bulkUpdate } = useBulkUpdateDocuments();

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (!kanbanData) return;

    // Get source and destination columns
    const sourceStatus = source.droppableId as DocumentWorkflowStatus;
    const destStatus = destination.droppableId as DocumentWorkflowStatus;

    // Prepare update payload
    const updates: Array<{ id: string; status: DocumentWorkflowStatus; position: number }> = [];

    if (sourceStatus === destStatus) {
      // Reordering within the same column
      const column = kanbanData.documents[sourceStatus];
      const reorderedDocs = Array.from(column);
      const [movedDoc] = reorderedDocs.splice(source.index, 1);
      reorderedDocs.splice(destination.index, 0, movedDoc);

      // Update positions
      reorderedDocs.forEach((doc, index) => {
        updates.push({
          id: doc.id,
          status: doc.status,
          position: (index + 1) * 1000,
        });
      });
    } else {
      // Moving to a different column
      const sourceColumn = kanbanData.documents[sourceStatus];
      const destColumn = kanbanData.documents[destStatus];

      const sourceDocs = Array.from(sourceColumn);
      const destDocs = Array.from(destColumn);

      const [movedDoc] = sourceDocs.splice(source.index, 1);
      destDocs.splice(destination.index, 0, {
        ...movedDoc,
        status: destStatus as any,
      });

      // Update positions for destination column
      destDocs.forEach((doc, index) => {
        updates.push({
          id: doc.id,
          status: destStatus as any,
          position: (index + 1) * 1000,
        });
      });

      // Update positions for source column if needed
      if (sourceDocs.length > 0) {
        sourceDocs.forEach((doc, index) => {
          updates.push({
            id: doc.id,
            status: sourceStatus as any,
            position: (index + 1) * 1000,
          });
        });
      }
    }

    // Call bulk update API
    if (updates.length > 0) {
      bulkUpdate({ documents: updates });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
        </AlertDescription>
      </Alert>
    );
  }

  if (!kanbanData) {
    return (
      <Alert>
        <AlertDescription>Không có dữ liệu để hiển thị.</AlertDescription>
      </Alert>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            documents={kanbanData.documents[column.id] || []}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
