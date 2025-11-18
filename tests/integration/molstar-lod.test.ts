/**
 * MolStar + LOD Manager Integration Tests
 * Tests the integration between MolStar viewer and LOD system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LODManager, LODLevel } from '@/lib/lod-manager';
import { molstarService } from '@/services/molstar-service';
import type { StructureComplexity } from '@/lib/lod-manager';

describe('MolStar + LOD Integration', () => {
  let container: HTMLDivElement;
  let lodManager: LODManager;

  beforeEach(async () => {
    // Create mock container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Initialize LOD Manager
    lodManager = new LODManager({}, 512);
  });

  afterEach(() => {
    molstarService.dispose();
    document.body.removeChild(container);
  });

  describe('Progressive Loading Integration', () => {
    it('should initialize MolStar and load structure progressively', async () => {
      // Initialize MolStar
      await molstarService.initialize(container, {
        layoutIsExpanded: false,
        layoutShowControls: true,
      });

      // Mock structure data
      const mockStructure = {
        atoms: generateMockAtoms(1000),
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 2,
        hasLigands: true,
        hasSurfaces: false,
      };

      // Analyze complexity
      const complexity = lodManager.analyzeComplexity(mockStructure);
      expect(complexity.atomCount).toBe(1000);
      expect(complexity.estimatedVertices).toBeGreaterThan(0);

      // Determine starting level
      const startLevel = lodManager.determineStartingLevel(complexity);
      expect([LODLevel.PREVIEW, LODLevel.INTERACTIVE]).toContain(startLevel);
    });

    it('should filter atoms correctly for each LOD level', () => {
      const atoms = [
        { name: 'CA', x: 0, y: 0, z: 0 },
        { name: 'CB', x: 1, y: 1, z: 1 },
        { name: 'C', x: 2, y: 2, z: 2 },
        { name: 'N', x: 3, y: 3, z: 3 },
        { name: 'O', x: 4, y: 4, z: 4 },
        { name: 'CG', x: 5, y: 5, z: 5 },
      ];

      const complexity: StructureComplexity = {
        atomCount: atoms.length,
        bondCount: 5,
        residueCount: 1,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 120,
      };

      // Preview: backbone only
      const previewAtoms = lodManager.filterAtomsForLevel(
        atoms,
        LODLevel.PREVIEW,
        complexity
      );
      expect(previewAtoms.length).toBe(4); // CA, C, N, O

      // Interactive: key atoms
      const interactiveAtoms = lodManager.filterAtomsForLevel(
        atoms,
        LODLevel.INTERACTIVE,
        complexity
      );
      expect(interactiveAtoms.length).toBe(5); // CA, CB, C, N, O

      // Full: all atoms
      const fullAtoms = lodManager.filterAtomsForLevel(
        atoms,
        LODLevel.FULL,
        complexity
      );
      expect(fullAtoms.length).toBe(6); // All atoms
    });

    it('should respect memory budget constraints', () => {
      const smallComplexity: StructureComplexity = {
        atomCount: 100,
        bondCount: 120,
        residueCount: 10,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 2000,
      };

      const largeComplexity: StructureComplexity = {
        atomCount: 100000,
        bondCount: 120000,
        residueCount: 10000,
        chainCount: 10,
        hasLigands: true,
        hasSurfaces: true,
        estimatedVertices: 5000000,
      };

      expect(lodManager.canAffordLevel(smallComplexity, LODLevel.FULL)).toBe(
        true
      );
      expect(lodManager.canAffordLevel(largeComplexity, LODLevel.FULL)).toBe(
        false
      );
    });
  });

  describe('Performance Optimization', () => {
    it('should estimate memory usage accurately', () => {
      const complexity: StructureComplexity = {
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const previewMemory = lodManager.estimateMemoryUsage(
        complexity,
        LODLevel.PREVIEW
      );
      const fullMemory = lodManager.estimateMemoryUsage(
        complexity,
        LODLevel.FULL
      );

      expect(fullMemory).toBeGreaterThan(previewMemory);
      expect(previewMemory).toBeGreaterThan(0);
    });

    it('should handle surface rendering in memory estimates', () => {
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
      const memoryWith = lodManager.estimateMemoryUsage(
        withSurface,
        LODLevel.FULL
      );

      expect(memoryWith).toBeGreaterThan(memoryWithout);
    });
  });

  describe('Stage Callbacks', () => {
    it('should trigger callbacks during progressive loading', async () => {
      const onStageStart = vi.fn();
      const onStageComplete = vi.fn();
      const onProgress = vi.fn();

      const manager = new LODManager(
        {
          onStageStart,
          onStageComplete,
          onProgress,
        },
        512
      );

      // Mock renderer with simple render function
      const mockRenderer = {
        render: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      };

      const mockStructure = {
        atoms: generateMockAtoms(100),
        atomCount: 100,
        bondCount: 120,
        residueCount: 10,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
      };

      await manager.loadProgressive(
        mockStructure,
        mockRenderer,
        LODLevel.INTERACTIVE
      );

      // Verify callbacks were called
      expect(onStageStart).toHaveBeenCalled();
      expect(onStageComplete).toHaveBeenCalled();
    });
  });

  describe('Cancellation', () => {
    it('should cancel progressive loading', async () => {
      const manager = new LODManager({}, 512);

      const mockRenderer = {
        render: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }),
      };

      const mockStructure = {
        atoms: generateMockAtoms(1000),
        atomCount: 1000,
        bondCount: 1200,
        residueCount: 100,
        chainCount: 2,
      };

      const loadPromise = manager.loadProgressive(
        mockStructure,
        mockRenderer,
        LODLevel.FULL
      );

      // Cancel after 50ms
      setTimeout(() => manager.cancelLoading(), 50);

      await expect(loadPromise).rejects.toThrow('Loading cancelled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty structures', () => {
      const emptyStructure = {
        atoms: [],
        atomCount: 0,
        bondCount: 0,
        residueCount: 0,
        chainCount: 0,
      };

      const complexity = lodManager.analyzeComplexity(emptyStructure);
      expect(complexity.atomCount).toBe(0);
      expect(complexity.estimatedVertices).toBe(0);
    });

    it('should handle very large structures', () => {
      const largeStructure = {
        atoms: [],
        atomCount: 500000,
        bondCount: 600000,
        residueCount: 50000,
        chainCount: 100,
        hasLigands: true,
        hasSurfaces: true,
      };

      const complexity = lodManager.analyzeComplexity(largeStructure);
      const startLevel = lodManager.determineStartingLevel(complexity);

      expect(startLevel).toBe(LODLevel.PREVIEW);
      expect(lodManager.canAffordLevel(complexity, LODLevel.FULL)).toBe(false);
    });
  });
});

// Helper function to generate mock atoms
function generateMockAtoms(count: number): any[] {
  const atomNames = ['CA', 'CB', 'C', 'N', 'O', 'CG', 'CD', 'CE', 'NZ'];
  const atoms: any[] = [];

  for (let i = 0; i < count; i++) {
    atoms.push({
      name: atomNames[i % atomNames.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      isLigand: i % 50 === 0,
    });
  }

  return atoms;
}
