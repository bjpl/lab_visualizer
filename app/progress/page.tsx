'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressIndicator } from '@/components/learning/ProgressIndicator';
import {
  Trophy,
  Target,
  Flame,
  BookMarked,
  TrendingUp,
  Calendar,
  Award,
  Star,
  ArrowLeft
} from 'lucide-react';

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    basicMastery: 65,
    expandedMastery: 32,
    streakDays: 5,
    totalWordsLearned: 18,
    totalSessions: 12,
    totalQuizzes: 8,
    averageQuizScore: 78,
    currentLevel: 'basic' as 'basic' | 'expanded',
    weakColors: [] as any[],
    strongColors: [] as any[],
    recentActivity: [] as any[],
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      // Simulated data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStats({
        basicMastery: 65,
        expandedMastery: 32,
        streakDays: 5,
        totalWordsLearned: 18,
        totalSessions: 12,
        totalQuizzes: 8,
        averageQuizScore: 78,
        currentLevel: 'basic',
        weakColors: [
          { name_es: 'morado', name_en: 'purple', mastery: 45 },
          { name_es: 'naranja', name_en: 'orange', mastery: 52 },
          { name_es: 'gris', name_en: 'gray', mastery: 58 },
        ],
        strongColors: [
          { name_es: 'rojo', name_en: 'red', mastery: 92 },
          { name_es: 'azul', name_en: 'blue', mastery: 88 },
          { name_es: 'verde', name_en: 'green', mastery: 85 },
        ],
        recentActivity: [
          { type: 'quiz', date: '2025-01-15', score: 85 },
          { type: 'study', date: '2025-01-14', colorsStudied: 5 },
          { type: 'quiz', date: '2025-01-13', score: 70 },
        ],
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📊</div>
          <p className="text-gray-600">Cargando tu progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>

          <h1 className="text-4xl font-bold mb-2">Tu Progreso</h1>
          <p className="text-gray-600">
            Sigue tu avance en el aprendizaje de colores en español
          </p>
        </div>

        {/* Main Stats */}
        <div className="mb-8">
          <ProgressIndicator
            basicMastery={stats.basicMastery}
            expandedMastery={stats.expandedMastery}
            streakDays={stats.streakDays}
            totalWordsLearned={stats.totalWordsLearned}
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Learning Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-blue-500" />
                Estadísticas de Aprendizaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Sesiones completadas</span>
                <span className="font-bold text-xl">{stats.totalSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quizzes realizados</span>
                <span className="font-bold text-xl">{stats.totalQuizzes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Puntuación promedio</span>
                <span className="font-bold text-xl">{stats.averageQuizScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nivel actual</span>
                <span className="font-bold text-xl capitalize">{stats.currentLevel}</span>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Logros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold">Primera semana</h4>
                    <p className="text-sm text-gray-600">5 días consecutivos</p>
                  </div>
                </div>

                {stats.basicMastery >= 50 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-semibold">Nivel Básico</h4>
                      <p className="text-sm text-gray-600">50%+ de dominio</p>
                    </div>
                  </div>
                )}

                {stats.totalQuizzes >= 5 && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Star className="w-8 h-8 text-purple-500" />
                    <div>
                      <h4 className="font-semibold">Quiz Master</h4>
                      <p className="text-sm text-gray-600">5+ quizzes completados</p>
                    </div>
                  </div>
                )}

                {stats.totalWordsLearned >= 10 && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <BookMarked className="w-8 h-8 text-green-500" />
                    <div>
                      <h4 className="font-semibold">Políglota de Colores</h4>
                      <p className="text-sm text-gray-600">10+ colores aprendidos</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weak Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Colores para Mejorar
              </CardTitle>
              <CardDescription>
                Enfócate en estos colores para mejorar tu dominio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weakColors.map((color, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{color.name_es}</span>
                      <span className="text-sm text-gray-600">{color.mastery}%</span>
                    </div>
                    <Progress value={color.mastery} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strong Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-green-500" />
                Colores Dominados
              </CardTitle>
              <CardDescription>
                ¡Excelente trabajo con estos colores!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.strongColors.map((color, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{color.name_es}</span>
                      <span className="text-sm text-green-600 font-semibold">{color.mastery}%</span>
                    </div>
                    <Progress value={color.mastery} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {activity.type === 'quiz' ? (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-purple-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookMarked className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">
                        {activity.type === 'quiz' ? 'Quiz completado' : 'Sesión de estudio'}
                      </h4>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.type === 'quiz' ? (
                      <span className="font-bold text-lg">{activity.score}%</span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {activity.colorsStudied} colores
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/learn')} size="lg">
            Continuar Aprendiendo
          </Button>
          <Button onClick={() => router.push('/quiz')} variant="outline" size="lg">
            Hacer un Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
