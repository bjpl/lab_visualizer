/**
 * useJobQueue Hook - Job queue management
 *
 * Features:
 * - Job submission
 * - Job status queries
 * - Queue statistics
 * - Optimistic updates
 * - Integration with Zustand store
 */

import { useState, useCallback } from 'react';
import { jobQueue, JobSubmission } from '@/services/job-queue';
import { MDJob, JobStatus } from '@/types/md-types';
import { useStore } from '@/stores';

export function useJobQueue() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createJob, updateJob, deleteJob } = useStore((state) => ({
    createJob: state.createJob,
    updateJob: state.updateJob,
    deleteJob: state.deleteJob,
  }));

  /**
   * Submit a new simulation job
   */
  const submitJob = useCallback(async (submission: JobSubmission): Promise<MDJob | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create optimistic job in store
      const tempJobId = createJob({
        type: 'md',
        name: `MD Simulation - ${submission.structureId}`,
        estimatedTime: submission.config.totalTime * 1000, // Convert to ms
        parameters: submission.config,
      });

      // Submit to queue service
      const job = await jobQueue.submitJob(submission);

      // Update store with real job data
      updateJob(tempJobId, {
        id: job.id,
        status: job.status as any,
      });

      return job;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit job';
      setError(message);
      console.error('[useJobQueue] Submit failed:', err);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [createJob, updateJob]);

  /**
   * Cancel a running job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      await jobQueue.cancelJob(jobId);
      updateJob(jobId, { status: 'cancelled' });
      return true;
    } catch (err) {
      console.error('[useJobQueue] Cancel failed:', err);
      return false;
    }
  }, [updateJob]);

  /**
   * Delete a completed job
   */
  const removeJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      deleteJob(jobId);
      return true;
    } catch (err) {
      console.error('[useJobQueue] Delete failed:', err);
      return false;
    }
  }, [deleteJob]);

  /**
   * Retry a failed job
   */
  const retryJob = useCallback(async (jobId: string): Promise<MDJob | null> => {
    try {
      const job = await jobQueue.getJob(jobId);
      if (!job) throw new Error('Job not found');

      // Create new submission from existing job
      const submission: JobSubmission = {
        config: job.config,
        structureId: job.structureId,
        structureData: job.structureData,
        userId: job.userId,
      };

      return await submitJob(submission);
    } catch (err) {
      console.error('[useJobQueue] Retry failed:', err);
      return null;
    }
  }, [submitJob]);

  /**
   * Query jobs with filters
   */
  const queryJobs = useCallback(async (
    filters: { userId?: string; status?: JobStatus; limit?: number }
  ): Promise<MDJob[]> => {
    try {
      return await jobQueue.queryJobs(filters);
    } catch (err) {
      console.error('[useJobQueue] Query failed:', err);
      return [];
    }
  }, []);

  /**
   * Get queue statistics
   */
  const getQueueStats = useCallback(async () => {
    try {
      return await jobQueue.getQueueStats();
    } catch (err) {
      console.error('[useJobQueue] Stats failed:', err);
      return null;
    }
  }, []);

  return {
    submitJob,
    cancelJob,
    removeJob,
    retryJob,
    queryJobs,
    getQueueStats,
    isSubmitting,
    error,
  };
}
