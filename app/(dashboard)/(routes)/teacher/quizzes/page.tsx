"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  BarChart3,
  CheckCircle,
  XCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  FileJson,
  HelpCircle
} from "lucide-react";

// Mock data - replace with real API calls
const mockQuizzes = [
  {
    id: 1,
    title: "Algebra Basics Quiz",
    description: "Test your understanding of basic algebra concepts",
    courseId: "algebra-basics",
    courseTitle: "Algebra Basics",
    categoryId: "toan-10",
    categoryName: "Toán 10",
    totalQuestions: 15,
    timeLimit: 30,
    totalAttempts: 234,
    averageScore: 87,
    createdAt: "2024-01-15",
    status: "Published",
    questions: [
      {
        id: 1,
        question: "What is the value of x in the equation 2x + 5 = 13?",
        type: "multiple-choice",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        points: 2
      },
      {
        id: 2,
        question: "Solve for y: 3y - 7 = 14",
        type: "multiple-choice",
        options: ["5", "6", "7", "8"],
        correctAnswer: "7",
        points: 2
      }
    ]
  },
  {
    id: 2,
    title: "Calculus Derivatives Quiz",
    description: "Test your knowledge of derivative concepts",
    courseId: "calculus-fundamentals",
    courseTitle: "Calculus Fundamentals",
    categoryId: "toan-11",
    categoryName: "Toán 11",
    totalQuestions: 20,
    timeLimit: 45,
    totalAttempts: 189,
    averageScore: 82,
    createdAt: "2024-01-20",
    status: "Draft",
    questions: [
      {
        id: 1,
        question: "What is the derivative of x²?",
        type: "multiple-choice",
        options: ["x", "2x", "x²", "2x²"],
        correctAnswer: 1,
        points: 3,
        explanation: "Using the power rule: d/dx(x²) = 2x"
      },
      {
        id: 2,
        question: "What is the derivative of sin(x)?",
        type: "multiple-choice",
        options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correctAnswer: 0,
        points: 2,
        explanation: "The derivative of sin(x) is cos(x)"
      }
    ]
  },
  {
    id: 3,
    title: "Quiz Chapter 1 - Đại số",
    description: "Kiểm tra kiến thức đại số cơ bản",
    courseId: "chapter-based",
    courseTitle: "Chapter-based Quiz",
    categoryId: "toan-10",
    categoryName: "Toán 10",
    totalQuestions: 1,
    timeLimit: 15,
    totalAttempts: 0,
    averageScore: 0,
    createdAt: "2024-01-20",
    status: "Draft",
    questions: [
      {
        id: 1,
        question: "Giải phương trình: 2x + 3 = 7",
        type: "multiple-choice",
        options: ["x = 1", "x = 2", "x = 3", "x = 4"],
        correctAnswer: 1,
        points: 2
      }
    ]
  }
];

const mockCourses = [
  { id: "algebra-basics", title: "Algebra Basics" },
  { id: "calculus-fundamentals", title: "Calculus Fundamentals" },
  { id: "geometry-advanced", title: "Geometry Advanced" },
  { id: "statistics-intro", title: "Statistics Intro" },
];

// Knowledge Categories
const mockCategories = [
  { id: "toan-10", name: "Toán 10" },
  { id: "toan-11", name: "Toán 11" },
];

