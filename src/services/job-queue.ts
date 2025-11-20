/**
 * Job Queue Service - Serverless MD Simulation Management
 * Tier 2: Serverless OpenMM simulations via Supabase Edge Functions
 */

import {
  MDJob,
  JobStatus,
  ServerlessMDConfig,
  MDResult,
  MDTier
} from '../types/md-types';

export interface JobQueueConfig {
  supabaseUrl: string;
  supabaseKey: string;
  pollingInterval?: number;  // milliseconds
  maxRetries?: number;
}

export interface JobSubmission {
  config: ServerlessMDConfig;
  structureId: string;
  structureData: string;
  userId: string;
}

export interface JobQueryOptions {
  userId?: string;
  status?: JobStatus;
  limit?: number;
  offset?: number;
}

export class JobQueueService {
  private static instance: JobQueueService;
  private config: JobQueueConfig | null = null;
  private pollingTimers = new Map<string, NodeJS.Timeout>();

  private constructor() {}

  static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Initialize service with Supabase credentials
   */
  initialize(config: JobQueueConfig): void {
    this.config = {
      pollingInterval: 5000,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Submit simulation job to queue
   */
  async submitJob(submission: JobSubmission): Promise<MDJob> {
    this.ensureInitialized();

    // Validate submission
    this.validateSubmission(submission);

    const job: MDJob = {
      id: this.generateJobId(),
      userId: submission.userId,
      status: JobStatus.PENDING,
      config: submission.config,
      structureId: submission.structureId,
      structureData: submission.structureData,
      createdAt: new Date(),
      progress: 0
    };

    // TODO: Submit to Supabase via Edge Function
    console.log('Submitting job to queue:', job.id);

    // Simulate submission
    await this.submitToSupabase(job);

    return job;
  }

  /**
   * Get job status by ID
   */
  async getJob(jobId: string): Promise<MDJob | null> {
    this.ensureInitialized();

    try {
      const response = await fetch(
        `${this.config!.supabaseUrl}/rest/v1/md_jobs?id=eq.${jobId}&select=*`,
        {
          headers: {
            'apikey': this.config!.supabaseKey,
            'Authorization': `Bearer ${this.config!.supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job: ${response.statusText}`);
      }

      const jobs = await response.json();

      if (!jobs || jobs.length === 0) {
        return null;
      }

      const jobData = jobs[0];

      return {
        id: jobData.id,
        userId: jobData.user_id,
        status: jobData.status as JobStatus,
        config: jobData.config,
        structureId: jobData.structure_id,
        structureData: jobData.structure_data || '',
        createdAt: new Date(jobData.created_at),
        startedAt: jobData.started_at ? new Date(jobData.started_at) : undefined,
        completedAt: jobData.completed_at ? new Date(jobData.completed_at) : undefined,
        progress: jobData.progress,
        resultUrl: jobData.result_url,
        errorMessage: jobData.error_message,
      };
    } catch (error) {
      console.error('Failed to fetch job:', error);
      throw error;
    }
  }

  /**
   * Query jobs with filters
   */
  async queryJobs(options: JobQueryOptions): Promise<MDJob[]> {
    this.ensureInitialized();

    try {
      // Build query string with filters
      const params = new URLSearchParams();
      params.append('select', '*');

      if (options.userId) {
        params.append('user_id', `eq.${options.userId}`);
      }

      if (options.status) {
        params.append('status', `eq.${options.status}`);
      }

      if (options.limit) {
        params.append('limit', options.limit.toString());
      }

      if (options.offset) {
        params.append('offset', options.offset.toString());
      }

      // Order by created date descending
      params.append('order', 'created_at.desc');

      const response = await fetch(
        `${this.config!.supabaseUrl}/rest/v1/md_jobs?${params.toString()}`,
        {
          headers: {
            'apikey': this.config!.supabaseKey,
            'Authorization': `Bearer ${this.config!.supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to query jobs: ${response.statusText}`);
      }

      const jobsData = await response.json();

      return jobsData.map((jobData: any) => ({
        id: jobData.id,
        userId: jobData.user_id,
        status: jobData.status as JobStatus,
        config: jobData.config,
        structureId: jobData.structure_id,
        structureData: jobData.structure_data || '',
        createdAt: new Date(jobData.created_at),
        startedAt: jobData.started_at ? new Date(jobData.started_at) : undefined,
        completedAt: jobData.completed_at ? new Date(jobData.completed_at) : undefined,
        progress: jobData.progress,
        resultUrl: jobData.result_url,
        errorMessage: jobData.error_message,
      }));
    } catch (error) {
      console.error('Failed to query jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel running job
   */
  async cancelJob(jobId: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Update job status to CANCELLED
      const response = await fetch(
        `${this.config!.supabaseUrl}/rest/v1/md_jobs?id=eq.${jobId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config!.supabaseKey,
            'Authorization': `Bearer ${this.config!.supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            status: JobStatus.CANCELLED,
            completed_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel job: ${response.statusText}`);
      }

      console.log('Job cancelled:', jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    } finally {
      // Stop polling if active
      this.stopPolling(jobId);
    }
  }

  /**
   * Get job result
   */
  async getJobResult(jobId: string): Promise<MDResult | null> {
    this.ensureInitialized();

    const job = await this.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new Error(`Job ${jobId} not completed (status: ${job.status})`);
    }

    if (!job.resultUrl) {
      throw new Error(`Job ${jobId} has no result URL`);
    }

    try {
      // Fetch result from Supabase Storage
      const response = await fetch(job.resultUrl, {
        headers: {
          'apikey': this.config!.supabaseKey,
          'Authorization': `Bearer ${this.config!.supabaseKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch result: ${response.statusText}`);
      }

      const resultData = await response.json();

      return resultData as MDResult;
    } catch (error) {
      console.error('Failed to fetch job result:', error);
      throw error;
    }
  }

  /**
   * Poll job status until completion
   */
  async pollJob(
    jobId: string,
    onProgress?: (job: MDJob) => void
  ): Promise<MDJob> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const job = await this.getJob(jobId);

          if (!job) {
            this.stopPolling(jobId);
            reject(new Error(`Job ${jobId} not found`));
            return;
          }

          onProgress?.(job);

          // Check terminal states
          if (job.status === JobStatus.COMPLETED) {
            this.stopPolling(jobId);
            resolve(job);
          } else if (
            job.status === JobStatus.FAILED ||
            job.status === JobStatus.CANCELLED
          ) {
            this.stopPolling(jobId);
            reject(new Error(`Job ${jobId} ${job.status}: ${job.errorMessage}`));
          }
        } catch (error) {
          this.stopPolling(jobId);
          reject(error);
        }
      };

      // Start polling
      const interval = this.config?.pollingInterval || 5000;
      const timer = setInterval(poll, interval);
      this.pollingTimers.set(jobId, timer);

      // Initial poll
      poll();
    });
  }

  /**
   * Stop polling for job
   */
  stopPolling(jobId: string): void {
    const timer = this.pollingTimers.get(jobId);
    if (timer) {
      clearInterval(timer);
      this.pollingTimers.delete(jobId);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    queued: number;
    running: number;
    completed: number;
    failed: number;
    averageWaitTime: number;
    averageProcessingTime: number;
  }> {
    this.ensureInitialized();

    try {
      // Query job counts by status
      const countResponse = await fetch(
        `${this.config!.supabaseUrl}/rest/v1/md_jobs?select=status`,
        {
          headers: {
            'apikey': this.config!.supabaseKey,
            'Authorization': `Bearer ${this.config!.supabaseKey}`,
          },
        }
      );

      if (!countResponse.ok) {
        throw new Error(`Failed to fetch job counts: ${countResponse.statusText}`);
      }

      const jobs = await countResponse.json();

      // Count jobs by status
      const statusCounts = jobs.reduce((acc: any, job: any) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      // Query for timing statistics (only completed jobs)
      const timingResponse = await fetch(
        `${this.config!.supabaseUrl}/rest/v1/md_jobs?status=eq.${JobStatus.COMPLETED}&select=created_at,started_at,completed_at`,
        {
          headers: {
            'apikey': this.config!.supabaseKey,
            'Authorization': `Bearer ${this.config!.supabaseKey}`,
          },
        }
      );

      let averageWaitTime = 0;
      let averageProcessingTime = 0;

      if (timingResponse.ok) {
        const completedJobs = await timingResponse.json();

        if (completedJobs.length > 0) {
          const waitTimes: number[] = [];
          const processingTimes: number[] = [];

          completedJobs.forEach((job: any) => {
            if (job.created_at && job.started_at && job.completed_at) {
              const created = new Date(job.created_at).getTime();
              const started = new Date(job.started_at).getTime();
              const completed = new Date(job.completed_at).getTime();

              waitTimes.push(started - created);
              processingTimes.push(completed - started);
            }
          });

          if (waitTimes.length > 0) {
            averageWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
          }

          if (processingTimes.length > 0) {
            averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
          }
        }
      }

      return {
        pending: statusCounts[JobStatus.PENDING] || 0,
        queued: statusCounts[JobStatus.QUEUED] || 0,
        running: statusCounts[JobStatus.RUNNING] || 0,
        completed: statusCounts[JobStatus.COMPLETED] || 0,
        failed: statusCounts[JobStatus.FAILED] || 0,
        averageWaitTime: Math.round(averageWaitTime / 1000), // Convert to seconds
        averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
      };
    } catch (error) {
      console.error('Failed to fetch queue statistics:', error);

      // Return zeros on error
      return {
        pending: 0,
        queued: 0,
        running: 0,
        completed: 0,
        failed: 0,
        averageWaitTime: 0,
        averageProcessingTime: 0,
      };
    }
  }

  /**
   * Estimate queue wait time
   */
  async estimateWaitTime(priority: 'low' | 'normal' | 'high'): Promise<number> {
    this.ensureInitialized();

    const stats = await this.getQueueStats();

    // Simple estimation based on queue length
    const queueLength = stats.pending + stats.queued;
    const avgProcessingTime = stats.averageProcessingTime || 60;

    const priorityMultiplier = {
      low: 2.0,
      normal: 1.0,
      high: 0.5
    };

    return queueLength * avgProcessingTime * priorityMultiplier[priority];
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.config) {
      throw new Error('JobQueueService not initialized. Call initialize() first.');
    }
  }

  private validateSubmission(submission: JobSubmission): void {
    if (submission.config.tier !== MDTier.SERVERLESS) {
      throw new Error('Job queue only handles serverless tier simulations');
    }

    if (submission.config.atomCount > submission.config.maxAtoms) {
      throw new Error(
        `Atom count ${submission.config.atomCount} exceeds ` +
        `serverless tier limit of ${submission.config.maxAtoms}`
      );
    }

    if (!submission.structureData || submission.structureData.trim() === '') {
      throw new Error('Structure data is required');
    }

    if (!submission.userId) {
      throw new Error('User ID is required');
    }
  }

  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `md-job-${timestamp}-${random}`;
  }

  private async submitToSupabase(job: MDJob): Promise<void> {
    if (!this.config) {
      throw new Error('Service not initialized');
    }

    try {
      // 1. Insert job record into 'md_jobs' table
      const jobRecord = {
        id: job.id,
        user_id: job.userId,
        status: job.status,
        config: job.config,
        structure_id: job.structureId,
        created_at: job.createdAt.toISOString(),
        progress: job.progress,
      };

      const insertResponse = await fetch(`${this.config.supabaseUrl}/rest/v1/md_jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.supabaseKey,
          'Authorization': `Bearer ${this.config.supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(jobRecord),
      });

      if (!insertResponse.ok) {
        throw new Error(`Failed to insert job record: ${insertResponse.statusText}`);
      }

      // 2. Store structure data in Supabase Storage
      const storageResponse = await fetch(
        `${this.config.supabaseUrl}/storage/v1/object/md-structures/${job.id}.pdb`,
        {
          method: 'POST',
          headers: {
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`,
            'Content-Type': 'chemical/x-pdb',
          },
          body: job.structureData,
        }
      );

      if (!storageResponse.ok) {
        throw new Error(`Failed to upload structure data: ${storageResponse.statusText}`);
      }

      // 3. Trigger Edge Function to start processing
      const functionResponse = await fetch(
        `${this.config.supabaseUrl}/functions/v1/process-md-job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`,
          },
          body: JSON.stringify({ jobId: job.id }),
        }
      );

      if (!functionResponse.ok) {
        console.warn(`Edge function trigger failed: ${functionResponse.statusText}`);
        // Don't throw - job is queued and can be processed by cron job
      }

      console.log('Successfully submitted job to Supabase:', job.id);
    } catch (error) {
      console.error('Supabase submission failed:', error);
      throw error;
    }
  }
}

// Singleton export
export const jobQueue = JobQueueService.getInstance();
