// Database types matching Supabase schema

export type Level = 'basic' | 'expanded';
export type ImageStatus = 'pending' | 'annotated' | 'approved' | 'rejected';
export type AnnotationQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Color {
  id: string;
  name_es: string;
  name_en: string;
  hex_code: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  level: Level;
  category: string | null;
  description_short: string | null;
  pronunciation_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  unsplash_id: string;
  url: string;
  thumbnail_url: string;
  photographer: string | null;
  photographer_url: string | null;
  primary_color_id: string | null;
  detected_colors: string[];
  status: ImageStatus;
  download_location: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  image_id: string;
  color_id: string | null;
  description_basic: string | null;
  description_expanded: string | null;
  phrases: string[];
  confidence_score: number | null;
  validated: boolean;
  validated_at: string | null;
  validator_id: string | null;
  rejection_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  color_id: string;
  mastery_level: number;
  last_reviewed: string | null;
  next_review: string | null;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  image_id: string;
  notes: string | null;
  created_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  level: Level;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  score: number | null;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface LearningSession {
  id: string;
  user_id: string;
  level: Level;
  cards_reviewed: number;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface AnnotationQueue {
  id: string;
  image_id: string;
  target_colors: string[];
  status: AnnotationQueueStatus;
  attempts: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

// Combined types with relations
export interface AnnotatedImage extends Image {
  annotation?: Annotation;
  color?: Color;
}

export interface ColorWithImages extends Color {
  images?: AnnotatedImage[];
}

export interface UserProgressWithColor extends UserProgress {
  color?: Color;
}

// Quiz types
export type QuizQuestionType = 'image-to-text' | 'text-to-image' | 'phrase-match';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  image_url?: string;
  options: QuizOption[];
  correct_answer: string;
  color_id: string;
  annotation?: Annotation;
}

export interface QuizOption {
  id: string;
  text: string;
  image_url?: string;
}

export interface QuizAnswer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  timestamp: string;
}

export interface QuizResults {
  quiz_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  answers: QuizAnswer[];
}
