"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Award, 
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  Download
} from "lucide-react";

// Mock data - replace with real API calls
const mockAnalytics = {
  totalStudents: 1250,
  totalCourses: 8,
  totalRevenue: 45231.89,
  averageRating: 4.8,
  completionRate: 78,
  activeStudents: 573,
  newEnrollments: 234,
  totalHours: 2450,
  studentGrowth: [
    { month: "Jan", students: 800, revenue: 12000 },
    { month: "Feb", students: 920, revenue: 15000 },
    { month: "Mar", students: 1050, revenue: 18000 },
    { month: "Apr", students: 1120, revenue: 20000 },
    { month: "May", students: 1180, revenue: 22000 },
    { month: "Jun", students: 1250, revenue: 25000 },
  ],
  coursePerformance: [
    { name: "Algebra Basics", students: 450, revenue: 13500, completion: 85, rating: 4.9 },
    { name: "Calculus Fundamentals", students: 320, revenue: 16000, completion: 78, rating: 4.7 },
    { name: "Geometry Advanced", students: 280, revenue: 8400, completion: 72, rating: 4.6 },
    { name: "Statistics Intro", students: 200, revenue: 7300, completion: 68, rating: 4.5 },
  ],
  studentProgress: [
    { name: "Week 1", completed: 85, inProgress: 15 },
    { name: "Week 2", completed: 78, inProgress: 22 },
    { name: "Week 3", completed: 82, inProgress: 18 },
    { name: "Week 4", completed: 88, inProgress: 12 },
    { name: "Week 5", completed: 75, inProgress: 25 },
    { name: "Week 6", completed: 90, inProgress: 10 },
  ],
  topStudents: [
    { name: "Alice Johnson", courses: 5, progress: 95, score: 98, lastActive: "2 hours ago" },
    { name: "Bob Smith", courses: 4, progress: 88, score: 94, lastActive: "1 day ago" },
    { name: "Carol Davis", courses: 3, progress: 92, score: 96, lastActive: "3 hours ago" },
    { name: "David Wilson", courses: 6, progress: 85, score: 91, lastActive: "5 hours ago" },
    { name: "Emma Brown", courses: 2, progress: 78, score: 89, lastActive: "1 day ago" },
  ],
  assignments: [
    { title: "Linear Equations Quiz", submissions: 234, averageScore: 87, dueDate: "2024-02-01" },
    { title: "Calculus Derivatives", submissions: 189, averageScore: 82, dueDate: "2024-02-05" },
    { title: "Geometry Proofs", submissions: 156, averageScore: 79, dueDate: "2024-02-08" },
    { title: "Statistics Project", submissions: 98, averageScore: 91, dueDate: "2024-02-10" },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/sign-in");
      return;
    }

    if (session.user.role !== "TEACHER") {
      router.push("/dashboard");
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

  if (!session || session.user.role !== "TEACHER") {
    return null;
  }

  const {
    totalStudents, 
    totalCourses, 
    totalRevenue,
    averageRating, 
    completionRate, 
    activeStudents, 
    newEnrollments,
    studentGrowth,
    coursePerformance,
    studentProgress,
    topStudents,
    assignments
  } = mockAnalytics;

  return ( 
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your teaching performance and student progress</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{newEnrollments} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Across {totalCourses} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Course completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Student Growth & Revenue</CardTitle>
            <CardDescription>Monthly student enrollment and revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={studentGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="students" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Student enrollment and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8884d8" name="Students" />
                <Bar dataKey="completion" fill="#82ca9d" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>Students with highest scores and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.courses} courses</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{student.score}%</div>
                  <Progress value={student.progress} className="w-16 h-2 mt-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assignment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>Assignment submissions and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.map((assignment, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{assignment.title}</h4>
                  <Badge variant="outline">{assignment.submissions} submissions</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Score: {assignment.averageScore}%</span>
                  <span className="text-muted-foreground">Due: {assignment.dueDate}</span>
                </div>
                <Progress value={assignment.averageScore} className="h-2 mt-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Active Students</span>
              </div>
              <span className="font-bold">{activeStudents}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm">Total Courses</span>
              </div>
              <span className="font-bold">{totalCourses}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Completion Rate</span>
              </div>
              <span className="font-bold">{completionRate}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Avg Rating</span>
              </div>
              <span className="font-bold">{averageRating}/5</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
   );
}