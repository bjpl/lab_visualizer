/**
 * Simulation Monitor Service
 * Real-time monitoring of MD simulations via Supabase Realtime
 */

import type { RealtimeChannel } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

export interface SimulationProgress {
  jobId: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  estimatedTimeRemaining: number;
  status: string;
}

export interface SimulationComplete {
  jobId: string;
  trajectoryUrl: string;
  energyUrl: string;
  frameCount: number;
}

export interface SimulationError {
  jobId: string;
  error: string;
  timestamp: Date;
}

export type ProgressCallback = (progress: SimulationProgress) => void;
export type CompleteCallback = (result: SimulationComplete) => void;
export type ErrorCallback = (error: SimulationError) => void;

export class SimulationMonitor {
  private channel: RealtimeChannel | null = null;
  private progressCallbacks: ProgressCallback[] = [];
  private completeCallbacks: CompleteCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private supabase = createClient();

  /**
   * Subscribe to simulation progress updates
   */
  subscribe(
    jobId: string,
    callbacks: {
      onProgress?: ProgressCallback;
      onComplete?: CompleteCallback;
      onError?: ErrorCallback;
    }
  ): void {
    // Store callbacks
    if (callbacks.onProgress) this.progressCallbacks.push(callbacks.onProgress);
    if (callbacks.onComplete) this.completeCallbacks.push(callbacks.onComplete);
    if (callbacks.onError) this.errorCallbacks.push(callbacks.onError);

    // Create Realtime channel
    this.channel = this.supabase.channel(`simulation:${jobId}`);

    // Subscribe to progress events
    this.channel.on('broadcast', { event: 'progress' }, (payload) => {
      const progress = payload.payload as SimulationProgress;
      this.progressCallbacks.forEach(cb => cb(progress));
    });

    // Subscribe to completion events
    this.channel.on('broadcast', { event: 'complete' }, (payload) => {
      const result = payload.payload as SimulationComplete;
      this.completeCallbacks.forEach(cb => cb(result));

      // Auto-unsubscribe on completion
      this.unsubscribe();
    });

    // Subscribe to error events
    this.channel.on('broadcast', { event: 'error' }, (payload) => {
      const error = payload.payload as SimulationError;
      this.errorCallbacks.forEach(cb => cb(error));

      // Auto-unsubscribe on error
      this.unsubscribe();
    });

    // Subscribe to channel
    this.channel.subscribe((status) => {
      console.log(`Simulation monitor status: ${status}`);
    });

    // Also poll database for status changes
    this.startPolling(jobId);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.progressCallbacks = [];
    this.completeCallbacks = [];
    this.errorCallbacks = [];

    this.stopPolling();
  }

  /**
   * Poll database for status changes (backup to Realtime)
   */
  private pollingInterval: NodeJS.Timeout | null = null;

  private startPolling(jobId: string): void {
    this.pollingInterval = setInterval(async () => {
      try {
        const { data: job, error } = await this.supabase
          .from('md_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Polling error:', error);
          return;
        }

        if (!job) {
          return;
        }

        // Emit progress update
        if (job.status === 'running') {
          const progress: SimulationProgress = {
            jobId: job.id,
            progress: job.progress || 0,
            currentStep: 0,
            totalSteps: 0,
            estimatedTimeRemaining: job.estimated_time_remaining || 0,
            status: job.status
          };

          this.progressCallbacks.forEach(cb => cb(progress));
        }

        // Emit completion
        if (job.status === 'completed') {
          const result: SimulationComplete = {
            jobId: job.id,
            trajectoryUrl: job.result_url || '',
            energyUrl: job.energy_plot_url || '',
            frameCount: job.frame_count || 0
          };

          this.completeCallbacks.forEach(cb => cb(result));
          this.stopPolling();
        }

        // Emit error
        if (job.status === 'failed') {
          const error: SimulationError = {
            jobId: job.id,
            error: job.error_message || 'Unknown error',
            timestamp: new Date(job.completed_at || Date.now())
          };

          this.errorCallbacks.forEach(cb => cb(error));
          this.stopPolling();
        }
      } catch (error) {
        console.error('Polling exception:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Get current job status from database
   */
  async getJobStatus(jobId: string) {
    const { data, error } = await this.supabase
      .from('md_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job status: ${error.message}`);
    }

    return data;
  }

  /**
   * Download trajectory file
   */
  async downloadTrajectory(jobId: string): Promise<Blob> {
    const trajectoryPath = `trajectories/${jobId}.dcd`;

    const { data, error } = await this.supabase.storage
      .from('simulations')
      .download(trajectoryPath);

    if (error) {
      throw new Error(`Failed to download trajectory: ${error.message}`);
    }

    return data;
  }

  /**
   * Download energy data
   */
  async downloadEnergyData(jobId: string): Promise<any> {
    const energyPath = `energy/${jobId}.json`;

    const { data, error } = await this.supabase.storage
      .from('simulations')
      .download(energyPath);

    if (error) {
      throw new Error(`Failed to download energy data: ${error.message}`);
    }

    const text = await data.text();
    return JSON.parse(text);
  }

  /**
   * Cancel running simulation
   */
  async cancelSimulation(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('md_jobs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to cancel simulation: ${error.message}`);
    }

    this.unsubscribe();
  }
}

// Singleton instance
export const simulationMonitor = new SimulationMonitor();
