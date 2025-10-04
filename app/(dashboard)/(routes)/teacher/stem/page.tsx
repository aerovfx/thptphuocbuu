"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Filter,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Star,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Send,
  Bookmark,
  Share,
  Download,
  Zap,
  FlaskConical,
  Cpu,
  Wrench,
  Calculator,
  UserCheck,
  FileText,
  Image,
  Video,
  Link,
  Target,
  Award,
  TrendingUp,
  BarChart3,
  Settings,
  Home,
  BookOpen,
  Plus,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Feedback {
  id: string;
  content: string;
  type: "suggestion" | "approval" | "revision" | "question";
  createdAt: string;
  isResolved: boolean;
}

interface STEMProject {
  id: string;
  title: string;
  description: string;
  category: "Science" | "Technology" | "Engineering" | "Math";
  status: "draft" | "in-progress" | "review" | "completed" | "published";
  teamMembers: Array<{
    id: string;
    name: string;
    role: string;
    email: string;
  }>;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  progress: number;
  milestones: Array<{
    id: string;
    title: string;
    status: "pending" | "in-progress" | "completed";
    dueDate: string;
  }>;
  feedback: Feedback[];
  isPublic: boolean;
  thumbnail?: string;
  lastReviewDate?: string;
  needsAttention: boolean;
}

