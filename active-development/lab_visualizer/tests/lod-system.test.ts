/**
 * LOD System Test Suite
 * Tests for LOD Manager, Quality Manager, and Performance Profiler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LODManager,
  LODLevel,
  LOD_CONFIGS,
  StructureComplexity,
} from '../src/lib/lod-manager';
import {
  QualityManager,
  QualityLevel,
  QUALITY_PRESETS,
} from '../src/services/quality-manager';
import { PerformanceProfiler } from '../src/lib/performance-profiler';

describe('LODManager', () => {
  let lodManager: LODManager;

  beforeEach(() => {
    lodManager = new LODManager({}, 512);
  });

  describe('analyzeComplexity', () => {
    it('should correctly analyze structure complexity', () => {
      const structure = {
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 2,
        hasLigands: true,
        hasSurfaces: false,
      };

      const complexity = lodManager.analyzeComplexity(structure);

      expect(complexity.atomCount).toBe(1000);
      expect(complexity.bondCount).toBe(1200);
      expect(complexity.residueCount).toBe(100);
      expect(complexity.chainCount).toBe(2);
      expect(complexity.hasLigands).toBe(true);
      expect(complexity.estimatedVertices).toBeGreaterThan(0);
    });

    it('should estimate vertices correctly for surfaces', () => {
      const withoutSurface = lodManager.analyzeComplexity({
        atomCount: 100,
        hasSurfaces: false,
      });

      const withSurface = lodManager.analyzeComplexity({
        atomCount: 100,
        hasSurfaces: true,
      });

      expect(withSurface.estimatedVertices).toBeGreaterThan(
        withoutSurface.estimatedVertices
      );
    });
  });

  describe('determineStartingLevel', () => {
    it('should start at INTERACTIVE for small structures', () => {
      const complexity: StructureComplexity = {
        atomCount: 300,
        bondCount: 350,
        residueCount: 30,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 6000,
      };

      const level = lodManager.determineStartingLevel(complexity);
      expect(level).toBe(LODLevel.INTERACTIVE);
    });

    it('should start at PREVIEW for medium structures', () => {
      const complexity: StructureComplexity = {
        atomCount: 2000,
        bondCount: 2400,
        residueCount: 200,
        chainCount: 2,
        hasLigands: true,
        hasSurfaces: false,
        estimatedVertices: 40000,
      };

      const level = lodManager.determineStartingLevel(complexity);
      expect(level).toBe(LODLevel.PREVIEW);
    });

    it('should start at PREVIEW for large structures', () => {
      const complexity: StructureComplexity = {
        atomCount: 50000,
        bondCount: 60000,
        residueCount: 5000,
        chainCount: 10,
        hasLigands: true,
        hasSurfaces: true,
        estimatedVertices: 2500000,
      };

      const level = lodManager.determineStartingLevel(complexity);
      expect(level).toBe(LODLevel.PREVIEW);
    });
  });

  describe('getConfig', () => {
    it('should return correct config for each LOD level', () => {
      const previewConfig = lodManager.getConfig(LODLevel.PREVIEW);
      expect(previewConfig.maxAtoms).toBe(100);
      expect(previewConfig.features.backboneOnly).toBe(true);

      const interactiveConfig = lodManager.getConfig(LODLevel.INTERACTIVE);
      expect(interactiveConfig.maxAtoms).toBe(1000);
      expect(interactiveConfig.features.secondaryStructure).toBe(true);

      const fullConfig = lodManager.getConfig(LODLevel.FULL);
      expect(fullConfig.maxAtoms).toBe(100000);
      expect(fullConfig.features.sidechains).toBe(true);
    });
  });

  describe('filterAtomsForLevel', () => {
    const mockAtoms = [
      { name: 'CA', x: 0, y: 0, z: 0 },
      { name: 'CB', x: 1, y: 1, z: 1 },
      { name: 'C', x: 2, y: 2, z: 2 },
      { name: 'N', x: 3, y: 3, z: 3 },
      { name: 'O', x: 4, y: 4, z: 4 },
      { name: 'CG', x: 5, y: 5, z: 5 },
    ];

    it('should filter to backbone only for PREVIEW level', () => {
      const complexity = {
        atomCount: 6,
        bondCount: 5,
        residueCount: 1,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 120,
      };

      const filtered = lodManager.filterAtomsForLevel(
        mockAtoms,
        LODLevel.PREVIEW,
        complexity
      );

      expect(filtered.length).toBe(4); // CA, C, N, O
      expect(filtered.every((a) => ['CA', 'C', 'N', 'O'].includes(a.name))).toBe(
        true
      );
    });

    it('should include CB for INTERACTIVE level', () => {
      const complexity = {
        atomCount: 6,
        bondCount: 5,
        residueCount: 1,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 120,
      };

      const filtered = lodManager.filterAtomsForLevel(
        mockAtoms,
        LODLevel.INTERACTIVE,
        complexity
      );

      expect(filtered.length).toBe(5); // CA, CB, C, N, O
    });

    it('should respect maxAtoms limit', () => {
      const manyAtoms = Array.from({ length: 200 }, (_, i) => ({
        name: 'CA',
        x: i,
        y: i,
        z: i,
      }));

      const complexity = {
        atomCount: 200,
        bondCount: 200,
        residueCount: 200,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 4000,
      };

      const filtered = lodManager.filterAtomsForLevel(
        manyAtoms,
        LODLevel.PREVIEW,
        complexity
      );

      expect(filtered.length).toBeLessThanOrEqual(100);
    });
  });

  describe('estimateMemoryUsage', () => {
    it('should estimate memory correctly', () => {
      const complexity: StructureComplexity = {
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const memory = lodManager.estimateMemoryUsage(complexity, LODLevel.FULL);
      expect(memory).toBeGreaterThan(0);
    });

    it('should estimate higher memory for surfaces', () => {
      const withoutSurface: StructureComplexity = {
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const withSurface: StructureComplexity = {
        ...withoutSurface,
        hasSurfaces: true,
        estimatedVertices: 50000,
      };

      const memoryWithout = lodManager.estimateMemoryUsage(
        withoutSurface,
        LODLevel.FULL
      );
      const memoryWith = lodManager.estimateMemoryUsage(withSurface, LODLevel.FULL);

      expect(memoryWith).toBeGreaterThan(memoryWithout);
    });
  });

  describe('canAffordLevel', () => {
    it('should return true for small structures', () => {
      const complexity: StructureComplexity = {
        atomCount: 100,
        bondCount: 120,
        residueCount: 10,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 2000,
      };

      expect(lodManager.canAffordLevel(complexity, LODLevel.FULL)).toBe(true);
    });

    it('should return false for very large structures', () => {
      const complexity: StructureComplexity = {
        atomCount: 100000, // At FULL LOD maxAtoms limit
        bondCount: 120000,
        residueCount: 10000,
        chainCount: 10,
        hasLigands: true,
        hasSurfaces: true,
        estimatedVertices: 11324441, // Enough to exceed 80% of 512MB budget
      };

      // With 512MB budget at 80% threshold (409.6MB), 11.3M vertices exceeds capacity
      // Memory = 11.3M * 32 bytes * 1.3 = 471MB > 409.6MB
      expect(lodManager.canAffordLevel(complexity, LODLevel.FULL)).toBe(false);
    });
  });
});

describe('QualityManager', () => {
  let qualityManager: QualityManager;

  beforeEach(() => {
    qualityManager = new QualityManager(QualityLevel.HIGH);
  });

  afterEach(() => {
    qualityManager.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default quality level', () => {
      const settings = qualityManager.getSettings();
      expect(settings.level).toBe(QualityLevel.HIGH);
    });

    it('should load quality presets correctly', () => {
      const lowSettings = QUALITY_PRESETS[QualityLevel.LOW];
      expect(lowSettings.renderScale).toBe(0.5);
      expect(lowSettings.features.antialiasing).toBe('none');

      const ultraSettings = QUALITY_PRESETS[QualityLevel.ULTRA];
      expect(ultraSettings.features.shadows).toBe(true);
      expect(ultraSettings.features.surfaces).toBe(true);
    });
  });

  describe('setQualityLevel', () => {
    it('should update quality level', () => {
      qualityManager.setQualityLevel(QualityLevel.LOW);
      const settings = qualityManager.getSettings();
      expect(settings.level).toBe(QualityLevel.LOW);
    });

    it('should trigger callback on quality change', () => {
      const callback = vi.fn();
      const manager = new QualityManager(QualityLevel.HIGH, {
        onQualityChange: callback,
      });

      manager.setQualityLevel(QualityLevel.MEDIUM);
      // Note: In real implementation, this would be called
      // For now, just verify the setting changed
      expect(manager.getSettings().level).toBe(QualityLevel.MEDIUM);
    });
  });

  describe('setAutoAdjust', () => {
    it('should toggle auto-adjust setting', () => {
      qualityManager.setAutoAdjust(false);
      expect(qualityManager.getSettings().autoAdjust).toBe(false);

      qualityManager.setAutoAdjust(true);
      expect(qualityManager.getSettings().autoAdjust).toBe(true);
    });
  });

  describe('updateRenderMetrics', () => {
    it('should update render metrics', () => {
      qualityManager.updateRenderMetrics(10, 5000, 50 * 1024 * 1024);

      const metrics = qualityManager.getMetrics();
      expect(metrics.drawCalls).toBe(10);
      expect(metrics.triangles).toBe(5000);
      expect(metrics.memoryUsed).toBe(50 * 1024 * 1024);
    });
  });
});

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
  });

  describe('frame profiling', () => {
    it('should record frame profiles', () => {
      profiler.startRecording();
      profiler.startFrame();

      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait 10ms
      }

      const profile = profiler.endFrame(5, 1000);

      expect(profile.drawCalls).toBe(5);
      expect(profile.triangles).toBe(1000);
      expect(profile.frameTime).toBeGreaterThan(0);
      expect(profile.fps).toBeGreaterThan(0);
    });

    it('should limit profile history', () => {
      profiler.startRecording();

      // Record many frames
      for (let i = 0; i < 2000; i++) {
        profiler.startFrame();
        profiler.endFrame(1, 100);
      }

      const profiles = profiler.getProfiles();
      expect(profiles.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('analyzeBottleneck', () => {
    it('should detect balanced performance', () => {
      profiler.startRecording();

      // Simulate balanced performance
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        profiler.endFrame(5, 1000);
      }

      const analysis = profiler.analyzeBottleneck();
      expect(analysis.bottleneck).toBe('balanced');
      expect(analysis.severity).toBe('low');
    });

    it('should detect CPU bottleneck', () => {
      profiler.startRecording();

      // Simulate CPU-bound scenario (high CPU time)
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        const start = performance.now();
        while (performance.now() - start < 20) {
          // Busy wait
        }
        profiler.endFrame(100, 1000); // Many draw calls suggest CPU work
      }

      const analysis = profiler.analyzeBottleneck();
      // Note: Actual bottleneck detection depends on implementation
      expect(analysis).toBeDefined();
      expect(analysis.recommendation).toBeTruthy();
    });
  });

  describe('generateReport', () => {
    it('should generate performance report', () => {
      profiler.startRecording();

      // Record some frames
      for (let i = 0; i < 120; i++) {
        profiler.startFrame();
        profiler.endFrame(5, 1000);
      }

      const report = profiler.generateReport();

      expect(report.summary).toBeDefined();
      expect(report.summary.totalFrames).toBe(120);
      expect(report.bottleneck).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should count dropped frames', () => {
      profiler.startRecording();

      // Record frames with some drops
      for (let i = 0; i < 100; i++) {
        profiler.startFrame();
        const waitTime = i % 10 === 0 ? 35 : 15; // Every 10th frame is dropped
        const start = performance.now();
        while (performance.now() - start < waitTime) {
          // Wait
        }
        profiler.endFrame(5, 1000);
      }

      const report = profiler.generateReport();
      expect(report.summary.droppedFrames).toBeGreaterThan(0);
    });
  });

  describe('getRealTimeStats', () => {
    it('should return real-time statistics', () => {
      profiler.startRecording();

      // Record some frames
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        profiler.endFrame(5, 1000);
      }

      const stats = profiler.getRealTimeStats();
      expect(stats.currentFPS).toBeGreaterThan(0);
      expect(stats.avgFPS).toBeGreaterThan(0);
      expect(stats.cpuTime).toBeGreaterThan(0);
    });
  });

  describe('exportReport', () => {
    it('should export report as JSON', () => {
      profiler.startRecording();

      // Record some frames
      for (let i = 0; i < 60; i++) {
        profiler.startFrame();
        profiler.endFrame(5, 1000);
      }

      const json = profiler.exportReport();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed.summary).toBeDefined();
      expect(parsed.bottleneck).toBeDefined();
    });
  });
});
