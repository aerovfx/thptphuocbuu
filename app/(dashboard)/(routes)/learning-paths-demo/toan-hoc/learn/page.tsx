"use client"

import { useState } from "react";
import { QuizletStyleLearning } from "@/components/quizlet-style-learning";

export default function ToanHocLearnPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const questions = [
    {
      term: "Tập hợp",
      definition: "Một nhóm các đối tượng có chung tính chất",
      options: [
        { id: "1", text: "Một nhóm các đối tượng có chung tính chất", isCorrect: true },
        { id: "2", text: "Một số nguyên dương", isCorrect: false },
        { id: "3", text: "Một phương trình", isCorrect: false },
        { id: "4", text: "Một hàm số", isCorrect: false }
      ]
    },
    {
      term: "Mệnh đề",
      definition: "Một câu khẳng định có thể xác định được tính đúng sai",
      options: [
        { id: "1", text: "Một câu hỏi", isCorrect: false },
        { id: "2", text: "Một câu khẳng định có thể xác định được tính đúng sai", isCorrect: true },
        { id: "3", text: "Một biểu thức", isCorrect: false },
        { id: "4", text: "Một tập hợp", isCorrect: false }
      ]
    },
    {
      term: "Hàm số bậc nhất",
      definition: "Hàm số có dạng y = ax + b (a ≠ 0)",
      options: [
        { id: "1", text: "Hàm số có dạng y = ax² + bx + c", isCorrect: false },
        { id: "2", text: "Hàm số có dạng y = ax + b (a ≠ 0)", isCorrect: true },
        { id: "3", text: "Hàm số có dạng y = x³", isCorrect: false },
        { id: "4", text: "Hàm số có dạng y = sin x", isCorrect: false }
      ]
    },
    {
      term: "Parabol",
      definition: "Đồ thị của hàm số bậc hai y = ax² + bx + c",
      options: [
        { id: "1", text: "Đường thẳng", isCorrect: false },
        { id: "2", text: "Đường tròn", isCorrect: false },
        { id: "3", text: "Đồ thị của hàm số bậc hai y = ax² + bx + c", isCorrect: true },
        { id: "4", text: "Đường elip", isCorrect: false }
      ]
    },
    {
      term: "Phương trình bậc hai",
      definition: "Phương trình có dạng ax² + bx + c = 0 (a ≠ 0)",
      options: [
        { id: "1", text: "Phương trình có dạng ax + b = 0", isCorrect: false },
        { id: "2", text: "Phương trình có dạng ax² + bx + c = 0 (a ≠ 0)", isCorrect: true },
        { id: "3", text: "Phương trình có dạng x³ + 1 = 0", isCorrect: false },
        { id: "4", text: "Phương trình có dạng sin x = 0", isCorrect: false }
      ]
    },
    {
      term: "Định lý Vi-ét",
      definition: "Cho phương trình ax² + bx + c = 0, nếu có 2 nghiệm x₁, x₂ thì x₁ + x₂ = -b/a và x₁x₂ = c/a",
      options: [
        { id: "1", text: "Công thức tính nghiệm của phương trình bậc hai", isCorrect: false },
        { id: "2", text: "Mối quan hệ giữa các nghiệm và hệ số của phương trình bậc hai", isCorrect: true },
        { id: "3", text: "Công thức tính diện tích tam giác", isCorrect: false },
        { id: "4", text: "Định lý về đường trung tuyến", isCorrect: false }
      ]
    },
    {
      term: "Sin",
      definition: "Tỉ số giữa cạnh đối và cạnh huyền trong tam giác vuông",
      options: [
        { id: "1", text: "Tỉ số giữa cạnh đối và cạnh huyền trong tam giác vuông", isCorrect: true },
        { id: "2", text: "Tỉ số giữa cạnh kề và cạnh huyền", isCorrect: false },
        { id: "3", text: "Tỉ số giữa cạnh đối và cạnh kề", isCorrect: false },
        { id: "4", text: "Tỉ số giữa cạnh huyền và cạnh đối", isCorrect: false }
      ]
    },
    {
      term: "Cos",
      definition: "Tỉ số giữa cạnh kề và cạnh huyền trong tam giác vuông",
      options: [
        { id: "1", text: "Tỉ số giữa cạnh đối và cạnh huyền", isCorrect: false },
        { id: "2", text: "Tỉ số giữa cạnh kề và cạnh huyền trong tam giác vuông", isCorrect: true },
        { id: "3", text: "Tỉ số giữa cạnh đối và cạnh kề", isCorrect: false },
        { id: "4", text: "Tỉ số giữa cạnh huyền và cạnh kề", isCorrect: false }
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
      // Quiz completed
      alert(`Quiz hoàn thành! Điểm số: ${score}/${questions.length}`);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <QuizletStyleLearning
      subject="Toán học - Tập hợp và mệnh đề"
      totalQuestions={questions.length}
      currentQuestion={currentQuestionIndex + 1}
      question={currentQuestion}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onSkip={handleSkip}
      showResult={showResult}
      selectedAnswer={selectedAnswer}
      isCorrect={isCorrect}
    />
  );
}
