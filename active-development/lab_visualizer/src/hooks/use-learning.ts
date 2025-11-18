/**
 * useLearning Hook
 * React hook for managing learning content and progress
 */

import { useState, useEffect, useCallback } from 'react';

import type {
  LearningModule,
  LearningPathway,
  PathwayWithModules,
  UserProgress,
  ContentReview,
  ListModulesFilters,
  CreateModuleRequest,
  UpdateProgressRequest,
} from '@/types/learning';

export interface UseLearningModulesReturn {
  modules: LearningModule[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseLearningModuleReturn {
  module: LearningModule | null;
  progress: UserProgress | null;
  reviews: ContentReview[];
  relatedContent: LearningModule[];
  loading: boolean;
  error: string | null;
  updateProgress: (data: UpdateProgressRequest) => Promise<void>;
  markComplete: () => Promise<void>;
  addBookmark: (timestamp: number, note?: string) => Promise<void>;
  submitQuiz: (score: number, answers: Record<string, string | string[]>) => Promise<void>;
}

export interface UseLearningPathwayReturn {
  pathway: PathwayWithModules | null;
  loading: boolean;
  error: string | null;
  nextModule: LearningModule | null;
  progressPercent: number;
}

/**
 * Hook for listing and filtering learning modules
 */
export function useLearningModules(filters?: ListModulesFilters): UseLearningModulesReturn {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.contentType) params.append('contentType', filters.contentType);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
      if (filters?.tags) params.append('tags', filters.tags.join(','));
      if (filters?.structureId) params.append('structureId', filters.structureId);
      if (filters?.creatorId) params.append('creatorId', filters.creatorId);
      if (filters?.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/learning/modules?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch modules');
      }

      setModules(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    modules,
    loading,
    error,
    refetch: fetchModules,
  };
}

/**
 * Hook for a single learning module with progress tracking
 */
export function useLearningModule(moduleId: string | null): UseLearningModuleReturn {
  const [module, setModule] = useState<LearningModule | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [relatedContent, setRelatedContent] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModule = useCallback(async () => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeProgress: 'true',
        includeReviews: 'true',
        includeRelated: 'true',
      });

      const response = await fetch(`/api/learning/modules/${moduleId}?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch module');
      }

      setModule(result.data.module);
      setProgress(result.data.userProgress || null);
      setReviews(result.data.reviews || []);
      setRelatedContent(result.data.relatedContent || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching module:', err);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  const updateProgress = useCallback(async (data: UpdateProgressRequest) => {
    if (!moduleId) return;

    try {
      const response = await fetch(`/api/learning/progress?contentId=${moduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update progress');
      }

      setProgress(result.data);
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  }, [moduleId]);

  const markComplete = useCallback(async () => {
    await updateProgress({ completed: true, progressPercent: 100 });
  }, [updateProgress]);

  const addBookmark = useCallback(async (timestamp: number, note?: string) => {
    const newBookmark = {
      timestamp,
      note,
      createdAt: new Date().toISOString(),
    };

    const existingBookmarks = progress?.bookmarks || [];
    await updateProgress({
      bookmarks: [...existingBookmarks, newBookmark],
    });
  }, [progress, updateProgress]);

  const submitQuiz = useCallback(async (score: number, answers: Record<string, string | string[]>) => {
    const quizAttempt = {
      attemptId: `attempt-${Date.now()}`,
      score,
      answers,
      completedAt: new Date().toISOString(),
      timeSpent: 0, // Track separately if needed
    };

    await updateProgress({
      quizAttempt,
      completed: score >= 70, // Assuming 70% passing score
    });
  }, [updateProgress]);

  return {
    module,
    progress,
    reviews,
    relatedContent,
    loading,
    error,
    updateProgress,
    markComplete,
    addBookmark,
    submitQuiz,
  };
}

/**
 * Hook for learning pathways with progress
 */
export function useLearningPathway(pathwayId: string | null): UseLearningPathwayReturn {
  const [pathway, setPathway] = useState<PathwayWithModules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pathwayId) {
      setLoading(false);
      return;
    }

    const fetchPathway = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/learning/pathways/${pathwayId}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch pathway');
        }

        setPathway(result.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching pathway:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPathway();
  }, [pathwayId]);

  const nextModule = pathway?.modules.find(
    m => !pathway.userProgress?.completedModules.includes(m.id)
  ) || null;

  const progressPercent = pathway?.userProgress?.overallProgress || 0;

  return {
    pathway,
    loading,
    error,
    nextModule,
    progressPercent,
  };
}

/**
 * Hook for searching learning content
 */
export function useSearchLearning(query: string, filters?: ListModulesFilters) {
  const [results, setResults] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ q: query });
        if (filters?.contentType) params.append('contentType', filters.contentType);
        if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
        if (filters?.tags) params.append('tags', filters.tags.join(','));

        const response = await fetch(`/api/learning/search?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Search failed');
        }

        setResults(result.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error searching learning content:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [query, filters]);

  return { results, loading, error };
}
