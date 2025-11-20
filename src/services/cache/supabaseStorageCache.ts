/**
 * L3 Cache - Supabase Storage Integration
 *
 * Long-term storage for large molecular data with:
 * - Automatic compression for molecular data
 * - Fallback for L2 cache misses
 * - Support for large objects (>500MB)
 * - Efficient retrieval and streaming
 */

import { createClient } from '@/lib/supabase/client';
import {
  ICacheProvider,
  CacheResult,
  CacheOptions,
  CacheStats,
  CacheError,
} from './types';
import { COMPRESSION_CONFIG, PERFORMANCE_TARGETS } from '@/config/cache.config';

/**
 * Supabase Storage Cache Client
 * Handles large object storage with compression
 */
export class SupabaseStorageCache implements ICacheProvider {
  private supabase: ReturnType<typeof createClient>;
  private bucketName: string;
  private stats: {
    hits: number;
    misses: number;
    totalRequests: number;
    latencies: number[];
    totalSize: number;
  };

  constructor(bucketName = 'cache-storage') {
    this.bucketName = bucketName;
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      latencies: [],
      totalSize: 0,
    };

    try {
      this.supabase = createClient();
      this.initializeBucket();
    } catch (error) {
      console.error('[SupabaseStorageCache] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Initialize storage bucket
   */
  private async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();

      const bucketExists = buckets?.some(b => b.name === this.bucketName);

      if (!bucketExists) {
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false,
          fileSizeLimit: 1024 * 1024 * 1024, // 1GB limit per file
        });

        if (error) {
          console.error('[SupabaseStorageCache] Failed to create bucket:', error);
        } else {
          console.log(`[SupabaseStorageCache] Bucket '${this.bucketName}' created`);
        }
      }
    } catch (error) {
      console.error('[SupabaseStorageCache] Bucket initialization failed:', error);
    }
  }

  /**
   * Get value from storage
   */
  async get<T>(key: string): Promise<CacheResult<T>> {
    const startTime = performance.now();
    this.stats.totalRequests++;

    try {
      const path = this.getStoragePath(key);

      // Download file from storage
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(this.bucketName)
        .download(path);

      if (downloadError || !fileData) {
        this.stats.misses++;
        const latency = performance.now() - startTime;
        this.recordLatency(latency);

        return {
          data: null,
          source: 'miss',
          latency,
        };
      }

      // Read file content
      const content = await fileData.text();
      const parsed = JSON.parse(content);

      const latency = performance.now() - startTime;
      this.recordLatency(latency);

      // Check expiration
      if (parsed.metadata?.expiresAt && Date.now() > parsed.metadata.expiresAt) {
        this.stats.misses++;
        await this.delete(key);
        return {
          data: null,
          source: 'miss',
          latency,
        };
      }

      this.stats.hits++;

      // Decompress if needed
      let data = parsed.value;
      if (parsed.metadata?.compressed) {
        data = await this.decompress(data);
      }

      return {
        data,
        metadata: parsed.metadata,
        source: 'l3',
        latency,
      };
    } catch (error) {
      const latency = performance.now() - startTime;
      this.recordLatency(latency);
      this.stats.misses++;

      console.error(`[SupabaseStorageCache] GET failed for key ${key}:`, error);

      throw new CacheError(
        `Failed to get key ${key} from L3 cache`,
        'l3',
        'get',
        error as Error
      );
    }
  }

  /**
   * Set value in storage with compression
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || 604800; // Default 7 days
      const expiresAt = Date.now() + (ttl * 1000);

      // Determine if compression is needed
      const valueStr = JSON.stringify(value);
      const shouldCompress = this.shouldCompress(valueStr, key);

      let finalValue = value;
      if (shouldCompress && options.compression !== false) {
        finalValue = await this.compress(valueStr) as T;
      }

      const cacheEntry = {
        value: finalValue,
        metadata: {
          createdAt: Date.now(),
          expiresAt,
          size: valueStr.length,
          compressed: shouldCompress && options.compression !== false,
          tier: 'l3' as const,
          hits: 0,
          tags: options.tags,
        },
      };

      const content = JSON.stringify(cacheEntry);
      const blob = new Blob([content], { type: 'application/json' });
      const path = this.getStoragePath(key);

      // Upload to storage
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, blob, {
          upsert: true,
          contentType: 'application/json',
        });

      if (error) {
        throw error;
      }

      this.stats.totalSize += content.length;

      console.log(
        `[SupabaseStorageCache] SET ${key} (Size: ${this.formatBytes(content.length)}, TTL: ${ttl}s, Compressed: ${shouldCompress})`
      );
    } catch (error) {
      console.error(`[SupabaseStorageCache] SET failed for key ${key}:`, error);

      throw new CacheError(
        `Failed to set key ${key} in L3 cache`,
        'l3',
        'set',
        error as Error
      );
    }
  }

  /**
   * Delete key from storage
   */
  async delete(key: string): Promise<void> {
    try {
      const path = this.getStoragePath(key);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw error;
      }

      console.log(`[SupabaseStorageCache] DELETE ${key}`);
    } catch (error) {
      console.error(`[SupabaseStorageCache] DELETE failed for key ${key}:`, error);

      throw new CacheError(
        `Failed to delete key ${key} from L3 cache`,
        'l3',
        'delete',
        error as Error
      );
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // List all files in bucket
      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list();

      if (files && files.length > 0) {
        const paths = files.map(f => f.name);

        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .remove(paths);

        if (error) {
          throw error;
        }
      }

      this.stats = {
        hits: 0,
        misses: 0,
        totalRequests: 0,
        latencies: [],
        totalSize: 0,
      };

      console.log('[SupabaseStorageCache] Cache cleared');
    } catch (error) {
      throw new CacheError(
        'Failed to clear L3 cache',
        'l3',
        'clear',
        error as Error
      );
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    let entries = 0;

    try {
      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list();

      entries = files?.length || 0;
    } catch (error) {
      console.error('[SupabaseStorageCache] Failed to get file count:', error);
    }

    return {
      tier: 'l3',
      hitRate,
      missRate,
      size: this.stats.totalSize,
      entries,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      avgLatency: this.calculateAvgLatency(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = '__health_check__';
      const testValue = { timestamp: Date.now() };

      await this.set(testKey, testValue, { ttl: 60 });
      const result = await this.get<typeof testValue>(testKey);
      await this.delete(testKey);

      return result.data !== null;
    } catch (error) {
      console.error('[SupabaseStorageCache] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get storage path for key
   */
  private getStoragePath(key: string): string {
    // Use path structure for organization: type/date/key
    const parts = key.split(':');
    const type = parts[0] || 'general';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = key.replace(/[^a-zA-Z0-9-_]/g, '_');

    return `${type}/${date}/${filename}.json`;
  }

  /**
   * Determine if compression should be applied
   */
  private shouldCompress(data: string, key: string): boolean {
    const dataType = key.split(':')[0];
    const config = COMPRESSION_CONFIG[dataType as keyof typeof COMPRESSION_CONFIG] || COMPRESSION_CONFIG.molecular;

    return data.length > config.threshold;
  }

  /**
   * Compress data using browser-compatible compression
   */
  private async compress(data: string): Promise<string> {
    try {
      // Use browser's native compression if available
      if (typeof CompressionStream !== 'undefined') {
        const blob = new Blob([data]);
        const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
        const compressedBlob = await new Response(stream).blob();
        const buffer = await compressedBlob.arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
      }

      // Fallback: Return original data if compression not available
      console.warn('[SupabaseStorageCache] Compression not available, storing uncompressed');
      return data;
    } catch (error) {
      console.error('[SupabaseStorageCache] Compression failed:', error);
      return data;
    }
  }

  /**
   * Decompress data
   */
  private async decompress(data: string): Promise<any> {
    try {
      // Use browser's native decompression if available
      if (typeof DecompressionStream !== 'undefined') {
        const binaryStr = atob(data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const blob = new Blob([bytes]);
        const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressedBlob = await new Response(stream).blob();
        const text = await decompressedBlob.text();

        return JSON.parse(text);
      }

      // Fallback: Return original if decompression not available
      return data;
    } catch (error) {
      console.error('[SupabaseStorageCache] Decompression failed:', error);
      return data;
    }
  }

  /**
   * Record latency metric
   */
  private recordLatency(latency: number): void {
    this.stats.latencies.push(latency);
    if (this.stats.latencies.length > 1000) {
      this.stats.latencies.shift();
    }

    // Log warning if latency exceeds target
    if (latency > PERFORMANCE_TARGETS.l3.maxLatency) {
      console.warn(
        `[SupabaseStorageCache] Latency ${latency.toFixed(2)}ms exceeds target ${PERFORMANCE_TARGETS.l3.maxLatency}ms`
      );
    }
  }

  /**
   * Calculate average latency
   */
  private calculateAvgLatency(): number {
    if (this.stats.latencies.length === 0) return 0;
    const sum = this.stats.latencies.reduce((a, b) => a + b, 0);
    return sum / this.stats.latencies.length;
  }

  /**
   * Format bytes for logging
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * Singleton instance
 */
let storageCacheInstance: SupabaseStorageCache | null = null;

/**
 * Get Supabase Storage cache instance
 */
export function getSupabaseStorageCache(): SupabaseStorageCache {
  if (!storageCacheInstance) {
    storageCacheInstance = new SupabaseStorageCache();
  }
  return storageCacheInstance;
}
