import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateAnswer } from '@/lib/learning/quiz-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { questionId, answerId } = body;

    if (!questionId || !answerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Find the question
    const question = quiz.questions.find((q: any) => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }

    // Evaluate answer
    const result = evaluateAnswer(question, answerId);

    // Update quiz with answer
    const updatedAnswers = [
      ...(quiz.answers || []),
      {
        questionId,
        selectedAnswer: answerId,
        isCorrect: result.isCorrect,
        timestamp: new Date().toISOString(),
      },
    ];

    // Check if quiz is complete
    const isComplete = updatedAnswers.length === quiz.questions.length;
    const score = isComplete
      ? Math.round((updatedAnswers.filter((a: any) => a.isCorrect).length / quiz.questions.length) * 100)
      : null;

    await supabase
      .from('quiz_sessions')
      .update({
        answers: updatedAnswers,
        completed: isComplete,
        score: score,
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', quizId);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        isComplete,
        score,
      },
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
