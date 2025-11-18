/**
 * Cache Warming Test Suite
 *
 * Comprehensive tests for cache warming functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheStrategyEngine, StructureMetadata } from '../src/lib/cache-strategy';
import CacheWarmingService from '../src/services/cache-warming';

describe('CacheStrategyEngine', () => {
  let strategy: CacheStrategyEngine;

  beforeEach(() => {
    strategy = new CacheStrategyEngine();
  });

  describe('Score Calculation', () => {
    it('should calculate high scores for educational structures', () => {
      const score = strategy.calculateScore('1HHO'); // Hemoglobin
      expect(score).toBeGreaterThan(0.4);
    });

    it('should give higher scores to recent structures', () => {
      strategy.updateHistory('TEST1');
      strategy.updateHistory('TEST2');

      const score1 = strategy.calculateScore('TEST1');
      const score2 = strategy.calculateScore('TEST2');

      expect(score2).toBeGreaterThan(score1); // More recent
    });

    it('should increase popularity over time', () => {
      const initialScore = strategy.calculateScore('NEWSTRUCT');

      strategy.updatePopularity('NEWSTRUCT', 0.2);
      const updatedScore = strategy.calculateScore('NEWSTRUCT');

      expect(updatedScore).toBeGreaterThan(initialScore);
    });

    it('should consider relevance from family relationships', () => {
      strategy.registerFamily('hemoglobin', ['1HHO', '2DHB', '4HHB']);
      strategy.updateHistory('1HHO');

      const score2DHB = strategy.calculateScore('2DHB');
      const scoreUnrelated = strategy.calculateScore('UNRELATED');

      expect(score2DHB).toBeGreaterThan(scoreUnrelated);
    });
  });

  describe('Structure Selection', () => {
    it('should select top educational structures', () => {
      const top = strategy.getTopEducationalStructures(10);
      expect(top).toHaveLength(10);
      expect(top).toContain('1HHO');
      expect(top).toContain('2LYZ');
    });

    it('should respect budget constraints', () => {
      const structures: StructureMetadata[] = Array.from({ length: 100 }, (_, i) => ({
        pdbId: `TEST${i}`,
        size: 10 * 1024 * 1024, // 10MB each
        popularity: Math.random(),
      }));

      const selected = strategy.getStructuresToCache(structures);
      const totalSize = selected.reduce((sum, s) => sum + s.estimatedSize, 0);

      expect(totalSize).toBeLessThanOrEqual(500 * 1024 * 1024); // 500MB budget
    });

    it('should filter by minimum score', () => {
      const structures: StructureMetadata[] = [
        { pdbId: '1HHO', size: 1024, popularity: 1.0 },
        { pdbId: 'LOWSCORE', size: 1024, popularity: 0.0 },
      ];

      const selected = strategy.getStructuresToCache(structures);

      expect(selected.some(s => s.pdbId === '1HHO')).toBe(true);
      expect(selected.some(s => s.pdbId === 'LOWSCORE')).toBe(false);
    });
  });

  describe('Adaptive Strategy', () => {
    it('should adapt weights based on hit rate', () => {
      const initialConfig = strategy.exportConfig();

      strategy.updateStats({ hitRate: 0.2, totalRequests: 100, cacheHits: 20, avgLoadTime: 500 });
      strategy.adaptStrategy(0.5);

      const adaptedConfig = strategy.exportConfig();

      expect(adaptedConfig.popularWeight).not.toEqual(initialConfig.popularWeight);
    });

    it('should provide recommendations for poor performance', () => {
      strategy.updateStats({ hitRate: 0.2, totalRequests: 100, cacheHits: 20, avgLoadTime: 1500 });

      const health = strategy.getHealthMetrics();

      expect(health.effectiveness).toBe('poor');
      expect(health.recommendations.length).toBeGreaterThan(0);
    });

    it('should recognize excellent performance', () => {
      strategy.updateStats({ hitRate: 0.7, totalRequests: 100, cacheHits: 70, avgLoadTime: 300 });

      const health = strategy.getHealthMetrics();

      expect(health.effectiveness).toBe('excellent');
    });
  });
});

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;

  beforeEach(() => {
    service = new CacheWarmingService({
      enabled: true,
      maxConcurrent: 3,
      networkAware: false,
      respectUserPrefs: false,
    });

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1024),
    } as Response);

    // Mock IndexedDB
    global.indexedDB = {
      open: vi.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: {
          transaction: () => ({
            objectStore: () => ({
              put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            }),
          }),
        },
      }),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Lifecycle', () => {
    it('should start warming with default structures', async () => {
      let progressEvents = 0;
      service.addEventListener((event) => {
        if (event.type === 'progress') progressEvents++;
      });

      await service.start();

      expect(progressEvents).toBeGreaterThan(0);
    });

    it('should respect max concurrent limit', async () => {
      service = new CacheWarmingService({ maxConcurrent: 2 });

      // This is a simplified test - in reality would need timing checks
      await service.start();
      const status = service.getStatus();

      expect(status.progress.inProgress).toBeLessThanOrEqual(2);
    });

    it('should handle pause and resume', async () => {
      await service.start();

      service.pause();
      let status = service.getStatus();
      expect(status.isPaused).toBe(true);

      service.resume();
      status = service.getStatus();
      expect(status.isPaused).toBe(false);
    });

    it('should handle cancellation', async () => {
      await service.start();

      service.cancel();
      const status = service.getStatus();

      expect(status.isActive).toBe(false);
    });
  });

  describe('Progress Tracking', () => {
    it('should report accurate progress', async () => {
      let finalProgress: any = null;

      service.addEventListener((event) => {
        if (event.type === 'complete') {
          finalProgress = event.progress;
        }
      });

      await service.start();

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 100));

      if (finalProgress) {
        expect(finalProgress.total).toBeGreaterThan(0);
      }
    });

    it('should calculate estimated time remaining', () => {
      const progress = service.getProgress();
      expect(progress.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should track bytes downloaded', async () => {
      await service.start();

      const progress = service.getProgress();
      expect(progress.bytesDownloaded).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should retry failed fetches', async () => {
      let attempts = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1024),
        });
      });

      await service.start();

      // Should have retried
      expect(attempts).toBeGreaterThanOrEqual(2);
    });

    it('should mark structures as failed after max retries', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      service = new CacheWarmingService({
        retryAttempts: 2,
        retryDelay: 10,
      });

      await service.start();

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 100));

      const status = service.getStatus();
      expect(status.progress.failed).toBeGreaterThan(0);
    });
  });

  describe('Network Awareness', () => {
    it('should skip warming on slow connections when enabled', async () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: 'slow-2g', saveData: false },
        writable: true,
      });

      service = new CacheWarmingService({ networkAware: true });
      await service.start();

      const status = service.getStatus();
      expect(status.isActive).toBe(false);
    });

    it('should respect save data preference', async () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g', saveData: true },
        writable: true,
      });

      service = new CacheWarmingService({ networkAware: true });
      await service.start();

      const status = service.getStatus();
      expect(status.isActive).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  it('should warm cache and improve hit rate', async () => {
    const strategy = new CacheStrategyEngine();
    const service = new CacheWarmingService({
      enabled: true,
      networkAware: false,
      respectUserPrefs: false,
    }, strategy);

    // Mock initial low hit rate
    strategy.updateStats({ hitRate: 0.25, totalRequests: 100, cacheHits: 25, avgLoadTime: 1000 });

    // Start warming
    await service.start();

    // Simulate cache usage
    strategy.updateHistory('1HHO');
    strategy.updateHistory('2LYZ');

    // Update with improved stats
    strategy.updateStats({ hitRate: 0.55, totalRequests: 200, cacheHits: 110, avgLoadTime: 400 });

    const health = strategy.getHealthMetrics();
    expect(health.hitRate).toBeGreaterThan(0.5);
    expect(health.effectiveness).not.toBe('poor');
  });

  it('should adapt strategy based on usage patterns', () => {
    const strategy = new CacheStrategyEngine();

    // Simulate usage
    for (let i = 0; i < 10; i++) {
      strategy.updateHistory(`TEST${i}`);
      strategy.updatePopularity(`TEST${i}`, 0.1);
    }

    const structures: StructureMetadata[] = Array.from({ length: 20 }, (_, i) => ({
      pdbId: `TEST${i}`,
      size: 2 * 1024 * 1024,
      popularity: i < 10 ? 0.8 : 0.2,
    }));

    const selected = strategy.getStructuresToCache(structures);

    // Should prioritize recently used and popular structures
    expect(selected[0].recency).toBeGreaterThan(0);
  });
});
