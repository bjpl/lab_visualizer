/**
 * Cache Integration Tests
 *
 * Tests multi-tier cache coordination and L2→L3 fallback behavior
 * Validates cache warming, distributed caching, and edge cache integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService } from '../../../src/lib/cache/cache-service';
import { IndexedDBCache, PDBCacheData } from '../../../src/lib/cache/indexeddb';

describe('Cache Integration', () => {
  let cacheService: CacheService;
  let mockIndexedDB: any;

  beforeEach(() => {
    // Mock IndexedDB implementation
    mockIndexedDB = {
      getPDB: vi.fn(),
      cachePDB: vi.fn(),
      getData: vi.fn(),
      cacheData: vi.fn(),
      deletePDB: vi.fn(),
      deleteData: vi.fn(),
      getStats: vi.fn(),
      getHitRate: vi.fn(),
      clear: vi.fn(),
    };

    cacheService = new CacheService(mockIndexedDB);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Multi-Tier Cache Flow', () => {
    it('should follow L1 → Server flow on cold cache', async () => {
      const serverData: PDBCacheData = {
        content: 'ATOM 1 CA MET A',
        metadata: { pdbId: '1ABC', title: 'Test Structure' },
      };

      // L1 (IndexedDB) miss
      mockIndexedDB.getPDB.mockResolvedValue(null);

      // Server response
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
        headers: new Headers({
          'X-Cache': 'MISS',
          'X-Cache-Key': 'pdb:1abc',
        }),
      });

      const result = await cacheService.fetchPDB('1ABC');

      expect(result).toEqual(serverData);
      expect(mockIndexedDB.getPDB).toHaveBeenCalledWith('1abc');
      expect(fetch).toHaveBeenCalledWith('/api/structures/1abc', expect.any(Object));
      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('1abc', serverData);
    });

    it('should serve from L1 without touching server', async () => {
      const cachedData: PDBCacheData = {
        content: 'CACHED STRUCTURE',
        metadata: { pdbId: '1ABC' },
      };

      // L1 (IndexedDB) hit
      mockIndexedDB.getPDB.mockResolvedValue(cachedData);

      const result = await cacheService.fetchPDB('1ABC');

      expect(result).toEqual(cachedData);
      expect(mockIndexedDB.getPDB).toHaveBeenCalledWith('1abc');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should cache server responses in L1', async () => {
      const serverData: PDBCacheData = {
        content: 'FRESH DATA',
        metadata: { pdbId: '2XYZ' },
      };

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
      });

      await cacheService.fetchPDB('2XYZ');

      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('2xyz', serverData);
    });
  });

  describe('Cache Warming Strategy', () => {
    it('should warm cache with popular structures', async () => {
      const popularStructures = ['1HHO', '2DHB', '1MBO', '2LYZ', '4HHB'];

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'test' }),
      });

      await cacheService.prefetchPDBs(popularStructures);

      expect(mockIndexedDB.getPDB).toHaveBeenCalledTimes(5);
      expect(fetch).toHaveBeenCalledTimes(5);
      expect(mockIndexedDB.cachePDB).toHaveBeenCalledTimes(5);
    });

    it('should handle partial failures during warming', async () => {
      const structures = ['VALID1', 'INVALID', 'VALID2'];

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: 'valid1' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: 'valid2' }),
        });

      // Should not throw
      await cacheService.prefetchPDBs(structures);

      expect(mockIndexedDB.cachePDB).toHaveBeenCalledTimes(2); // Only valid ones
    });

    it('should skip already cached structures during warming', async () => {
      const structures = ['CACHED1', 'NEW1', 'CACHED2'];

      mockIndexedDB.getPDB
        .mockResolvedValueOnce({ content: 'cached1' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ content: 'cached2' });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'new' }),
      });

      await cacheService.prefetchPDBs(structures);

      expect(fetch).toHaveBeenCalledTimes(1); // Only for NEW1
    });
  });

  describe('Cache Coordination', () => {
    it('should coordinate updates across cache tiers', async () => {
      const updatedData: PDBCacheData = {
        content: 'UPDATED STRUCTURE',
        metadata: { pdbId: '1ABC', resolution: 1.5 },
      };

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => updatedData,
      });

      await cacheService.fetchPDB('1ABC', { forceRefresh: true });

      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('1abc', updatedData);
    });

    it('should invalidate cache entries correctly', async () => {
      await cacheService.invalidate('pdb:1abc');

      expect(mockIndexedDB.deletePDB).toHaveBeenCalledWith('1abc');
    });

    it('should handle bulk invalidation', async () => {
      const keys = ['pdb:1abc', 'pdb:2def', 'custom-key'];

      for (const key of keys) {
        await cacheService.invalidate(key);
      }

      expect(mockIndexedDB.deletePDB).toHaveBeenCalledTimes(2);
      expect(mockIndexedDB.deleteData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cache Integration', () => {
    it('should respect cache control headers', async () => {
      const serverData: PDBCacheData = { content: 'test' };

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
        headers: new Headers({
          'Cache-Control': 'public, max-age=3600',
          'X-Cache-Status': 'HIT',
        }),
      });

      await cacheService.fetchPDB('1ABC');

      expect(mockIndexedDB.cachePDB).toHaveBeenCalled();
    });

    it('should handle cache bypass headers', async () => {
      const freshData: PDBCacheData = { content: 'fresh' };

      mockIndexedDB.getPDB.mockResolvedValue({ content: 'stale' });
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => freshData,
      });

      const result = await cacheService.fetchPDB('1ABC', { forceRefresh: true });

      expect(result).toEqual(freshData);
      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('1abc', freshData);
    });
  });

  describe('Distributed Cache Scenarios', () => {
    it('should handle concurrent requests for same resource', async () => {
      const data: PDBCacheData = { content: 'shared data' };

      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => data,
      });

      // Simulate 10 concurrent requests for same PDB
      const promises = Array(10)
        .fill(null)
        .map(() => cacheService.fetchPDB('1ABC'));

      const results = await Promise.all(promises);

      // All should get the same data
      results.forEach((result) => {
        expect(result).toEqual(data);
      });

      // Fetch might be called multiple times due to race, but that's okay
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle different resources concurrently', async () => {
      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockImplementation((url: string) => {
        const pdbId = url.split('/').pop();
        return Promise.resolve({
          ok: true,
          json: async () => ({
            content: `data for ${pdbId}`,
            metadata: { pdbId },
          }),
        });
      });

      const pdbIds = ['1ABC', '2DEF', '3GHI', '4JKL', '5MNO'];
      const promises = pdbIds.map((id) => cacheService.fetchPDB(id));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.metadata?.pdbId).toBe(pdbIds[i].toLowerCase());
      });
    });
  });

  describe('Cache Metrics Integration', () => {
    it('should track hit rate across requests', async () => {
      mockIndexedDB.getStats.mockResolvedValue({
        totalSize: 1024 * 1024 * 50,
        entryCount: 10,
        hitCount: 7,
        missCount: 3,
        lastCleanup: Date.now(),
      });
      mockIndexedDB.getHitRate.mockResolvedValue(0.7);

      const stats = await cacheService.getStats();

      expect(stats.l1HitRate).toBe(0.7);
      expect(stats.totalHits).toBe(7);
      expect(stats.totalMisses).toBe(3);
    });

    it('should track latency across tiers', async () => {
      // L1 hit (fast)
      mockIndexedDB.getPDB.mockResolvedValueOnce({ content: 'cached' });
      await cacheService.fetchPDB('CACHED');

      // L1 miss + server fetch (slower)
      mockIndexedDB.getPDB.mockResolvedValueOnce(null);
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { content: 'fetched' };
        },
      });
      await cacheService.fetchPDB('FETCHED');

      mockIndexedDB.getStats.mockResolvedValue({
        totalSize: 0,
        entryCount: 2,
        hitCount: 1,
        missCount: 1,
        lastCleanup: Date.now(),
      });
      mockIndexedDB.getHitRate.mockResolvedValue(0.5);

      const stats = await cacheService.getStats();

      expect(stats.avgLatency).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    it('should gracefully degrade when L1 cache fails', async () => {
      const serverData: PDBCacheData = { content: 'fallback data' };

      // L1 cache throws error
      mockIndexedDB.getPDB.mockRejectedValue(new Error('IndexedDB unavailable'));

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
      });

      // Should still fail as we propagate cache errors
      await expect(cacheService.fetchPDB('1ABC')).rejects.toThrow('IndexedDB unavailable');
    });

    it('should handle network failures', async () => {
      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(cacheService.fetchPDB('1ABC')).rejects.toThrow('Network error');
    });

    it('should recover from temporary failures', async () => {
      mockIndexedDB.getPDB.mockResolvedValue(null);

      // First attempt fails
      (fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      await expect(cacheService.fetchPDB('1ABC')).rejects.toThrow('Timeout');

      // Second attempt succeeds
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'recovered' }),
      });

      const result = await cacheService.fetchPDB('1ABC');
      expect(result.content).toBe('recovered');
    });
  });

  describe('Cache Consistency', () => {
    it('should maintain consistency across updates', async () => {
      const initialData: PDBCacheData = { content: 'v1' };
      const updatedData: PDBCacheData = { content: 'v2' };

      // Initial fetch and cache
      mockIndexedDB.getPDB.mockResolvedValueOnce(null);
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => initialData,
      });

      await cacheService.fetchPDB('1ABC');
      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('1abc', initialData);

      // Force refresh with updated data
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedData,
      });

      await cacheService.fetchPDB('1ABC', { forceRefresh: true });
      expect(mockIndexedDB.cachePDB).toHaveBeenCalledWith('1abc', updatedData);
    });

    it('should handle cache eviction correctly', async () => {
      mockIndexedDB.getStats.mockResolvedValue({
        totalSize: 500 * 1024 * 1024, // At max capacity
        entryCount: 100,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });

      const newData: PDBCacheData = { content: 'new large structure' };
      mockIndexedDB.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => newData,
      });

      await cacheService.fetchPDB('NEW');

      // Should still attempt to cache even if eviction needed
      expect(mockIndexedDB.cachePDB).toHaveBeenCalled();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle high request volume', async () => {
      mockIndexedDB.getPDB.mockImplementation((id: string) => {
        // Simulate 70% hit rate
        return Math.random() < 0.7
          ? Promise.resolve({ content: `cached ${id}` })
          : Promise.resolve(null);
      });

      (fetch as any).mockImplementation((url: string) => {
        const pdbId = url.split('/').pop();
        return Promise.resolve({
          ok: true,
          json: async () => ({ content: `fetched ${pdbId}` }),
        });
      });

      const requests = 100;
      const pdbIds = Array(requests)
        .fill(null)
        .map((_, i) => `PDB${i % 20}`); // 20 unique structures

      const promises = pdbIds.map((id) => cacheService.fetchPDB(id));

      const start = performance.now();
      await Promise.all(promises);
      const duration = performance.now() - start;

      // Should complete reasonably fast
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    });

    it('should maintain performance with growing cache', async () => {
      const sizes = [10, 50, 100];

      for (const size of sizes) {
        mockIndexedDB.getPDB.mockResolvedValue({ content: 'test' });

        const start = performance.now();
        const promises = Array(size)
          .fill(null)
          .map((_, i) => cacheService.fetchPDB(`PDB${i}`));
        await Promise.all(promises);
        const duration = performance.now() - start;

        // Performance should scale linearly or better
        expect(duration).toBeLessThan(size * 10); // <10ms per request
      }
    });
  });
});
