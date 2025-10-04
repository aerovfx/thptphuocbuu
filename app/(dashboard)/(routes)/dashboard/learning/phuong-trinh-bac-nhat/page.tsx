"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  CheckCircle, 
  Star, 
  Trophy, 
  ArrowRight,
  BookOpen,
  Target,
  Zap,
  Calculator,
  ArrowLeft,
  X
} from "lucide-react";

export default function PhuongTrinhBacNhatPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Don't auto-complete on page load, wait for user to complete lesson

  const steps = [
    {
      title: "Định nghĩa phương trình bậc nhất",
      content: "Phương trình bậc nhất một ẩn là phương trình có dạng: ax + b = 0 (với a ≠ 0)",
      example: "Ví dụ: 2x + 3 = 0, -5x + 7 = 0",
      icon: "📝"
    },
    {
      title: "Cách giải phương trình bậc nhất",
      content: "Để giải phương trình ax + b = 0, ta chuyển b sang vế phải và chia cho a",
      example: "ax + b = 0 → ax = -b → x = -b/a",
      icon: "🧮"
    },
    {
      title: "Ví dụ cụ thể",
      content: "Giải phương trình: 3x + 6 = 0",
      example: "3x + 6 = 0 → 3x = -6 → x = -6/3 = -2",
      icon: "💡"
    },
    {
      title: "Bài tập thực hành",
      content: "Giải phương trình: 2x - 4 = 0",
      example: "Hãy nhập đáp án của bạn:",
      icon: "🎯"
    }
  ];

  const correctAnswer = "2";

  const handleAnswerSubmit = () => {
    setShowResult(true);
    setIsCorrect(userAnswer.trim() === correctAnswer);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      // Hoàn thành bài học - chúc mừng và mở khóa bài tiếp theo
      // Sử dụng URL parameter thay vì custom event
      router.push("/dashboard/learning?completed=2");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setUserAnswer("");
      setShowResult(false);
    } else {
      router.push("/dashboard/learning");
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Bài học: Phương trình bậc nhất</h1>
                <p className="text-gray-600">Học cách giải phương trình bậc nhất</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">+20 XP</Badge>
              <Badge className="bg-blue-100 text-blue-700">Bài học</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tiến độ bài học</span>
            <span className="text-sm text-gray-600">{currentStep + 1}/{steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{steps[currentStep].icon}</div>
            <CardTitle className="text-3xl">{steps[currentStep].title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-gray-700 mb-6">{steps[currentStep].content}</p>
            
            {/* Example */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Ví dụ:</h3>
              <p className="text-gray-700 font-mono text-lg">{steps[currentStep].example}</p>
            </div>

            {/* Interactive Exercise */}
            {currentStep === 3 && (
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold mb-4">Bài tập: Giải phương trình 2x - 4 = 0</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-lg">x =</span>
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-20 text-center text-lg"
                    placeholder="?"
                    disabled={showResult}
                  />
                </div>
                <Button 
                  onClick={handleAnswerSubmit}
                  disabled={showResult || !userAnswer.trim()}
                  className="mb-4"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Kiểm tra
                </Button>
                
                {showResult && (
                  <div className={`p-4 rounded-lg ${
                    isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                  } border`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800">Chính xác!</span>
                        </>
                      ) : (
                        <>
                          <X className="h-5 w-5 text-red-600" />
                          <span className="font-semibold text-red-800">Chưa đúng</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">
                      Đáp án đúng là: x = 2
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      2x - 4 = 0 → 2x = 4 → x = 2
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center gap-4">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Trước đó
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={currentStep === 3 && !showResult}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Hoàn thành (+20 XP)
                  </>
                ) : (
                  <>
                    Tiếp theo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Points */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Điểm quan trọng</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Phương trình bậc nhất có dạng ax + b = 0 (a ≠ 0)</li>
                  <li>• Nghiệm của phương trình là x = -b/a</li>
                  <li>• Luôn kiểm tra lại kết quả bằng cách thay vào phương trình gốc</li>
                  <li>• Nếu a = 0 và b ≠ 0 thì phương trình vô nghiệm</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Section - Only for development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-red-50 border-red-200 mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-red-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-2">🔧 Debug Tools (Development Only)</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        localStorage.removeItem('completedLessons');
                        window.location.reload();
                      }}
                    >
                      Reset All Progress
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
                        alert(`Completed: [${completed.join(', ')}]`);
                      }}
                    >
                      Debug Progress
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
                        const newCompleted = [...completed, 2];
                        localStorage.setItem('completedLessons', JSON.stringify(newCompleted));
                        router.push("/dashboard/learning?completed=2");
                      }}
                    >
                      Complete Lesson 2 (Phương trình bậc nhất)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
