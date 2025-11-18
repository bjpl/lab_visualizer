/**
 * Learning Content Type Definitions
 * Type system for educational content management
 */

import type { Database } from './database';

export type ContentType = Database['public']['Enums']['content_type'];
export type Visibility = Database['public']['Enums']['visibility'];

/**
 * Core Learning Module
 */
export interface LearningModule {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  contentData: ModuleContentData;
  thumbnailUrl: string | null;
  duration: number | null; // seconds for videos
  relatedStructures: string[]; // structure IDs
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[]; // module IDs
  learningObjectives: string[];
  tags: string[];
  visibility: Visibility;
  isPublished: boolean;
  viewCount: number;
  completionCount: number;
  avgRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/**
 * Content data structure varies by type
 */
export type ModuleContentData =
  | VideoContent
  | GuideContent
  | TutorialContent
  | QuizContent
  | PathwayContent;

export interface VideoContent {
  type: 'video';
  videoUrl: string;
  transcript?: string;
  chapters?: VideoChapter[];
  annotations?: StructureAnnotation[];
}

export interface VideoChapter {
  time: number; // seconds
  title: string;
  description?: string;
}

export interface StructureAnnotation {
  timestamp: number; // seconds
  structureId: string;
  cameraPosition?: {
    position: [number, number, number];
    target: [number, number, number];
    up: [number, number, number];
  };
  highlights?: {
    atoms?: number[];
    residues?: string[];
    chains?: string[];
  };
  note?: string;
}

export interface GuideContent {
  type: 'guide';
  sections: GuideSection[];
  interactiveElements?: InteractiveElement[];
}

export interface GuideSection {
  id: string;
  title: string;
  content: string; // Markdown
  structureId?: string;
  images?: string[];
  order: number;
}

export interface InteractiveElement {
  type: 'structure-viewer' | 'quiz' | 'comparison';
  sectionId: string;
  config: Record<string, unknown>;
}

export interface TutorialContent {
  type: 'tutorial';
  steps: TutorialStep[];
}

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  structureId?: string;
  action?: {
    type: 'rotate' | 'zoom' | 'select' | 'measure' | 'annotate';
    target?: string;
    parameters?: Record<string, unknown>;
  };
  validation?: {
    type: 'manual' | 'automatic';
    criteria?: string;
  };
  order: number;
}

export interface QuizContent {
  type: 'quiz';
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // seconds
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'structure-identification';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  structureId?: string;
  order: number;
}

export interface PathwayContent {
  type: 'pathway';
  moduleSequence: string[]; // ordered module IDs
}

/**
 * Learning Pathway (Collection of Modules)
 */
export interface LearningPathway {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  contentSequence: string[]; // ordered module IDs
  estimatedDuration: number; // total minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  visibility: Visibility;
  isPublished: boolean;
  enrollmentCount: number;
  completionCount: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Progress Tracking
 */
export interface UserProgress {
  userId: string;
  contentId: string;
  completed: boolean;
  progressPercent: number; // 0-100
  timeSpent: number; // seconds
  notes: string | null;
  bookmarks: Bookmark[] | null;
  quizScores: QuizAttempt[] | null;
  startedAt: string;
  completedAt: string | null;
  lastAccessed: string;
}

export interface Bookmark {
  timestamp: number; // seconds for video, step index for tutorial
  note?: string;
  createdAt: string;
}

export interface QuizAttempt {
  attemptId: string;
  score: number; // 0-100
  answers: Record<string, string | string[]>;
  completedAt: string;
  timeSpent: number; // seconds
}

/**
 * Content Review
 */
export interface ContentReview {
  id: string;
  userId: string;
  contentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Request/Response Types
 */
export interface CreateModuleRequest {
  title: string;
  description?: string;
  contentType: ContentType;
  contentData: ModuleContentData;
  thumbnailUrl?: string;
  duration?: number;
  relatedStructures?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites?: string[];
  learningObjectives?: string[];
  tags?: string[];
  visibility?: Visibility;
}

export interface UpdateModuleRequest extends Partial<CreateModuleRequest> {
  isPublished?: boolean;
}

export interface ListModulesFilters {
  contentType?: ContentType;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  structureId?: string;
  creatorId?: string;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'created' | 'updated' | 'popular' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePathwayRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  contentSequence: string[];
  estimatedDuration: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  visibility?: Visibility;
}

export interface UpdateProgressRequest {
  progressPercent?: number;
  timeSpent?: number;
  completed?: boolean;
  notes?: string;
  bookmarks?: Bookmark[];
  quizAttempt?: QuizAttempt;
}

export interface CreateReviewRequest {
  contentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewText?: string;
}

/**
 * Frontend State Types
 */
export interface LearningModuleWithProgress extends LearningModule {
  userProgress?: UserProgress;
  userReview?: ContentReview;
}

export interface PathwayWithModules extends LearningPathway {
  modules: LearningModule[];
  userProgress?: {
    completedModules: string[];
    currentModule: string | null;
    overallProgress: number;
  };
}

/**
 * Error Types
 */
export interface LearningError extends Error {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'PERMISSION_DENIED' | 'NETWORK_ERROR';
  details?: unknown;
}

/**
 * Service Interface
 */
export interface ILearningService {
  // Modules
  listModules(filters?: ListModulesFilters): Promise<LearningModule[]>;
  getModule(id: string): Promise<LearningModule>;
  createModule(data: CreateModuleRequest): Promise<LearningModule>;
  updateModule(id: string, data: UpdateModuleRequest): Promise<LearningModule>;
  deleteModule(id: string): Promise<void>;
  publishModule(id: string): Promise<LearningModule>;

  // Pathways
  listPathways(filters?: { tags?: string[]; difficulty?: number }): Promise<LearningPathway[]>;
  getPathway(id: string): Promise<PathwayWithModules>;
  createPathway(data: CreatePathwayRequest): Promise<LearningPathway>;
  updatePathway(id: string, data: Partial<CreatePathwayRequest>): Promise<LearningPathway>;
  deletePathway(id: string): Promise<void>;

  // Progress
  getUserProgress(contentId: string): Promise<UserProgress | null>;
  updateProgress(contentId: string, data: UpdateProgressRequest): Promise<UserProgress>;
  getPathwayProgress(pathwayId: string): Promise<UserProgress[]>;

  // Reviews
  createReview(data: CreateReviewRequest): Promise<ContentReview>;
  getReviews(contentId: string): Promise<ContentReview[]>;

  // Utilities
  getRelatedContent(moduleId: string): Promise<LearningModule[]>;
  searchContent(query: string, filters?: ListModulesFilters): Promise<LearningModule[]>;
}
