"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle, 
  Calendar, 
  Star, 
  Download,
  FileText,
  Video,
  Award,
  Users
} from "lucide-react";

// Mock data - replace with real API calls
const mockEnrolledCourses = [
  {
    id: 1,
    title: "Algebra Basics",
    description: "Learn the fundamentals of algebra including equations, inequalities, and functions.",
    instructor: "Dr. Sarah Johnson",
    thumbnail: "/api/placeholder/300/200",
    progress: 80,
    totalChapters: 12,
    completedChapters: 10,
    totalDuration: "8 hours",
    timeSpent: "6.5 hours",
    lastAccessed: "2 hours ago",
    status: "In Progress",
    rating: 4.8,
    enrolledStudents: 1250,
    price: 0,
    assignments: [
      { id: 1, title: "Linear Equations Practice", status: "Completed", dueDate: "2024-01-20", score: 95 },
      { id: 2, title: "Quadratic Functions Quiz", status: "Completed", dueDate: "2024-01-25", score: 88 },
      { id: 3, title: "Final Project", status: "Pending", dueDate: "2024-02-01", score: null },
    ],
    chapters: [
      { id: 1, title: "Introduction to Algebra", duration: "30 min", completed: true },
      { id: 2, title: "Linear Equations", duration: "45 min", completed: true },
      { id: 3, title: "Quadratic Equations", duration: "50 min", completed: true },
      { id: 4, title: "Polynomials", duration: "40 min", completed: false },
      { id: 5, title: "Factoring", duration: "35 min", completed: false },
    ],
    certificates: [],
  },
  {
    id: 2,
    title: "Calculus Fundamentals",
    description: "Master the basics of calculus including limits, derivatives, and integrals.",
    instructor: "Prof. Michael Chen",
    thumbnail: "/api/placeholder/300/200",
    progress: 100,
    totalChapters: 15,
    completedChapters: 15,
    totalDuration: "12 hours",
    timeSpent: "11.5 hours",
    lastAccessed: "1 day ago",
    status: "Completed",
    rating: 4.9,
    enrolledStudents: 890,
    price: 49.99,
    assignments: [
      { id: 1, title: "Limits and Continuity", status: "Completed", dueDate: "2024-01-15", score: 92 },
      { id: 2, title: "Derivatives Quiz", status: "Completed", dueDate: "2024-01-22", score: 96 },
      { id: 3, title: "Integration Project", status: "Completed", dueDate: "2024-01-30", score: 94 },
    ],
    chapters: [
      { id: 1, title: "Introduction to Calculus", duration: "45 min", completed: true },
      { id: 2, title: "Limits", duration: "60 min", completed: true },
      { id: 3, title: "Derivatives", duration: "75 min", completed: true },
      { id: 4, title: "Integration", duration: "80 min", completed: true },
      { id: 5, title: "Applications", duration: "65 min", completed: true },
    ],
    certificates: [
      { id: 1, name: "Calculus Fundamentals Certificate", issuedDate: "2024-01-30", downloadUrl: "/api/certificates/1" }
    ],
  },
  {
    id: 3,
    title: "Geometry Advanced",
    description: "Advanced topics in geometry including proofs, transformations, and coordinate geometry.",
    instructor: "Dr. Emily Rodriguez",
    thumbnail: "/api/placeholder/300/200",
    progress: 45,
    totalChapters: 10,
    completedChapters: 5,
    totalDuration: "6 hours",
    timeSpent: "2.7 hours",
    lastAccessed: "3 days ago",
    status: "In Progress",
    rating: 4.6,
    enrolledStudents: 650,
    price: 29.99,
    assignments: [
      { id: 1, title: "Triangle Properties", status: "Completed", dueDate: "2024-01-18", score: 87 },
      { id: 2, title: "Circle Theorems", status: "Pending", dueDate: "2024-01-28", score: null },
      { id: 3, title: "Transformations Quiz", status: "Not Started", dueDate: "2024-02-05", score: null },
    ],
    chapters: [
      { id: 1, title: "Advanced Triangles", duration: "40 min", completed: true },
      { id: 2, title: "Circle Properties", duration: "35 min", completed: true },
      { id: 3, title: "Polygons", duration: "30 min", completed: true },
      { id: 4, title: "Transformations", duration: "45 min", completed: false },
      { id: 5, title: "Coordinate Geometry", duration: "50 min", completed: false },
    ],
    certificates: [],
  },
];

export default function MyCoursesPage() {
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

  const totalCourses = mockEnrolledCourses.length;
  const completedCourses = mockEnrolledCourses.filter(c => c.status === "Completed").length;
  const inProgressCourses = mockEnrolledCourses.filter(c => c.status === "In Progress").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalCourses}</div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{completedCourses}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{inProgressCourses}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="space-y-6">
        {mockEnrolledCourses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <Badge variant={course.status === "Completed" ? "default" : "secondary"}>
                      {course.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-base mb-3">
                    {course.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.instructor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {course.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.enrolledStudents} students
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.timeSpent} / {course.totalDuration}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">{course.progress}%</div>
                  <Progress value={course.progress} className="w-24 h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.completedChapters}/{course.totalChapters} chapters
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Course Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-3" />
              </div>

              {/* Chapters */}
              <div>
                <h4 className="font-medium mb-2">Chapters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {course.chapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        chapter.completed 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {chapter.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Play className="h-4 w-4 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{chapter.title}</p>
                        <p className="text-xs text-muted-foreground">{chapter.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignments */}
              <div>
                <h4 className="font-medium mb-2">Assignments</h4>
                <div className="space-y-2">
                  {course.assignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {assignment.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.score !== null ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {assignment.score}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {assignment.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificates */}
              {course.certificates.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Certificates</h4>
                  <div className="space-y-2">
                    {course.certificates.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-yellow-600" />
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Issued: {cert.issuedDate}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last accessed: {course.lastAccessed}
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/courses`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/learning`}>
                    <Button size="sm">
                      Continue Learning
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mockEnrolledCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start your learning journey by enrolling in courses
            </p>
            <Button onClick={() => router.push("/search")}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


