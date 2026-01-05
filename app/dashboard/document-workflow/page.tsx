"use client";

import { useState } from "react";
import { Plus, Filter, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanBoard } from "@/components/DocumentWorkflow/KanbanBoard";
import { CreateDocumentModal } from "@/components/DocumentWorkflow/CreateDocumentModal";
import { DocumentStatsWidget } from "@/components/DocumentWorkflow/DocumentStatsWidget";
import { DocumentFilters } from "@/components/DocumentWorkflow/DocumentFilters";
import {
  DocumentWorkflowFilters,
  DocumentDirection,
  DocumentPriority,
  DocumentWorkflowStatus,
} from "@/types/document-workflow";

export default function DocumentWorkflowPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentWorkflowFilters>({});
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (newFilters: DocumentWorkflowFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý Văn bản
            </h1>
            <p className="text-gray-600 mt-1">
              Hệ thống quản lý văn bản theo phong cách Jira
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                /* TODO: Export functionality */
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo văn bản mới
            </Button>
          </div>
        </div>

        {/* Statistics Widget */}
        <DocumentStatsWidget filters={filters} />

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm văn bản..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={filters.direction || ""}
                  onValueChange={(value) =>
                    handleFilterChange({
                      ...filters,
                      direction: value as DocumentDirection,
                    })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Loại văn bản" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value={DocumentDirection.INCOMING}>
                      Văn bản đến
                    </SelectItem>
                    <SelectItem value={DocumentDirection.OUTGOING}>
                      Văn bản đi
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority || ""}
                  onValueChange={(value) =>
                    handleFilterChange({
                      ...filters,
                      priority: value as DocumentPriority,
                    })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value={DocumentPriority.URGENT}>
                      🔴 Khẩn cấp
                    </SelectItem>
                    <SelectItem value={DocumentPriority.HIGH}>
                      🟠 Cao
                    </SelectItem>
                    <SelectItem value={DocumentPriority.NORMAL}>
                      🟡 Bình thường
                    </SelectItem>
                    <SelectItem value={DocumentPriority.LOW}>
                      🟢 Thấp
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status || ""}
                  onValueChange={(value) =>
                    handleFilterChange({
                      ...filters,
                      status: value as DocumentWorkflowStatus,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.DRAFT}>
                      Dự thảo
                    </SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.PENDING_REVIEW}>
                      Chờ xem xét
                    </SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.IN_REVIEW}>
                      Đang xem xét
                    </SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.PENDING_APPROVAL}>
                      Chờ phê duyệt
                    </SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.APPROVED}>
                      Đã phê duyệt
                    </SelectItem>
                    <SelectItem value={DocumentWorkflowStatus.PUBLISHED}>
                      Đã xuất bản
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  disabled={Object.keys(filters).length === 0}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <DocumentFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </CardContent>
        </Card>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="list">Danh sách</TabsTrigger>
            <TabsTrigger value="calendar">Lịch</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            <KanbanBoard initialFilters={filters} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách văn bản</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Chức năng danh sách đang được phát triển...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch văn bản</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Chức năng lịch đang được phát triển...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