const TeacherSTEMReview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<STEMProject | null>(null);
  const [newFeedback, setNewFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "approval" | "revision" | "question">("suggestion");

  // Mock data - in real app, this would be fetched from API
  const [projects] = useState<STEMProject[]>([
    {
      id: "1",
      title: "Robot Tự Động Dọn Rác",
      description: "Thiết kế và chế tạo robot có khả năng nhận diện và thu gom rác thải tự động sử dụng AI và computer vision",
      category: "Engineering",
      status: "review",
      teamMembers: [
        { id: "1", name: "Nguyễn Văn A", role: "Team Leader", email: "nguyen.a@student.edu.vn" },
        { id: "2", name: "Trần Thị B", role: "Hardware Engineer", email: "tran.b@student.edu.vn" },
        { id: "3", name: "Lê Văn C", role: "Software Developer", email: "le.c@student.edu.vn" }
      ],
      instructor: {
        id: "teacher1",
        name: "Thầy Nguyễn Minh Kỹ thuật",
        email: "nguyen.minh@teacher.edu.vn"
      },
      createdAt: "2024-10-01",
      updatedAt: "2024-12-20",
      dueDate: "2024-12-30",
      tags: ["AI", "Robotics", "Environment", "Arduino"],
      difficulty: "advanced",
      progress: 85,
      milestones: [
        { id: "m1", title: "Ý tưởng và nghiên cứu", status: "completed", dueDate: "2024-10-15" },
        { id: "m2", title: "Thiết kế hệ thống", status: "completed", dueDate: "2024-11-01" },
        { id: "m3", title: "Chế tạo và thử nghiệm", status: "in-progress", dueDate: "2024-11-20" },
        { id: "m4", title: "Hoàn thiện và báo cáo", status: "pending", dueDate: "2024-12-10" }
      ],
      feedback: [
        {
          id: "f1",
          content: "Dự án rất ấn tượng! Tuy nhiên cần chú ý đến việc tối ưu hóa thuật toán nhận diện để tăng độ chính xác.",
          type: "suggestion",
          createdAt: "2024-12-18",
          isResolved: false
        },
        {
          id: "f2",
          content: "Phần thiết kế hardware rất tốt, các em đã thể hiện sự hiểu biết sâu về robotics.",
          type: "approval",
          createdAt: "2024-12-19",
          isResolved: true
        }
      ],
      isPublic: false,
      lastReviewDate: "2024-12-19",
      needsAttention: true
    },
    {
      id: "2",
      title: "Hệ thống Tưới Cây Thông Minh",
      description: "Phát triển hệ thống tưới cây tự động sử dụng cảm biến độ ẩm và IoT",
      category: "Technology",
      status: "in-progress",
      teamMembers: [
        { id: "4", name: "Phạm Thị D", role: "Project Manager", email: "pham.d@student.edu.vn" },
        { id: "5", name: "Hoàng Văn E", role: "IoT Developer", email: "hoang.e@student.edu.vn" }
      ],
      instructor: {
        id: "teacher2",
        name: "Cô Trần Lan IoT",
        email: "tran.lan@teacher.edu.vn"
      },
      createdAt: "2024-11-15",
      updatedAt: "2024-12-20",
      dueDate: "2025-01-15",
      tags: ["IoT", "Agriculture", "Sensors", "Automation"],
      difficulty: "intermediate",
      progress: 65,
      milestones: [
        { id: "m1", title: "Nghiên cứu và thiết kế", status: "completed", dueDate: "2024-11-30" },
        { id: "m2", title: "Lập trình và kết nối", status: "in-progress", dueDate: "2024-12-25" },
        { id: "m3", title: "Thử nghiệm thực tế", status: "pending", dueDate: "2025-01-05" },
        { id: "m4", title: "Tối ưu hóa và báo cáo", status: "pending", dueDate: "2025-01-15" }
      ],
      feedback: [
        {
          id: "f3",
          content: "Ý tưởng tốt! Hãy chú ý đến việc tối ưu hóa năng lượng cho hệ thống.",
          type: "suggestion",
          createdAt: "2024-12-18",
          isResolved: false
        }
      ],
      isPublic: false,
      lastReviewDate: "2024-12-18",
      needsAttention: false
    },
    {
      id: "3",
      title: "Mô hình Hệ Mặt Trời 3D",
      description: "Tạo mô hình hệ mặt trời tương tác với thông tin chi tiết về các hành tinh",
      category: "Science",
      status: "draft",
      teamMembers: [
        { id: "6", name: "Vũ Thị F", role: "Designer", email: "vu.f@student.edu.vn" },
        { id: "7", name: "Đặng Văn G", role: "3D Artist", email: "dang.g@student.edu.vn" }
      ],
      instructor: {
        id: "teacher3",
        name: "Thầy Lê Minh Vũ trụ",
        email: "le.minh@teacher.edu.vn"
      },
      createdAt: "2024-12-10",
      updatedAt: "2024-12-22",
      dueDate: "2025-02-01",
      tags: ["3D Modeling", "Astronomy", "Education", "VR"],
      difficulty: "beginner",
      progress: 25,
      milestones: [
        { id: "m1", title: "Nghiên cứu thiên văn", status: "in-progress", dueDate: "2024-12-25" },
        { id: "m2", title: "Thiết kế 3D", status: "pending", dueDate: "2025-01-10" },
        { id: "m3", title: "Lập trình tương tác", status: "pending", dueDate: "2025-01-20" },
        { id: "m4", title: "Hoàn thiện và demo", status: "pending", dueDate: "2025-02-01" }
      ],
      feedback: [],
      isPublic: false,
      needsAttention: true
    },
    {
      id: "4",
      title: "Ứng dụng Học Toán Gamification",
      description: "Phát triển ứng dụng mobile học toán với các yếu tố game hóa để tăng hứng thú học tập",
      category: "Math",
      status: "completed",
      teamMembers: [
        { id: "8", name: "Bùi Thị H", role: "App Developer", email: "bui.h@student.edu.vn" },
        { id: "9", name: "Ngô Văn I", role: "UI/UX Designer", email: "ngo.i@student.edu.vn" },
        { id: "10", name: "Lý Thị K", role: "Game Designer", email: "ly.k@student.edu.vn" }
      ],
      instructor: {
        id: "teacher4",
        name: "Cô Phạm Minh Toán",
        email: "pham.minh@teacher.edu.vn"
      },
      createdAt: "2024-10-20",
      updatedAt: "2024-12-18",
      dueDate: "2024-12-30",
      tags: ["Mobile App", "Gamification", "Education", "Mathematics"],
      difficulty: "advanced",
      progress: 100,
      milestones: [
        { id: "m1", title: "Thiết kế và lập kế hoạch", status: "completed", dueDate: "2024-11-05" },
        { id: "m2", title: "Phát triển ứng dụng", status: "completed", dueDate: "2024-11-25" },
        { id: "m3", title: "Tích hợp game mechanics", status: "completed", dueDate: "2024-12-10" },
        { id: "m4", title: "Testing và tối ưu hóa", status: "completed", dueDate: "2024-12-30" }
      ],
      feedback: [
        {
          id: "f4",
          content: "Ứng dụng rất sáng tạo! Tuy nhiên cần điều chỉnh độ khó của các bài toán để phù hợp với từng độ tuổi.",
          type: "revision",
          createdAt: "2024-12-18",
          isResolved: true
        },
        {
          id: "f5",
          content: "Hoàn thành xuất sắc! Dự án đã sẵn sàng để tham gia cuộc thi.",
          type: "approval",
          createdAt: "2024-12-20",
          isResolved: true
        }
      ],
      isPublic: true,
      lastReviewDate: "2024-12-20",
      needsAttention: false
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Bản nháp</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">Đang thực hiện</Badge>;
      case "review":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case "published":
        return <Badge className="bg-purple-100 text-purple-800">Đã xuất bản</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Science":
        return <FlaskConical className="h-5 w-5 text-blue-600" />;
      case "Technology":
        return <Cpu className="h-5 w-5 text-green-600" />;
      case "Engineering":
        return <Wrench className="h-5 w-5 text-orange-600" />;
      case "Math":
        return <Calculator className="h-5 w-5 text-purple-600" />;
      default:
        return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Science":
        return "bg-blue-100 text-blue-800";
      case "Technology":
        return "bg-green-100 text-green-800";
      case "Engineering":
        return "bg-orange-100 text-orange-800";
      case "Math":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case "suggestion":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "approval":
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case "revision":
        return <Edit className="h-4 w-4 text-orange-500" />;
      case "question":
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFeedbackTypeColor = (type: string) => {
    switch (type) {
      case "suggestion":
        return "bg-blue-50 border-blue-200";
      case "approval":
        return "bg-green-50 border-green-200";
      case "revision":
        return "bg-orange-50 border-orange-200";
      case "question":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.teamMembers.some(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: projects.length,
    needsReview: projects.filter(p => p.status === "review").length,
    needsAttention: projects.filter(p => p.needsAttention).length,
    completed: projects.filter(p => p.status === "completed").length,
    pendingFeedback: projects.filter(p => p.feedback.some(f => !f.isResolved)).length
  };

  const addFeedback = (projectId: string) => {
    if (newFeedback.trim()) {
      const feedback: Feedback = {
        id: `f${Date.now()}`,
        content: newFeedback.trim(),
        type: feedbackType,
        createdAt: new Date().toISOString(),
        isResolved: false
      };
      
      // In real app, this would be an API call
      console.log("Adding feedback:", feedback, "to project:", projectId);
      setNewFeedback("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Review Dự án STEM
              </h1>
              <p className="text-gray-600">
                Xem xét và đưa ra phản hồi cho các dự án STEM của học sinh
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <a href="/teacher/dashboard">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/teacher/stem/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Thống kê
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng dự án</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cần review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.needsReview}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cần chú ý</p>
                  <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Chờ phản hồi</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingFeedback}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm dự án hoặc học sinh..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Bản nháp</option>
                  <option value="in-progress">Đang thực hiện</option>
                  <option value="review">Chờ duyệt</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="published">Đã xuất bản</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả lĩnh vực</option>
                  <option value="Science">Khoa học</option>
                  <option value="Technology">Công nghệ</option>
                  <option value="Engineering">Kỹ thuật</option>
                  <option value="Math">Toán học</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className={`hover:shadow-md transition-shadow ${project.needsAttention ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Category Icon */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                      {getCategoryIcon(project.category)}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        {getStatusBadge(project.status)}
                        <Badge className={getCategoryColor(project.category)}>
                          {project.category}
                        </Badge>
                        {project.needsAttention && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Cần chú ý
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      
                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Tiến độ</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{project.teamMembers.length} thành viên</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Hạn: {new Date(project.dueDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {project.lastReviewDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Review: {new Date(project.lastReviewDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                      </div>

                      {/* Feedback Summary */}
                      {project.feedback.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">
                              {project.feedback.length} phản hồi
                              {project.feedback.filter(f => !f.isResolved).length > 0 && (
                                <span className="text-red-600 ml-1">
                                  ({project.feedback.filter(f => !f.isResolved).length} chưa giải quyết)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 4).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedProject(project)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <a href={`/teacher/stem/${project.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/teacher/stem/${project.id}/timeline`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Timeline
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Xuất báo cáo
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="mr-2 h-4 w-4" />
                          Chia sẻ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy dự án nào
              </h3>
              <p className="text-gray-600">
                Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác
              </p>
            </CardContent>
          </Card>
        )}

        {/* Review Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedProject.category)}
                      {selectedProject.title}
                    </CardTitle>
                    <CardDescription>
                      Review dự án • {selectedProject.category}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedProject(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Overview */}
                <div>
                  <h4 className="font-medium mb-2">Mô tả dự án</h4>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>

                {/* Team Members */}
                <div>
                  <h4 className="font-medium mb-2">Thành viên nhóm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProject.teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="font-medium mb-2">Các giai đoạn</h4>
                  <div className="space-y-2">
                    {selectedProject.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          milestone.status === "completed" ? "bg-green-500" :
                          milestone.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{milestone.title}</p>
                          <p className="text-xs text-gray-600">
                            Hạn: {new Date(milestone.dueDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <Badge className={
                          milestone.status === "completed" ? "bg-green-100 text-green-800" :
                          milestone.status === "in-progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }>
                          {milestone.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Existing Feedback */}
                {selectedProject.feedback.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Phản hồi trước đó</h4>
                    <div className="space-y-3">
                      {selectedProject.feedback.map((feedback) => (
                        <div key={feedback.id} className={`p-3 border rounded-lg ${getFeedbackTypeColor(feedback.type)}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {getFeedbackTypeIcon(feedback.type)}
                            <span className="text-sm font-medium capitalize">{feedback.type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            {feedback.isResolved && (
                              <Badge className="bg-green-100 text-green-800 text-xs">Đã giải quyết</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{feedback.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Feedback */}
                <div>
                  <h4 className="font-medium mb-2">Thêm phản hồi mới</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại phản hồi
                      </label>
                      <select
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="suggestion">Gợi ý</option>
                        <option value="approval">Phê duyệt</option>
                        <option value="revision">Cần chỉnh sửa</option>
                        <option value="question">Câu hỏi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nội dung phản hồi
                      </label>
                      <Textarea
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => addFeedback(selectedProject.id)}
                        disabled={!newFeedback.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Gửi phản hồi
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setNewFeedback("");
                          setFeedbackType("suggestion");
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSTEMReview;
