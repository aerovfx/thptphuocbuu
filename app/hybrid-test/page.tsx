"use client";

import { EducationQuizInterface } from '@/components/hybrid-bubble-sheet';

const mockQuizData = {
  id: "test-quiz",
  title: "Test Quiz",
  description: "Test quiz for hybrid bubble sheet",
  timeLimit: 30,
  totalQuestions: 5,
  questions: [
    {
      id: 1,
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1
    }
  ]
};

export default function HybridTestPage() {
  const handleSubmit = (answers: Record<number, number>) => {
    console.log('Answers:', answers);
  };

  return (
    <div className="min-h-screen">
      <EducationQuizInterface 
        quizData={mockQuizData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

