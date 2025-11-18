/**
 * Authentication Type Definitions
 * Types for authentication errors and responses
 */

import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

/**
 * Normalized authentication error
 * Provides consistent error handling across the application
 */
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Authentication response with potential error
 */
export interface AuthResponse {
  error: AuthError | null;
}

/**
 * Helper to convert Supabase auth errors to our auth error type
 */
export function normalizeAuthError(error: unknown): AuthError | null {
  if (!error) return null;

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const authError = error as Partial<SupabaseAuthError>;
    return {
      message: authError.message || 'An authentication error occurred',
      code: authError.code,
      status: authError.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unknown authentication error occurred',
  };
}
