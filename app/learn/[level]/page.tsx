'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorCard } from '@/components/learning/ColorCard';
import { ProgressIndicator } from '@/components/learning/ProgressIndicator';
import { Color, ColorWithImages, UserProgress } from '@/types/database';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function LearningSessionPage() {
  const params = useParams();
  const router = useRouter();
  const level = params.level as 'basic' | 'expanded';

  const [colors, setColors] = useState<Color[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [progress, setProgress] = useState({
    basicMastery: 0,
    expandedMastery: 0,
    streakDays: 0,
    totalWordsLearned: 0,
  });

  useEffect(() => {
    fetchColors();
  }, [level]);

  const fetchColors = async () => {
    try {
      const response = await fetch(`/api/colors?level=${level}`);
      const data = await response.json();

      if (data.success) {
        setColors(data.data);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (masteryChange: number) => {
    // Move to next color
    if (currentIndex < colors.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleBookmark = async (imageId: string) => {
    console.log('Bookmark image:', imageId);
    // API call would go here
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">¡Felicidades!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Has completado la sesión de aprendizaje
          </p>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resumen de la sesión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{colors.length}</div>
                  <div className="text-sm text-gray-600">Colores estudiados</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{level === 'basic' ? 'Básico' : 'Avanzado'}</div>
                  <div className="text-sm text-gray-600">Nivel</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/learn')} variant="outline">
              Volver a niveles
            </Button>
            <Button onClick={() => router.push('/quiz')}>
              Hacer un quiz
            </Button>
            <Button onClick={() => setSessionComplete(false)} variant="secondary">
              Repasar de nuevo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentColor = colors[currentIndex];

  if (!currentColor) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">No colors found</h1>
          <p className="text-gray-600 mb-8">
            No colors available for this level. Please try again later.
          </p>
          <Button onClick={() => router.push('/learn')}>
            Back to Levels
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/learn')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a niveles
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Nivel {level === 'basic' ? 'Básico' : 'Avanzado'}
              </h1>
              <p className="text-gray-600">
                Color {currentIndex + 1} de {colors.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progreso</div>
              <div className="text-2xl font-bold">
                {Math.round(((currentIndex + 1) / colors.length) * 100)}%
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / colors.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Color Display */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="overflow-hidden">
            <CardHeader
              className="p-8 text-center"
              style={{
                backgroundColor: currentColor.hex_code,
                color: getContrastColor(currentColor.hex_code),
              }}
            >
              <CardTitle className="text-5xl font-bold mb-2">
                {currentColor.name_es}
              </CardTitle>
              <CardDescription
                className="text-lg"
                style={{ color: getContrastColor(currentColor.hex_code), opacity: 0.9 }}
              >
                {currentColor.name_en}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-center text-gray-700 mb-6">
                {currentColor.description_short}
              </p>

              <div className="text-center mb-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(currentColor.name_es);
                    utterance.lang = 'es-ES';
                    utterance.rate = 0.8;
                    window.speechSynthesis.speak(utterance);
                  }}
                >
                  🔊 Escuchar pronunciación
                </Button>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                  disabled={currentIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button onClick={() => handleComplete(5)}>
                  {currentIndex === colors.length - 1 ? 'Terminar' : 'Siguiente'}
                  {currentIndex < colors.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {colors.map((color, idx) => (
              <button
                key={color.id}
                onClick={() => setCurrentIndex(idx)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-blue-500 shadow-lg scale-105'
                    : idx < currentIndex
                    ? 'border-green-500 opacity-75'
                    : 'border-gray-200 opacity-50'
                }`}
                style={{ backgroundColor: color.hex_code }}
                title={color.name_es}
              >
                <div className="text-xs font-semibold text-center" style={{ color: getContrastColor(color.hex_code) }}>
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}
