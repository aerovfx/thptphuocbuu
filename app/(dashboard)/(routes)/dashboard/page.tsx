"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, BookOpen, Clock, Star, TrendingUp, Award, Target, Users, FileText, Play } from "lucide-react";
import Link from "next/link";

// Mock data - replace with real API calls
const mockStudentData = {
  totalCourses: 5,
  completedCourses: 2,
  totalChapters: 25,
  completedChapters: 12,
  totalAssignments: 15,
  completedAssignments: 8,
  totalQuizzes: 12,
  completedQuizzes: 5,
  pendingQuizzes: 3,
  averageScore: 85,
  totalStudyTime: "45 hours",
  currentStreak: 7,
  achievements: [
    { id: 1, name: "First Course Complete", description: "Completed your first course", icon: "🎓", earned: true, date: "2024-01-15" },
    { id: 2, name: "Perfect Score", description: "Got 100% on a quiz", icon: "⭐", earned: true, date: "2024-01-20" },
    { id: 3, name: "Week Warrior", description: "Studied 7 days in a row", icon: "🔥", earned: true, date: "2024-01-25" },
    { id: 4, name: "Math Master", description: "Complete 10 math courses", icon: "🧮", earned: false, date: null },
    { id: 5, name: "Speed Learner", description: "Complete a course in under 3 days", icon: "⚡", earned: false, date: null },
  ],
  recentCourses: [
    { id: 1, title: "Algebra Basics", progress: 80, status: "In Progress", lastAccessed: "2 hours ago" },
    { id: 2, title: "Calculus Fundamentals", progress: 100, status: "Completed", lastAccessed: "1 day ago" },
    { id: 3, title: "Geometry Advanced", progress: 45, status: "In Progress", lastAccessed: "3 days ago" },
  ],
  leaderboard: [
    { rank: 1, name: "Alice Johnson", score: 2450, badge: "🥇" },
    { rank: 2, name: "Bob Smith", score: 2380, badge: "🥈" },
    { rank: 3, name: "You", score: 2150, badge: "🥉" },
    { rank: 4, name: "Carol Davis", score: 1920, badge: "🏅" },
    { rank: 5, name: "David Wilson", score: 1850, badge: "🏅" },
  ],
  recentQuizzes: [
    { id: 1, title: "Đề thi Hóa học - Chuyên đề Este", course: "Hóa học 12", status: "Available", dueDate: "2024-02-15", timeLimit: 60, questions: 18 },
    { id: 2, title: "Bài kiểm tra Đại số - Chương 1", course: "Toán học 10", status: "Completed", score: 87, completedDate: "2024-01-20" },
    { id: 3, title: "Quiz Giải tích - Đạo hàm", course: "Toán học 11", status: "Locked", dueDate: "2024-02-20" },
  ]
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/sign-in");
      return;
    }

    if (session.user.role !== "STUDENT") {
      router.push("/teacher/courses");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "STUDENT") {
    return null;
  }

  const { totalCourses, completedCourses, totalChapters, completedChapters, 
          totalAssignments, completedAssignments, totalQuizzes, completedQuizzes, 
          pendingQuizzes, averageScore, totalStudyTime, currentStreak, achievements, 
          recentCourses, recentQuizzes, leaderboard } = mockStudentData;

  const courseProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
  const chapterProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
          <p className="text-muted-foreground">Here's your learning progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span className="text-2xl font-bold">{averageScore}%</span>
          <span className="text-muted-foreground">Average Score</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCourses}/{totalCourses}</div>
            <Progress value={courseProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {courseProgress.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedChapters}/{totalChapters}</div>
            <Progress value={chapterProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {chapterProgress.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments}/{totalAssignments}</div>
            <Progress value={assignmentProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {assignmentProgress.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedQuizzes}/{totalQuizzes}</div>
            <Progress value={quizProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {quizProgress.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Total study time: {totalStudyTime}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
            <CardDescription>Your learning progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{course.title}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={course.progress} className="w-24 h-2" />
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Last accessed: {course.lastAccessed}</p>
                </div>
                <Badge variant={course.status === "Completed" ? "default" : "secondary"}>
                  {course.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Your quiz activities</CardDescription>
            </div>
            <Link href="/dashboard/quizzes">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{quiz.title}</p>
                  <p className="text-xs text-muted-foreground">{quiz.course}</p>
                  {quiz.status === "Completed" && quiz.score && (
                    <p className="text-xs text-green-600 font-medium">Score: {quiz.score}%</p>
                  )}
                  {quiz.status === "Available" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {quiz.timeLimit} min • {quiz.questions} questions
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={
                    quiz.status === "Completed" ? "default" : 
                    quiz.status === "Available" ? "secondary" : 
                    "outline"
                  }>
                    {quiz.status}
                  </Badge>
                  {quiz.status === "Available" && (
                    <Link href={`/dashboard/quiz/quiz-${quiz.id}`}>
                      <Button size="sm" className="h-6 px-2 text-xs">
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.earned && achievement.date && (
                    <p className="text-xs text-green-600">Earned on {achievement.date}</p>
                  )}
                </div>
                {achievement.earned && <Star className="h-5 w-5 text-yellow-500" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Quick access to your learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/dashboard/quizzes">
              <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Take Quiz</p>
                  <p className="text-sm text-muted-foreground">Start a quiz</p>
                </div>
              </div>
            </Link>
            
            <Link href="/dashboard/courses">
              <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Browse Courses</p>
                  <p className="text-sm text-muted-foreground">View all courses</p>
                </div>
              </div>
            </Link>
            
            <Link href="/dashboard/assignments">
              <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Assignments</p>
                  <p className="text-sm text-muted-foreground">View assignments</p>
                </div>
              </div>
            </Link>
            
            <Link href="/dashboard/achievements">
              <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Achievements</p>
                  <p className="text-sm text-muted-foreground">View achievements</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top performers this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((student) => (
              <div key={student.rank} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{student.badge}</span>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">Rank #{student.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{student.score}</p>
                  <p className="text-sm text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