export default function QuizzesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState(mockQuizzes);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    courseId: "",
    timeLimit: 30,
    questions: []
  });
  
  // Question creation state
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
    explanation: ""
  });
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [importType, setImportType] = useState("json"); // json or pdf
  
  // PDF import state
  const [isPdfImportDialogOpen, setIsPdfImportDialogOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [pdfQuestions, setPdfQuestions] = useState([]);
  
  // Edit quiz state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

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

  const handleCreateQuiz = () => {
    const quiz = {
      id: quizzes.length + 1,
      ...newQuiz,
      totalQuestions: newQuiz.questions.length,
      totalAttempts: 0,
      averageScore: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: "Draft"
    };
    
    setQuizzes([...quizzes, quiz]);
    setNewQuiz({
      title: "",
      description: "",
      courseId: "",
      timeLimit: 30,
      questions: []
    });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteQuiz = (id: number) => {
    setQuizzes(quizzes.filter(quiz => quiz.id !== id));
  };

  const handleToggleStatus = (id: number) => {
    setQuizzes(quizzes.map(quiz => 
      quiz.id === id 
        ? { ...quiz, status: quiz.status === "Published" ? "Draft" : "Published" }
        : quiz
    ));
  };

  // Question management functions
  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleAddQuestion = () => {
    if (!selectedQuiz) return;
    
    const newQuestion = {
      id: selectedQuiz.questions.length + 1,
      ...currentQuestion
    };
    
    setQuizzes(quizzes.map(quiz => 
      quiz.id === selectedQuiz.id 
        ? { 
            ...quiz, 
            questions: [...quiz.questions, newQuestion],
            totalQuestions: quiz.questions.length + 1
          }
        : quiz
    ));
    
    setCurrentQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
      explanation: ""
    });
  };

  const handleEditQuestion = (questionIndex) => {
    const question = selectedQuiz.questions[questionIndex];
    setCurrentQuestion({
      question: question.question,
      type: question.type,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      points: question.points,
      explanation: question.explanation || ""
    });
    setIsEditingQuestion(true);
    setEditingQuestionIndex(questionIndex);
  };

  const handleUpdateQuestion = () => {
    if (!selectedQuiz || editingQuestionIndex === -1) return;
    
    const updatedQuestion = {
      id: selectedQuiz.questions[editingQuestionIndex].id,
      ...currentQuestion
    };
    
    setQuizzes(quizzes.map(quiz => 
      quiz.id === selectedQuiz.id 
        ? { 
            ...quiz, 
            questions: quiz.questions.map((q, index) => 
              index === editingQuestionIndex ? updatedQuestion : q
            )
          }
        : quiz
    ));
    
    setIsEditingQuestion(false);
    setEditingQuestionIndex(-1);
    setCurrentQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
      explanation: ""
    });
  };

  const handleDeleteQuestion = (questionIndex) => {
    if (!selectedQuiz) return;
    
    setQuizzes(quizzes.map(quiz => 
      quiz.id === selectedQuiz.id 
        ? { 
            ...quiz, 
            questions: quiz.questions.filter((_, index) => index !== questionIndex),
            totalQuestions: quiz.questions.length - 1
          }
        : quiz
    ));
  };

  const handleImportFromJSON = () => {
    try {
      const parsedData = JSON.parse(importData);
      if (!Array.isArray(parsedData)) {
        alert("JSON must be an array of questions");
        return;
      }
      
      if (!selectedQuiz) {
        alert("Please select a quiz first");
        return;
      }
      
      const importedQuestions = parsedData.map((q, index) => ({
        id: selectedQuiz.questions.length + index + 1,
        question: q.question || q.text || "",
        type: q.type || "multiple-choice",
        options: q.options || q.choices || ["", "", "", ""],
        correctAnswer: q.correctAnswer || q.answer || 0,
        points: q.points || q.score || 1,
        explanation: q.explanation || ""
      }));
      
      setQuizzes(quizzes.map(quiz => 
        quiz.id === selectedQuiz.id 
          ? { 
              ...quiz, 
              questions: [...quiz.questions, ...importedQuestions],
              totalQuestions: quiz.questions.length + importedQuestions.length
            }
          : quiz
      ));
      
      setImportData("");
      setIsImportDialogOpen(false);
      alert(`Successfully imported ${importedQuestions.length} questions!`);
      
    } catch (error) {
      alert("Invalid JSON format. Please check your data.");
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target.result);
      };
      reader.readAsText(file);
    } else {
      alert("Please select a JSON file");
    }
  };

  // Edit quiz functions
  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    
    setQuizzes(quizzes.map(quiz => 
      quiz.id === editingQuiz.id 
        ? { ...editingQuiz }
        : quiz
    ));
    
    setIsEditDialogOpen(false);
    setEditingQuiz(null);
  };

  const handlePreviewQuiz = (quiz) => {
    // For now, show an alert with quiz details
    const questionsText = quiz.questions.length > 0 
      ? `\n\nQuestions:\n${quiz.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}`
      : '\n\nNo questions added yet.';
    
    alert(`Quiz Preview: ${quiz.title}\n\nDescription: ${quiz.description}\nTime Limit: ${quiz.timeLimit} minutes\nQuestions: ${quiz.questions.length}${questionsText}`);
  };

  // PDF import functions
  const handlePdfFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }
    
    setPdfFile(file);
    
    // Mock extracted questions for demo
    const mockExtractedQuestions = [
      {
        id: 1,
        question: "What is the capital of France?",
        options: ["London", "Paris", "Berlin", "Madrid"],
        correctAnswer: null, // Will be set by teacher
        points: 1
      },
      {
        id: 2,
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: null,
        points: 1
      },
      {
        id: 3,
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Jupiter", "Saturn", "Neptune"],
        correctAnswer: null,
        points: 2
      }
    ];
    
    setExtractedQuestions(mockExtractedQuestions);
    setPdfQuestions([...mockExtractedQuestions]);
    setIsPdfImportDialogOpen(true);
  };

  const handleAnswerSelection = (questionIndex, answerIndex) => {
    const updatedQuestions = [...pdfQuestions];
    updatedQuestions[questionIndex].correctAnswer = answerIndex;
    setPdfQuestions(updatedQuestions);
    
    // Debug log
    console.log(`Question ${questionIndex + 1}: Selected answer ${String.fromCharCode(65 + answerIndex)}`);
    console.log(`Total answered: ${updatedQuestions.filter(q => q.correctAnswer !== null).length}`);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < pdfQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleImportPdfQuestions = () => {
    if (!selectedQuiz) {
      alert("Please select a quiz first");
      return;
    }
    
    const validQuestions = pdfQuestions.filter(q => q.correctAnswer !== null);
    
    if (validQuestions.length === 0) {
      alert("Please select answers for at least one question");
      return;
    }
    
    const importedQuestions = validQuestions.map((q, index) => ({
      id: selectedQuiz.questions.length + index + 1,
      question: q.question,
      type: "multiple-choice",
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: ""
    }));
    
    setQuizzes(quizzes.map(quiz => 
      quiz.id === selectedQuiz.id 
        ? { 
            ...quiz, 
            questions: [...quiz.questions, ...importedQuestions],
            totalQuestions: quiz.questions.length + importedQuestions.length
          }
        : quiz
    ));
    
    // Reset state
    setIsPdfImportDialogOpen(false);
    setPdfFile(null);
    setExtractedQuestions([]);
    setPdfQuestions([]);
    setCurrentQuestionIndex(0);
    
    alert(`Successfully imported ${importedQuestions.length} questions!`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground">Create and manage quizzes for your courses</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Create a new quiz for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({...newQuiz, title: e.target.value})}
                  placeholder="Enter quiz title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({...newQuiz, description: e.target.value})}
                  placeholder="Enter quiz description"
                />
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <select
                  id="course"
                  value={newQuiz.courseId}
                  onChange={(e) => setNewQuiz({...newQuiz, courseId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a course</option>
                  {mockCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  value={newQuiz.timeLimit}
                  onChange={(e) => setNewQuiz({...newQuiz, timeLimit: parseInt(e.target.value)})}
                  min="1"
                  max="180"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuiz}>
                  Create Quiz
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Quiz Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Quiz</DialogTitle>
              <DialogDescription>
                Update quiz information
              </DialogDescription>
            </DialogHeader>
            {editingQuiz && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Quiz Title</Label>
                  <Input
                    id="edit-title"
                    value={editingQuiz.title}
                    onChange={(e) => setEditingQuiz({...editingQuiz, title: e.target.value})}
                    placeholder="Enter quiz title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingQuiz.description}
                    onChange={(e) => setEditingQuiz({...editingQuiz, description: e.target.value})}
                    placeholder="Enter quiz description"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-course">Course</Label>
                  <select
                    id="edit-course"
                    value={editingQuiz.courseId}
                    onChange={(e) => setEditingQuiz({...editingQuiz, courseId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a course</option>
                    {mockCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="edit-timeLimit"
                    type="number"
                    value={editingQuiz.timeLimit}
                    onChange={(e) => setEditingQuiz({...editingQuiz, timeLimit: parseInt(e.target.value)})}
                    min="1"
                    max="180"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuiz}>
                    Update Quiz
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* PDF Import Dialog - Simplified */}
        <Dialog open={isPdfImportDialogOpen} onOpenChange={setIsPdfImportDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Import Questions from PDF</DialogTitle>
              <DialogDescription>
                Review extracted questions and select correct answers
              </DialogDescription>
            </DialogHeader>
            
            {pdfQuestions.length > 0 ? (
              <div className="space-y-4">
                {/* Question Display */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">
                    Question {currentQuestionIndex + 1} of {pdfQuestions.length}
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-lg">{pdfQuestions[currentQuestionIndex]?.question}</p>
                  </div>
                  
                  {/* Answer Selection */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Select Correct Answer:</h4>
                    {pdfQuestions[currentQuestionIndex]?.options.map((option, index) => (
                      <button
                        key={index}
                        className={`w-full p-3 border-2 rounded-lg text-left ${
                          pdfQuestions[currentQuestionIndex]?.correctAnswer === index
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleAnswerSelection(currentQuestionIndex, index)}
                      >
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                        {pdfQuestions[currentQuestionIndex]?.correctAnswer === index && (
                          <span className="ml-2 text-green-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handlePrevQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === pdfQuestions.length - 1}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {pdfQuestions.filter(q => q.correctAnswer !== null).length} of {pdfQuestions.length} answered
                  </div>
                </div>

                {/* Import Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    {pdfQuestions.filter(q => q.correctAnswer !== null).length === 0 ? (
                      <span className="text-orange-600">
                        Please select answers for at least one question
                      </span>
                    ) : (
                      <span className="text-green-600">
                        Ready to import {pdfQuestions.filter(q => q.correctAnswer !== null).length} questions
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPdfImportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleImportPdfQuestions}
                      disabled={pdfQuestions.filter(q => q.correctAnswer !== null).length === 0}
                    >
                      Import Questions ({pdfQuestions.filter(q => q.correctAnswer !== null).length})
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No questions extracted from PDF</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-xs text-muted-foreground">
              {quizzes.filter(q => q.status === "Published").length} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.reduce((sum, q) => sum + q.totalAttempts, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all quizzes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.length > 0 
                ? Math.round(quizzes.reduce((sum, q) => sum + q.averageScore, 0) / quizzes.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Created</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizzes.reduce((sum, q) => sum + q.totalQuestions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total questions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Management Tabs */}
      <Tabs defaultValue="quizzes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quizzes">All Quizzes</TabsTrigger>
          <TabsTrigger value="create">Create Questions</TabsTrigger>
          <TabsTrigger value="import">Import from PDF</TabsTrigger>
        </TabsList>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Category:</span>
            <select
              onChange={(e) => {
                const category = e.target.value;
                // Filter logic would go here
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {mockCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>

        <TabsContent value="quizzes" className="space-y-4">
          <div className="grid gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{quiz.title}</CardTitle>
                        <Badge variant={quiz.status === "Published" ? "default" : "secondary"}>
                          {quiz.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-base mb-3">
                        {quiz.description}
                      </CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">{quiz.categoryName}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {quiz.totalQuestions} questions
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.timeLimit} minutes
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {quiz.totalAttempts} attempts
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {quiz.averageScore}% avg score
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {quiz.createdAt}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePreviewQuiz(quiz)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditQuiz(quiz)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleStatus(quiz.id)}
                      >
                        {quiz.status === "Published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteQuiz(quiz.id)}
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

        <TabsContent value="create" className="space-y-4">
          {!selectedQuiz ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Quiz to Edit</CardTitle>
                <CardDescription>
                  Choose a quiz to start adding or editing questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {quizzes.map((quiz) => (
                    <Card 
                      key={quiz.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectQuiz(quiz)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{quiz.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {quiz.totalQuestions} questions • {quiz.timeLimit} minutes
                            </p>
                          </div>
                          <Badge variant={quiz.status === "Published" ? "default" : "secondary"}>
                            {quiz.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Quiz Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedQuiz(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {selectedQuiz.title}
                      </CardTitle>
                      <CardDescription>
                        {selectedQuiz.description} • {selectedQuiz.totalQuestions} questions
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <FileJson className="h-4 w-4 mr-2" />
                            Import JSON
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Import Questions from JSON</DialogTitle>
                            <DialogDescription>
                              Paste your JSON data or upload a JSON file
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>JSON Data</Label>
                              <Textarea
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                                placeholder="Paste your JSON data here..."
                                rows={10}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div>
                              <Label>Or upload JSON file</Label>
                              <Input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                              />
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">JSON Format Example:</h4>
                              <pre className="text-xs text-blue-800 overflow-x-auto">
{`[
  {
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correctAnswer": 1,
    "points": 2,
    "explanation": "Basic addition"
  }
]`}
                              </pre>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleImportFromJSON}>
                                Import Questions
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Question Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isEditingQuestion ? "Edit Question" : "Add New Question"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Question Text</Label>
                      <Textarea
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                        placeholder="Enter your question..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label>Question Type</Label>
                      <select
                        value={currentQuestion.type}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                    </div>

                    {currentQuestion.type === "multiple-choice" && (
                      <div className="space-y-3">
                        <Label>Answer Options</Label>
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={currentQuestion.correctAnswer === index}
                              onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
                            />
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = e.target.value;
                                setCurrentQuestion({...currentQuestion, options: newOptions});
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {(currentQuestion.type === "true-false" || currentQuestion.type === "short-answer") && (
                      <div>
                        <Label>Correct Answer</Label>
                        {currentQuestion.type === "true-false" ? (
                          <select
                            value={currentQuestion.correctAnswer}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value={0}>True</option>
                            <option value={1}>False</option>
                          </select>
                        ) : (
                          <Input
                            value={currentQuestion.options[0] || ""}
                            onChange={(e) => setCurrentQuestion({...currentQuestion, options: [e.target.value]})}
                            placeholder="Enter correct answer..."
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={currentQuestion.points}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})}
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Explanation (Optional)</Label>
                      <Textarea
                        value={currentQuestion.explanation}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                        placeholder="Explain why this answer is correct..."
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      {isEditingQuestion ? (
                        <>
                          <Button onClick={handleUpdateQuestion}>
                            <Save className="h-4 w-4 mr-2" />
                            Update Question
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditingQuestion(false);
                              setEditingQuestionIndex(-1);
                              setCurrentQuestion({
                                question: "",
                                type: "multiple-choice",
                                options: ["", "", "", ""],
                                correctAnswer: 0,
                                points: 1,
                                explanation: ""
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={handleAddQuestion}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Questions List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Questions ({selectedQuiz.questions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedQuiz.questions.length === 0 ? (
                      <div className="text-center py-8">
                        <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No questions yet. Add your first question!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedQuiz.questions.map((question, index) => (
                          <div key={question.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium mb-2">
                                  {index + 1}. {question.question}
                                </h4>
                                {question.type === "multiple-choice" && (
                                  <div className="space-y-1">
                                    {question.options.map((option, optIndex) => (
                                      <div key={optIndex} className="flex items-center gap-2 text-sm">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                          optIndex === question.correctAnswer 
                                            ? "bg-green-100 text-green-600" 
                                            : "bg-gray-100 text-gray-600"
                                        }`}>
                                          {String.fromCharCode(65 + optIndex)}
                                        </span>
                                        <span className={optIndex === question.correctAnswer ? "font-medium text-green-600" : ""}>
                                          {option}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{question.points} points</span>
                                  <span>{question.type}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditQuestion(index)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          {!selectedQuiz ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Quiz for PDF Import</CardTitle>
                <CardDescription>
                  Choose a quiz to import PDF questions into
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {quizzes.map((quiz) => (
                    <Card 
                      key={quiz.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectQuiz(quiz)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{quiz.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {quiz.totalQuestions} questions • {quiz.timeLimit} minutes
                            </p>
                          </div>
                          <Badge variant={quiz.status === "Published" ? "default" : "secondary"}>
                            {quiz.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Quiz Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedQuiz(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        Import PDF Questions - {selectedQuiz.title}
                      </CardTitle>
                      <CardDescription>
                        Upload PDF and set correct answers for each question
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload PDF File</CardTitle>
                  <CardDescription>
                    Upload a PDF file containing multiple choice questions (without answers)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload PDF</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a PDF file with multiple choice questions
                    </p>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfFileUpload}
                      className="max-w-xs mx-auto"
                    />
                    {pdfFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {pdfFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">PDF Requirements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• PDF with text content (not scanned images)</li>
                          <li>• Multiple choice questions (A, B, C, D)</li>
                          <li>• Questions WITHOUT correct answers marked</li>
                          <li>• Clear question numbering</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Import Process</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>1. Upload PDF file</li>
                          <li>2. Review extracted questions</li>
                          <li>3. Select correct answers (A, B, C, D)</li>
                          <li>4. Import to your quiz</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


