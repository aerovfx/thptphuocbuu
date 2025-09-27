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
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  FileText, 
  Clock,
  Users,
  ClipboardCheck,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Mail,
  FileEdit,
  Target,
  BookOpen
} from "lucide-react";

// Mock data - replace with real API calls
const mockAssignments = [
  {
    id: 1,
    title: "Linear Equations Practice",
    description: "Solve the following linear equations and show your work step by step.",
    course: "Algebra Basics",
    courseId: "algebra-basics",
    dueDate: "2024-02-01",
    createdAt: "2024-01-20",
    points: 100,
    status: "Published",
    submissions: [
      {
        id: 1,
        studentId: "alice.johnson@student.test",
        studentName: "Alice Johnson",
        submittedAt: "2024-01-27 14:30",
        score: 95,
        status: "Graded",
        feedback: "Excellent work! Great understanding of linear equations.",
        attachments: ["assignment1.pdf", "work.pdf"]
      },
      {
        id: 2,
        studentId: "bob.smith@student.test", 
        studentName: "Bob Smith",
        submittedAt: "2024-01-27 13:45",
        score: null,
        status: "Submitted",
        feedback: null,
        attachments: ["homework.pdf"]
      },
      {
        id: 3,
        studentId: "carol.davis@student.test",
        studentName: "Carol Davis", 
        submittedAt: "2024-01-27 12:20",
        score: 88,
        status: "Graded",
        feedback: "Good work, but check your arithmetic in problem 3.",
        attachments: ["math_homework.pdf"]
      }
    ],
    totalStudents: 25,
    instructions: "Please solve all problems showing your work. Submit as PDF."
  },
  {
    id: 2,
    title: "Calculus Derivatives Quiz",
    description: "Find the derivatives of the following functions using the appropriate rules.",
    course: "Calculus Fundamentals",
    courseId: "calculus-fundamentals", 
    dueDate: "2024-02-05",
    createdAt: "2024-01-22",
    points: 50,
    status: "Published",
    submissions: [
      {
        id: 4,
        studentId: "alice.johnson@student.test",
        studentName: "Alice Johnson",
        submittedAt: "2024-01-28 10:15",
        score: 98,
        status: "Graded",
        feedback: "Perfect! Excellent application of derivative rules.",
        attachments: ["derivatives_quiz.pdf"]
      },
      {
        id: 5,
        studentId: "david.wilson@student.test",
        studentName: "David Wilson",
        submittedAt: "2024-01-28 09:30",
        score: null,
        status: "Submitted",
        feedback: null,
        attachments: ["quiz_answers.pdf"]
      }
    ],
    totalStudents: 18,
    instructions: "Show all work for partial credit. Use proper notation."
  },
  {
    id: 3,
    title: "Geometry Proofs Assignment",
    description: "Prove the following geometric theorems using two-column proofs.",
    course: "Geometry Advanced",
    courseId: "geometry-advanced",
    dueDate: "2024-02-08",
    createdAt: "2024-01-25",
    points: 75,
    status: "Draft",
    submissions: [],
    totalStudents: 12,
    instructions: "Use proper geometric notation and logical reasoning."
  }
];

const mockCourses = [
  { id: "algebra-basics", title: "Algebra Basics" },
  { id: "calculus-fundamentals", title: "Calculus Fundamentals" },
  { id: "geometry-advanced", title: "Geometry Advanced" },
  { id: "statistics-intro", title: "Statistics Intro" },
];

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState(mockAssignments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    courseId: "",
    dueDate: "",
    points: 100,
    instructions: ""
  });

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

  const handleCreateAssignment = () => {
    const assignment = {
      id: assignments.length + 1,
      ...newAssignment,
      course: mockCourses.find(c => c.id === newAssignment.courseId)?.title || "",
      createdAt: new Date().toISOString().split('T')[0],
      status: "Draft",
      submissions: [],
      totalStudents: 0
    };
    
    setAssignments([...assignments, assignment]);
    setNewAssignment({
      title: "",
      description: "",
      courseId: "",
      dueDate: "",
      points: 100,
      instructions: ""
    });
    setIsCreateDialogOpen(false);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === "all") return matchesSearch;
    if (selectedTab === "published") return matchesSearch && assignment.status === "Published";
    if (selectedTab === "draft") return matchesSearch && assignment.status === "Draft";
    if (selectedTab === "grading") return matchesSearch && assignment.submissions.some(s => s.status === "Submitted");
    
    return matchesSearch;
  });

  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
  const totalGraded = assignments.reduce((sum, a) => sum + a.submissions.filter(s => s.status === "Graded").length, 0);
  const pendingGrading = assignments.reduce((sum, a) => sum + a.submissions.filter(s => s.status === "Submitted").length, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Management</h1>
          <p className="text-muted-foreground">Create, manage, and grade student assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Create a new assignment for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  placeholder="Enter assignment title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  placeholder="Enter assignment description"
                />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <select
                  id="course"
                  value={newAssignment.courseId}
                  onChange={(e) => setNewAssignment({...newAssignment, courseId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a course</option>
                  {mockCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newAssignment.points}
                    onChange={(e) => setNewAssignment({...newAssignment, points: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})}
                  placeholder="Enter detailed instructions for students"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAssignment}>
                  Create Assignment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => a.status === "Published").length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Across all assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGraded}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalGraded / totalSubmissions) * 100) || 0}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGrading}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Management Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Assignments</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="grading">Needs Grading</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search assignments..."
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
        </div>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="space-y-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <Badge variant={assignment.status === "Published" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {assignment.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {assignment.course}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {assignment.dueDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {assignment.points} points
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {assignment.submissions.length}/{assignment.totalStudents} submitted
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold mb-1">
                        {assignment.totalStudents > 0 
                          ? Math.round((assignment.submissions.length / assignment.totalStudents) * 100)
                          : 0}%
                      </div>
                      <Progress 
                        value={assignment.totalStudents > 0 
                          ? (assignment.submissions.length / assignment.totalStudents) * 100
                          : 0
                        } 
                        className="w-24 h-2" 
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Submission rate
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Submissions List */}
                  {assignment.submissions.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <h4 className="font-medium">Recent Submissions</h4>
                      {assignment.submissions.slice(0, 3).map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {submission.studentName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{submission.studentName}</p>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {submission.submittedAt}
                              </p>
                              {submission.attachments && (
                                <p className="text-xs text-blue-600">
                                  {submission.attachments.length} file(s)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {submission.score !== null ? (
                              <div className="text-right">
                                <div className="font-bold text-green-600">{submission.score}%</div>
                                <Badge variant="default" className="text-xs">Graded</Badge>
                              </div>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {assignment.submissions.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{assignment.submissions.length - 3} more submissions
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Created: {assignment.createdAt}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                      <Button variant="outline" size="sm">
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Grade
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredAssignments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm ? "Try adjusting your search criteria" : "Create your first assignment to get started"}
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
