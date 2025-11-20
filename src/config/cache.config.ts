/**
 * Multi-Tier Cache Configuration
 *
 * L1 (IndexedDB) - Browser-side cache for instant access
 * L2 (Vercel KV) - Edge cache with 70% target hit rate
 * L3 (Supabase Storage) - Large object storage with compression
 */

export interface CacheTier {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize?: number; // Max size in bytes (optional)
  compressionEnabled?: boolean;
}

export interface CacheConfig {
  tiers: {
    l1: CacheTier;
    l2: CacheTier;
    l3: CacheTier;
  };
  fallbackStrategy: 'sequential' | 'parallel';
  prefetchEnabled: boolean;
  metricsEnabled: boolean;
  keyStrategies: {
    prefix: string;
    separator: string;
    includeVersion: boolean;
  };
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  tiers: {
    // L1: IndexedDB - Fast local cache
    l1: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: false, // Browser cache doesn't need compression
    },
    // L2: Vercel KV - Edge cache for 70% hit rate
    l2: {
      enabled: true,
      ttl: 86400, // 24 hours
      maxSize: 500 * 1024 * 1024, // 500MB per key
      compressionEnabled: true, // Compress to save edge storage
    },
    // L3: Supabase Storage - Long-term storage for large objects
    l3: {
      enabled: true,
      ttl: 604800, // 7 days
      compressionEnabled: true, // Compress molecular data
    },
  },
  fallbackStrategy: 'sequential', // L1 → L2 → L3 → source
  prefetchEnabled: true,
  metricsEnabled: true,
  keyStrategies: {
    prefix: 'lab-viz',
    separator: ':',
    includeVersion: true,
  },
};

/**
 * Cache key patterns for different data types
 */
export const CACHE_KEY_PATTERNS = {
  pdb: (id: string) => `pdb:${id.toLowerCase()}`,
  molecular: (id: string, type: string) => `molecular:${type}:${id}`,
  simulation: (id: string, frame?: number) =>
    frame !== undefined ? `sim:${id}:frame:${frame}` : `sim:${id}`,
  trajectory: (id: string) => `trajectory:${id}`,
  analysis: (id: string, type: string) => `analysis:${type}:${id}`,
  image: (id: string, resolution: string) => `image:${id}:${resolution}`,
} as const;

/**
 * TTL configurations for different data types
 */
export const CACHE_TTL = {
  // Short-lived: Real-time collaboration data
  short: 300, // 5 minutes

  // Medium: PDB structures, analysis results
  medium: 3600, // 1 hour

  // Long: Static molecular data, trajectories
  long: 86400, // 24 hours

  // Permanent: Published structures, reference data
  permanent: 2592000, // 30 days
} as const;

/**
 * Compression settings for different data types
 */
export const COMPRESSION_CONFIG = {
  // Molecular data - high compression
  molecular: {
    level: 9, // Maximum compression
    threshold: 10 * 1024, // Compress if > 10KB
  },

  // PDB files - medium compression
  pdb: {
    level: 6, // Balanced compression
    threshold: 50 * 1024, // Compress if > 50KB
  },

  // Simulation frames - fast compression
  simulation: {
    level: 3, // Fast compression for real-time data
    threshold: 100 * 1024, // Compress if > 100KB
  },

  // Images - minimal compression (already compressed)
  image: {
    level: 1,
    threshold: 500 * 1024, // Compress if > 500KB
  },
} as const;

/**
 * Rate limiting configuration for cache operations
 */
export const RATE_LIMIT_CONFIG = {
  l2: {
    maxRequestsPerSecond: 100,
    maxConcurrentRequests: 10,
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
  },
  l3: {
    maxRequestsPerSecond: 50,
    maxConcurrentRequests: 5,
    retryAttempts: 3,
    retryDelay: 2000, // 2 seconds
    backoffMultiplier: 2,
  },
} as const;

/**
 * Performance targets
 */
export const PERFORMANCE_TARGETS = {
  l1: {
    targetHitRate: 0.30, // 30% hit rate
    maxLatency: 100, // < 100ms
  },
  l2: {
    targetHitRate: 0.70, // 70% hit rate
    maxLatency: 500, // < 500ms
  },
  l3: {
    targetHitRate: 0.90, // 90% combined hit rate
    maxLatency: 2000, // < 2s
  },
} as const;

/**
 * Get cache configuration with environment overrides
 */
export function getCacheConfig(): CacheConfig {
  const config = { ...DEFAULT_CACHE_CONFIG };

  // Environment-based overrides
  if (process.env.NEXT_PUBLIC_DISABLE_L2_CACHE === 'true') {
    config.tiers.l2.enabled = false;
  }

  if (process.env.NEXT_PUBLIC_DISABLE_L3_CACHE === 'true') {
    config.tiers.l3.enabled = false;
  }

  if (process.env.NEXT_PUBLIC_CACHE_METRICS === 'false') {
    config.metricsEnabled = false;
  }

  return config;
}
