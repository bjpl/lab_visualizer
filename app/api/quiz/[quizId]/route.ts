import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const supabase = await createClient();
    const { data: quiz, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error || !quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        level: quiz.level,
        questions: quiz.questions,
        answers: quiz.answers,
        completed: quiz.completed,
        score: quiz.score,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
