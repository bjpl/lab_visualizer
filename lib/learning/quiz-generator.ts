import { Color, AnnotatedImage, QuizQuestion, QuizQuestionType } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

/**
 * Generate a quiz with mixed question types
 */
export async function generateQuiz(
  level: 'basic' | 'expanded',
  questionCount: number = 10
): Promise<QuizQuestion[]> {
  // Fetch colors for the level
  const colors = await getColorsForLevel(level);

  if (colors.length === 0) {
    throw new Error(`No colors found for level: ${level}`);
  }

  const questions: QuizQuestion[] = [];
  const questionTypes: QuizQuestionType[] = [
    'image-to-text',
    'text-to-image',
    'phrase-match',
  ];

  for (let i = 0; i < questionCount; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let question: QuizQuestion | null = null;

    switch (questionType) {
      case 'image-to-text':
        question = await generateImageToTextQuestion(color, colors);
        break;
      case 'text-to-image':
        question = await generateTextToImageQuestion(color, colors);
        break;
      case 'phrase-match':
        question = await generatePhraseMatchQuestion(color, colors);
        break;
    }

    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * Generate "What color is this?" question
 */
async function generateImageToTextQuestion(
  correctColor: Color,
  allColors: Color[]
): Promise<QuizQuestion | null> {
  // Get an image for this color
  const image = await getRandomImageForColor(correctColor.id);

  if (!image) {
    return null;
  }

  // Generate distractors
  const distractors = getRandomDistractors(allColors, correctColor.id, 3);

  // Shuffle options
  const options = shuffle([
    { id: correctColor.id, text: correctColor.name_es },
    ...distractors.map(c => ({ id: c.id, text: c.name_es })),
  ]);

  return {
    id: generateQuestionId(),
    type: 'image-to-text',
    prompt: '¿Qué color ves principalmente en esta imagen?',
    image_url: image.url,
    options,
    correct_answer: correctColor.id,
    color_id: correctColor.id,
    annotation: image.annotation,
  };
}

/**
 * Generate "Which image shows this color?" question
 */
async function generateTextToImageQuestion(
  correctColor: Color,
  allColors: Color[]
): Promise<QuizQuestion | null> {
  // Get images for correct and distractor colors
  const correctImage = await getRandomImageForColor(correctColor.id);

  if (!correctImage) {
    return null;
  }

  const distractors = getRandomDistractors(allColors, correctColor.id, 3);
  const distractorImages = await Promise.all(
    distractors.map(c => getRandomImageForColor(c.id))
  );

  // Filter out nulls
  const validDistractorImages = distractorImages.filter(img => img !== null) as AnnotatedImage[];

  if (validDistractorImages.length < 2) {
    return null; // Not enough images
  }

  // Shuffle options
  const options = shuffle([
    { id: correctImage.id, text: '', image_url: correctImage.thumbnail_url },
    ...validDistractorImages.map(img => ({
      id: img.id,
      text: '',
      image_url: img.thumbnail_url,
    })),
  ]);

  return {
    id: generateQuestionId(),
    type: 'text-to-image',
    prompt: `¿Cuál imagen muestra el color ${correctColor.name_es}?`,
    options,
    correct_answer: correctImage.id,
    color_id: correctColor.id,
  };
}

/**
 * Generate phrase matching question
 */
async function generatePhraseMatchQuestion(
  correctColor: Color,
  allColors: Color[]
): Promise<QuizQuestion | null> {
  // Get an annotated image with phrases
  const image = await getRandomImageForColor(correctColor.id);

  if (!image || !image.annotation || !image.annotation.phrases || image.annotation.phrases.length === 0) {
    return null;
  }

  const phrase = image.annotation.phrases[0];

  // Generate distractors
  const distractors = getRandomDistractors(allColors, correctColor.id, 3);

  // Shuffle options
  const options = shuffle([
    { id: correctColor.id, text: correctColor.name_es },
    ...distractors.map(c => ({ id: c.id, text: c.name_es })),
  ]);

  return {
    id: generateQuestionId(),
    type: 'phrase-match',
    prompt: `¿Qué color completa esta frase? "${phrase.replace(correctColor.name_es, '___')}"`,
    options,
    correct_answer: correctColor.id,
    color_id: correctColor.id,
    annotation: image.annotation,
  };
}

/**
 * Helper: Get colors for a specific level
 */
async function getColorsForLevel(level: 'basic' | 'expanded'): Promise<Color[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .eq('level', level);

  if (error) {
    console.error('Error fetching colors:', error);
    return [];
  }

  return data;
}

/**
 * Helper: Get random image for a color
 */
async function getRandomImageForColor(colorId: string): Promise<AnnotatedImage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('images')
    .select(`
      *,
      annotation:annotations(*)
    `)
    .eq('primary_color_id', colorId)
    .eq('status', 'approved')
    .limit(10);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Pick random image
  const randomImage = data[Math.floor(Math.random() * data.length)];

  return {
    ...randomImage,
    annotation: Array.isArray(randomImage.annotation) && randomImage.annotation.length > 0
      ? randomImage.annotation[0]
      : undefined,
  } as AnnotatedImage;
}

/**
 * Helper: Get random distractor colors
 */
function getRandomDistractors(
  allColors: Color[],
  excludeId: string,
  count: number
): Color[] {
  const available = allColors.filter(c => c.id !== excludeId);
  return shuffle(available).slice(0, count);
}

/**
 * Helper: Shuffle array
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Helper: Generate unique question ID
 */
function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Evaluate quiz answer
 */
export function evaluateAnswer(
  question: QuizQuestion,
  selectedAnswer: string
): {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
} {
  const isCorrect = selectedAnswer === question.correct_answer;

  let explanation = '';
  if (question.annotation) {
    explanation = question.annotation.description_basic || '';
  }

  return {
    isCorrect,
    explanation,
    correctAnswer: question.correct_answer,
  };
}
