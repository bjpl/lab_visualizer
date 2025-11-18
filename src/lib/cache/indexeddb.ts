/**
 * IndexedDB Caching Layer
 *
 * Browser-based L1 cache for PDB files and computed data
 * - 500MB quota management
 * - 7-day TTL automatic expiration
 * - Type-safe wrapper with metrics
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Cache configuration constants
export const CACHE_CONFIG = {
  DB_NAME: 'lab-visualizer-cache',
  VERSION: 1,
  MAX_SIZE_MB: 500,
  TTL_DAYS: 7,
  STORES: {
    PDB_FILES: 'pdb-files',
    COMPUTED_DATA: 'computed-data',
    METADATA: 'metadata',
  },
} as const;

// Type definitions
export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheMetadata {
  totalSize: number;
  entryCount: number;
  hitCount: number;
  missCount: number;
  lastCleanup: number;
}

export interface PDBCacheData {
  content: string;
  structure?: unknown;
  metadata?: {
    pdbId: string;
    title?: string;
    resolution?: number;
    chains?: string[];
  };
}

// IndexedDB Schema
interface CacheDB extends DBSchema {
  'pdb-files': {
    key: string;
    value: CacheEntry<PDBCacheData>;
    indexes: {
      'by-timestamp': number;
      'by-access': number;
      'by-size': number;
    };
  };
  'computed-data': {
    key: string;
    value: CacheEntry;
    indexes: {
      'by-timestamp': number;
      'by-access': number;
    };
  };
  'metadata': {
    key: string;
    value: CacheMetadata;
  };
}

/**
 * IndexedDB Cache Manager
 * Provides type-safe caching with automatic cleanup and metrics
 */
