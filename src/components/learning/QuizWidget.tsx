/**
 * QuizWidget Component
 * Interactive quiz widget for learning modules
 */

'use client';

import React, { useState } from 'react';
import type { QuizContent, QuizQuestion } from '@/types/learning';

interface QuizWidgetProps {
  quiz: QuizContent;
  onComplete: (score: number, answers: Record<string, string | string[]>) => void;
}

export function QuizWidget({ quiz, onComplete }: QuizWidgetProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit || null);

  const questions = quiz.questions.sort((a, b) => a.order - b.order);
  const currentQ = questions[currentQuestion];

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const score = calculateScore();
    setShowResults(true);
    onComplete(score, answers);
  };

  const calculateScore = () => {
    let correctPoints = 0;
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const isCorrect = Array.isArray(question.correctAnswer)
        ? Array.isArray(userAnswer) && JSON.stringify([...userAnswer].sort()) === JSON.stringify([...question.correctAnswer].sort())
        : userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctPoints += question.points;
      }
    });

    return (correctPoints / totalPoints) * 100;
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;

    return (
      <div className="text-center p-8">
        <div className={`text-6xl font-bold mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {Math.round(score)}%
        </div>
        <h2 className="text-2xl font-semibold mb-2">
          {passed ? 'Congratulations!' : 'Keep Learning!'}
        </h2>
        <p className="text-gray-600 mb-6">
          {passed
            ? `You passed! You scored ${Math.round(score)}% (passing: ${quiz.passingScore}%)`
            : `You need ${quiz.passingScore}% to pass. Review the material and try again.`
          }
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {passed ? 'Continue' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          {timeRemaining !== null && (
            <span className="font-semibold">Time: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold mb-4">{currentQ.question}</h3>

        {currentQ.type === 'multiple-choice' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  answers[currentQ.id] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQ.id}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQ.type === 'true-false' && (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  answers[currentQ.id] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQ.id}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQ.type === 'short-answer' && (
          <textarea
            value={(answers[currentQ.id] as string) || ''}
            onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Type your answer here..."
          />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!answers[currentQ.id]}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
        >
          {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}
