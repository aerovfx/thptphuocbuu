"use client";

import { Droppable } from "@hello-pangea/dnd";
import { DocumentCard } from "./DocumentCard";
import { KanbanColumn as KanbanColumnType, DocumentWorkflowItem } from "@/types/document-workflow";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
  column: KanbanColumnType;
  documents: DocumentWorkflowItem[];
}

const columnColorClasses = {
  gray: "bg-gray-100 border-gray-300",
  yellow: "bg-yellow-50 border-yellow-300",
  blue: "bg-blue-50 border-blue-300",
  orange: "bg-orange-50 border-orange-300",
  green: "bg-green-50 border-green-300",
  red: "bg-red-50 border-red-300",
  purple: "bg-purple-50 border-purple-300",
};

export function KanbanColumn({ column, documents }: KanbanColumnProps) {
  const colorClass = columnColorClasses[column.color as keyof typeof columnColorClasses] || columnColorClasses.gray;

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={cn(
        "rounded-t-lg border-2 p-4",
        colorClass
      )}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <Badge variant="secondary" className="ml-2">
            {documents.length}
          </Badge>
        </div>
        {column.description && (
          <p className="text-xs text-gray-600">{column.description}</p>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[500px] p-2 space-y-2 bg-gray-50 border-2 border-t-0 rounded-b-lg transition-colors",
              snapshot.isDraggingOver && "bg-blue-50 border-blue-200"
            )}
          >
            {documents.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Không có văn bản
              </div>
            ) : (
              documents.map((document, index) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  index={index}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
