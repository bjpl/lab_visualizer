export type BodyPartCategory = 'head' | 'torso' | 'arms' | 'legs' | 'hands' | 'feet' | 'organs';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type LearningMode = 'study' | 'quiz' | 'challenge';

export interface BodyPart {
  id: string;
  spanish: string;
  english: string;
  category: BodyPartCategory;
  coordinates: {
    x: number; // percentage
    y: number; // percentage
  };
  difficulty: DifficultyLevel;
  audioUrl?: string;
}

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

export interface QuizQuestion {
  bodyPart: BodyPart;
  options: string[];
  correctAnswer: string;
}

export interface UserProgress {
  studiedParts: Set<string>;
  quizScores: number[];
  lastStudyDate: Date;
  totalTimeSpent: number;
  masteredParts: Set<string>;
}

export interface AnnotationMarkerProps {
  bodyPart: BodyPart;
  isActive: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  onHover?: (isHovering: boolean) => void;
}
