"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCompetition } from "@/contexts/CompetitionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Filter, Calendar, Clock, Users, Trophy, Award, 
  Code, Calculator, Eye, Play, Star, Target, Zap, Flame
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const StudentCompetitionPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { competitions, getCompetition } = useCompetition();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  if (!session || session.user.role !== "STUDENT") {
    router.push("/sign-in");
    return null;
  }

  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || comp.status === statusFilter;
    const matchesType = typeFilter === "all" || comp.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Sắp diễn ra";
      case "active":
        return "Đang diễn ra";
      case "ended":
        return "Đã kết thúc";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "programming":
        return <Code className="h-5 w-5" />;
      case "mathematics":
        return <Calculator className="h-5 w-5" />;
      case "mixed":
        return <Target className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "programming":
        return "Lập trình";
      case "mathematics":
        return "Toán học";
      case "mixed":
        return "Tổng hợp";
      default:
        return type;
    }
  };

  const canJoin = (competition: any) => {
    return competition.status === "upcoming" || competition.status === "active";
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Đã kết thúc";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cuộc thi</h1>
          <p className="text-muted-foreground">
            Tham gia các cuộc thi lập trình và toán học
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Trophy className="h-4 w-4 mr-2" />
            Bảng xếp hạng
          </Button>
          <Button variant="outline" size="sm">
            <Award className="h-4 w-4 mr-2" />
            Thành tích
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm cuộc thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Trạng thái: {statusFilter === "all" ? "Tất cả" : getStatusText(statusFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Tất cả</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("upcoming")}>Sắp diễn ra</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Đang diễn ra</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("ended")}>Đã kết thúc</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Loại: {typeFilter === "all" ? "Tất cả" : getTypeText(typeFilter)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter("all")}>Tất cả</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("programming")}>Lập trình</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("mathematics")}>Toán học</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("mixed")}>Tổng hợp</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuộc thi đã tham gia</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 từ tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng điểm</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              +50 tuần này
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xếp hạng</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#12</div>
            <p className="text-xs text-muted-foreground">
              +3 từ tuần trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              ngày liên tiếp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competitions List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
          <TabsTrigger value="active">Đang diễn ra</TabsTrigger>
          <TabsTrigger value="ended">Đã kết thúc</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompetitions.map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(competition.type)}
                      <div>
                        <CardTitle className="text-lg">{competition.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {competition.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(competition.status)}>
                      {getStatusText(competition.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(competition.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.currentParticipants}/{competition.maxParticipants}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.problems.length} bài</span>
                    </div>
                  </div>
                  
                  {competition.status === "active" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Còn lại: {getTimeRemaining(competition.endDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Giải thưởng:</span>
                      <span className="font-medium text-yellow-600">
                        {competition.prizes.length > 0 ? competition.prizes[0].value : "Không có"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Độ khó:</span>
                      <div className="flex gap-1">
                        {competition.problems.map((_: any, index: number) => (
                          <Star key={index} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canJoin(competition) ? (
                      <Button 
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {competition.status === "upcoming" ? "Đăng ký" : "Tham gia"}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        disabled
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem kết quả
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompetitions.filter(c => c.status === "upcoming").map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(competition.type)}
                      <div>
                        <CardTitle className="text-lg">{competition.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {competition.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(competition.status)}>
                      {getStatusText(competition.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(competition.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.currentParticipants}/{competition.maxParticipants}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.problems.length} bài</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Đăng ký
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompetitions.filter(c => c.status === "active").map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(competition.type)}
                      <div>
                        <CardTitle className="text-lg">{competition.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {competition.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(competition.status)}>
                      {getStatusText(competition.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Còn lại: {getTimeRemaining(competition.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Tham gia ngay
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="ended" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompetitions.filter(c => c.status === "ended").map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(competition.type)}
                      <div>
                        <CardTitle className="text-lg">{competition.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {competition.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(competition.status)}>
                      {getStatusText(competition.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(competition.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.currentParticipants} thí sinh</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span>{competition.submissions.length} bài nộp</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem kết quả
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/competition/${competition.id}`)}
                    >
                      <Trophy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCompetitionPage;

