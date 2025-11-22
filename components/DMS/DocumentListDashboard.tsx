"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import Avatar from '@/components/Common/Avatar';

interface Document {
  id: string;
  documentNumber: string | null;
  title: string;
  type: string;
  status: string;
  priority: string;
  sender: string | null;
  receivedDate: string;
  deadline: string | null;
  summary: string | null;
  ocrConfidence: number | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  fileUrl?: string;
  fileName?: string;
  assignments: Array<{
    id: string;
    assignedTo: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    status: string;
    deadline: string | null;
  }>;
  createdAt: string;
}

interface DocumentListDashboardProps {
  initialDocuments?: Document[];
  onDocumentClick?: (documentId: string) => void;
}

export default function DocumentListDashboard({
  initialDocuments = [],
  onDocumentClick,
}: DocumentListDashboardProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useAPI, setUseAPI] = useState(initialDocuments.length === 0);

  // Update documents when initialDocuments change
  useEffect(() => {
    if (initialDocuments.length > 0) {
      setDocuments(initialDocuments);
      setUseAPI(false);
    }
  }, [initialDocuments]);

  // Fetch documents from API only if needed
  useEffect(() => {
    if (useAPI) {
      fetchDocuments();
    } else {
      // Filter local documents
      filterLocalDocuments();
    }
  }, [page, statusFilter, typeFilter, priorityFilter, searchQuery, useAPI]);

  const filterLocalDocuments = () => {
    let filtered = [...initialDocuments];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.type === typeFilter);
    }
    if (priorityFilter !== "ALL") {
      filtered = filtered.filter((doc) => doc.priority === priorityFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.summary?.toLowerCase().includes(query) ||
          doc.sender?.toLowerCase().includes(query)
      );
    }

    setDocuments(filtered);
    setTotalPages(1);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "ALL" && { status: statusFilter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
        ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/dms/incoming?${params}`);
      const data = await response.json();

      if (data.documents) {
        setDocuments(data.documents);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        label: "Chờ xử lý",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: Clock,
      },
      PROCESSING: {
        label: "Đang xử lý",
        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        icon: AlertCircle,
      },
      APPROVED: {
        label: "Đã phê duyệt",
        className: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: CheckCircle2,
      },
      REJECTED: {
        label: "Từ chối",
        className: "bg-red-500/20 text-red-400 border-red-500/30",
        icon: XCircle,
      },
      COMPLETED: {
        label: "Hoàn thành",
        className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        icon: CheckCircle2,
      },
      ARCHIVED: {
        label: "Lưu trữ",
        className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        icon: FileText,
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border font-poppins ${badge.className}`}
      >
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      URGENT: {
        label: "Khẩn",
        className: "bg-red-500/20 text-red-400",
      },
      HIGH: {
        label: "Cao",
        className: "bg-orange-500/20 text-orange-400",
      },
      NORMAL: {
        label: "Bình thường",
        className: "bg-blue-500/20 text-blue-400",
      },
      LOW: {
        label: "Thấp",
        className: "bg-gray-500/20 text-gray-400",
      },
    };

    const badge = badges[priority as keyof typeof badges] || badges.NORMAL;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-poppins ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      DIRECTIVE: "Chỉ đạo",
      RECORD: "Hồ sơ",
      REPORT: "Báo cáo",
      REQUEST: "Đề nghị",
      OTHER: "Khác",
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
          >
            <option value="ALL">Tất cả loại</option>
            <option value="DIRECTIVE">Chỉ đạo</option>
            <option value="RECORD">Hồ sơ</option>
            <option value="REPORT">Báo cáo</option>
            <option value="REQUEST">Đề nghị</option>
            <option value="OTHER">Khác</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="URGENT">Khẩn</option>
            <option value="HIGH">Cao</option>
            <option value="NORMAL">Bình thường</option>
            <option value="LOW">Thấp</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-400 font-poppins">Đang tải...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 font-poppins">Không có văn bản nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {documents.map((doc) => {
              const daysUntilDeadline = getDaysUntilDeadline(doc.deadline);
              const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3;

              // Calculate progress based on status
              const getProgress = (status: string) => {
                switch (status) {
                  case 'PENDING': return 0
                  case 'PROCESSING': return 33
                  case 'APPROVED': return 66
                  case 'COMPLETED': return 100
                  case 'REJECTED': return 0
                  case 'ARCHIVED': return 100
                  default: return 0
                }
              }

              const progress = getProgress(doc.status)
              const primaryAssignee = doc.assignments.length > 0 ? doc.assignments[0].assignedTo : null

              return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-800 last:border-b-0"
                  onClick={() => onDocumentClick?.(doc.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(doc.status)}
                        {getPriorityBadge(doc.priority)}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-semibold text-white mb-2 line-clamp-1 font-poppins">
                        {doc.title}
                      </h3>

                      {/* Metadata - Compact */}
                      <div className="space-y-1 mb-3">
                        {doc.sender && (
                          <div className="text-xs text-gray-400 font-poppins">
                            {doc.sender}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 font-poppins">
                          <span>Nhận: {formatDate(doc.receivedDate)}</span>
                          {doc.deadline && (
                            <span className={isUrgent ? "text-red-400 font-medium" : ""}>
                              Hạn: {formatDate(doc.deadline)}
                              {daysUntilDeadline !== null && (
                                <span className="ml-1">
                                  ({daysUntilDeadline > 0 ? `Còn ${daysUntilDeadline} ngày` : "Quá hạn"})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400 font-poppins">Tiến độ</span>
                          <span className="text-xs font-semibold text-white font-poppins">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              progress === 100 ? 'bg-green-500' :
                              progress >= 66 ? 'bg-blue-500' :
                              progress >= 33 ? 'bg-yellow-500' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Avatar and Actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {/* Primary Assignee Avatar */}
                      {primaryAssignee ? (
                        <div className="relative group">
                          <Avatar
                            src={primaryAssignee.avatar}
                            name={`${primaryAssignee.firstName} ${primaryAssignee.lastName}`}
                            size="md"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900"></div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-400">?</span>
                        </div>
                      )}

                      {/* Action Icons */}
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDocumentClick) {
                              onDocumentClick(doc.id);
                            } else if (typeof window !== 'undefined') {
                              window.location.href = `/dashboard/dms/incoming/${doc.id}`;
                            }
                          }}
                          title="Xem"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            let fileUrl = doc.fileUrl;
                            let fileName = doc.fileName || 'document.pdf';
                            
                            // If fileUrl not available, fetch from API
                            if (!fileUrl) {
                              const response = await fetch(`/api/dms/incoming/${doc.id}`);
                              if (!response.ok) throw new Error('Failed to fetch document');
                              const data = await response.json();
                              fileUrl = data.fileUrl;
                              fileName = data.fileName || fileName;
                            }
                            
                            if (fileUrl) {
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = fileName;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              alert('Không tìm thấy file để tải xuống');
                            }
                          } catch (error) {
                            console.error('Error downloading document:', error);
                            alert('Không thể tải xuống văn bản');
                          }
                        }}
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors relative group"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle dropdown menu (simple implementation)
                          const menuId = `menu-${doc.id}`;
                          const existingMenu = document.getElementById(menuId);
                          if (existingMenu) {
                            existingMenu.remove();
                            return;
                          }
                          
                          const menu = document.createElement('div');
                          menu.id = menuId;
                          menu.className = 'absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]';
                          menu.innerHTML = `
                            <div class="py-1">
                              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-action="view">Xem chi tiết</button>
                              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-action="download">Tải xuống</button>
                              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-action="assign">Phân công xử lý</button>
                              <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-action="workflow">Tạo workflow</button>
                            </div>
                          `;
                          
                          menu.querySelector('[data-action="view"]')?.addEventListener('click', () => {
                            if (onDocumentClick) onDocumentClick(doc.id);
                            menu.remove();
                          });
                          
                          menu.querySelector('[data-action="download"]')?.addEventListener('click', async () => {
                            try {
                              let fileUrl = doc.fileUrl;
                              let fileName = doc.fileName || 'document.pdf';
                              if (!fileUrl) {
                                const response = await fetch(`/api/dms/incoming/${doc.id}`);
                                const data = await response.json();
                                fileUrl = data.fileUrl;
                                fileName = data.fileName || fileName;
                              }
                              if (fileUrl) {
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.download = fileName;
                                link.click();
                              }
                            } catch (error) {
                              alert('Không thể tải xuống văn bản');
                            }
                            menu.remove();
                          });
                          
                          menu.querySelector('[data-action="assign"]')?.addEventListener('click', () => {
                            window.location.href = `/dashboard/dms/incoming/${doc.id}?action=assign`;
                            menu.remove();
                          });
                          
                          menu.querySelector('[data-action="workflow"]')?.addEventListener('click', () => {
                            window.location.href = `/dashboard/dms/incoming/${doc.id}?action=workflow`;
                            menu.remove();
                          });
                          
                          const button = e.currentTarget as HTMLElement;
                          button.parentElement?.appendChild(menu);
                          
                          // Close menu when clicking outside
                          setTimeout(() => {
                            const closeMenu = (event: MouseEvent) => {
                              if (!menu.contains(event.target as Node) && !button.contains(event.target as Node)) {
                                menu.remove();
                                document.removeEventListener('click', closeMenu);
                              }
                            };
                            document.addEventListener('click', closeMenu);
                          }, 0);
                        }}
                          title="Thêm tùy chọn"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400 font-poppins">
              Trang {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 text-white font-poppins"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-700 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 text-white font-poppins"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

