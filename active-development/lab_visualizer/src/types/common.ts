/**
 * Common Type Definitions
 * Shared types used across the application
 */

/**
 * Generic error response structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Structure metadata that can be loaded from various sources
 */
export interface StructureMetadata {
  id?: string;
  title?: string;
  resolution?: number;
  chains: string[];
  atomCount: number;
  residueCount: number;
  experimentMethod?: string;
  depositionDate?: string;
  authors?: string[];
  organisms?: string[];
}

/**
 * Atom data structure used in molecular visualizations
 * Represents a single atom with position and properties
 */
export interface AtomData {
  id: number;
  element: string;
  x: number;
  y: number;
  z: number;
  residue?: string;
  residueId?: number;
  chain?: string;
  atomName?: string;
  bFactor?: number;
  occupancy?: number;
}

/**
 * Job submission parameters for molecular dynamics simulations
 * Defines the configuration for a new simulation job
 */
export interface JobSubmissionData {
  structureId: string;
  structureData?: string;
  tier: 'browser' | 'serverless' | 'desktop';
  config: {
    timestep: number;
    totalTime: number;
    temperature: number;
    ensemble: 'NVE' | 'NVT' | 'NPT';
    integrator: 'verlet' | 'leapfrog' | 'langevin';
    outputFrequency: number;
  };
  priority?: 'low' | 'normal' | 'high';
  notifyOnComplete?: boolean;
}

/**
 * Queue statistics for monitoring simulation jobs
 */
export interface QueueStatistics {
  total: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  completionRate24h?: number;
  averageWaitTime?: number;
  averageExecutionTime?: number;
}

/**
 * Worker message types for web workers
 */
export interface WorkerMessage<T = unknown> {
  type: string;
  payload: T;
  requestId?: string;
  timestamp?: number;
}

/**
 * Worker response types
 */
export interface WorkerResponse<T = unknown> {
  type: string;
  payload: T;
  requestId?: string;
  success: boolean;
  error?: string;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig<T extends string = string> {
  field: T;
  order: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}
