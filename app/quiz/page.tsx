'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Target, Zap, ArrowRight } from 'lucide-react';

export default function QuizSetupPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<'basic' | 'expanded'>('basic');
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStartQuiz = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: selectedLevel,
          questionCount,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.quizId) {
        router.push(`/quiz/${data.data.quizId}`);
      } else {
        alert('Error generating quiz. Please try again.');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Error starting quiz. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-5xl font-bold mb-4">Quiz de Colores</h1>
            <p className="text-xl text-gray-600">
              Pon a prueba tus conocimientos de colores en español
            </p>
          </div>

          {/* Quiz Setup */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Basic Level */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                selectedLevel === 'basic'
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedLevel('basic')}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Nivel Básico</CardTitle>
                <CardDescription>
                  12 colores fundamentales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Perfecto para principiantes. Cubre los colores más comunes y esenciales.
                </p>
              </CardContent>
            </Card>

            {/* Expanded Level */}
            <Card
              className={`cursor-pointer transition-all border-2 ${
                selectedLevel === 'expanded'
                  ? 'border-purple-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedLevel('expanded')}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Nivel Avanzado</CardTitle>
                <CardDescription>
                  24+ variaciones de colores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Desafío avanzado con tonos, matices y vocabulario sofisticado.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Question Count */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Número de preguntas</CardTitle>
              <CardDescription>
                Selecciona cuántas preguntas quieres responder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[5, 10, 15, 20].map((count) => (
                  <Button
                    key={count}
                    variant={questionCount === count ? 'default' : 'outline'}
                    onClick={() => setQuestionCount(count)}
                    className="flex-1"
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Types Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tipos de preguntas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Identificación de imagen</h4>
                    <p className="text-sm text-gray-600">¿Qué color ves en esta imagen?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Imagen del color</h4>
                    <p className="text-sm text-gray-600">¿Cuál imagen muestra este color?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Completar frases</h4>
                    <p className="text-sm text-gray-600">Usa el color correcto en contexto</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleStartQuiz}
              disabled={isGenerating}
              className="px-12 py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generando quiz...
                </>
              ) : (
                <>
                  Comenzar Quiz
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              Quiz de {questionCount} preguntas · Nivel {selectedLevel === 'basic' ? 'Básico' : 'Avanzado'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
