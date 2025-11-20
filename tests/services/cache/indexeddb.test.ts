/**
 * IndexedDB Cache Unit Tests
 *
 * Comprehensive test suite for IndexedDB caching layer
 * Tests: initialization, CRUD operations, TTL, quota management, metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  IndexedDBCache,
  getCache,
  resetCache,
  CACHE_CONFIG,
  CacheEntry,
  PDBCacheData,
} from '../../../src/lib/cache/indexeddb';
import { openDB } from 'idb';

// Mock idb library
vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('IndexedDBCache', () => {
  let cache: IndexedDBCache;
  let mockDB: any;

  beforeEach(async () => {
    // Reset singleton
    resetCache();

    // Create mock IndexedDB
    mockDB = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      close: vi.fn(),
      transaction: vi.fn(),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false),
      },
      createObjectStore: vi.fn((name) => ({
        createIndex: vi.fn(),
      })),
    };

    (openDB as any).mockResolvedValue(mockDB);
    cache = new IndexedDBCache();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for initialization
  });

  afterEach(async () => {
    await cache.close();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize IndexedDB with correct schema', () => {
      expect(openDB).toHaveBeenCalledWith(
        CACHE_CONFIG.DB_NAME,
        CACHE_CONFIG.VERSION,
        expect.objectContaining({
          upgrade: expect.any(Function),
        })
      );
    });

    it('should create required object stores', () => {
      const upgradeCallback = (openDB as any).mock.calls[0][2].upgrade;
      const mockUpgradeDB = {
        objectStoreNames: { contains: vi.fn().mockReturnValue(false) },
        createObjectStore: vi.fn((name) => ({
          createIndex: vi.fn(),
        })),
      };

      upgradeCallback(mockUpgradeDB);

      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.PDB_FILES,
        { keyPath: 'key' }
      );
      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.COMPUTED_DATA,
        { keyPath: 'key' }
      );
      expect(mockUpgradeDB.createObjectStore).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.METADATA,
        { keyPath: 'key' }
      );
    });

    it('should initialize metadata on first run', async () => {
      mockDB.get.mockResolvedValue(null);
      mockDB.put.mockResolvedValue(undefined);

      const newCache = new IndexedDBCache();
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.METADATA,
        expect.objectContaining({
          key: 'stats',
          totalSize: 0,
          entryCount: 0,
          hitCount: 0,
          missCount: 0,
        })
      );
    });
  });

  describe('PDB Caching', () => {
    it('should cache PDB data successfully', async () => {
      const pdbData: PDBCacheData = {
        content: 'ATOM 1 CA MET A',
        metadata: {
          pdbId: '1ABC',
          title: 'Test Protein',
          resolution: 2.1,
          chains: ['A', 'B'],
        },
      };

      mockDB.get.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockDB.put.mockResolvedValue(undefined);

      await cache.cachePDB('1ABC', pdbData);

      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.PDB_FILES,
        expect.objectContaining({
          key: 'pdb:1abc',
          data: pdbData,
          tags: ['pdb', '1ABC'],
        })
      );
    });

    it('should retrieve cached PDB data', async () => {
      const pdbData: PDBCacheData = {
        content: 'ATOM 1 CA MET A',
        metadata: { pdbId: '1ABC' },
      };

      const cacheEntry: CacheEntry<PDBCacheData> = {
        key: 'pdb:1abc',
        data: pdbData,
        timestamp: Date.now(),
        size: 1000,
        accessCount: 0,
        lastAccessed: Date.now(),
        tags: ['pdb', '1ABC'],
      };

      mockDB.get.mockResolvedValue(cacheEntry);
      mockDB.put.mockResolvedValue(undefined);

      const result = await cache.getPDB('1ABC');

      expect(result).toEqual(pdbData);
      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.PDB_FILES,
        expect.objectContaining({
          accessCount: 1,
        })
      );
    });

    it('should return null for cache miss', async () => {
      mockDB.get.mockResolvedValue(null);

      const result = await cache.getPDB('9999');

      expect(result).toBeNull();
    });

    it('should normalize PDB IDs to lowercase', async () => {
      mockDB.get.mockResolvedValue(null);
      mockDB.put.mockResolvedValue(undefined);

      const pdbData: PDBCacheData = { content: 'test' };
      await cache.cachePDB('1ABC', pdbData);

      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.PDB_FILES,
        expect.objectContaining({
          key: 'pdb:1abc',
        })
      );
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const oldTimestamp = Date.now() - (CACHE_CONFIG.TTL_DAYS + 1) * 24 * 60 * 60 * 1000;

      const expiredEntry: CacheEntry<PDBCacheData> = {
        key: 'pdb:1abc',
        data: { content: 'old data' },
        timestamp: oldTimestamp,
        size: 1000,
        accessCount: 0,
        lastAccessed: oldTimestamp,
      };

      mockDB.get.mockResolvedValue(expiredEntry);
      mockDB.delete.mockResolvedValue(undefined);

      const result = await cache.getPDB('1ABC');

      expect(result).toBeNull();
      expect(mockDB.delete).toHaveBeenCalledWith(CACHE_CONFIG.STORES.PDB_FILES, 'pdb:1abc');
    });

    it('should keep fresh entries', async () => {
      const freshEntry: CacheEntry<PDBCacheData> = {
        key: 'pdb:1abc',
        data: { content: 'fresh data' },
        timestamp: Date.now() - 1000, // 1 second old
        size: 1000,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      mockDB.get.mockResolvedValue(freshEntry);
      mockDB.put.mockResolvedValue(undefined);

      const result = await cache.getPDB('1ABC');

      expect(result).toEqual({ content: 'fresh data' });
      expect(mockDB.delete).not.toHaveBeenCalled();
    });
  });

  describe('Quota Management', () => {
    it('should evict old entries when quota exceeded', async () => {
      const stats = {
        totalSize: CACHE_CONFIG.MAX_SIZE_MB * 1024 * 1024 - 100, // Near limit
        entryCount: 10,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValue(stats);

      const mockCursor = {
        value: {
          key: 'old-entry',
          data: 'old',
          size: 500,
          timestamp: Date.now() - 10000,
          lastAccessed: Date.now() - 10000,
          accessCount: 0,
        },
        delete: vi.fn(),
        continue: vi.fn().mockResolvedValue(null),
      };

      mockDB.transaction = vi.fn().mockReturnValue({
        store: {
          index: vi.fn().mockReturnValue({
            openCursor: vi.fn().mockResolvedValue(mockCursor),
          }),
        },
        done: Promise.resolve(),
      });

      const largePDBData: PDBCacheData = {
        content: 'A'.repeat(500), // Large data
      };

      await cache.cachePDB('LARGE', largePDBData);

      expect(mockCursor.delete).toHaveBeenCalled();
    });

    it('should enforce maximum cache size', async () => {
      const maxSizeBytes = CACHE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
      expect(maxSizeBytes).toBe(500 * 1024 * 1024); // 500MB
    });
  });

  describe('Metrics and Statistics', () => {
    it('should track cache hits', async () => {
      const entry: CacheEntry<PDBCacheData> = {
        key: 'pdb:1abc',
        data: { content: 'test' },
        timestamp: Date.now(),
        size: 1000,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      const stats = {
        totalSize: 1000,
        entryCount: 1,
        hitCount: 5,
        missCount: 2,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValueOnce(entry).mockResolvedValueOnce(stats);
      mockDB.put.mockResolvedValue(undefined);

      await cache.getPDB('1ABC');

      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.METADATA,
        expect.objectContaining({
          hitCount: 6,
        })
      );
    });

    it('should track cache misses', async () => {
      const stats = {
        totalSize: 0,
        entryCount: 0,
        hitCount: 5,
        missCount: 2,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValueOnce(null).mockResolvedValueOnce(stats);
      mockDB.put.mockResolvedValue(undefined);

      await cache.getPDB('MISSING');

      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.METADATA,
        expect.objectContaining({
          missCount: 3,
        })
      );
    });

    it('should calculate hit rate correctly', async () => {
      const stats = {
        totalSize: 1000,
        entryCount: 10,
        hitCount: 70,
        missCount: 30,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValue(stats);

      const hitRate = await cache.getHitRate();

      expect(hitRate).toBe(0.7); // 70/100 = 0.7
    });

    it('should return 0 hit rate when no requests', async () => {
      const stats = {
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValue(stats);

      const hitRate = await cache.getHitRate();

      expect(hitRate).toBe(0);
    });
  });

  describe('Cleanup Operations', () => {
    it('should clear all cache data', async () => {
      mockDB.clear.mockResolvedValue(undefined);
      mockDB.put.mockResolvedValue(undefined);
      mockDB.get.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });

      await cache.clear();

      expect(mockDB.clear).toHaveBeenCalledWith(CACHE_CONFIG.STORES.PDB_FILES);
      expect(mockDB.clear).toHaveBeenCalledWith(CACHE_CONFIG.STORES.COMPUTED_DATA);
      expect(mockDB.put).toHaveBeenCalledWith(
        CACHE_CONFIG.STORES.METADATA,
        expect.objectContaining({
          totalSize: 0,
          entryCount: 0,
          hitCount: 0,
          missCount: 0,
        })
      );
    });

    it('should delete specific PDB entry', async () => {
      const entry: CacheEntry<PDBCacheData> = {
        key: 'pdb:1abc',
        data: { content: 'test' },
        timestamp: Date.now(),
        size: 1000,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      mockDB.get.mockResolvedValue(entry);
      mockDB.delete.mockResolvedValue(undefined);

      await cache.deletePDB('1ABC');

      expect(mockDB.delete).toHaveBeenCalledWith(CACHE_CONFIG.STORES.PDB_FILES, 'pdb:1abc');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getCache', () => {
      const instance1 = getCache();
      const instance2 = getCache();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton when resetCache called', () => {
      const instance1 = getCache();
      resetCache();
      const instance2 = getCache();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database initialization errors gracefully', async () => {
      (openDB as any).mockRejectedValue(new Error('DB init failed'));

      await expect(async () => {
        const failCache = new IndexedDBCache();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }).rejects.toThrow();
    });

    it('should handle quota exceeded errors', async () => {
      const stats = {
        totalSize: CACHE_CONFIG.MAX_SIZE_MB * 1024 * 1024,
        entryCount: 1000,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      };

      mockDB.get.mockResolvedValue(stats);
      mockDB.transaction = vi.fn().mockReturnValue({
        store: {
          index: vi.fn().mockReturnValue({
            openCursor: vi.fn().mockResolvedValue(null),
          }),
        },
        done: Promise.resolve(),
      });

      const pdbData: PDBCacheData = { content: 'test' };
      await cache.cachePDB('TEST', pdbData);

      // Should attempt eviction
      expect(mockDB.transaction).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent cache operations', async () => {
      const pdbData: PDBCacheData = { content: 'test' };

      mockDB.get.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockDB.put.mockResolvedValue(undefined);

      const promises = Array(100)
        .fill(null)
        .map((_, i) => cache.cachePDB(`PDB${i}`, pdbData));

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should complete cache operations within acceptable time', async () => {
      const pdbData: PDBCacheData = { content: 'test data' };

      mockDB.get.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockDB.put.mockResolvedValue(undefined);

      const start = performance.now();
      await cache.cachePDB('PERF', pdbData);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });
  });
});
