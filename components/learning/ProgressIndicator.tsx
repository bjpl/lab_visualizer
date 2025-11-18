'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Flame, BookMarked } from 'lucide-react';

interface ProgressIndicatorProps {
  basicMastery: number;
  expandedMastery: number;
  streakDays: number;
  totalWordsLearned: number;
}

export function ProgressIndicator({
  basicMastery,
  expandedMastery,
  streakDays,
  totalWordsLearned,
}: ProgressIndicatorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nivel Básico
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{basicMastery}%</div>
          <Progress value={basicMastery} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nivel Avanzado
          </CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expandedMastery}%</div>
          <Progress value={expandedMastery} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Racha
          </CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{streakDays}</div>
          <p className="text-xs text-muted-foreground">
            días consecutivos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Palabras Aprendidas
          </CardTitle>
          <BookMarked className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWordsLearned}</div>
          <p className="text-xs text-muted-foreground">
            colores dominados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
