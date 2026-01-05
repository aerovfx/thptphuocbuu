"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateDocumentWorkflow } from "@/hooks/use-document-workflow";
import {
  CreateDocumentWorkflowPayload,
  DocumentDirection,
  DocumentWorkflowStatus,
  DocumentPriority,
  DocumentTypeCode,
  PRIORITY_CONFIG,
  DOCUMENT_TYPE_CONFIG,
} from "@/types/document-workflow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDirection?: DocumentDirection;
}

export function CreateDocumentModal({
  isOpen,
  onClose,
  defaultDirection = DocumentDirection.OUTGOING,
}: CreateDocumentModalProps) {
  const { mutate: createDocument, isPending } = useCreateDocumentWorkflow();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDocumentWorkflowPayload>({
    defaultValues: {
      direction: defaultDirection,
      status: DocumentWorkflowStatus.DRAFT,
      priority: DocumentPriority.NORMAL,
    },
  });

  const direction = watch("direction");

  const onSubmit = (data: CreateDocumentWorkflowPayload) => {
    createDocument(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo văn bản mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo văn bản mới trong hệ thống
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Direction */}
          <div className="space-y-2">
            <Label htmlFor="direction">
              Loại văn bản <span className="text-red-500">*</span>
            </Label>
            <Select
              value={direction}
              onValueChange={(value) =>
                setValue("direction", value as DocumentDirection)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DocumentDirection.INCOMING}>
                  Văn bản đến
                </SelectItem>
                <SelectItem value={DocumentDirection.OUTGOING}>
                  Văn bản đi
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register("title", { required: "Tiêu đề là bắt buộc" })}
              placeholder="Nhập tiêu đề văn bản"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Nhập nội dung văn bản"
              rows={6}
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Loại văn bản</Label>
            <Select
              onValueChange={(value) =>
                setValue("documentType", value as DocumentTypeCode)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại văn bản" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Mức độ ưu tiên <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={DocumentPriority.NORMAL}
                onValueChange={(value) =>
                  setValue("priority", value as DocumentPriority)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Trạng thái <span className="text-red-500">*</span>
              </Label>
              <Select
                defaultValue={DocumentWorkflowStatus.DRAFT}
                onValueChange={(value) =>
                  setValue("status", value as DocumentWorkflowStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DocumentWorkflowStatus.DRAFT}>
                    Dự thảo
                  </SelectItem>
                  <SelectItem value={DocumentWorkflowStatus.PENDING_REVIEW}>
                    Chờ xem xét
                  </SelectItem>
                  <SelectItem value={DocumentWorkflowStatus.IN_REVIEW}>
                    Đang xem xét
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Hạn xử lý</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register("dueDate")}
            />
          </div>

          {/* Effective Date (for outgoing documents) */}
          {direction === DocumentDirection.OUTGOING && (
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Ngày có hiệu lực</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register("effectiveDate")}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags (phân cách bằng dấu phẩy)
            </Label>
            <Input
              id="tags"
              placeholder="tag1, tag2, tag3"
              onChange={(e) => {
                const tagsArray = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                setValue("tags", tagsArray);
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo văn bản
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
