import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateQuiz } from '@/lib/learning/quiz-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, questionCount = 10 } = body;

    if (!level || (level !== 'basic' && level !== 'expanded')) {
      return NextResponse.json(
        { success: false, error: 'Invalid level specified' },
        { status: 400 }
      );
    }

    // Generate quiz questions
    const questions = await generateQuiz(level, questionCount);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate quiz questions' },
        { status: 500 }
      );
    }

    // Create quiz session in database
    const supabase = await createClient();
    const { data: quiz, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // Guest user for demo
        level,
        questions: questions,
        answers: [],
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create quiz session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        quizId: quiz.id,
        questionCount: questions.length,
      },
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
