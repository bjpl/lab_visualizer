// API request and response types

import { Color, AnnotatedImage, Annotation, QuizQuestion, QuizResults, Level } from './database';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Image fetching
export interface FetchImagesRequest {
  colorId: string;
  level: Level;
  count?: number;
  refresh?: boolean;
}

export interface FetchImagesResponse {
  images: AnnotatedImage[];
  cached: boolean;
}

// Annotation
export interface CreateAnnotationRequest {
  imageId: string;
  colorId: string;
  targetColors?: string[];
}

export interface AnnotationResponse {
  detectedColors: string[];
  primary: string;
  descriptionsInSpanish: {
    basic: string;
    expanded: string;
  };
  contextualPhrases: string[];
  colorAnalysis: {
    dominantColors: string[];
    mood: string;
  };
  confidenceScore: number;
  difficulty: Level;
}

export interface ReviewAnnotationRequest {
  annotationId: string;
  action: 'approve' | 'reject' | 'edit';
  feedback?: {
    description?: string;
    phrases?: string[];
    rejectionReason?: string;
  };
}

// Learning
export interface StartLearningSessionRequest {
  userId: string;
  level: Level;
}

export interface LearningSessionResponse {
  sessionId: string;
  level: Level;
  cards: ColorCard[];
}

export interface ColorCard {
  colorId: string;
  colorName: string;
  colorHex: string;
  images: AnnotatedImage[];
  currentMastery: number;
  annotation?: Annotation;
}

export interface UpdateProgressRequest {
  userId: string;
  colorId: string;
  isCorrect: boolean;
  masteryChange: number;
}

// Quiz
export interface GenerateQuizRequest {
  userId: string;
  level: Level;
  questionCount?: number;
}

export interface GenerateQuizResponse {
  quizId: string;
  questions: QuizQuestion[];
}

export interface SubmitAnswerRequest {
  quizId: string;
  questionId: string;
  answerId: string;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
}

// Progress
export interface ProgressStats {
  totalColorsLearned: number;
  basicMastery: number;
  expandedMastery: number;
  currentLevel: Level;
  streakDays: number;
  totalSessions: number;
  totalQuizzes: number;
  averageQuizScore: number;
}

export interface LearningPathResponse {
  currentLevel: Level;
  basicMastery: number;
  expandedMastery: number;
  recommendations: Color[];
  message: string;
  totalWordsLearned: number;
  streakDays: number;
}

// Bookmarks
export interface CreateBookmarkRequest {
  imageId: string;
  notes?: string;
}

export interface UpdateBookmarkRequest {
  bookmarkId: string;
  notes: string;
}
