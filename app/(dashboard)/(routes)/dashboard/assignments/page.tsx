"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  FileText, 
  Clock,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Eye,
  Send,
  BookOpen,
  Target,
  Award,
  FileEdit
} from "lucide-react";

// Mock data - replace with real API calls
const mockStudentAssignments = [
  {
    id: 1,
    title: "Linear Equations Practice",
    description: "Solve the following linear equations and show your work step by step.",
    course: "Algebra Basics",
    dueDate: "2024-02-01",
    points: 100,
    status: "Assigned",
    instructions: "Please solve all problems showing your work. Submit as PDF.",
    submission: {
      id: 1,
      submittedAt: null,
      score: null,
      status: "Not Submitted",
      feedback: null,
      attachments: []
    },
    timeLeft: "4 days left"
  },
  {
    id: 2,
    title: "Calculus Derivatives Quiz",
    description: "Find the derivatives of the following functions using the appropriate rules.",
    course: "Calculus Fundamentals",
    dueDate: "2024-02-05",
    points: 50,
    status: "Submitted",
    instructions: "Show all work for partial credit. Use proper notation.",
    submission: {
      id: 2,
      submittedAt: "2024-01-28 10:15",
      score: 98,
      status: "Graded",
      feedback: "Perfect! Excellent application of derivative rules.",
      attachments: ["derivatives_quiz.pdf"]
    },
    timeLeft: "8 days left"
  },
  {
    id: 3,
    title: "Geometry Proofs Assignment",
    description: "Prove the following geometric theorems using two-column proofs.",
    course: "Geometry Advanced",
    dueDate: "2024-02-08",
    points: 75,
    status: "Submitted",
    instructions: "Use proper geometric notation and logical reasoning.",
    submission: {
      id: 3,
      submittedAt: "2024-01-29 14:30",
      score: null,
      status: "Submitted",
      feedback: null,
      attachments: ["proofs_assignment.pdf"]
    },
    timeLeft: "11 days left"
  },
  {
    id: 4,
    title: "Statistics Project",
    description: "Analyze the given dataset and create a comprehensive statistical report.",
    course: "Statistics Intro",
    dueDate: "2024-02-15",
    points: 150,
    status: "Assigned",
    instructions: "Include descriptive statistics, hypothesis testing, and visualizations.",
    submission: {
      id: null,
      submittedAt: null,
      score: null,
      status: "Not Submitted",
      feedback: null,
      attachments: []
    },
    timeLeft: "18 days left"
  }
];

export default function StudentAssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState(mockStudentAssignments);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/sign-in");
      return;
    }

    if (session.user.role !== "STUDENT") {
      router.push("/teacher/dashboard");
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

  const handleSubmitAssignment = (assignmentId: number) => {
    if (!assignmentId) return;
    
    setAssignments(assignments.map(assignment => 
      assignment.id === assignmentId 
        ? {
            ...assignment,
            status: "Submitted",
            submission: {
              id: Date.now(),
              submittedAt: new Date().toISOString(),
              score: null,
              status: "Submitted",
              feedback: null,
              attachments: uploadedFiles
            }
          }
        : assignment
    ));
    
    // Close dialog and reset state
    setIsSubmitDialogOpen(false);
    setSubmissionText("");
    setUploadedFiles([]);
    setSelectedAssignment(null);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (selectedTab === "all") return true;
    if (selectedTab === "assigned") return assignment.status === "Assigned";
    if (selectedTab === "submitted") return assignment.status === "Submitted";
    if (selectedTab === "graded") return assignment.submission.status === "Graded";
    
    return true;
  });

  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(a => a.status === "Submitted").length;
  const gradedCount = assignments.filter(a => a.submission.status === "Graded").length;
  const averageScore = assignments
    .filter(a => a.submission.score !== null)
    .reduce((sum, a) => sum + (a.submission.score || 0), 0) / 
    assignments.filter(a => a.submission.score !== null).length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">View and submit your course assignments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {submittedCount} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((gradedCount / totalAssignments) * 100) || 0}% completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Across graded assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments - submittedCount}</div>
            <p className="text-xs text-muted-foreground">
              Not yet submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          <div className="space-y-6">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <Badge variant={
                          assignment.status === "Assigned" ? "secondary" :
                          assignment.submission.status === "Graded" ? "default" :
                          "outline"
                        }>
                          {assignment.status === "Assigned" ? "Assigned" :
                           assignment.submission.status === "Graded" ? "Graded" :
                           "Submitted"}
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
                          <Clock className="h-4 w-4" />
                          {assignment.timeLeft}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {assignment.submission.score !== null ? (
                        <div className="text-2xl font-bold text-green-600">
                          {assignment.submission.score}%
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-600">
                          --
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {assignment.submission.status}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Instructions */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                    <p className="text-sm text-blue-800">{assignment.instructions}</p>
                  </div>

                  {/* Submission Status */}
                  {assignment.submission.status === "Graded" && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Feedback</h4>
                      <p className="text-sm text-green-800">{assignment.submission.feedback}</p>
                      {assignment.submission.attachments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-900 mb-1">Submitted Files:</p>
                          <div className="flex gap-2">
                            {assignment.submission.attachments.map((file, index) => (
                              <Button key={index} variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                {file}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {assignment.submission.submittedAt && (
                        `Submitted: ${new Date(assignment.submission.submittedAt).toLocaleDateString()}`
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/courses`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      
                      {assignment.status === "Assigned" && (
                        <Dialog open={isSubmitDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                          if (open) {
                            setSelectedAssignment(assignment);
                            setIsSubmitDialogOpen(true);
                          } else {
                            setSelectedAssignment(null);
                            setIsSubmitDialogOpen(false);
                            setSubmissionText("");
                            setUploadedFiles([]);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setIsSubmitDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
                              <DialogDescription>
                                Upload your assignment files and add any additional comments
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Assignment Instructions
                                </label>
                                <div className="p-3 bg-gray-50 border rounded-lg">
                                  <p className="text-sm text-gray-700">{selectedAssignment?.instructions}</p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Additional Comments (Optional)
                                </label>
                                <Textarea
                                  value={submissionText}
                                  onChange={(e) => setSubmissionText(e.target.value)}
                                  placeholder="Add any additional comments or explanations..."
                                  rows={4}
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Upload Files
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <h3 className="text-lg font-semibold mb-2">Upload Assignment Files</h3>
                                  <p className="text-muted-foreground mb-4">
                                    Drag and drop your files here or click to browse
                                  </p>
                                  <Button variant="outline">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose Files
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAssignment(null);
                                    setIsSubmitDialogOpen(false);
                                    setSubmissionText("");
                                    setUploadedFiles([]);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={() => handleSubmitAssignment(selectedAssignment?.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit Assignment
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {assignment.submission.status === "Submitted" && (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submitted
                        </Button>
                      )}
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
                    {selectedTab === "all" ? "You don't have any assignments yet" :
                     selectedTab === "assigned" ? "No pending assignments" :
                     selectedTab === "submitted" ? "No submitted assignments" :
                     "No graded assignments"}
                  </p>
                  <Button variant="outline" onClick={() => router.push("/dashboard/courses")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View My Courses
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
