/**
 * Cache Manager - Multi-Tier Cache Orchestration
 *
 * Coordinates L1 (IndexedDB), L2 (Vercel KV), and L3 (Supabase Storage)
 * with intelligent fallback and performance metrics.
 *
 * Flow: L1 → L2 → L3 → origin
 * Backfill: Data fetched from higher tier is stored in lower tiers
 */

import { CacheService as L1Cache } from '@/lib/cache/cache-service';
import { VercelKVCache } from './vercelKvCache';
import { SupabaseStorageCache } from './supabaseStorageCache';
import {
  CacheResult,
  CacheOptions,
  CacheMetrics,
  CacheStats,
  CacheError,
} from './types';
import { getCacheConfig, CACHE_KEY_PATTERNS } from '@/config/cache.config';

/**
 * Multi-Tier Cache Manager
 * Orchestrates all cache levels with automatic fallback
 */
export class CacheManager {
  private l1Cache: L1Cache;
  private l2Cache: VercelKVCache;
  private l3Cache: SupabaseStorageCache;
  private config = getCacheConfig();
  private metricsCollector: MetricsCollector;

  constructor() {
    this.l1Cache = new L1Cache();
    this.l2Cache = new VercelKVCache();
    this.l3Cache = new SupabaseStorageCache();
    this.metricsCollector = new MetricsCollector();

    console.log('[CacheManager] Initialized with multi-tier caching');
    this.logConfiguration();
  }

  /**
   * Get data with multi-tier fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<CacheResult<T>> {
    const startTime = performance.now();
    const tier = options.tier || 'all';

    try {
      // L1 (IndexedDB) - Fastest
      if (tier === 'all' || tier === 'l1') {
        if (this.config.tiers.l1.enabled && !options.forceRefresh) {
          const l1Result = await this.getFromL1<T>(key);
          if (l1Result.data !== null) {
            this.metricsCollector.recordHit('l1', performance.now() - startTime);
            console.log(`[CacheManager] L1 HIT for ${key}`);
            return l1Result;
          }
        }
      }

      // L2 (Vercel KV) - Fast edge cache
      if (tier === 'all' || tier === 'l2') {
        if (this.config.tiers.l2.enabled && !options.forceRefresh) {
          try {
            const l2Result = await this.l2Cache.get<T>(key);
            if (l2Result.data !== null) {
              this.metricsCollector.recordHit('l2', performance.now() - startTime);
              console.log(`[CacheManager] L2 HIT for ${key}`);

              // Backfill L1
              await this.backfillL1(key, l2Result.data, options);

              return l2Result;
            }
          } catch (error) {
            console.warn('[CacheManager] L2 error, falling back to L3:', error);
          }
        }
      }

      // L3 (Supabase Storage) - Long-term storage
      if (tier === 'all' || tier === 'l3') {
        if (this.config.tiers.l3.enabled && !options.forceRefresh) {
          try {
            const l3Result = await this.l3Cache.get<T>(key);
            if (l3Result.data !== null) {
              this.metricsCollector.recordHit('l3', performance.now() - startTime);
              console.log(`[CacheManager] L3 HIT for ${key}`);

              // Backfill L1 and L2
              await Promise.all([
                this.backfillL1(key, l3Result.data, options),
                this.backfillL2(key, l3Result.data, options),
              ]);

              return l3Result;
            }
          } catch (error) {
            console.warn('[CacheManager] L3 error:', error);
          }
        }
      }

      // All caches missed
      this.metricsCollector.recordMiss(performance.now() - startTime);
      console.log(`[CacheManager] MISS for ${key}`);

      return {
        data: null,
        source: 'miss',
        latency: performance.now() - startTime,
      };
    } catch (error) {
      console.error(`[CacheManager] GET failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set data across cache tiers
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const promises: Promise<void>[] = [];

    try {
      // Store in L1 (IndexedDB)
      if (this.config.tiers.l1.enabled) {
        promises.push(
          this.setInL1(key, value, options).catch(error => {
            console.warn('[CacheManager] L1 SET failed:', error);
          })
        );
      }

      // Store in L2 (Vercel KV)
      if (this.config.tiers.l2.enabled) {
        promises.push(
          this.l2Cache.set(key, value, {
            ...options,
            ttl: options.ttl || this.config.tiers.l2.ttl,
          }).catch(error => {
            console.warn('[CacheManager] L2 SET failed:', error);
          })
        );
      }

      // Store in L3 (Supabase Storage) for large/important data
      if (this.config.tiers.l3.enabled && this.shouldStoreInL3(value)) {
        promises.push(
          this.l3Cache.set(key, value, {
            ...options,
            ttl: options.ttl || this.config.tiers.l3.ttl,
            compression: this.config.tiers.l3.compressionEnabled,
          }).catch(error => {
            console.warn('[CacheManager] L3 SET failed:', error);
          })
        );
      }

      await Promise.allSettled(promises);

      console.log(`[CacheManager] SET ${key} across ${promises.length} tier(s)`);
    } catch (error) {
      console.error(`[CacheManager] SET failed for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Fetch with automatic caching
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);

    if (cached.data !== null) {
      return cached.data;
    }

    // Cache miss - fetch from origin
    console.log(`[CacheManager] Fetching ${key} from origin`);
    const data = await fetcher();

    // Store in all cache tiers
    await this.set(key, data, options);

    return data;
  }

  /**
   * Invalidate key across all tiers
   */
  async invalidate(key: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.tiers.l1.enabled) {
      promises.push(
        this.l1Cache.invalidate(key).catch(error => {
          console.warn('[CacheManager] L1 invalidate failed:', error);
        })
      );
    }

