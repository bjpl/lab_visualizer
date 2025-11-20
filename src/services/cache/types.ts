/**
 * Cache Types and Interfaces
 */

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  createdAt: number;
  expiresAt: number;
  size: number;
  compressed: boolean;
  tier: 'l1' | 'l2' | 'l3';
  hits: number;
  version?: string;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  forceRefresh?: boolean;
  compression?: boolean;
  tier?: 'l1' | 'l2' | 'l3' | 'all';
}

export interface CacheResult<T> {
  data: T | null;
  metadata?: CacheMetadata;
  source: 'l1' | 'l2' | 'l3' | 'origin' | 'miss';
  latency: number;
}

export interface CacheStats {
  tier: 'l1' | 'l2' | 'l3';
  hitRate: number;
  missRate: number;
  size: number;
  entries: number;
  totalHits: number;
  totalMisses: number;
  avgLatency: number;
  lastUpdated: number;
}

export interface CacheMetrics {
  l1: CacheStats;
  l2: CacheStats;
  l3: CacheStats;
  overall: {
    combinedHitRate: number;
    totalRequests: number;
    avgLatency: number;
  };
}

export interface ICacheProvider {
  get<T>(key: string): Promise<CacheResult<T>>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
  healthCheck(): Promise<boolean>;
}

export class CacheError extends Error {
  constructor(
    message: string,
    public tier: 'l1' | 'l2' | 'l3',
    public operation: 'get' | 'set' | 'delete' | 'clear',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
}
