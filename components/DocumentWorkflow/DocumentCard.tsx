"use client";

import { Draggable } from "@hello-pangea/dnd";
import { DocumentWorkflowItem, PRIORITY_CONFIG, DOCUMENT_TYPE_CONFIG } from "@/types/document-workflow";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, FileText, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";

interface DocumentCardProps {
  document: DocumentWorkflowItem;
  index: number;
}

export function DocumentCard({ document, index }: DocumentCardProps) {
  const priority = PRIORITY_CONFIG[document.priority];
  const docType = document.documentType
    ? DOCUMENT_TYPE_CONFIG[document.documentType]
    : null;

  const isOverdue =
    document.dueDate &&
    new Date(document.dueDate) < new Date() &&
    document.status !== "PUBLISHED";

  return (
    <Draggable draggableId={document.id} index={index}>
      {(provided, snapshot) => (
        <Link
          href={`/dashboard/document-workflow/${document.id}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "block bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary-500"
          )}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {/* Document Number */}
                {document.documentNumber && (
                  <div className="text-xs text-gray-500 mb-1">
                    #{document.documentNumber}
                  </div>
                )}

                {/* Title */}
                <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
                  {document.title}
                </h4>
              </div>

              {/* Priority Badge */}
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 flex-shrink-0",
                  priority.color === "red" && "border-red-500 text-red-700",
                  priority.color === "orange" && "border-orange-500 text-orange-700",
                  priority.color === "yellow" && "border-yellow-500 text-yellow-700",
                  priority.color === "green" && "border-green-500 text-green-700"
                )}
              >
                {priority.label}
              </Badge>
            </div>

            {/* Summary */}
            {document.summary && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {document.summary}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-500">
              {/* Document Type */}
              {docType && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{docType.label}</span>
                </div>
              )}

              {/* Direction Badge */}
              <Badge variant="secondary" className="text-xs">
                {document.direction === "INCOMING" ? "Văn bản đến" : "Văn bản đi"}
              </Badge>

              {/* Due Date */}
              {document.dueDate && (
                <div
                  className={cn(
                    "flex items-center gap-1",
                    isOverdue && "text-red-600 font-medium"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(new Date(document.dueDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </span>
                  {isOverdue && <AlertCircle className="h-3 w-3" />}
                </div>
              )}
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {document.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {document.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{document.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
              {/* Assignee */}
              {document.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={document.assignedTo.avatar} />
                    <AvatarFallback className="text-xs">
                      {document.assignedTo.firstName[0]}
                      {document.assignedTo.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600 truncate max-w-[120px]">
                    {document.assignedTo.firstName} {document.assignedTo.lastName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <User className="h-3 w-3" />
                  <span>Chưa phân công</span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(document.createdAt), "dd/MM", {
                    locale: vi,
                  })}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}
    </Draggable>
  );
}
