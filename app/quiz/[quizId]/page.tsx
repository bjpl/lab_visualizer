'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuizQuestion } from '@/types/database';
import { CheckCircle, XCircle, ArrowRight, Home } from 'lucide-react';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string; correct: boolean }>>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correct_answer;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Save answer
    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct,
      },
    ]);

    // Submit to API
    try {
      await fetch(`/api/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerId: selectedAnswer,
        }),
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      setQuizComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🎨</div>
          <p className="text-gray-600">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const score = answers.filter(a => a.correct).length;
    const percentage = Math.round((score / answers.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              {percentage >= 80 ? (
                <div className="text-green-500 text-8xl mb-4">🎉</div>
              ) : percentage >= 60 ? (
                <div className="text-blue-500 text-8xl mb-4">👏</div>
              ) : (
                <div className="text-orange-500 text-8xl mb-4">💪</div>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4">¡Quiz Completado!</h1>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Tu Puntuación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-6xl font-bold mb-4" style={{ color: percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#3b82f6' : '#f97316' }}>
                  {percentage}%
                </div>
                <p className="text-xl text-gray-600 mb-4">
                  {score} de {answers.length} correctas
                </p>
                <Progress value={percentage} className="h-3" />

                <div className="mt-6 text-left">
                  <h3 className="font-semibold mb-3">Resumen:</h3>
                  <div className="space-y-2">
                    {answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        {answer.correct ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>Pregunta {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Inicio
              </Button>
              <Button onClick={() => router.push('/quiz')}>
                Nuevo Quiz
              </Button>
              <Button onClick={() => router.push('/learn')} variant="secondary">
                Seguir Aprendiendo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">Question not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </span>
              <span className="text-sm font-semibold">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">{currentQuestion.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Image if present */}
              {currentQuestion.image_url && (
                <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
                  <Image
                    src={currentQuestion.image_url}
                    alt="Question image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                </div>
              )}

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const isCorrectAnswer = option.id === currentQuestion.correct_answer;
                  const showCorrect = showFeedback && isCorrectAnswer;
                  const showIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        showCorrect
                          ? 'border-green-500 bg-green-50'
                          : showIncorrect
                          ? 'border-red-500 bg-red-50'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {option.image_url ? (
                            <div className="relative w-full h-32 rounded overflow-hidden">
                              <Image
                                src={option.image_url}
                                alt={option.text || 'Option'}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 640px"
                              />
                            </div>
                          ) : (
                            <span className="text-lg">{option.text}</span>
                          )}
                        </div>
                        {showFeedback && (
                          <div className="ml-4">
                            {isCorrectAnswer ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : isSelected ? (
                              <XCircle className="w-6 h-6 text-red-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    )}
                    <div>
                      <h4 className="font-semibold mb-1">
                        {isCorrect ? '¡Correcto!' : 'No es correcto'}
                      </h4>
                      {currentQuestion.annotation?.description_basic && (
                        <p className="text-sm text-gray-700">
                          {currentQuestion.annotation.description_basic}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    className="flex-1"
                    size="lg"
                  >
                    Comprobar Respuesta
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="flex-1"
                    size="lg"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Siguiente Pregunta
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    ) : (
                      'Ver Resultados'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
