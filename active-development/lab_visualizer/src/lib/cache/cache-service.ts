/**
 * Unified Cache Service
 *
 * Multi-tier caching strategy:
 * L1 (Browser/IndexedDB) → L2 (Edge/Cloudflare) → L3 (Storage/Database)
 *
 * Target: 30% L1 hit rate, <100ms L1 latency
 */

import type { PDBCacheData } from './indexeddb';
import { getCache } from './indexeddb';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  forceRefresh?: boolean;
  useL1?: boolean; // Use IndexedDB cache
  useL2?: boolean; // Use edge cache
}

export interface CacheStats {
  l1HitRate: number;
  l1Size: number;
  l1Entries: number;
  totalHits: number;
  totalMisses: number;
  avgLatency: number;
}

export interface FetchWithCacheOptions extends CacheOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
}

/**
 * Unified Cache Service
 * Orchestrates multi-tier caching with automatic fallback
 */
export class CacheService {
  private latencyMetrics: number[] = [];
  private readonly maxMetrics = 100;

  constructor(private cache = getCache()) {}

  /**
   * Fetch PDB file with caching
   */
  async fetchPDB(pdbId: string, options: CacheOptions = {}): Promise<PDBCacheData> {
    const startTime = performance.now();
    const normalizedId = pdbId.toLowerCase();

    try {
      // Try L1 cache first
      if (options.useL1 !== false && !options.forceRefresh) {
        const cached = await this.cache.getPDB(normalizedId);
        if (cached) {
          this.recordLatency(performance.now() - startTime);
          console.log(`[CacheService] L1 HIT for PDB ${pdbId}`);
          return cached;
        }
      }

      // L1 miss - fetch from server
      console.log(`[CacheService] L1 MISS for PDB ${pdbId}, fetching...`);
      const data = await this.fetchPDBFromServer(normalizedId);

      // Store in L1 cache
      if (options.useL1 !== false) {
        await this.cache.cachePDB(normalizedId, data);
      }

      this.recordLatency(performance.now() - startTime);
      return data;
    } catch (error) {
      console.error(`[CacheService] Failed to fetch PDB ${pdbId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch from server with edge caching
   */
  private async fetchPDBFromServer(pdbId: string): Promise<PDBCacheData> {
    const url = `/api/structures/${pdbId}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PDB ${pdbId}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Generic fetch with caching
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Try L1 cache first
      if (options.useL1 !== false && !options.forceRefresh) {
        const cached = await this.cache.getData<T>(key);
        if (cached) {
          this.recordLatency(performance.now() - startTime);
          console.log(`[CacheService] L1 HIT for ${key}`);
          return cached;
        }
      }

      // L1 miss - execute fetcher
      console.log(`[CacheService] L1 MISS for ${key}, fetching...`);
      const data = await fetcher();

      // Store in L1 cache
      if (options.useL1 !== false) {
        await this.cache.cacheData(key, data, options.tags);
      }

      this.recordLatency(performance.now() - startTime);
      return data;
    } catch (error) {
      console.error(`[CacheService] Failed to fetch ${key}:`, error);
      throw error;
    }
  }

  /**
   * Fetch URL with automatic caching
   */
  async fetchURL<T>(
    url: string,
    options: FetchWithCacheOptions = {}
  ): Promise<T> {
    const cacheKey = `url:${url}:${JSON.stringify(options.body || '')}`;

    return this.fetchWithCache(
      cacheKey,
      async () => {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      },
      options
    );
  }

  /**
   * Prefetch PDB files for cache warming
   */
  async prefetchPDBs(pdbIds: string[]): Promise<void> {
    console.log(`[CacheService] Prefetching ${pdbIds.length} PDB files...`);

    const promises = pdbIds.map(async (pdbId) => {
      try {
        await this.fetchPDB(pdbId, { useL1: true });
      } catch (error) {
        console.error(`[CacheService] Failed to prefetch ${pdbId}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log(`[CacheService] Prefetch complete`);
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    if (key.startsWith('pdb:')) {
      const pdbId = key.slice(4);
      await this.cache.deletePDB(pdbId);
    } else {
      await this.cache.deleteData(key);
    }
    console.log(`[CacheService] Invalidated ${key}`);
  }

  /**
   * Invalidate multiple cache entries by pattern
   */
  async invalidatePattern(pattern: RegExp): Promise<void> {
    // This requires scanning all keys - implement if needed
    console.warn('[CacheService] Pattern invalidation not yet implemented');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const metadata = await this.cache.getStats();
    const hitRate = await this.cache.getHitRate();

    return {
      l1HitRate: hitRate,
      l1Size: metadata?.totalSize || 0,
      l1Entries: metadata?.entryCount || 0,
      totalHits: metadata?.hitCount || 0,
      totalMisses: metadata?.missCount || 0,
      avgLatency: this.calculateAvgLatency(),
    };
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    await this.cache.clear();
    this.latencyMetrics = [];
    console.log('[CacheService] All caches cleared');
  }

  /**
   * Record latency metric
   */
  private recordLatency(latency: number): void {
    this.latencyMetrics.push(latency);
    if (this.latencyMetrics.length > this.maxMetrics) {
      this.latencyMetrics.shift();
    }
  }

  /**
   * Calculate average latency
   */
  private calculateAvgLatency(): number {
    if (this.latencyMetrics.length === 0) return 0;
    const sum = this.latencyMetrics.reduce((a, b) => a + b, 0);
    return sum / this.latencyMetrics.length;
  }
}

// Singleton instance
let serviceInstance: CacheService | null = null;

/**
 * Get singleton cache service instance
 */
export function getCacheService(): CacheService {
  if (!serviceInstance) {
    serviceInstance = new CacheService();
  }
  return serviceInstance;
}

/**
 * Reset cache service (for testing)
 */
export function resetCacheService(): void {
  serviceInstance = null;
}
