"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileText, 
  HelpCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  FileJson,
  Upload
} from "lucide-react";

interface ChapterQuizFormProps {
  initialData: any;
  courseId: string;
  chapterId: string;
}

// Mock data for categories
const mockCategories = [
  { id: "toan-10", name: "Toán 10" },
  { id: "toan-11", name: "Toán 11" },
];

export const ChapterQuizForm = ({
  initialData,
  courseId,
  chapterId
}: ChapterQuizFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chapterQuizzes, setChapterQuizzes] = useState([
    {
      id: 1,
      title: "Quiz Chapter 1 - Đại số",
      description: "Kiểm tra kiến thức đại số cơ bản",
      categoryId: "toan-10",
      categoryName: "Toán 10",
      questions: [
        {
          id: 1,
          question: "Giải phương trình: 2x + 3 = 7",
          options: ["x = 1", "x = 2", "x = 3", "x = 4"],
          correctAnswer: 1,
          points: 2
        }
      ],
      totalQuestions: 1,
      timeLimit: 15,
      createdAt: "2024-01-20"
    }
  ]);

  // Quiz creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    categoryId: "",
    timeLimit: 15,
    questions: []
  });

  // Question creation state
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
    explanation: ""
  });

  const handleCreateQuiz = () => {
    const quiz = {
      id: chapterQuizzes.length + 1,
      ...newQuiz,
      categoryName: mockCategories.find(c => c.id === newQuiz.categoryId)?.name || "",
      totalQuestions: newQuiz.questions.length,
      createdAt: new Date().toISOString().split('T')[0],
      questions: newQuiz.questions
    };
    
    setChapterQuizzes([...chapterQuizzes, quiz]);
    setNewQuiz({
      title: "",
      description: "",
      categoryId: "",
      timeLimit: 15,
      questions: []
    });
    setIsCreateDialogOpen(false);
    toast.success("Quiz created successfully!");
  };

  const handleAddQuestion = () => {
    if (!selectedQuiz) return;
    
    const newQuestion = {
      id: (selectedQuiz.questions?.length || 0) + 1,
      ...currentQuestion
    };
    
    setChapterQuizzes(chapterQuizzes.map(quiz => 
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
    toast.success("Question added!");
  };

  const handleDeleteQuiz = (id: number) => {
    setChapterQuizzes(chapterQuizzes.filter(quiz => quiz.id !== id));
    toast.success("Quiz deleted!");
  };

  return (
    <div className="mt-6 border bg-slate-50 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <HelpCircle className="h-4 w-4" />
          Chapter Quizzes
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Quiz for Chapter</DialogTitle>
              <DialogDescription>
                Create a quiz that will be linked to this chapter
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
                <Label htmlFor="category">Knowledge Category</Label>
                <select
                  id="category"
                  value={newQuiz.categoryId}
                  onChange={(e) => setNewQuiz({...newQuiz, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a category</option>
                  {mockCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
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
      </div>

      <div className="mt-4 space-y-3">
        {chapterQuizzes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No quizzes created yet</p>
            <p className="text-sm">Create your first quiz to get started</p>
          </div>
        ) : (
          chapterQuizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{quiz.categoryName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {quiz.totalQuestions} questions • {quiz.timeLimit} minutes
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedQuiz(quiz)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
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
              </CardHeader>
              <CardContent>
                {quiz.questions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Questions:</h4>
                    {quiz.questions.map((question, index) => (
                      <div key={question.id} className="text-sm p-2 bg-gray-50 rounded border">
                        <div className="font-medium">{index + 1}. {question.question}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {question.options.map((opt, optIndex) => (
                            <span key={optIndex} className={optIndex === question.correctAnswer ? "text-green-600 font-medium" : ""}>
                              {String.fromCharCode(65 + optIndex)}. {opt}{optIndex < question.options.length - 1 ? " | " : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Question Add Dialog */}
      {selectedQuiz && (
        <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Question to: {selectedQuiz.title}</DialogTitle>
              <DialogDescription>
                Add a new question to this quiz
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                <Label>Answer Options</Label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mt-2">
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

              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value) || 1})}
                  min="1"
                  className="w-20"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedQuiz(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAddQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
