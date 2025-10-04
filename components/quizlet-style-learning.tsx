"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Flag, Play, CheckCircle, XCircle } from "lucide-react";

interface QuizletStyleLearningProps {
  subject: string;
  totalQuestions: number;
  currentQuestion: number;
  question: {
    term: string;
    definition: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  };
  onAnswer: (answerId: string) => void;
  onNext: () => void;
  onSkip: () => void;
  showResult?: boolean;
  selectedAnswer?: string;
  isCorrect?: boolean;
}

export function QuizletStyleLearning({
  subject,
  totalQuestions,
  currentQuestion,
  question,
  onAnswer,
  onNext,
  onSkip,
  showResult = false,
  selectedAnswer,
  isCorrect
}: QuizletStyleLearningProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (!showResult) {
      setSelectedOption(optionId);
      onAnswer(optionId);
    }
  };

  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-80"></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Learn</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Button 
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg"
          onClick={onNext}
        >
          {showResult ? "Continue" : "Start"}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-8">
        <div className="relative">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-slate-900"
            style={{ left: `calc(${progressPercentage}% - 16px)` }}
          >
            {currentQuestion}
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
            {totalQuestions}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="px-6">
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardContent className="p-8">
            {/* Question */}
            <div className="text-center mb-8">
              <div className="text-sm text-gray-400 mb-2">Term</div>
              <h1 className="text-4xl font-bold text-white mb-4">{question.term}</h1>
            </div>

            {/* Answer Options */}
            <div className="mb-8">
              <div className="text-sm text-gray-400 mb-4 text-center">Choose an answer</div>
              <div className="grid grid-cols-2 gap-4">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === option.id || selectedAnswer === option.id;
                  const showCorrect = showResult && option.isCorrect;
                  const showIncorrect = showResult && isSelected && !option.isCorrect;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={showResult}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-200 text-left
                        ${showResult 
                          ? showCorrect 
                            ? 'border-green-500 bg-green-500/20' 
                            : showIncorrect
                            ? 'border-red-500 bg-red-500/20'
                            : 'border-slate-600 bg-slate-700'
                          : isSelected
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500 hover:bg-slate-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${showResult 
                            ? showCorrect 
                              ? 'bg-green-500 text-white' 
                              : showIncorrect
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-600 text-gray-400'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-600 text-gray-400'
                          }
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{option.text}</div>
                        </div>
                        {showResult && showCorrect && (
                          <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                        )}
                        {showResult && showIncorrect && (
                          <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result Message */}
            {showResult && (
              <div className="text-center mb-6">
                <div className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${isCorrect 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }
                `}>
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Incorrect
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Skip Button */}
            <div className="flex justify-end">
              <button
                onClick={onSkip}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm"
              >
                <Flag className="h-4 w-4" />
                Don't know?
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-center text-gray-500 text-sm">
          {subject} • Question {currentQuestion} of {totalQuestions}
        </div>
      </div>
    </div>
  );
}
