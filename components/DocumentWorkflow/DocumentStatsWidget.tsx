"use client";

import { useDocumentKanbanBoard } from "@/hooks/use-document-workflow";
import { DocumentWorkflowFilters } from "@/types/document-workflow";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentStatsWidgetProps {
  filters?: DocumentWorkflowFilters;
}

export function DocumentStatsWidget({ filters }: DocumentStatsWidgetProps) {
  const { data: kanbanData, isLoading } = useDocumentKanbanBoard(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = kanbanData?.stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Documents */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng văn bản</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quá hạn</p>
              <p className="text-3xl font-bold text-red-600">
                {stats?.overdue || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due This Week */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Đến hạn tuần này
              </p>
              <p className="text-3xl font-bold text-orange-600">
                {stats?.dueThisWeek || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed This Month */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Hoàn thành tháng này
              </p>
              <p className="text-3xl font-bold text-green-600">
                {stats?.completedThisMonth || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
