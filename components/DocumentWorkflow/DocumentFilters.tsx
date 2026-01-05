"use client";

import { DocumentWorkflowFilters } from "@/types/document-workflow";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DocumentFiltersProps {
  filters: DocumentWorkflowFilters;
  onFilterChange: (filters: DocumentWorkflowFilters) => void;
}

export function DocumentFilters({
  filters,
  onFilterChange,
}: DocumentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-sm text-gray-600"
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          Bộ lọc nâng cao
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Bộ lọc nâng cao</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
          className="text-sm text-gray-600"
        >
          <ChevronUp className="mr-2 h-4 w-4" />
          Thu gọn
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Space ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="spaceId">Space ID</Label>
          <Input
            id="spaceId"
            placeholder="Lọc theo Space"
            value={filters.spaceId || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, spaceId: e.target.value })
            }
          />
        </div>

        {/* Department ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department ID</Label>
          <Input
            id="departmentId"
            placeholder="Lọc theo Department"
            value={filters.departmentId || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, departmentId: e.target.value })
            }
          />
        </div>

        {/* Assigned To ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Người được phân công</Label>
          <Input
            id="assignedToId"
            placeholder="User ID"
            value={filters.assignedToId || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, assignedToId: e.target.value })
            }
          />
        </div>

        {/* Due Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">Hạn xử lý</Label>
          <Input
            id="dueDate"
            type="date"
            value={filters.dueDate || ""}
            onChange={(e) =>
              onFilterChange({ ...filters, dueDate: e.target.value })
            }
          />
        </div>

        {/* Tags Filter */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
          <Input
            id="tags"
            placeholder="tag1, tag2"
            onChange={(e) => {
              const tagsArray = e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              onFilterChange({ ...filters, tags: tagsArray });
            }}
          />
        </div>
      </div>
    </div>
  );
}