    if (this.config.tiers.l2.enabled) {
      promises.push(
        this.l2Cache.delete(key).catch(error => {
          console.warn('[CacheManager] L2 invalidate failed:', error);
        })
      );
    }

    if (this.config.tiers.l3.enabled) {
      promises.push(
        this.l3Cache.delete(key).catch(error => {
          console.warn('[CacheManager] L3 invalidate failed:', error);
        })
      );
    }

    await Promise.allSettled(promises);
    console.log(`[CacheManager] Invalidated ${key} across all tiers`);
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.tiers.l1.enabled) {
      promises.push(this.l1Cache.clearAll());
    }

    if (this.config.tiers.l2.enabled) {
      promises.push(this.l2Cache.clear());
    }

    if (this.config.tiers.l3.enabled) {
      promises.push(this.l3Cache.clear());
    }

    await Promise.allSettled(promises);
    this.metricsCollector.reset();

    console.log('[CacheManager] All caches cleared');
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics(): Promise<CacheMetrics> {
    const [l1Stats, l2Stats, l3Stats] = await Promise.all([
      this.l1Cache.getStats(),
      this.l2Cache.getStats(),
      this.l3Cache.getStats(),
    ]);

    const collectedMetrics = this.metricsCollector.getMetrics();

    return {
      l1: this.convertToTierStats(l1Stats, 'l1'),
      l2: l2Stats,
      l3: l3Stats,
      overall: {
        combinedHitRate: collectedMetrics.combinedHitRate,
        totalRequests: collectedMetrics.totalRequests,
        avgLatency: collectedMetrics.avgLatency,
      },
    };
  }

  /**
   * Health check all tiers
   */
  async healthCheck(): Promise<{ l1: boolean; l2: boolean; l3: boolean }> {
    const [l2Health, l3Health] = await Promise.all([
      this.l2Cache.healthCheck(),
      this.l3Cache.healthCheck(),
    ]);

    return {
      l1: true, // L1 is always available (IndexedDB)
      l2: l2Health,
      l3: l3Health,
    };
  }

  /**
   * Prefetch multiple keys
   */
  async prefetch(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    console.log(`[CacheManager] Prefetching ${keys.length} keys...`);

    const promises = keys.map(async key => {
      try {
        await this.fetchWithCache(key, () => fetcher(key));
      } catch (error) {
        console.error(`[CacheManager] Prefetch failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('[CacheManager] Prefetch complete');
  }

  // Private helper methods

  private async getFromL1<T>(key: string): Promise<CacheResult<T>> {
    try {
      const data = await this.l1Cache.fetchWithCache<T>(key, async () => {
        throw new Error('L1 miss');
      }, { useL1: true, forceRefresh: false });

      return {
        data,
        source: 'l1',
        latency: 0,
      };
    } catch {
      return {
        data: null,
        source: 'miss',
        latency: 0,
      };
    }
  }

  private async setInL1<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    await this.l1Cache.fetchWithCache(key, async () => value, {
      useL1: true,
      ttl: options.ttl || this.config.tiers.l1.ttl,
      tags: options.tags,
    });
  }

  private async backfillL1<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    try {
      await this.setInL1(key, data, options);
      console.log(`[CacheManager] Backfilled L1 for ${key}`);
    } catch (error) {
      console.warn(`[CacheManager] L1 backfill failed for ${key}:`, error);
    }
  }

  private async backfillL2<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    try {
      await this.l2Cache.set(key, data, {
        ...options,
        ttl: options.ttl || this.config.tiers.l2.ttl,
      });
      console.log(`[CacheManager] Backfilled L2 for ${key}`);
    } catch (error) {
      console.warn(`[CacheManager] L2 backfill failed for ${key}:`, error);
    }
  }

  private shouldStoreInL3<T>(value: T): boolean {
    // Store in L3 if data is large or important
    const size = JSON.stringify(value).length;
    return size > 100 * 1024; // > 100KB
  }

  private convertToTierStats(stats: any, tier: 'l1' | 'l2' | 'l3'): CacheStats {
    return {
      tier,
      hitRate: stats.l1HitRate || 0,
      missRate: 1 - (stats.l1HitRate || 0),
      size: stats.l1Size || 0,
      entries: stats.l1Entries || 0,
      totalHits: stats.totalHits || 0,
      totalMisses: stats.totalMisses || 0,
      avgLatency: stats.avgLatency || 0,
      lastUpdated: Date.now(),
    };
  }

  private logConfiguration(): void {
    console.log('[CacheManager] Configuration:', {
      l1: this.config.tiers.l1.enabled ? 'enabled' : 'disabled',
      l2: this.config.tiers.l2.enabled ? 'enabled' : 'disabled',
      l3: this.config.tiers.l3.enabled ? 'enabled' : 'disabled',
      fallbackStrategy: this.config.fallbackStrategy,
      metricsEnabled: this.config.metricsEnabled,
    });
  }
}

/**
 * Metrics Collector for performance tracking
 */
class MetricsCollector {
  private metrics = {
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0,
    misses: 0,
    latencies: [] as number[],
  };

  recordHit(tier: 'l1' | 'l2' | 'l3', latency: number): void {
    if (tier === 'l1') this.metrics.l1Hits++;
    if (tier === 'l2') this.metrics.l2Hits++;
    if (tier === 'l3') this.metrics.l3Hits++;
    this.recordLatency(latency);
  }

  recordMiss(latency: number): void {
    this.metrics.misses++;
    this.recordLatency(latency);
  }

  private recordLatency(latency: number): void {
    this.metrics.latencies.push(latency);
    if (this.metrics.latencies.length > 1000) {
      this.metrics.latencies.shift();
    }
  }

  getMetrics() {
    const totalRequests = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits + this.metrics.misses;
    const totalHits = this.metrics.l1Hits + this.metrics.l2Hits + this.metrics.l3Hits;
    const combinedHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    const avgLatency = this.metrics.latencies.length > 0
      ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
      : 0;

    return {
      combinedHitRate,
      totalRequests,
      avgLatency,
      breakdown: {
        l1Hits: this.metrics.l1Hits,
        l2Hits: this.metrics.l2Hits,
        l3Hits: this.metrics.l3Hits,
        misses: this.metrics.misses,
      },
    };
  }

  reset(): void {
    this.metrics = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      latencies: [],
    };
  }
}

/**
 * Singleton instance
 */
let cacheManagerInstance: CacheManager | null = null;

/**
 * Get cache manager instance
 */
export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
  }
  return cacheManagerInstance;
}

/**
 * Reset cache manager (for testing)
 */
export function resetCacheManager(): void {
  cacheManagerInstance = null;
}
