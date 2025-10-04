"use client"

import { useState } from "react";
import { QuizletStyleLearning } from "@/components/quizlet-style-learning";

export default function PythonLearnPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const questions = [
    {
      term: "Python",
      definition: "Ngôn ngữ lập trình bậc cao, dễ học và mạnh mẽ",
      options: [
        { id: "1", text: "Ngôn ngữ lập trình bậc cao, dễ học và mạnh mẽ", isCorrect: true },
        { id: "2", text: "Một loại rắn", isCorrect: false },
        { id: "3", text: "Một phần mềm soạn thảo", isCorrect: false },
        { id: "4", text: "Một hệ điều hành", isCorrect: false }
      ]
    },
    {
      term: "Biến (Variable)",
      definition: "Tên để lưu trữ dữ liệu trong chương trình",
      options: [
        { id: "1", text: "Tên để lưu trữ dữ liệu trong chương trình", isCorrect: true },
        { id: "2", text: "Một hàm trong Python", isCorrect: false },
        { id: "3", text: "Một module", isCorrect: false },
        { id: "4", text: "Một class", isCorrect: false }
      ]
    },
    {
      term: "print()",
      definition: "Hàm để hiển thị dữ liệu ra màn hình",
      options: [
        { id: "1", text: "Hàm để nhập dữ liệu từ bàn phím", isCorrect: false },
        { id: "2", text: "Hàm để hiển thị dữ liệu ra màn hình", isCorrect: true },
        { id: "3", text: "Hàm để tính toán", isCorrect: false },
        { id: "4", text: "Hàm để lưu file", isCorrect: false }
      ]
    },
    {
      term: "input()",
      definition: "Hàm để nhập dữ liệu từ người dùng",
      options: [
        { id: "1", text: "Hàm để hiển thị dữ liệu", isCorrect: false },
        { id: "2", text: "Hàm để nhập dữ liệu từ người dùng", isCorrect: true },
        { id: "3", text: "Hàm để tính toán", isCorrect: false },
        { id: "4", text: "Hàm để lưu file", isCorrect: false }
      ]
    },
    {
      term: "if/else",
      definition: "Cấu trúc điều kiện để thực hiện các hành động khác nhau",
      options: [
        { id: "1", text: "Cấu trúc lặp", isCorrect: false },
        { id: "2", text: "Cấu trúc điều kiện để thực hiện các hành động khác nhau", isCorrect: true },
        { id: "3", text: "Cấu trúc dữ liệu", isCorrect: false },
        { id: "4", text: "Cấu trúc hàm", isCorrect: false }
      ]
    },
    {
      term: "for loop",
      definition: "Vòng lặp để thực hiện một khối lệnh nhiều lần",
      options: [
        { id: "1", text: "Cấu trúc điều kiện", isCorrect: false },
        { id: "2", text: "Vòng lặp để thực hiện một khối lệnh nhiều lần", isCorrect: true },
        { id: "3", text: "Cấu trúc dữ liệu", isCorrect: false },
        { id: "4", text: "Cấu trúc hàm", isCorrect: false }
      ]
    },
    {
      term: "List",
      definition: "Cấu trúc dữ liệu để lưu trữ nhiều giá trị theo thứ tự",
      options: [
        { id: "1", text: "Cấu trúc dữ liệu để lưu trữ nhiều giá trị theo thứ tự", isCorrect: true },
        { id: "2", text: "Một hàm", isCorrect: false },
        { id: "3", text: "Một class", isCorrect: false },
        { id: "4", text: "Một module", isCorrect: false }
      ]
    },
    {
      term: "Function",
      definition: "Khối mã có thể tái sử dụng để thực hiện một tác vụ cụ thể",
      options: [
        { id: "1", text: "Một biến", isCorrect: false },
        { id: "2", text: "Khối mã có thể tái sử dụng để thực hiện một tác vụ cụ thể", isCorrect: true },
        { id: "3", text: "Một class", isCorrect: false },
        { id: "4", text: "Một module", isCorrect: false }
      ]
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer ? currentQuestion.options.find(opt => opt.id === selectedAnswer)?.isCorrect : false;

  const handleAnswer = (answerId: string) => {
    setSelectedAnswer(answerId);
    setShowResult(true);
    if (currentQuestion.options.find(opt => opt.id === answerId)?.isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    } else {
      // Quiz completed - show celebration
      // The celebration will be handled by the component
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const isCompleted = currentQuestionIndex === questions.length - 1 && showResult;
  const totalXP = score * 10; // 10 XP per correct answer

  return (
    <QuizletStyleLearning
      subject="Python Programming - Giới thiệu Python"
      totalQuestions={questions.length}
      currentQuestion={currentQuestionIndex + 1}
      question={currentQuestion}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onSkip={handleSkip}
      showResult={showResult}
      selectedAnswer={selectedAnswer}
      isCorrect={isCorrect}
      isCompleted={isCompleted}
      totalXP={totalXP}
    />
  );
}
