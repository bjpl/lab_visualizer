/**
 * React Hooks for MD Simulation Management
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  SimulationMonitor,
  SimulationProgress,
  SimulationComplete,
  SimulationError
} from '@/services/simulation-monitor';
import { MDJob, JobStatus, ServerlessMDConfig } from '@/types/md-types';

export interface UseSimulationOptions {
  jobId: string;
  autoStart?: boolean;
}

export interface UseSimulationResult {
  job: MDJob | null;
  progress: number;
  estimatedTimeRemaining: number;
  status: JobStatus;
  error: string | null;
  isRunning: boolean;
  isComplete: boolean;
  trajectoryUrl: string | null;
  energyUrl: string | null;
  cancel: () => Promise<void>;
  retry: () => Promise<void>;
  downloadTrajectory: () => Promise<Blob>;
  downloadEnergyData: () => Promise<any>;
}

/**
 * Hook for monitoring a specific simulation job
 */
export function useSimulation(options: UseSimulationOptions): UseSimulationResult {
  const { jobId, autoStart = true } = options;
  const [job, setJob] = useState<MDJob | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [status, setStatus] = useState<JobStatus>(JobStatus.PENDING);
  const [error, setError] = useState<string | null>(null);
  const [trajectoryUrl, setTrajectoryUrl] = useState<string | null>(null);
  const [energyUrl, setEnergyUrl] = useState<string | null>(null);
  const [monitor] = useState(() => new SimulationMonitor());

  // Fetch initial job status
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const jobData = await monitor.getJobStatus(jobId);
        setJob(jobData as MDJob);
        setStatus(jobData.status as JobStatus);
        setProgress(jobData.progress || 0);
        setEstimatedTimeRemaining(jobData.estimated_time_remaining || 0);
        setTrajectoryUrl(jobData.result_url || null);
        setEnergyUrl(jobData.energy_plot_url || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
      }
    };

    fetchJob();
  }, [jobId, monitor]);

  // Subscribe to updates
  useEffect(() => {
    if (!autoStart) return;

    monitor.subscribe(jobId, {
      onProgress: (progressData: SimulationProgress) => {
        setProgress(progressData.progress);
        setEstimatedTimeRemaining(progressData.estimatedTimeRemaining);
        setStatus(progressData.status as JobStatus);
      },
      onComplete: (result: SimulationComplete) => {
        setProgress(100);
        setStatus(JobStatus.COMPLETED);
        setTrajectoryUrl(result.trajectoryUrl);
        setEnergyUrl(result.energyUrl);
      },
      onError: (errorData: SimulationError) => {
        setStatus(JobStatus.FAILED);
        setError(errorData.error);
      }
    });

    return () => {
      monitor.unsubscribe();
    };
  }, [jobId, autoStart, monitor]);

  // Cancel simulation
  const cancel = useCallback(async () => {
    try {
      await monitor.cancelSimulation(jobId);
      setStatus(JobStatus.CANCELLED);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel simulation');
    }
  }, [jobId, monitor]);

  // Retry failed simulation
  const retry = useCallback(async () => {
    // TODO: Implement retry logic
    console.log('Retry not implemented yet');
  }, []);

  // Download trajectory
  const downloadTrajectory = useCallback(async () => {
    return monitor.downloadTrajectory(jobId);
  }, [jobId, monitor]);

  // Download energy data
  const downloadEnergyData = useCallback(async () => {
    return monitor.downloadEnergyData(jobId);
  }, [jobId, monitor]);

  return {
    job,
    progress,
    estimatedTimeRemaining,
    status,
    error,
    isRunning: status === JobStatus.RUNNING,
    isComplete: status === JobStatus.COMPLETED,
    trajectoryUrl,
    energyUrl,
    cancel,
    retry,
    downloadTrajectory,
    downloadEnergyData
  };
}

/**
 * Hook for submitting new simulation jobs
 */
export function useSimulationSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const submit = useCallback(async (
    config: ServerlessMDConfig,
    structureData: string,
    userId: string
  ): Promise<string> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Call Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('md-simulation', {
        body: {
          jobId: generateJobId(),
          structureData,
          config,
          userId
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data.jobId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit simulation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [supabase]);

  return {
    submit,
    isSubmitting,
    error
  };
}

/**
 * Hook for managing user's simulation quota
 */
export function useSimulationQuota(userId: string) {
  const [quota, setQuota] = useState({
    daily: 5,
    used: 0,
    remaining: 5
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        // Get today's simulation count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
          .from('md_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString());

        if (error) {
          throw error;
        }

        const used = count || 0;
        const remaining = Math.max(0, 5 - used);

        setQuota({
          daily: 5,
          used,
          remaining
        });
      } catch (err) {
        console.error('Failed to fetch quota:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
  }, [userId, supabase]);

  return {
    quota,
    loading,
    hasQuota: quota.remaining > 0
  };
}

// Helper function
function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `md-job-${timestamp}-${random}`;
}
