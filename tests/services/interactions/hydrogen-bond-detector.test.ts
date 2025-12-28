/**
 * Hydrogen Bond Detector Tests - RED Phase (TDD)
 *
 * Tests for detecting hydrogen bonds in molecular structures
 * following scientific criteria:
 * - Distance: 2.5-3.5 Angstroms (D...A)
 * - Angle: D-H...A > 120 degrees
 * - Donor atoms: N, O with hydrogens
 * - Acceptor atoms: N, O, S with lone pairs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Types for hydrogen bond detection
interface HydrogenBond {
  id: string;
  donorAtom: {
    residueId: string;
    atomName: string;
    element: string;
    position: [number, number, number];
  };
  hydrogenAtom: {
    atomName: string;
    position: [number, number, number];
    inferred?: boolean;
  };
  acceptorAtom: {
    residueId: string;
    atomName: string;
    element: string;
    position: [number, number, number];
  };
  distance: number; // Angstroms
  angle: number; // Degrees
  strength: 'strong' | 'moderate' | 'weak';
  type: 'backbone-backbone' | 'backbone-sidechain' | 'sidechain-sidechain' | 'base-pair' | 'water-mediated';
}

interface DetectionOptions {
  minDistance?: number; // Default 2.5 Å
  maxDistance?: number; // Default 3.5 Å
  minAngle?: number; // Default 120°
  searchRadius?: number; // Default 5 Å from selected residue
  inferHydrogens?: boolean; // Default true
  includeWaterMediated?: boolean; // Default false
}

interface Structure {
  atoms: Array<{
    residueId: string;
    atomName: string;
    element: string;
    position: [number, number, number];
  }>;
}

describe('HydrogenBondDetector', () => {
  let detector: any;
  let mockStructure: Structure;

  beforeEach(() => {
    // Mock structure with alpha helix H-bonds (i -> i+4 pattern)
    mockStructure = {
      atoms: [
        // Residue 1 - Alanine
        { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] },
        { residueId: 'A:1', atomName: 'H', element: 'H', position: [0.1, 0.1, 0] },
        { residueId: 'A:1', atomName: 'CA', element: 'C', position: [1, 0, 0] },
        { residueId: 'A:1', atomName: 'C', element: 'C', position: [2, 0, 0] },
        { residueId: 'A:1', atomName: 'O', element: 'O', position: [2.5, 0.5, 0] },

        // Residue 5 - Leucine (forms H-bond with residue 1)
        { residueId: 'A:5', atomName: 'N', element: 'N', position: [2.8, 0.3, 0] },
        { residueId: 'A:5', atomName: 'H', element: 'H', position: [2.7, 0.2, 0] },
        { residueId: 'A:5', atomName: 'CA', element: 'C', position: [3.5, 0, 0] },
        { residueId: 'A:5', atomName: 'C', element: 'C', position: [4.5, 0, 0] },
        { residueId: 'A:5', atomName: 'O', element: 'O', position: [5, 0.5, 0] },

        // Residue 10 - Serine with sidechain hydroxyl
        { residueId: 'A:10', atomName: 'N', element: 'N', position: [10, 0, 0] },
        { residueId: 'A:10', atomName: 'CA', element: 'C', position: [11, 0, 0] },
        { residueId: 'A:10', atomName: 'CB', element: 'C', position: [11.5, 1, 0] },
        { residueId: 'A:10', atomName: 'OG', element: 'O', position: [12, 1.5, 0] },
        { residueId: 'A:10', atomName: 'HG', element: 'H', position: [12.1, 1.6, 0] },

        // Water molecule
        { residueId: 'HOH:100', atomName: 'O', element: 'O', position: [6, 2, 0] },
        { residueId: 'HOH:100', atomName: 'H1', element: 'H', position: [5.9, 2.1, 0] },
        { residueId: 'HOH:100', atomName: 'H2', element: 'H', position: [6.1, 2.1, 0] },
      ]
    };

    // Placeholder - actual implementation will be created in GREEN phase
    detector = {
      detectHydrogenBonds: vi.fn(),
      detectLocalizedHydrogenBonds: vi.fn(),
      inferHydrogenPositions: vi.fn(),
      calculateBondStrength: vi.fn(),
      classifyBondType: vi.fn(),
    };
  });

  describe('detection criteria', () => {
    it('should detect H-bonds with distance 2.5-3.5 Angstroms', () => {
      // Expect to find H-bond between residue 1 O and residue 5 N
      const result = detector.detectHydrogenBonds(mockStructure);

      expect(result).toHaveLength(1);
      expect(result[0].distance).toBeGreaterThanOrEqual(2.5);
      expect(result[0].distance).toBeLessThanOrEqual(3.5);
      expect(result[0].donorAtom.residueId).toBe('A:5');
      expect(result[0].acceptorAtom.residueId).toBe('A:1');
    });

    it('should reject bonds outside distance threshold', () => {
      // Create structure with atoms too far apart (4.0 Å)
      const farStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'O', element: 'O', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'N', element: 'N', position: [4, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'H', element: 'H', position: [3.9, 0, 0] as [number, number, number] },
        ]
      };

      const result = detector.detectHydrogenBonds(farStructure);
      expect(result).toHaveLength(0);
    });

    it('should validate D-H...A angle > 120 degrees', () => {
      // Structure with ideal linear H-bond (angle ~180°)
      const linearStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'H', element: 'H', position: [1, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'O', element: 'O', position: [3, 0, 0] as [number, number, number] },
        ]
      };

      const result = detector.detectHydrogenBonds(linearStructure);

      expect(result).toHaveLength(1);
      expect(result[0].angle).toBeGreaterThan(120);
      expect(result[0].angle).toBeLessThanOrEqual(180);
    });

    it('should reject bonds with angles < 120 degrees', () => {
      // Structure with bent geometry (angle ~90°)
      const bentStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'H', element: 'H', position: [1, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'O', element: 'O', position: [1, 2, 0] as [number, number, number] }, // 90° angle
        ]
      };

      const result = detector.detectHydrogenBonds(bentStructure);
      expect(result).toHaveLength(0);
    });

    it('should identify donor and acceptor atoms correctly', () => {
      const result = detector.detectHydrogenBonds(mockStructure);

      expect(result[0].donorAtom.element).toBe('N'); // Nitrogen with H
      expect(result[0].hydrogenAtom.atomName).toBe('H');
      expect(result[0].acceptorAtom.element).toBe('O'); // Oxygen accepting
    });
  });

  describe('localized detection', () => {
    it('should detect H-bonds within 5Å radius of selected residue', () => {
      const selectedResidue = 'A:1';
      const searchRadius = 5;

      const result = detector.detectLocalizedHydrogenBonds(
        mockStructure,
        selectedResidue,
        { searchRadius }
      );

      // Should find H-bond with residue 5 (within radius)
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((bond: HydrogenBond) =>
        bond.donorAtom.residueId === 'A:5' || bond.acceptorAtom.residueId === 'A:5'
      )).toBe(true);

      // Should NOT include distant residues
      expect(result.some((bond: HydrogenBond) =>
        bond.donorAtom.residueId === 'A:10' || bond.acceptorAtom.residueId === 'A:10'
      )).toBe(false);
    });

    it('should handle residues at protein surface', () => {
      // Surface residues may have fewer H-bonds
      const surfaceStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'H', element: 'H', position: [0.1, 0.1, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'O', element: 'O', position: [1, 0, 0] as [number, number, number] },
          // No nearby acceptors - exposed to solvent
        ]
      };

      const result = detector.detectLocalizedHydrogenBonds(surfaceStructure, 'A:1');

      // Should return empty array without errors
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle residues in protein core', () => {
      // Core residues typically have multiple H-bonds (alpha helix, beta sheet)
      const coreStructure = {
        atoms: [
          // Central residue with multiple H-bond partners
          { residueId: 'A:5', atomName: 'N', element: 'N', position: [5, 5, 5] as [number, number, number] },
          { residueId: 'A:5', atomName: 'H', element: 'H', position: [5.1, 5.1, 5] as [number, number, number] },
          { residueId: 'A:5', atomName: 'O', element: 'O', position: [6, 5, 5] as [number, number, number] },

          // Partner 1
          { residueId: 'A:1', atomName: 'O', element: 'O', position: [5.3, 5.2, 5] as [number, number, number] },

          // Partner 2
          { residueId: 'A:9', atomName: 'N', element: 'N', position: [6.3, 5.3, 5] as [number, number, number] },
          { residueId: 'A:9', atomName: 'H', element: 'H', position: [6.2, 5.2, 5] as [number, number, number] },
        ]
      };

      const result = detector.detectLocalizedHydrogenBonds(coreStructure, 'A:5');

      // Should detect multiple H-bonds
      expect(result.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('edge cases', () => {
    it('should handle structures without explicit hydrogens', () => {
      // PDB files often lack hydrogen atoms
      const noHydrogensStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'O', element: 'O', position: [2, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'N', element: 'N', position: [3, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'O', element: 'O', position: [5, 0, 0] as [number, number, number] },
        ]
      };

      const result = detector.detectHydrogenBonds(noHydrogensStructure, {
        inferHydrogens: true
      });

      // Should still detect H-bonds by inferring positions
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].hydrogenAtom.inferred).toBe(true);
    });

    it('should infer hydrogen positions when missing', () => {
      const noHydrogensStructure = {
        atoms: [
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'CA', element: 'C', position: [1.5, 0, 0] as [number, number, number] },
          { residueId: 'A:2', atomName: 'O', element: 'O', position: [3, 0.5, 0] as [number, number, number] },
        ]
      };

      const inferredPositions = detector.inferHydrogenPositions(noHydrogensStructure);

      expect(inferredPositions).toBeDefined();
      expect(inferredPositions.length).toBeGreaterThan(0);
      expect(inferredPositions[0]).toHaveProperty('position');
      expect(inferredPositions[0]).toHaveProperty('parentAtom');

      // Inferred H should be ~1 Å from N along N-C axis
      const distance = Math.sqrt(
        Math.pow(inferredPositions[0].position[0] - 0, 2) +
        Math.pow(inferredPositions[0].position[1] - 0, 2) +
        Math.pow(inferredPositions[0].position[2] - 0, 2)
      );
      expect(distance).toBeCloseTo(1.0, 1);
    });

    it('should handle nucleic acid H-bonds (A-T, G-C base pairs)', () => {
      // DNA base pair - Adenine-Thymine (2 H-bonds)
      const dnaStructure = {
        atoms: [
          // Adenine N6 (donor)
          { residueId: 'DA:1', atomName: 'N6', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'DA:1', atomName: 'H61', element: 'H', position: [0.1, 0.1, 0] as [number, number, number] },

          // Thymine O4 (acceptor)
          { residueId: 'DT:2', atomName: 'O4', element: 'O', position: [3, 0, 0] as [number, number, number] },

          // Adenine N1 (acceptor)
          { residueId: 'DA:1', atomName: 'N1', element: 'N', position: [1, 2, 0] as [number, number, number] },

          // Thymine N3 (donor)
          { residueId: 'DT:2', atomName: 'N3', element: 'N', position: [2.5, 2, 0] as [number, number, number] },
          { residueId: 'DT:2', atomName: 'H3', element: 'H', position: [2.4, 2, 0] as [number, number, number] },
        ]
      };

      const result = detector.detectHydrogenBonds(dnaStructure);

      // Should detect 2 H-bonds for A-T pair
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('base-pair');
      expect(result[1].type).toBe('base-pair');
    });

    it('should detect water-mediated H-bonds', () => {
      // Protein-water-protein H-bond bridge
      const waterMediatedStructure = {
        atoms: [
          // Protein donor
          { residueId: 'A:1', atomName: 'N', element: 'N', position: [0, 0, 0] as [number, number, number] },
          { residueId: 'A:1', atomName: 'H', element: 'H', position: [0.5, 0, 0] as [number, number, number] },

          // Water
          { residueId: 'HOH:100', atomName: 'O', element: 'O', position: [3, 0, 0] as [number, number, number] },
          { residueId: 'HOH:100', atomName: 'H1', element: 'H', position: [3.5, 0, 0] as [number, number, number] },

          // Protein acceptor
          { residueId: 'A:10', atomName: 'O', element: 'O', position: [6, 0, 0] as [number, number, number] },
        ]
      };

      const result = detector.detectHydrogenBonds(waterMediatedStructure, {
        includeWaterMediated: true
      });

      // Should detect 2 H-bonds forming a bridge
      expect(result.length).toBeGreaterThanOrEqual(2);
      const waterBonds = result.filter((bond: HydrogenBond) => bond.type === 'water-mediated');
      expect(waterBonds.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should complete detection in <500ms for typical proteins', async () => {
      // Generate structure with ~1000 atoms (small protein)
      const largeStructure = {
        atoms: Array.from({ length: 1000 }, (_, i) => ({
          residueId: `A:${Math.floor(i / 10)}`,
          atomName: ['N', 'CA', 'C', 'O'][i % 4],
          element: ['N', 'C', 'C', 'O'][i % 4],
          position: [
            Math.random() * 50,
            Math.random() * 50,
            Math.random() * 50
          ] as [number, number, number]
        }))
      };

      const startTime = performance.now();
      detector.detectHydrogenBonds(largeStructure);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(500);
    });

    it('should handle large structures (>10000 atoms)', () => {
      // Generate large structure (ribosome, virus capsid)
      const massiveStructure = {
        atoms: Array.from({ length: 15000 }, (_, i) => ({
          residueId: `A:${Math.floor(i / 10)}`,
          atomName: ['N', 'CA', 'C', 'O', 'CB'][i % 5],
          element: ['N', 'C', 'C', 'O', 'C'][i % 5],
          position: [
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100
          ] as [number, number, number]
        }))
      };

      // Should complete without crashing or excessive memory
      expect(() => {
        detector.detectHydrogenBonds(massiveStructure);
      }).not.toThrow();
    });
  });

  describe('bond strength classification', () => {
    it('should classify strong H-bonds (distance < 2.8 Å, angle > 170°)', () => {
      const strength = detector.calculateBondStrength(2.7, 175);
      expect(strength).toBe('strong');
    });

    it('should classify moderate H-bonds (distance 2.8-3.2 Å, angle 140-170°)', () => {
      const strength = detector.calculateBondStrength(3.0, 150);
      expect(strength).toBe('moderate');
    });

    it('should classify weak H-bonds (distance 3.2-3.5 Å, angle 120-140°)', () => {
      const strength = detector.calculateBondStrength(3.3, 125);
      expect(strength).toBe('weak');
    });
  });

  describe('bond type classification', () => {
    it('should identify backbone-backbone H-bonds (alpha helix)', () => {
      const bond: Partial<HydrogenBond> = {
        donorAtom: { residueId: 'A:5', atomName: 'N', element: 'N', position: [0, 0, 0] },
        acceptorAtom: { residueId: 'A:1', atomName: 'O', element: 'O', position: [3, 0, 0] }
      };

      const type = detector.classifyBondType(bond);
      expect(type).toBe('backbone-backbone');
    });

    it('should identify sidechain-sidechain H-bonds', () => {
      const bond: Partial<HydrogenBond> = {
        donorAtom: { residueId: 'A:10', atomName: 'OG', element: 'O', position: [0, 0, 0] },
        acceptorAtom: { residueId: 'A:15', atomName: 'OD1', element: 'O', position: [3, 0, 0] }
      };

      const type = detector.classifyBondType(bond);
      expect(type).toBe('sidechain-sidechain');
    });

    it('should identify backbone-sidechain H-bonds', () => {
      const bond: Partial<HydrogenBond> = {
        donorAtom: { residueId: 'A:5', atomName: 'N', element: 'N', position: [0, 0, 0] },
        acceptorAtom: { residueId: 'A:10', atomName: 'OG', element: 'O', position: [3, 0, 0] }
      };

      const type = detector.classifyBondType(bond);
      expect(type).toBe('backbone-sidechain');
    });
  });
});
