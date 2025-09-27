"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  FileText,
  Send,
  ClipboardCheck,
  FileEdit,
  HelpCircle,
  Video,
  Image,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";

// Mock data - replace with real API calls
const mockDashboardData = {
  overview: {
    totalStudents: 1250,
    totalCourses: 8,
    totalRevenue: 45231.89,
    averageRating: 4.8,
    completionRate: 78,
    activeStudents: 573,
    newEnrollments: 234,
    pendingAssignments: 45,
    publishedQuizzes: 12
  },
  studentGrowth: [
    { month: "Jan", students: 800, enrollments: 120 },
    { month: "Feb", students: 920, enrollments: 150 },
    { month: "Mar", students: 1050, enrollments: 180 },
    { month: "Apr", students: 1120, enrollments: 200 },
    { month: "May", students: 1180, enrollments: 220 },
    { month: "Jun", students: 1250, enrollments: 250 },
  ],
  coursePerformance: [
    { name: "Algebra Basics", students: 450, revenue: 13500, completion: 85, rating: 4.9 },
    { name: "Calculus Fundamentals", students: 320, revenue: 16000, completion: 78, rating: 4.7 },
    { name: "Geometry Advanced", students: 280, revenue: 8400, completion: 72, rating: 4.6 },
    { name: "Statistics Intro", students: 200, revenue: 7300, completion: 68, rating: 4.5 },
  ],
  students: [
    { 
      id: 1, 
      name: "Alice Johnson", 
      email: "alice.johnson@student.test", 
      progress: 95, 
      assignmentsSubmitted: 8, 
      totalAssignments: 10, 
      lastActive: "2 hours ago",
      grade: "A+",
      courses: ["Algebra Basics", "Calculus Fundamentals"],
      phone: "555-0123",
      enrollmentDate: "2024-01-15"
    },
    { 
      id: 2, 
      name: "Bob Smith", 
      email: "bob.smith@student.test", 
      progress: 88, 
      assignmentsSubmitted: 6, 
      totalAssignments: 8, 
      lastActive: "1 day ago",
      grade: "A-",
      courses: ["Geometry Advanced"],
      phone: "555-0456",
      enrollmentDate: "2024-01-20"
    },
    { 
      id: 3, 
      name: "Carol Davis", 
      email: "carol.davis@student.test", 
      progress: 92, 
      assignmentsSubmitted: 9, 
      totalAssignments: 10, 
      lastActive: "3 hours ago",
      grade: "A",
      courses: ["Algebra Basics", "Statistics Intro"],
      phone: "555-0789",
      enrollmentDate: "2024-01-10"
    },
    { 
      id: 4, 
      name: "David Wilson", 
      email: "david.wilson@student.test", 
      progress: 85, 
      assignmentsSubmitted: 7, 
      totalAssignments: 9, 
      lastActive: "5 hours ago",
      grade: "B+",
      courses: ["Calculus Fundamentals", "Geometry Advanced"],
      phone: "555-0321",
      enrollmentDate: "2024-01-25"
    },
    { 
      id: 5, 
      name: "Emma Brown", 
      email: "emma.brown@student.test", 
      progress: 78, 
      assignmentsSubmitted: 5, 
      totalAssignments: 8, 
      lastActive: "1 day ago",
      grade: "B",
      courses: ["Statistics Intro"],
      phone: "555-0654",
      enrollmentDate: "2024-02-01"
    },
  ],
  courses: [
    {
      id: 1,
      title: "Algebra Basics",
      description: "Learn the fundamentals of algebra",
      students: 450,
      revenue: 13500,
      status: "Published",
      completion: 85,
      rating: 4.9,
      chapters: 12,
      lastUpdated: "2024-01-20",
      category: "Mathematics"
    },
    {
      id: 2,
      title: "Calculus Fundamentals", 
      description: "Master the basics of calculus",
      students: 320,
      revenue: 16000,
      status: "Published",
      completion: 78,
      rating: 4.7,
      chapters: 15,
      lastUpdated: "2024-01-18",
      category: "Mathematics"
    },
    {
      id: 3,
      title: "Geometry Advanced",
      description: "Advanced geometry concepts",
      students: 280,
      revenue: 8400,
      status: "Draft",
      completion: 72,
      rating: 4.6,
      chapters: 10,
      lastUpdated: "2024-01-15",
      category: "Mathematics"
    }
  ],
  assignments: [
    {
      id: 1,
      title: "Linear Equations Practice",
      course: "Algebra Basics",
      dueDate: "2024-02-01",
      submissions: 234,
      graded: 200,
      averageScore: 87,
      status: "Active"
    },
    {
      id: 2,
      title: "Derivatives Quiz",
      course: "Calculus Fundamentals", 
      dueDate: "2024-02-05",
      submissions: 189,
      graded: 150,
      averageScore: 82,
      status: "Active"
    },
    {
      id: 3,
      title: "Geometry Proofs Assignment",
      course: "Geometry Advanced",
      dueDate: "2024-02-08",
      submissions: 156,
      graded: 120,
      averageScore: 79,
      status: "Grading"
    }
  ],
  recentSubmissions: [
    {
      id: 1,
      studentName: "Alice Johnson",
      assignment: "Linear Equations Practice",
      course: "Algebra Basics",
      submittedAt: "2024-01-27 14:30",
      score: 95,
      status: "Graded"
    },
    {
      id: 2,
      studentName: "Bob Smith",
      assignment: "Derivatives Quiz",
      course: "Calculus Fundamentals",
      submittedAt: "2024-01-27 13:45",
      score: null,
      status: "Pending"
    },
    {
      id: 3,
      studentName: "Carol Davis",
      assignment: "Geometry Proofs Assignment",
      course: "Geometry Advanced",
      submittedAt: "2024-01-27 12:20",
      score: 88,
      status: "Graded"
    }
  ]
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

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

  const { overview, studentGrowth, coursePerformance, students, courses, assignments, recentSubmissions } = mockDashboardData;

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your courses, students, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => router.push("/teacher/courses")}>
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{overview.newEnrollments} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter(c => c.status === "Published").length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Assignments to grade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Student Growth</CardTitle>
                <CardDescription>Monthly enrollment and student growth</CardDescription>
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
                      dataKey="enrollments" 
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

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Latest assignment submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {submission.studentName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{submission.studentName}</p>
                        <p className="text-sm text-muted-foreground">{submission.assignment}</p>
                        <p className="text-xs text-muted-foreground">{submission.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{submission.score || 'Pending'}</div>
                      <Badge variant={submission.status === "Graded" ? "default" : "secondary"}>
                        {submission.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => router.push("/teacher/assignments")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Assignment
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/teacher/quizzes")}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/teacher/courses")}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Upload Video Lesson
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push("/teacher/assignments")}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Grade Assignments
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setSelectedTab("students")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <Button onClick={() => alert("Add Student functionality - to be implemented")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>View and manage all students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{student.name}</h3>
                          <Badge variant="outline">{student.grade}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-sm text-muted-foreground">{student.phone}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">
                            {student.assignmentsSubmitted}/{student.totalAssignments} assignments
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Last active: {student.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-green-600">{student.progress}%</div>
                        <Progress value={student.progress} className="w-20 h-2 mt-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => alert(`View ${student.name} details`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => alert(`Send email to ${student.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => alert(`Edit ${student.name} profile`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Course Management</h2>
            <Button onClick={() => router.push("/teacher/courses")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>

          <div className="grid gap-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <Badge variant={course.status === "Published" ? "default" : "secondary"}>
                          {course.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {course.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.students} students
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {course.rating}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course.chapters} chapters
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${course.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold mb-1">{course.completion}%</div>
                      <Progress value={course.completion} className="w-24 h-2" />
                      <p className="text-sm text-muted-foreground mt-1">
                        Completion rate
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Last updated: {course.lastUpdated}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/teacher/courses/${course.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/teacher/courses/${course.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`View ${course.title} students`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Students
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Delete ${course.title}?`) && window.confirm("Are you sure?")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Assignment Management</h2>
            <Button onClick={() => router.push("/teacher/assignments")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>

          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <Badge variant={assignment.status === "Active" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base mb-3">
                        Course: {assignment.course}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {assignment.dueDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {assignment.submissions} submissions
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          {assignment.graded} graded
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Avg: {assignment.averageScore}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold mb-1">
                        {Math.round((assignment.graded / assignment.submissions) * 100)}%
                      </div>
                      <Progress 
                        value={(assignment.graded / assignment.submissions) * 100} 
                        className="w-24 h-2" 
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Graded
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {assignment.submissions - assignment.graded} pending grading
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push("/teacher/assignments")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Submissions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push("/teacher/assignments")}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Grade
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push("/teacher/assignments")}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Delete ${assignment.title}?`) && window.confirm("Are you sure?")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Creation Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Content Creation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Lesson
                </CardTitle>
                <CardDescription>Create video-based lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload video content with transcripts and notes
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/courses")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Video Lesson
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Text Lesson
                </CardTitle>
                <CardDescription>Create rich text lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Write lessons with rich formatting and media
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/courses")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Text Lesson
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5" />
                  Assignment
                </CardTitle>
                <CardDescription>Create assignments and projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Design assignments with rubrics and due dates
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/assignments")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Quiz
                </CardTitle>
                <CardDescription>Create interactive quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Build quizzes with multiple choice and open questions
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/quizzes")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Interactive Content
                </CardTitle>
                <CardDescription>Create interactive learning materials</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Build interactive diagrams and simulations
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/courses")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Interactive
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Resources
                </CardTitle>
                <CardDescription>Upload files and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload PDFs, documents, and other resources
                </p>
                <Button 
                  className="w-full"
                  onClick={() => router.push("/teacher/courses")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quiz Creation Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Quiz Management</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Quiz Creation */}
            <Card>
              <CardHeader>
                <CardTitle>Create Quiz Manually</CardTitle>
                <CardDescription>Build quizzes by adding questions one by one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quiz-title">Quiz Title</Label>
                  <Input id="quiz-title" placeholder="Enter quiz title" />
                </div>
                <div>
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea id="quiz-description" placeholder="Enter quiz description" />
                </div>
                <div>
                  <Label htmlFor="quiz-course">Course</Label>
                  <select id="quiz-course" className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                  <Input id="quiz-time" type="number" placeholder="30" />
                </div>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Creating Questions
                </Button>
              </CardContent>
            </Card>

            {/* PDF Import */}
            <Card>
              <CardHeader>
                <CardTitle>Import from PDF</CardTitle>
                <CardDescription>Upload a PDF and extract questions automatically</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload PDF</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your PDF file here or click to browse
                  </p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Supported formats:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>PDF files with text content</li>
                    <li>Multiple choice questions (A, B, C, D)</li>
                    <li>Numbered questions</li>
                    <li>Clear answer indicators</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Existing Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Existing Quizzes</CardTitle>
              <CardDescription>Manage your published and draft quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "Algebra Basics Quiz", course: "Algebra Basics", questions: 15, attempts: 234, status: "Published" },
                  { title: "Calculus Derivatives Quiz", course: "Calculus Fundamentals", questions: 20, attempts: 189, status: "Draft" },
                  { title: "Geometry Proofs Quiz", course: "Geometry Advanced", questions: 12, attempts: 156, status: "Published" }
                ].map((quiz, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{quiz.title}</h3>
                        <Badge variant={quiz.status === "Published" ? "default" : "secondary"}>
                          {quiz.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{quiz.course}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{quiz.questions} questions</span>
                        <span>{quiz.attempts} attempts</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