export class IndexedDBCache {
  private db: IDBPDatabase<CacheDB> | null = null;
  private initPromise: Promise<void> | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-initialize on construction
    this.initPromise = this.initialize();
  }

  /**
   * Initialize IndexedDB connection
   */
  private async initialize(): Promise<void> {
    try {
      this.db = await openDB<CacheDB>(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.VERSION, {
        upgrade(db) {
          // PDB Files store
          if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.PDB_FILES)) {
            const pdbStore = db.createObjectStore(CACHE_CONFIG.STORES.PDB_FILES, {
              keyPath: 'key',
            });
            pdbStore.createIndex('by-timestamp', 'timestamp');
            pdbStore.createIndex('by-access', 'lastAccessed');
            pdbStore.createIndex('by-size', 'size');
          }

          // Computed data store
          if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.COMPUTED_DATA)) {
            const computedStore = db.createObjectStore(CACHE_CONFIG.STORES.COMPUTED_DATA, {
              keyPath: 'key',
            });
            computedStore.createIndex('by-timestamp', 'timestamp');
            computedStore.createIndex('by-access', 'lastAccessed');
          }

          // Metadata store
          if (!db.objectStoreNames.contains(CACHE_CONFIG.STORES.METADATA)) {
            db.createObjectStore(CACHE_CONFIG.STORES.METADATA, {
              keyPath: 'key',
            });
          }
        },
      });

      // Initialize metadata if not exists
      await this.initializeMetadata();

      // Schedule periodic cleanup
      this.scheduleCleanup();

      console.log('[IndexedDBCache] Initialized successfully');
    } catch (error) {
      console.error('[IndexedDBCache] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure DB is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
  }

  /**
   * Initialize cache metadata
   */
  private async initializeMetadata(): Promise<void> {
    const existing = await this.db?.get(CACHE_CONFIG.STORES.METADATA, 'stats');
    if (!existing) {
      await this.db?.put(CACHE_CONFIG.STORES.METADATA, {
        key: 'stats',
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });
    }
  }

  /**
   * Store PDB file in cache
   */
  async cachePDB(pdbId: string, data: PDBCacheData): Promise<void> {
    await this.ensureInitialized();

    const key = `pdb:${pdbId.toLowerCase()}`;
    const size = new Blob([JSON.stringify(data)]).size;

    // Check quota before storing
    await this.ensureQuota(size);

    const entry: CacheEntry<PDBCacheData> = {
      key,
      data,
      timestamp: Date.now(),
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: ['pdb', pdbId],
    };

    await this.db!.put(CACHE_CONFIG.STORES.PDB_FILES, entry);
    await this.updateMetadata({ totalSize: size, entryCount: 1 });

    console.log(`[IndexedDBCache] Cached PDB ${pdbId} (${(size / 1024).toFixed(2)} KB)`);
  }

  /**
   * Retrieve PDB file from cache
   */
  async getPDB(pdbId: string): Promise<PDBCacheData | null> {
    await this.ensureInitialized();

    const key = `pdb:${pdbId.toLowerCase()}`;
    const entry = await this.db!.get(CACHE_CONFIG.STORES.PDB_FILES, key);

    if (!entry) {
      await this.recordMiss();
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    const maxAge = CACHE_CONFIG.TTL_DAYS * 24 * 60 * 60 * 1000;

    if (age > maxAge) {
      await this.deletePDB(pdbId);
      await this.recordMiss();
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    await this.db!.put(CACHE_CONFIG.STORES.PDB_FILES, entry);
    await this.recordHit();

    console.log(`[IndexedDBCache] Cache HIT for PDB ${pdbId} (accessed ${entry.accessCount} times)`);
    return entry.data;
  }

  /**
   * Store computed data in cache
   */
  async cacheData<T>(key: string, data: T, tags?: string[]): Promise<void> {
    await this.ensureInitialized();

    const size = new Blob([JSON.stringify(data)]).size;
    await this.ensureQuota(size);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
    };

    await this.db!.put(CACHE_CONFIG.STORES.COMPUTED_DATA, entry as CacheEntry);
    await this.updateMetadata({ totalSize: size, entryCount: 1 });
  }

  /**
   * Retrieve computed data from cache
   */
  async getData<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    const entry = await this.db!.get(CACHE_CONFIG.STORES.COMPUTED_DATA, key);

    if (!entry) {
      await this.recordMiss();
      return null;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    const maxAge = CACHE_CONFIG.TTL_DAYS * 24 * 60 * 60 * 1000;

    if (age > maxAge) {
      await this.deleteData(key);
      await this.recordMiss();
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    await this.db!.put(CACHE_CONFIG.STORES.COMPUTED_DATA, entry);
    await this.recordHit();

    return entry.data as T;
  }

  /**
   * Delete PDB file from cache
   */
  async deletePDB(pdbId: string): Promise<void> {
    await this.ensureInitialized();

    const key = `pdb:${pdbId.toLowerCase()}`;
    const entry = await this.db!.get(CACHE_CONFIG.STORES.PDB_FILES, key);

    if (entry) {
      await this.db!.delete(CACHE_CONFIG.STORES.PDB_FILES, key);
      await this.updateMetadata({ totalSize: -entry.size, entryCount: -1 });
    }
  }

  /**
   * Delete computed data from cache
   */
  async deleteData(key: string): Promise<void> {
    await this.ensureInitialized();

    const entry = await this.db!.get(CACHE_CONFIG.STORES.COMPUTED_DATA, key);

    if (entry) {
      await this.db!.delete(CACHE_CONFIG.STORES.COMPUTED_DATA, key);
      await this.updateMetadata({ totalSize: -entry.size, entryCount: -1 });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheMetadata | null> {
    await this.ensureInitialized();
    return await this.db!.get(CACHE_CONFIG.STORES.METADATA, 'stats') || null;
  }

  /**
   * Calculate cache hit rate
   */
  async getHitRate(): Promise<number> {
    const stats = await this.getStats();
    if (!stats || (stats.hitCount + stats.missCount) === 0) {
      return 0;
    }
    return stats.hitCount / (stats.hitCount + stats.missCount);
  }

  /**
   * Ensure cache quota is not exceeded
   */
  private async ensureQuota(requiredSize: number): Promise<void> {
    const stats = await this.getStats();
    if (!stats) return;

    const maxSizeBytes = CACHE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
    const availableSize = maxSizeBytes - stats.totalSize;

    if (requiredSize > availableSize) {
      console.warn(`[IndexedDBCache] Quota exceeded, evicting old entries...`);
      await this.evictOldEntries(requiredSize - availableSize);
    }
  }

  /**
   * Evict old entries to free up space (LRU strategy)
   */
  private async evictOldEntries(bytesToFree: number): Promise<void> {
    await this.ensureInitialized();

    let freedBytes = 0;
    const stores = [CACHE_CONFIG.STORES.PDB_FILES, CACHE_CONFIG.STORES.COMPUTED_DATA];

    for (const storeName of stores) {
      if (freedBytes >= bytesToFree) break;

      const tx = this.db!.transaction(storeName, 'readwrite');
      const index = tx.store.index('by-access');

      // Get entries sorted by last access (oldest first)
      const cursor = await index.openCursor();

      if (cursor) {
        do {
          const entry = cursor.value;
          await cursor.delete();
          freedBytes += entry.size;
          await this.updateMetadata({ totalSize: -entry.size, entryCount: -1 });

          if (freedBytes >= bytesToFree) break;
        } while (await cursor.continue());
      }

      await tx.done;
    }

    console.log(`[IndexedDBCache] Evicted ${freedBytes} bytes`);
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<void> {
    await this.ensureInitialized();

    const maxAge = CACHE_CONFIG.TTL_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;

    const stores = [CACHE_CONFIG.STORES.PDB_FILES, CACHE_CONFIG.STORES.COMPUTED_DATA];

    for (const storeName of stores) {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const index = tx.store.index('by-timestamp');

      const range = IDBKeyRange.upperBound(cutoff);
      const cursor = await index.openCursor(range);

      if (cursor) {
        let deletedCount = 0;
        do {
          const entry = cursor.value;
          await cursor.delete();
          await this.updateMetadata({ totalSize: -entry.size, entryCount: -1 });
          deletedCount++;
        } while (await cursor.continue());

        console.log(`[IndexedDBCache] Cleaned up ${deletedCount} expired entries from ${storeName}`);
      }

      await tx.done;
    }

    // Update last cleanup time
    const stats = await this.getStats();
    if (stats) {
      stats.lastCleanup = Date.now();
      await this.db!.put(CACHE_CONFIG.STORES.METADATA, stats);
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    await this.db!.clear(CACHE_CONFIG.STORES.PDB_FILES);
    await this.db!.clear(CACHE_CONFIG.STORES.COMPUTED_DATA);

    await this.db!.put(CACHE_CONFIG.STORES.METADATA, {
      key: 'stats',
      totalSize: 0,
      entryCount: 0,
      hitCount: 0,
      missCount: 0,
      lastCleanup: Date.now(),
    });

    console.log('[IndexedDBCache] Cache cleared');
  }

  /**
   * Schedule periodic cleanup
   */
  private scheduleCleanup(): void {
    // Cleanup every 6 hours
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(console.error);
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Update cache metadata
   */
  private async updateMetadata(delta: Partial<Pick<CacheMetadata, 'totalSize' | 'entryCount'>>): Promise<void> {
    const stats = await this.getStats();
    if (!stats) return;

    if (delta.totalSize !== undefined) {
      stats.totalSize += delta.totalSize;
    }
    if (delta.entryCount !== undefined) {
      stats.entryCount += delta.entryCount;
    }

    await this.db!.put(CACHE_CONFIG.STORES.METADATA, stats);
  }

  /**
   * Record cache hit
   */
  private async recordHit(): Promise<void> {
    const stats = await this.getStats();
    if (stats) {
      stats.hitCount++;
      await this.db!.put(CACHE_CONFIG.STORES.METADATA, stats);
    }
  }

  /**
   * Record cache miss
   */
  private async recordMiss(): Promise<void> {
    const stats = await this.getStats();
    if (stats) {
      stats.missCount++;
      await this.db!.put(CACHE_CONFIG.STORES.METADATA, stats);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let cacheInstance: IndexedDBCache | null = null;

/**
 * Get singleton cache instance
 */
export function getCache(): IndexedDBCache {
  if (!cacheInstance) {
    cacheInstance = new IndexedDBCache();
  }
  return cacheInstance;
}

/**
 * Clear cache instance (for testing)
 */
export function resetCache(): void {
  if (cacheInstance) {
    cacheInstance.close();
    cacheInstance = null;
  }
}
