import { z } from 'zod';
import { Level } from '@/types/database';

// Schema validations
export const levelSchema = z.enum(['basic', 'expanded']);

export const colorSchema = z.object({
  id: z.string().uuid(),
  name_es: z.string().min(1),
  name_en: z.string().min(1),
  hex_code: z.string().regex(/^#[0-9A-F]{6}$/i),
  level: levelSchema,
});

export const imageSchema = z.object({
  unsplash_id: z.string().min(1),
  url: z.string().url(),
  photographer: z.string().optional(),
});

export const annotationSchema = z.object({
  image_id: z.string().uuid(),
  color_id: z.string().uuid(),
  description_basic: z.string().min(10).max(500),
  description_expanded: z.string().min(20).max(1000),
  phrases: z.array(z.string()).min(1).max(10),
  confidence_score: z.number().min(0).max(1),
});

export const quizAnswerSchema = z.object({
  quiz_id: z.string().uuid(),
  question_id: z.string(),
  selected_answer: z.string(),
});

export const progressUpdateSchema = z.object({
  color_id: z.string().uuid(),
  mastery_change: z.number().min(-100).max(100),
  is_correct: z.boolean(),
});

/**
 * Validate level
 */
export function validateLevel(level: string): level is Level {
  return level === 'basic' || level === 'expanded';
}

/**
 * Validate hex color
 */
export function validateHexColor(hex: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Validate UUID
 */
export function validateUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Validate mastery level
 */
export function validateMasteryLevel(level: number): boolean {
  return level >= 0 && level <= 100 && Number.isInteger(level);
}

/**
 * Validate confidence score
 */
export function validateConfidenceScore(score: number): boolean {
  return score >= 0 && score <= 1;
}
