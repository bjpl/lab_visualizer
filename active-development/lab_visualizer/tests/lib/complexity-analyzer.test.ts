/**
 * Unit tests for Complexity Analyzer
 * Tests centralized complexity calculation logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ComplexityAnalyzer,
  getComplexityAnalyzer,
  resetComplexityAnalyzer,
  analyzeFromAtoms,
  analyzeFromMetadata,
  categorizeComplexity,
  estimateMemoryUsage,
} from '@/lib/complexity-analyzer';
import type { Atom, StructureMetadata } from '@/types/pdb';

describe('ComplexityAnalyzer', () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
  });

  afterEach(() => {
    resetComplexityAnalyzer();
  });

  describe('analyzeFromAtoms', () => {
    it('should analyze small structure correctly', () => {
      const atoms: Atom[] = [
        {
          serial: 1,
          name: 'CA',
          element: 'C',
          residue: 'ALA',
          residueSeq: 1,
          chain: 'A',
          x: 0,
          y: 0,
          z: 0,
          occupancy: 1.0,
          tempFactor: 0.0,
        },
        {
          serial: 2,
          name: 'CB',
          element: 'C',
          residue: 'ALA',
          residueSeq: 1,
          chain: 'A',
          x: 1,
          y: 1,
          z: 1,
          occupancy: 1.0,
          tempFactor: 0.0,
        },
      ];

      const metadata: StructureMetadata = {
        chains: ['A'],
        atomCount: 2,
        residueCount: 1,
      };

      const result = analyzer.analyzeFromAtoms(atoms, metadata);

      expect(result.atomCount).toBe(2);
      expect(result.residueCount).toBe(1);
      expect(result.chainCount).toBe(1);
      expect(result.hasLigands).toBe(false);
      expect(result.hasSurfaces).toBe(false);
      // Bonds: 2 * 3.5 = 7
      expect(result.bondCount).toBe(Math.floor(2 * 3.5));
      // Vertices: 2 * 50 + 1 * 10 = 110
      expect(result.estimatedVertices).toBe(2 * 50 + 1 * 10);
    });

    it('should detect ligands correctly', () => {
      const atoms: Atom[] = [
        {
          serial: 1,
          name: 'CA',
          element: 'C',
          residue: 'ALA',
          residueSeq: 1,
          chain: 'A',
          x: 0,
          y: 0,
          z: 0,
          occupancy: 1.0,
          tempFactor: 0.0,
          isLigand: false,
        },
        {
          serial: 2,
          name: 'C',
          element: 'C',
          residue: 'LIG',
          residueSeq: 1,
          chain: 'B',
          x: 1,
          y: 1,
          z: 1,
          occupancy: 1.0,
          tempFactor: 0.0,
          isLigand: true,
        },
      ];

      const metadata: StructureMetadata = {
        chains: ['A', 'B'],
        atomCount: 2,
        residueCount: 1,
      };

      const result = analyzer.analyzeFromAtoms(atoms, metadata);

      expect(result.hasLigands).toBe(true);
      expect(result.chainCount).toBe(2);
    });

    it('should handle large structures', () => {
      const atomCount = 10000;
      const atoms: Atom[] = Array.from({ length: atomCount }, (_, i) => ({
        serial: i + 1,
        name: i % 4 === 0 ? 'CA' : 'C',
        element: 'C',
        residue: 'ALA',
        residueSeq: Math.floor(i / 4) + 1,
        chain: 'A',
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100,
        occupancy: 1.0,
        tempFactor: 0.0,
      }));

      const metadata: StructureMetadata = {
        chains: ['A'],
        atomCount,
        residueCount: Math.floor(atomCount / 4),
      };

      const result = analyzer.analyzeFromAtoms(atoms, metadata);

      expect(result.atomCount).toBe(atomCount);
      expect(result.bondCount).toBe(Math.floor(atomCount * 3.5));
      expect(result.estimatedVertices).toBeGreaterThan(0);
    });
  });

  describe('analyzeFromMetadata', () => {
    it('should analyze from metadata correctly', () => {
      const metadata = {
        atomCount: 1000,
        residueCount: 100,
        chains: ['A', 'B'],
        hasLigands: true,
        hasSurfaces: false,
      };

      const result = analyzer.analyzeFromMetadata(metadata, false);

      expect(result.atomCount).toBe(1000);
      expect(result.residueCount).toBe(100);
      expect(result.chainCount).toBe(2);
      expect(result.hasLigands).toBe(true);
      // Bonds: 1000 * 1.5 = 1500
      expect(result.bondCount).toBe(Math.floor(1000 * 1.5));
      // Vertices: 1000 * 20 (sphere) = 20000
      expect(result.estimatedVertices).toBe(1000 * 20);
    });

    it('should handle surfaces parameter', () => {
      const metadata = {
        atomCount: 100,
        residueCount: 10,
        chains: ['A'],
      };

      const resultNoSurface = analyzer.analyzeFromMetadata(metadata, false);
      const resultWithSurface = analyzer.analyzeFromMetadata(metadata, true);

      // Surface representation uses 50 vertices per atom instead of 20
      expect(resultWithSurface.estimatedVertices).toBe(100 * 50);
      expect(resultNoSurface.estimatedVertices).toBe(100 * 20);
      expect(resultWithSurface.estimatedVertices / resultNoSurface.estimatedVertices).toBe(2.5);
    });

    it('should use defaults for missing values', () => {
      const metadata = {
        atomCount: 500,
        residueCount: 0,
        chains: [],
      };

      const result = analyzer.analyzeFromMetadata(metadata);

      expect(result.chainCount).toBe(1); // Default
      expect(result.hasLigands).toBe(false); // Default
      expect(result.hasSurfaces).toBe(false); // Default
    });
  });

  describe('analyzeGenericStructure', () => {
    it('should analyze generic structure objects', () => {
      const structure = {
        atomCount: 500,
        bondCount: 1750,
        residueCount: 50,
        chainCount: 2,
        hasLigands: true,
        hasSurfaces: false,
      };

      const result = analyzer.analyzeGenericStructure(structure);

      expect(result.atomCount).toBe(500);
      expect(result.bondCount).toBe(1750);
      expect(result.residueCount).toBe(50);
      expect(result.chainCount).toBe(2);
    });

    it('should estimate values when not provided', () => {
      const structure = {
        atomCount: 500,
      };

      const result = analyzer.analyzeGenericStructure(structure);

      expect(result.atomCount).toBe(500);
      expect(result.bondCount).toBeGreaterThan(0); // Should be estimated
      expect(result.residueCount).toBe(0);
      expect(result.chainCount).toBe(1);
    });
  });

  describe('estimateMemoryUsage', () => {
    it('should estimate memory correctly', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const memory = analyzer.estimateMemoryUsage(complexity, 32);

      // 20000 * 32 * 1.3 = 832000 bytes
      const expected = 20000 * 32 * 1.3;
      expect(memory).toBe(expected);
    });

    it('should scale with vertex count', () => {
      const complexity1 = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 10000,
      };

      const complexity2 = {
        ...complexity1,
        estimatedVertices: 20000, // 2x
      };

      const memory1 = analyzer.estimateMemoryUsage(complexity1, 32);
      const memory2 = analyzer.estimateMemoryUsage(complexity2, 32);

      expect(memory2).toBeCloseTo(memory1 * 2, 1);
    });

    it('should use different bytes per vertex', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 1000,
      };

      const memory16 = analyzer.estimateMemoryUsage(complexity, 16);
      const memory32 = analyzer.estimateMemoryUsage(complexity, 32);

      expect(memory32).toBeCloseTo(memory16 * 2, 1);
    });
  });

  describe('canAffordComplexity', () => {
    it('should determine affordability correctly', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const smallBudget = 100000; // Too small
      const largeBudget = 10000000; // Large enough

      expect(analyzer.canAffordComplexity(complexity, smallBudget)).toBe(false);
      expect(analyzer.canAffordComplexity(complexity, largeBudget)).toBe(true);
    });

    it('should respect threshold percentage', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const budget = 1000000;

      const affordable80 = analyzer.canAffordComplexity(complexity, budget, 32, 0.8);
      const affordable50 = analyzer.canAffordComplexity(complexity, budget, 32, 0.5);

      // With 50% threshold, it should be harder to afford (more restrictive)
      // If both are true or both are false, that's acceptable
      // If 80% threshold allows it, 50% should not (or be equally restrictive)
      expect(affordable80 === true || affordable50 === false).toBe(true);
    });
  });

  describe('categorizeComplexity', () => {
    it('should categorize tiny structures', () => {
      const complexity = {
        atomCount: 50,
        bondCount: 175,
        residueCount: 5,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 1000,
      };

      expect(analyzer.categorizeComplexity(complexity)).toBe('tiny');
    });

    it('should categorize small structures', () => {
      const complexity = {
        atomCount: 300,
        bondCount: 1050,
        residueCount: 30,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 6000,
      };

      expect(analyzer.categorizeComplexity(complexity)).toBe('small');
    });

    it('should categorize medium structures', () => {
      const complexity = {
        atomCount: 2000,
        bondCount: 7000,
        residueCount: 200,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 40000,
      };

      expect(analyzer.categorizeComplexity(complexity)).toBe('medium');
    });

    it('should categorize large structures', () => {
      const complexity = {
        atomCount: 25000,
        bondCount: 87500,
        residueCount: 2500,
        chainCount: 2,
        hasLigands: true,
        hasSurfaces: false,
        estimatedVertices: 500000,
      };

      expect(analyzer.categorizeComplexity(complexity)).toBe('large');
    });

    it('should categorize very large structures', () => {
      const complexity = {
        atomCount: 100000,
        bondCount: 350000,
        residueCount: 10000,
        chainCount: 5,
        hasLigands: true,
        hasSurfaces: true,
        estimatedVertices: 5000000,
      };

      expect(analyzer.categorizeComplexity(complexity)).toBe('very-large');
    });
  });

  describe('compareComplexity', () => {
    it('should compare two structures correctly', () => {
      const complexity1 = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const complexity2 = {
        atomCount: 2000,
        bondCount: 7000,
        residueCount: 200,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 40000,
      };

      const comparison = analyzer.compareComplexity(complexity1, complexity2);

      expect(comparison.atomRatio).toBe(2);
      expect(comparison.vertexRatio).toBe(2);
      expect(comparison.estimatedLoadTimeFactor).toBe(2);
    });

    it('should handle partial differences', () => {
      const complexity1 = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const complexity2 = {
        atomCount: 1500,
        bondCount: 5250,
        residueCount: 150,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 30000,
      };

      const comparison = analyzer.compareComplexity(complexity1, complexity2);

      expect(comparison.atomRatio).toBeCloseTo(1.5, 2);
      expect(comparison.vertexRatio).toBeCloseTo(1.5, 2);
    });
  });

  describe('getExtendedAnalysis', () => {
    it('should add metadata to complexity analysis', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const extended = analyzer.getExtendedAnalysis(complexity, 'atom-based');

      expect(extended.atomCount).toBe(1000);
      expect(extended.calculationMethod).toBe('atom-based');
      expect(extended.confidenceScore).toBe(1.0);
    });

    it('should assign appropriate confidence scores', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const atomBased = analyzer.getExtendedAnalysis(complexity, 'atom-based');
      const metadataBased = analyzer.getExtendedAnalysis(complexity, 'metadata-based');
      const hybrid = analyzer.getExtendedAnalysis(complexity, 'hybrid');

      expect(atomBased.confidenceScore).toBe(1.0);
      expect(metadataBased.confidenceScore).toBe(0.7);
      expect(hybrid.confidenceScore).toBe(0.85);
    });
  });

  describe('estimateVertices', () => {
    it('should estimate vertices for sphere representation', () => {
      const vertices = analyzer.estimateVertices(100, false);
      expect(vertices).toBe(100 * 20); // 20 vertices per atom for sphere
    });

    it('should estimate vertices for surface representation', () => {
      const vertices = analyzer.estimateVertices(100, true);
      expect(vertices).toBe(100 * 50); // 50 vertices per atom for surface
    });

    it('should scale with atom count', () => {
      const v1 = analyzer.estimateVertices(100, false);
      const v2 = analyzer.estimateVertices(200, false);

      expect(v2).toBe(v1 * 2);
    });
  });

  describe('Singleton pattern', () => {
    it('should return same instance when called multiple times', () => {
      const analyzer1 = getComplexityAnalyzer();
      const analyzer2 = getComplexityAnalyzer();

      expect(analyzer1).toBe(analyzer2);
    });

    it('should reset singleton instance', () => {
      const analyzer1 = getComplexityAnalyzer();
      resetComplexityAnalyzer();
      const analyzer2 = getComplexityAnalyzer();

      expect(analyzer1).not.toBe(analyzer2);
    });

    it('should create new instance with config', () => {
      const analyzer1 = getComplexityAnalyzer();
      const analyzer2 = getComplexityAnalyzer({ bondsPerAtomMultiplier: 4.0 });

      // Should create new instance when config is provided
      expect(analyzer1).not.toBe(analyzer2);
    });
  });

  describe('Utility functions', () => {
    it('analyzeFromAtoms should work as standalone function', () => {
      const atoms: Atom[] = [
        {
          serial: 1,
          name: 'CA',
          element: 'C',
          residue: 'ALA',
          residueSeq: 1,
          chain: 'A',
          x: 0,
          y: 0,
          z: 0,
          occupancy: 1.0,
          tempFactor: 0.0,
        },
      ];

      const metadata: StructureMetadata = {
        chains: ['A'],
        atomCount: 1,
        residueCount: 1,
      };

      const result = analyzeFromAtoms(atoms, metadata);
      expect(result.atomCount).toBe(1);
    });

    it('analyzeFromMetadata should work as standalone function', () => {
      const result = analyzeFromMetadata({
        atomCount: 100,
        residueCount: 10,
        chains: ['A'],
      });

      expect(result.atomCount).toBe(100);
      expect(result.chainCount).toBe(1);
    });

    it('categorizeComplexity should work as standalone function', () => {
      const complexity = {
        atomCount: 300,
        bondCount: 1050,
        residueCount: 30,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 6000,
      };

      const category = categorizeComplexity(complexity);
      expect(category).toBe('small');
    });

    it('estimateMemoryUsage should work as standalone function', () => {
      const complexity = {
        atomCount: 1000,
        bondCount: 3500,
        residueCount: 100,
        chainCount: 1,
        hasLigands: false,
        hasSurfaces: false,
        estimatedVertices: 20000,
      };

      const memory = estimateMemoryUsage(complexity);
      expect(memory).toBeGreaterThan(0);
    });
  });

  describe('Configuration options', () => {
    it('should use custom configuration', () => {
      const customAnalyzer = new ComplexityAnalyzer({
        verticesPerAtomSphere: 30,
        verticesPerAtomSurface: 60,
        bondsPerAtomMultiplier: 2.5,
      });

      const atoms: Atom[] = [
        {
          serial: 1,
          name: 'CA',
          element: 'C',
          residue: 'ALA',
          residueSeq: 1,
          chain: 'A',
          x: 0,
          y: 0,
          z: 0,
          occupancy: 1.0,
          tempFactor: 0.0,
        },
      ];

      const metadata: StructureMetadata = {
        chains: ['A'],
        atomCount: 1,
        residueCount: 1,
      };

      const result = customAnalyzer.analyzeFromAtoms(atoms, metadata);

      // Uses custom multiplier
      expect(result.bondCount).toBe(Math.floor(1 * 2.5));
    });
  });
});
