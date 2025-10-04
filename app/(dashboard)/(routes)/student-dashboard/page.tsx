"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SpecialActivities } from "@/components/special-activities";
import { Trophy, Target, Clock, BookOpen, Zap } from "lucide-react";

export default function StudentDashboard() {
  const [studentStats, setStudentStats] = useState({
    totalXP: 245,
    level: 2,
    gems: 12,
    hearts: 5,
    streak: 3,
    coursesCompleted: 2,
    totalCourses: 5
  });
  const [loading, setLoading] = useState(true);

  // Fetch user XP data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/xp');
        if (response.ok) {
          const data = await response.json();
          setStudentStats(prev => ({
            ...prev,
            totalXP: data.xp,
            level: data.level,
            gems: data.gems,
            hearts: data.hearts,
            streak: data.streak
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const recentProgress = [
    {
      course: "Toán học cơ bản",
      chapter: "Giá trị lượng giác",
      progress: 25,
      completed: 5,
      total: 20,
      lastAccessed: "2 giờ trước"
    },
    {
      course: "Hóa học",
      chapter: "Bảng tuần hoàn",
      progress: 60,
      completed: 9,
      total: 15,
      lastAccessed: "1 ngày trước"
    },
    {
      course: "Vật lý",
      chapter: "Điện tích và điện trường",
      progress: 10,
      completed: 1,
      total: 15,
      lastAccessed: "3 ngày trước"
    }
  ];

  const achievements = [
    {
      title: "Người học chăm chỉ",
      description: "Học liên tục 3 ngày",
      icon: Clock,
      color: "bg-blue-500",
      unlocked: true,
      xp: 20
    },
    {
      title: "Nhà toán học",
      description: "Hoàn thành 5 bài toán",
      icon: Target,
      color: "bg-green-500",
      unlocked: true,
      xp: 30
    },
    {
      title: "Thám hiểm khoa học",
      description: "Mở khóa 3 môn học",
      icon: BookOpen,
      color: "bg-purple-500",
      unlocked: false,
      xp: 50
    },
    {
      title: "Lập trình viên",
      description: "Hoàn thành khóa Python",
      icon: Zap,
      color: "bg-orange-500",
      unlocked: false,
      xp: 100
    }
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng XP</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.totalXP}</div>
            <p className="text-xs text-muted-foreground">
              Cấp độ {studentStats.level}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gem</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.gems}</div>
            <p className="text-xs text-muted-foreground">
              Thu thập thêm để đổi phần thưởng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trái tim</CardTitle>
            <div className="h-4 w-4 text-red-500">♥</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.hearts}</div>
            <p className="text-xs text-muted-foreground">
              Số lần thử lại bài tập
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chuỗi học</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentStats.streak}</div>
            <p className="text-xs text-muted-foreground">
              Ngày liên tục học tập
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Special Activities */}
      <SpecialActivities />

      {/* Recent Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tiến độ gần đây</h3>
        
        <div className="space-y-4">
          {recentProgress.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{item.course}</CardTitle>
                    <CardDescription>{item.chapter}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.lastAccessed}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Tiến độ</span>
                    <span>{item.completed}/{item.total} bài học</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {item.progress}% hoàn thành
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Thành tích</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => {
            const IconComponent = achievement.icon;
            
            return (
              <Card 
                key={index} 
                className={`transition-all duration-200 ${
                  achievement.unlocked 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'opacity-60'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${achievement.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {achievement.title}
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ✅
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {achievement.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {achievement.unlocked ? (
                    <div className="text-sm text-green-600 font-medium">
                      +{achievement.xp} XP đã nhận
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      🔒 Chưa mở khóa
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

