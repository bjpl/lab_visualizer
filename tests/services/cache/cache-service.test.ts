/**
 * Cache Service Unit Tests
 *
 * Comprehensive test suite for the unified cache service
 * Tests: multi-tier caching, L1 hit/miss, prefetch, invalidation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheService, getCacheService, resetCacheService } from '../../../src/lib/cache/cache-service';
import { PDBCacheData } from '../../../src/lib/cache/indexeddb';

// Mock IndexedDB cache
const mockCache = {
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

vi.mock('../../../src/lib/cache/indexeddb', () => ({
  getCache: () => mockCache,
}));

// Mock fetch
global.fetch = vi.fn();

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    resetCacheService();
    service = new CacheService(mockCache as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PDB Fetching with L1 Cache', () => {
    it('should return cached data on L1 hit', async () => {
      const cachedData: PDBCacheData = {
        content: 'CACHED PDB DATA',
        metadata: { pdbId: '1ABC' },
      };

      mockCache.getPDB.mockResolvedValue(cachedData);

      const result = await service.fetchPDB('1ABC');

      expect(result).toEqual(cachedData);
      expect(mockCache.getPDB).toHaveBeenCalledWith('1abc');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fetch from server on L1 miss', async () => {
      const serverData: PDBCacheData = {
        content: 'SERVER PDB DATA',
        metadata: { pdbId: '1ABC' },
      };

      mockCache.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
      });

      const result = await service.fetchPDB('1ABC');

      expect(result).toEqual(serverData);
      expect(mockCache.getPDB).toHaveBeenCalledWith('1abc');
      expect(fetch).toHaveBeenCalledWith(
        '/api/structures/1abc',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      );
      expect(mockCache.cachePDB).toHaveBeenCalledWith('1abc', serverData);
    });

    it('should bypass cache with forceRefresh option', async () => {
      const freshData: PDBCacheData = {
        content: 'FRESH DATA',
        metadata: { pdbId: '1ABC' },
      };

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => freshData,
      });

      const result = await service.fetchPDB('1ABC', { forceRefresh: true });

      expect(result).toEqual(freshData);
      expect(mockCache.getPDB).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalled();
    });

    it('should normalize PDB IDs to lowercase', async () => {
      mockCache.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'test' }),
      });

      await service.fetchPDB('ABC123');

      expect(mockCache.getPDB).toHaveBeenCalledWith('abc123');
      expect(fetch).toHaveBeenCalledWith('/api/structures/abc123', expect.any(Object));
    });

    it('should respect useL1 option', async () => {
      const serverData: PDBCacheData = { content: 'SERVER' };

      mockCache.getPDB.mockResolvedValue({ content: 'CACHED' });
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => serverData,
      });

      await service.fetchPDB('1ABC', { useL1: false });

      expect(mockCache.getPDB).not.toHaveBeenCalled();
      expect(mockCache.cachePDB).not.toHaveBeenCalled();
    });
  });

  describe('Generic Cache with Fetcher', () => {
    it('should cache and return fetcher result', async () => {
      const data = { value: 'computed' };
      const fetcher = vi.fn().mockResolvedValue(data);

      mockCache.getData.mockResolvedValue(null);

      const result = await service.fetchWithCache('test-key', fetcher);

      expect(result).toEqual(data);
      expect(fetcher).toHaveBeenCalled();
      expect(mockCache.cacheData).toHaveBeenCalledWith('test-key', data, undefined);
    });

    it('should return cached data without calling fetcher', async () => {
      const cachedData = { value: 'cached' };
      const fetcher = vi.fn();

      mockCache.getData.mockResolvedValue(cachedData);

      const result = await service.fetchWithCache('test-key', fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should support custom tags', async () => {
      const data = { value: 'test' };
      const fetcher = vi.fn().mockResolvedValue(data);
      const tags = ['tag1', 'tag2'];

      mockCache.getData.mockResolvedValue(null);

      await service.fetchWithCache('key', fetcher, { tags });

      expect(mockCache.cacheData).toHaveBeenCalledWith('key', data, tags);
    });
  });

  describe('URL Fetching', () => {
    it('should fetch and cache URL responses', async () => {
      const responseData = { result: 'success' };

      mockCache.getData.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      const result = await service.fetchURL('https://api.example.com/data');

      expect(result).toEqual(responseData);
      expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', expect.any(Object));
    });

    it('should use different cache keys for different request bodies', async () => {
      mockCache.getData.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await service.fetchURL('https://api.example.com', {
        method: 'POST',
        body: JSON.stringify({ id: 1 }),
      });

      await service.fetchURL('https://api.example.com', {
        method: 'POST',
        body: JSON.stringify({ id: 2 }),
      });

      expect(mockCache.getData).toHaveBeenCalledTimes(2);
      const calls = mockCache.getData.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]); // Different cache keys
    });

    it('should handle HTTP errors', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(service.fetchURL('https://api.example.com/missing')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });
  });

  describe('Prefetching', () => {
    it('should prefetch multiple PDB files', async () => {
      const pdbIds = ['1ABC', '2DEF', '3GHI'];

      mockCache.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'test' }),
      });

      await service.prefetchPDBs(pdbIds);

      expect(mockCache.getPDB).toHaveBeenCalledTimes(3);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle prefetch errors gracefully', async () => {
      const pdbIds = ['1ABC', 'INVALID', '2DEF'];

      mockCache.getPDB.mockResolvedValue(null);
      (fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'test' }) })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ content: 'test' }) });

      // Should not throw
      await expect(service.prefetchPDBs(pdbIds)).resolves.not.toThrow();
    });

    it('should skip already cached entries during prefetch', async () => {
      const pdbIds = ['1ABC', '2DEF'];

      mockCache.getPDB
        .mockResolvedValueOnce({ content: 'cached' })
        .mockResolvedValueOnce(null);

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: 'fetched' }),
      });

      await service.prefetchPDBs(pdbIds);

      expect(fetch).toHaveBeenCalledTimes(1); // Only for non-cached
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate PDB cache entry', async () => {
      await service.invalidate('pdb:1abc');

      expect(mockCache.deletePDB).toHaveBeenCalledWith('1abc');
    });

    it('should invalidate generic data entry', async () => {
      await service.invalidate('custom-key');

      expect(mockCache.deleteData).toHaveBeenCalledWith('custom-key');
    });
  });

  describe('Statistics and Metrics', () => {
    it('should return cache statistics', async () => {
      const metadata = {
        totalSize: 100 * 1024 * 1024,
        entryCount: 50,
        hitCount: 350,
        missCount: 150,
        lastCleanup: Date.now(),
      };

      mockCache.getStats.mockResolvedValue(metadata);
      mockCache.getHitRate.mockResolvedValue(0.7);

      const stats = await service.getStats();

      expect(stats).toEqual({
        l1HitRate: 0.7,
        l1Size: 100 * 1024 * 1024,
        l1Entries: 50,
        totalHits: 350,
        totalMisses: 150,
        avgLatency: expect.any(Number),
      });
    });

    it('should track latency metrics', async () => {
      mockCache.getPDB.mockResolvedValue({ content: 'test' });
      mockCache.getStats.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 1,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockCache.getHitRate.mockResolvedValue(1);

      await service.fetchPDB('1ABC');
      const stats = await service.getStats();

      expect(stats.avgLatency).toBeGreaterThanOrEqual(0);
      expect(stats.avgLatency).toBeLessThan(1000); // Should be fast
    });

    it('should maintain limited latency history', async () => {
      mockCache.getPDB.mockResolvedValue({ content: 'test' });

      // Fetch 150 times (more than maxMetrics)
      for (let i = 0; i < 150; i++) {
        await service.fetchPDB(`PDB${i}`);
      }

      mockCache.getStats.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 150,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockCache.getHitRate.mockResolvedValue(1);

      const stats = await service.getStats();

      // Should still calculate average correctly (limited to last 100)
      expect(stats.avgLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Clearing', () => {
    it('should clear all caches and reset metrics', async () => {
      mockCache.clear.mockResolvedValue(undefined);

      await service.clearAll();

      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should reset latency metrics on clear', async () => {
      mockCache.getPDB.mockResolvedValue({ content: 'test' });
      await service.fetchPDB('1ABC');

      await service.clearAll();

      mockCache.getStats.mockResolvedValue({
        totalSize: 0,
        entryCount: 0,
        hitCount: 0,
        missCount: 0,
        lastCleanup: Date.now(),
      });
      mockCache.getHitRate.mockResolvedValue(0);

      const stats = await service.getStats();
      expect(stats.avgLatency).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error on fetch failure', async () => {
      mockCache.getPDB.mockResolvedValue(null);
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.fetchPDB('1ABC')).rejects.toThrow();
    });

    it('should propagate cache errors', async () => {
      mockCache.getPDB.mockRejectedValue(new Error('Cache error'));

      await expect(service.fetchPDB('1ABC')).rejects.toThrow('Cache error');
    });

    it('should handle fetcher errors in fetchWithCache', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetcher failed'));
      mockCache.getData.mockResolvedValue(null);

      await expect(service.fetchWithCache('key', fetcher)).rejects.toThrow('Fetcher failed');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getCacheService', () => {
      const instance1 = getCacheService();
      const instance2 = getCacheService();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton when resetCacheService called', () => {
      const instance1 = getCacheService();
      resetCacheService();
      const instance2 = getCacheService();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Performance', () => {
    it('should handle concurrent cache requests', async () => {
      mockCache.getPDB.mockResolvedValue({ content: 'test' });

      const promises = Array(100)
        .fill(null)
        .map((_, i) => service.fetchPDB(`PDB${i}`));

      await expect(Promise.all(promises)).resolves.toHaveLength(100);
    });

    it('should complete fetch operations quickly', async () => {
      mockCache.getPDB.mockResolvedValue({ content: 'cached data' });

      const start = performance.now();
      await service.fetchPDB('1ABC');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // L1 hit should be very fast
    });
  });
});
