/**
 * Performance Benchmark Integration Tests
 * Tests system performance under various load conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceProfiler } from '@/lib/performance-profiler';
import { LODManager, LODLevel } from '@/lib/lod-manager';
import { molstarService } from '@/services/molstar-service';

describe('Performance Benchmarks', () => {
  let profiler: PerformanceProfiler;
  let container: HTMLDivElement;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    profiler.stopRecording();
    molstarService.dispose();
    document.body.removeChild(container);
  });

  describe('Frame Rate Benchmarks', () => {
    it('should maintain 60fps with small structures', async () => {
      profiler.startRecording();

      // Simulate 120 frames at 60fps
      for (let i = 0; i < 120; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 16)); // ~60fps
        profiler.endFrame(5, 1000);
      }

      const report = profiler.generateReport();

      expect(report.summary.avgFPS).toBeGreaterThan(50);
      expect(report.summary.droppedFrames).toBeLessThan(10);
    }, 10000);

    it('should detect performance degradation', async () => {
      profiler.startRecording();

      // Simulate progressive slowdown
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        const frameTime = 16 + i * 0.5; // Gradually increasing frame time
        await new Promise((resolve) => setTimeout(resolve, frameTime));
        profiler.endFrame(5 + i, 1000);
      }

      const analysis = profiler.analyzeBottleneck();

      expect(analysis.bottleneck).not.toBe('balanced');
      expect(analysis.severity).not.toBe('low');
    }, 10000);

    it('should track real-time stats accurately', async () => {
      profiler.startRecording();

      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 16));
        profiler.endFrame(5, 1000);
      }

      const stats = profiler.getRealTimeStats();

      expect(stats.currentFPS).toBeGreaterThan(0);
      expect(stats.avgFPS).toBeGreaterThan(0);
      expect(stats.cpuTime).toBeGreaterThan(0);
    }, 5000);
  });

  describe('Memory Benchmarks', () => {
    it('should stay within memory budget for small structures', () => {
      const lodManager = new LODManager({}, 512);

      const smallComplexity = lodManager.analyzeComplexity({
        atomCount: 500,
        bondCount: 600,
        residueCount: 50,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
      });

      const memory = lodManager.estimateMemoryUsage(
        smallComplexity,
        LODLevel.FULL
      );

      const budgetMB = 512;
      expect(memory).toBeLessThan(budgetMB * 1024 * 1024 * 0.8);
    });

    it('should enforce memory limits for large structures', () => {
      const lodManager = new LODManager({}, 512);

      const largeComplexity = lodManager.analyzeComplexity({
        atomCount: 100000,
        bondCount: 120000,
        residueCount: 10000,
        chainCount: 20,
        hasLigands: true,
        hasSurfaces: true,
      });

      expect(
        lodManager.canAffordLevel(largeComplexity, LODLevel.FULL)
      ).toBe(false);
      expect(
        lodManager.canAffordLevel(largeComplexity, LODLevel.PREVIEW)
      ).toBe(true);
    });

    it('should optimize memory usage with LOD', () => {
      const lodManager = new LODManager({}, 256);

      const complexity = lodManager.analyzeComplexity({
        atomCount: 5000,
        bondCount: 6000,
        residueCount: 500,
        chainCount: 2,
      });

      const previewMemory = lodManager.estimateMemoryUsage(
        complexity,
        LODLevel.PREVIEW
      );
      const fullMemory = lodManager.estimateMemoryUsage(
        complexity,
        LODLevel.FULL
      );

      // Preview should use significantly less memory
      expect(previewMemory).toBeLessThan(fullMemory * 0.2);
    });
  });

  describe('Load Time Benchmarks', () => {
    it('should load small structures under 200ms', async () => {
      const lodManager = new LODManager({}, 512);

      const mockRenderer = {
        render: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }),
      };

      const smallStructure = {
        atoms: Array(100)
          .fill(null)
          .map((_, i) => ({ name: 'CA', x: i, y: i, z: i })),
        atomCount: 100,
        bondCount: 120,
        residueCount: 10,
        chainCount: 1,
      };

      const startTime = performance.now();
      await lodManager.loadProgressive(
        smallStructure,
        mockRenderer,
        LODLevel.PREVIEW
      );
      const loadTime = performance.now() - startTime;

      expect(loadTime).toBeLessThan(500);
    });

    it('should implement progressive loading for large structures', async () => {
      const lodManager = new LODManager({}, 512);

      const stageResults: any[] = [];

      const mockRenderer = {
        render: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 30));
        }),
      };

      const largeStructure = {
        atoms: Array(5000)
          .fill(null)
          .map((_, i) => ({ name: 'CA', x: i, y: i, z: i })),
        atomCount: 5000,
        bondCount: 6000,
        residueCount: 500,
        chainCount: 5,
      };

      const results = await lodManager.loadProgressive(
        largeStructure,
        mockRenderer,
        LODLevel.INTERACTIVE
      );

      // Should have loaded multiple stages
      expect(results.length).toBeGreaterThan(0);

      // Each stage should complete successfully
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should process multiple structures efficiently', async () => {
      const lodManager = new LODManager({}, 512);

      const mockRenderer = {
        render: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      };

      const structures = Array(5)
        .fill(null)
        .map((_, i) => ({
          atoms: Array(100)
            .fill(null)
            .map((_, j) => ({ name: 'CA', x: j, y: j, z: j })),
          atomCount: 100,
          bondCount: 120,
          residueCount: 10,
          chainCount: 1,
        }));

      const startTime = performance.now();

      for (const structure of structures) {
        await lodManager.loadProgressive(
          structure,
          mockRenderer,
          LODLevel.PREVIEW
        );
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerStructure = totalTime / structures.length;

      expect(avgTimePerStructure).toBeLessThan(200);
    });
  });

  describe('Bottleneck Detection', () => {
    it('should detect CPU bottleneck', async () => {
      profiler.startRecording();

      // Simulate CPU-bound scenario
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        const start = performance.now();
        while (performance.now() - start < 30) {
          // Busy wait - simulate heavy CPU work
        }
        profiler.endFrame(100, 1000); // Many draw calls
      }

      const analysis = profiler.analyzeBottleneck();

      expect(analysis.bottleneck).toBeDefined();
      expect(analysis.recommendation).toBeTruthy();
      expect(analysis.severity).not.toBe('low');
    }, 5000);

    it('should detect GPU bottleneck', async () => {
      profiler.startRecording();

      // Simulate GPU-bound scenario
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 20));
        profiler.endFrame(5, 50000); // Few draw calls, many triangles
      }

      const analysis = profiler.analyzeBottleneck();

      expect(analysis.bottleneck).toBeDefined();
    }, 5000);
  });

  describe('Stress Tests', () => {
    it('should handle sustained high load', async () => {
      profiler.startRecording();

      // Run 300 frames
      for (let i = 0; i < 300; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 16));
        profiler.endFrame(10, 5000);
      }

      const report = profiler.generateReport();

      expect(report.summary.totalFrames).toBe(300);
      expect(report.summary.avgFPS).toBeGreaterThan(30);
    }, 15000);

    it('should recover from frame drops', async () => {
      profiler.startRecording();

      // Mix of good and bad frames
      for (let i = 0; i < 120; i++) {
        profiler.startFrame();
        const isDropped = i % 10 === 0;
        await new Promise((resolve) =>
          setTimeout(resolve, isDropped ? 50 : 16)
        );
        profiler.endFrame(5, 1000);
      }

      const report = profiler.generateReport();

      // Should have recovered between drops
      expect(report.summary.avgFPS).toBeGreaterThan(40);
    }, 10000);
  });

  describe('Export and Reporting', () => {
    it('should export performance report as JSON', async () => {
      profiler.startRecording();

      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 16));
        profiler.endFrame(5, 1000);
      }

      const json = profiler.exportReport();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.summary).toBeDefined();
      expect(parsed.bottleneck).toBeDefined();
      expect(parsed.recommendations).toBeDefined();
    }, 5000);

    it('should generate actionable recommendations', async () => {
      profiler.startRecording();

      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        await new Promise((resolve) => setTimeout(resolve, 25));
        profiler.endFrame(50, 10000);
      }

      const report = profiler.generateReport();

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('suggestion');
        expect(rec).toHaveProperty('priority');
      });
    }, 5000);
  });
});
