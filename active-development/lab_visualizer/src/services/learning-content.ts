/**
 * Learning Content Service
 * Manages educational modules, pathways, and progress tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import type {
  ILearningService,
  LearningModule,
  LearningPathway,
  PathwayWithModules,
  UserProgress,
  ContentReview,
  CreateModuleRequest,
  UpdateModuleRequest,
  ListModulesFilters,
  CreatePathwayRequest,
  UpdateProgressRequest,
  CreateReviewRequest,
  LearningError,
} from '@/types/learning';

class LearningContentService implements ILearningService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  /**
   * List learning modules with filters
   */
  async listModules(filters: ListModulesFilters = {}): Promise<LearningModule[]> {
    try {
      let query = this.supabase
        .from('learning_content')
        .select('*');

      // Apply filters
      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.structureId) {
        query = query.contains('related_structures', [filters.structureId]);
      }
      if (filters.creatorId) {
        query = query.eq('creator_id', filters.creatorId);
      }
      if (filters.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }

      // Sorting
      const sortBy = filters.sortBy || 'created';
      const sortOrder = filters.sortOrder || 'desc';

      if (sortBy === 'popular') {
        query = query.order('view_count', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'rating') {
        query = query.order('avg_rating', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'updated') {
        query = query.order('updated_at', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToLearningModule);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get single module by ID
   */
  async getModule(id: string): Promise<LearningModule> {
    try {
      const { data, error } = await this.supabase
        .from('learning_content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw this.createError('NOT_FOUND', `Module ${id} not found`, error);
      if (!data) throw this.createError('NOT_FOUND', `Module ${id} not found`);

      // Increment view count
      await this.incrementViewCount(id);

      return this.mapToLearningModule(data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new learning module
   */
  async createModule(data: CreateModuleRequest): Promise<LearningModule> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in to create modules');

      const { data: module, error } = await this.supabase
        .from('learning_content')
        .insert({
          creator_id: user.id,
          title: data.title,
          description: data.description || null,
          content_type: data.contentType,
          content_data: data.contentData as any,
          thumbnail_url: data.thumbnailUrl || null,
          duration: data.duration || null,
          related_structures: data.relatedStructures || [],
          difficulty: data.difficulty,
          prerequisites: data.prerequisites || [],
          learning_objectives: data.learningObjectives || [],
          tags: data.tags || [],
          visibility: data.visibility || 'private',
        })
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!module) throw this.createError('NETWORK_ERROR', 'Failed to create module');

      return this.mapToLearningModule(module);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update existing module
   */
  async updateModule(id: string, data: UpdateModuleRequest): Promise<LearningModule> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      // Check ownership
      const { data: existing } = await this.supabase
        .from('learning_content')
        .select('creator_id')
        .eq('id', id)
        .single();

      if (!existing) throw this.createError('NOT_FOUND', `Module ${id} not found`);
      if (existing.creator_id !== user.id) {
        throw this.createError('PERMISSION_DENIED', 'You do not own this module');
      }

      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.contentType) updateData.content_type = data.contentType;
      if (data.contentData) updateData.content_data = data.contentData;
      if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.relatedStructures) updateData.related_structures = data.relatedStructures;
      if (data.difficulty) updateData.difficulty = data.difficulty;
      if (data.prerequisites) updateData.prerequisites = data.prerequisites;
      if (data.learningObjectives) updateData.learning_objectives = data.learningObjectives;
      if (data.tags) updateData.tags = data.tags;
      if (data.visibility) updateData.visibility = data.visibility;
      if (data.isPublished !== undefined) {
        updateData.is_published = data.isPublished;
        if (data.isPublished) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data: updated, error } = await this.supabase
        .from('learning_content')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!updated) throw this.createError('NETWORK_ERROR', 'Failed to update module');

      return this.mapToLearningModule(updated);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete module
   */
  async deleteModule(id: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      // Check ownership
      const { data: existing } = await this.supabase
        .from('learning_content')
        .select('creator_id')
        .eq('id', id)
        .single();

      if (!existing) throw this.createError('NOT_FOUND', `Module ${id} not found`);
      if (existing.creator_id !== user.id) {
        throw this.createError('PERMISSION_DENIED', 'You do not own this module');
      }

      const { error } = await this.supabase
        .from('learning_content')
        .delete()
        .eq('id', id);

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Publish module
   */
  async publishModule(id: string): Promise<LearningModule> {
    return this.updateModule(id, { isPublished: true });
  }

  /**
   * List learning pathways
   */
  async listPathways(filters: { tags?: string[]; difficulty?: number } = {}): Promise<LearningPathway[]> {
    try {
      let query = this.supabase
        .from('learning_pathways')
        .select('*')
        .eq('is_published', true);

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToLearningPathway);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get pathway with full module details
   */
  async getPathway(id: string): Promise<PathwayWithModules> {
    try {
      const { data: pathway, error: pathwayError } = await this.supabase
        .from('learning_pathways')
        .select('*')
        .eq('id', id)
        .single();

      if (pathwayError || !pathway) {
        throw this.createError('NOT_FOUND', `Pathway ${id} not found`, pathwayError);
      }

      // Fetch all modules in the pathway
      const { data: modules, error: modulesError } = await this.supabase
        .from('learning_content')
        .select('*')
        .in('id', pathway.content_sequence);

      if (modulesError) {
        throw this.createError('NETWORK_ERROR', modulesError.message, modulesError);
      }

      // Maintain order from content_sequence
      const orderedModules = pathway.content_sequence
        .map(id => modules?.find(m => m.id === id))
        .filter(Boolean)
        .map(this.mapToLearningModule);

      // Get user progress if authenticated
      const { data: { user } } = await this.supabase.auth.getUser();
      let userProgress: { completedModules: string[]; currentModule: string | null; overallProgress: number } | undefined;

      if (user) {
        const { data: progress } = await this.supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('content_id', pathway.content_sequence);

        const completedModules = (progress || [])
          .filter(p => p.completed)
          .map(p => p.content_id);

        const currentModule = pathway.content_sequence.find(id => !completedModules.includes(id)) || null;
        const overallProgress = (completedModules.length / pathway.content_sequence.length) * 100;

        userProgress = { completedModules, currentModule, overallProgress };
      }

      return {
        ...this.mapToLearningPathway(pathway),
        modules: orderedModules,
        userProgress,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create pathway
   */
  async createPathway(data: CreatePathwayRequest): Promise<LearningPathway> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      const { data: pathway, error } = await this.supabase
        .from('learning_pathways')
        .insert({
          creator_id: user.id,
          title: data.title,
          description: data.description || null,
          thumbnail_url: data.thumbnailUrl || null,
          content_sequence: data.contentSequence,
          estimated_duration: data.estimatedDuration,
          difficulty: data.difficulty,
          tags: data.tags || [],
          visibility: data.visibility || 'private',
        })
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!pathway) throw this.createError('NETWORK_ERROR', 'Failed to create pathway');

      return this.mapToLearningPathway(pathway);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update pathway
   */
  async updatePathway(id: string, data: Partial<CreatePathwayRequest>): Promise<LearningPathway> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      const { data: updated, error } = await this.supabase
        .from('learning_pathways')
        .update(data as any)
        .eq('id', id)
        .eq('creator_id', user.id)
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!updated) throw this.createError('PERMISSION_DENIED', 'Pathway not found or unauthorized');

      return this.mapToLearningPathway(updated);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete pathway
   */
  async deletePathway(id: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      const { error } = await this.supabase
        .from('learning_pathways')
        .delete()
        .eq('id', id)
        .eq('creator_id', user.id);

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user progress for a module
   */
  async getUserProgress(contentId: string): Promise<UserProgress | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw this.createError('NETWORK_ERROR', error.message, error);
      }

      return data ? this.mapToUserProgress(data) : null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user progress
   */
  async updateProgress(contentId: string, data: UpdateProgressRequest): Promise<UserProgress> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      // Get existing progress
      const existing = await this.getUserProgress(contentId);

      const updateData: any = {
        user_id: user.id,
        content_id: contentId,
        last_accessed: new Date().toISOString(),
      };

      if (data.progressPercent !== undefined) updateData.progress_percent = data.progressPercent;
      if (data.timeSpent !== undefined) {
        updateData.time_spent = (existing?.timeSpent || 0) + data.timeSpent;
      }
      if (data.completed !== undefined) {
        updateData.completed = data.completed;
        if (data.completed) {
          updateData.completed_at = new Date().toISOString();
          // Increment completion count
          await this.incrementCompletionCount(contentId);
        }
      }
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.bookmarks !== undefined) updateData.bookmarks = data.bookmarks;
      if (data.quizAttempt) {
        const scores = existing?.quizScores || [];
        updateData.quiz_scores = [...scores, data.quizAttempt];
      }

      const { data: progress, error } = await this.supabase
        .from('user_progress')
        .upsert(updateData)
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!progress) throw this.createError('NETWORK_ERROR', 'Failed to update progress');

      return this.mapToUserProgress(progress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all progress for a pathway
   */
  async getPathwayProgress(pathwayId: string): Promise<UserProgress[]> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return [];

      const pathway = await this.getPathway(pathwayId);

      const { data, error } = await this.supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('content_id', pathway.contentSequence);

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToUserProgress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create content review
   */
  async createReview(data: CreateReviewRequest): Promise<ContentReview> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw this.createError('UNAUTHORIZED', 'Must be logged in');

      const { data: review, error } = await this.supabase
        .from('content_reviews')
        .insert({
          user_id: user.id,
          content_id: data.contentId,
          rating: data.rating,
          review_text: data.reviewText || null,
        })
        .select()
        .single();

      if (error) throw this.createError('VALIDATION_ERROR', error.message, error);
      if (!review) throw this.createError('NETWORK_ERROR', 'Failed to create review');

      return this.mapToContentReview(review);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get reviews for content
   */
  async getReviews(contentId: string): Promise<ContentReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_reviews')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToContentReview);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get related content based on tags and difficulty
   */
  async getRelatedContent(moduleId: string): Promise<LearningModule[]> {
    try {
      const module = await this.getModule(moduleId);

      const { data, error } = await this.supabase
        .from('learning_content')
        .select('*')
        .overlaps('tags', module.tags)
        .eq('difficulty', module.difficulty)
        .eq('is_published', true)
        .neq('id', moduleId)
        .limit(5);

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToLearningModule);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search content
   */
  async searchContent(query: string, filters: ListModulesFilters = {}): Promise<LearningModule[]> {
    try {
      let dbQuery = this.supabase
        .from('learning_content')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_published', true);

      if (filters.contentType) dbQuery = dbQuery.eq('content_type', filters.contentType);
      if (filters.difficulty) dbQuery = dbQuery.eq('difficulty', filters.difficulty);
      if (filters.tags) dbQuery = dbQuery.overlaps('tags', filters.tags);

      dbQuery = dbQuery.limit(filters.limit || 20);

      const { data, error } = await dbQuery;

      if (error) throw this.createError('NETWORK_ERROR', error.message, error);

      return (data || []).map(this.mapToLearningModule);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Helper: Increment view count
   */
  private async incrementViewCount(contentId: string): Promise<void> {
    await this.supabase.rpc('increment', {
      table_name: 'learning_content',
      column_name: 'view_count',
      row_id: contentId,
    });
  }

  /**
   * Helper: Increment completion count
   */
  private async incrementCompletionCount(contentId: string): Promise<void> {
    await this.supabase.rpc('increment', {
      table_name: 'learning_content',
      column_name: 'completion_count',
      row_id: contentId,
    });
  }

  /**
   * Type mappers
   */
  private mapToLearningModule(data: any): LearningModule {
    return {
      id: data.id,
      creatorId: data.creator_id,
      title: data.title,
      description: data.description,
      contentType: data.content_type,
      contentData: data.content_data,
      thumbnailUrl: data.thumbnail_url,
      duration: data.duration,
      relatedStructures: data.related_structures || [],
      difficulty: data.difficulty,
      prerequisites: data.prerequisites || [],
      learningObjectives: data.learning_objectives || [],
      tags: data.tags || [],
      visibility: data.visibility,
      isPublished: data.is_published,
      viewCount: data.view_count || 0,
      completionCount: data.completion_count || 0,
      avgRating: parseFloat(data.avg_rating || '0'),
      ratingCount: data.rating_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
    };
  }

  private mapToLearningPathway(data: any): LearningPathway {
    return {
      id: data.id,
      creatorId: data.creator_id,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      contentSequence: data.content_sequence || [],
      estimatedDuration: data.estimated_duration || 0,
      difficulty: data.difficulty,
      tags: data.tags || [],
      visibility: data.visibility,
      isPublished: data.is_published,
      enrollmentCount: data.enrollment_count || 0,
      completionCount: data.completion_count || 0,
      avgRating: parseFloat(data.avg_rating || '0'),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToUserProgress(data: any): UserProgress {
    return {
      userId: data.user_id,
      contentId: data.content_id,
      completed: data.completed,
      progressPercent: data.progress_percent || 0,
      timeSpent: data.time_spent || 0,
      notes: data.notes,
      bookmarks: data.bookmarks,
      quizScores: data.quiz_scores,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      lastAccessed: data.last_accessed,
    };
  }

  private mapToContentReview(data: any): ContentReview {
    return {
      id: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      rating: data.rating,
      reviewText: data.review_text,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Error handling
   */
  private createError(code: LearningError['code'], message: string, details?: unknown): LearningError {
    const error = new Error(message) as LearningError;
    error.name = 'LearningError';
    error.code = code;
    error.details = details;
    return error;
  }

  private handleError(error: unknown): LearningError {
    if ((error as LearningError).name === 'LearningError') {
      return error as LearningError;
    }
    return this.createError('NETWORK_ERROR', 'An unexpected error occurred', error);
  }
}

// Export singleton
export const learningContentService = new LearningContentService();
export default learningContentService;
