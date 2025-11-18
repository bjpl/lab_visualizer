/**
 * Simulation State Slice
 *
 * Manages simulation jobs and results:
 * - Job creation and tracking
 * - Job status updates
 * - Results storage
 */

import { StateCreator } from 'zustand';

export type SimulationStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SimulationType =
  | 'md'
  | 'docking'
  | 'minimization'
  | 'analysis';

export interface SimulationJob {
  id: string;
  type: SimulationType;
  name: string;
  status: SimulationStatus;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  estimatedTime?: number;
  parameters: Record<string, unknown>;
  error?: string;
}

export interface SimulationResult {
  jobId: string;
  data: unknown;
  metadata?: {
    duration: number;
    iterations?: number;
    energy?: number;
    rmsd?: number;
  };
  files?: {
    trajectory?: string;
    log?: string;
    output?: string;
  };
}

export interface SimulationSlice {
  // State
  jobs: Map<string, SimulationJob>;
  activeJobId: string | null;
  results: Map<string, SimulationResult>;

  // Actions
  createJob: (job: Omit<SimulationJob, 'id' | 'status' | 'progress' | 'createdAt'>) => string;
  updateJob: (jobId: string, updates: Partial<SimulationJob>) => void;
  deleteJob: (jobId: string) => void;
  setActiveJob: (jobId: string | null) => void;
  storeResult: (result: SimulationResult) => void;
  getJob: (jobId: string) => SimulationJob | undefined;
  getResult: (jobId: string) => SimulationResult | undefined;
  clearCompleted: () => void;
}

export const createSimulationSlice: StateCreator<
  SimulationSlice,
  [['zustand/immer', never]],
  [],
  SimulationSlice
> = (set, get) => ({
  // Initial state
  jobs: new Map(),
  activeJobId: null,
  results: new Map(),

  // Actions
  createJob: (jobData) => {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    set((state) => {
      const job: SimulationJob = {
        ...jobData,
        id: jobId,
        status: 'pending',
        progress: 0,
        createdAt: Date.now(),
      };

      state.jobs.set(jobId, job);
      console.log(`[Simulation] Created job ${jobId}: ${job.name}`);
    });

    return jobId;
  },

  updateJob: (jobId, updates) =>
    set((state) => {
      const job = state.jobs.get(jobId);
      if (!job) {
        console.warn(`[Simulation] Job ${jobId} not found`);
        return;
      }

      state.jobs.set(jobId, {
        ...job,
        ...updates,
      });

      console.log(`[Simulation] Updated job ${jobId}:`, updates);
    }),

  deleteJob: (jobId) =>
    set((state) => {
      state.jobs.delete(jobId);
      state.results.delete(jobId);

      if (state.activeJobId === jobId) {
        state.activeJobId = null;
      }

      console.log(`[Simulation] Deleted job ${jobId}`);
    }),

  setActiveJob: (jobId) =>
    set((state) => {
      if (jobId && !state.jobs.has(jobId)) {
        console.warn(`[Simulation] Job ${jobId} not found`);
        return;
      }

      state.activeJobId = jobId;
      console.log(`[Simulation] Set active job: ${jobId}`);
    }),

  storeResult: (result) =>
    set((state) => {
      state.results.set(result.jobId, result);

      // Update job status to completed
      const job = state.jobs.get(result.jobId);
      if (job) {
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = Date.now();
      }

      console.log(`[Simulation] Stored result for job ${result.jobId}`);
    }),

  getJob: (jobId) => get().jobs.get(jobId),

  getResult: (jobId) => get().results.get(jobId),

  clearCompleted: () =>
    set((state) => {
      const completedIds: string[] = [];

      for (const [id, job] of state.jobs.entries()) {
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          completedIds.push(id);
        }
      }

      for (const id of completedIds) {
        state.jobs.delete(id);
        state.results.delete(id);
      }

      if (state.activeJobId && completedIds.includes(state.activeJobId)) {
        state.activeJobId = null;
      }

      console.log(`[Simulation] Cleared ${completedIds.length} completed jobs`);
    }),
});
