/**
 * Tests for PDB parser
 */

import { describe, it, expect } from 'vitest';
import { parsePDB, validateStructure } from '@/lib/pdb-parser';

// Sample PDB data
const SAMPLE_PDB = `HEADER    OXYGEN STORAGE/TRANSPORT                11-MAR-98   1MBN
TITLE     MYOGLOBIN FROM SPERM WHALE
ATOM      1  N   VAL A   1      18.660  19.770  24.040  1.00 41.54           N
ATOM      2  CA  VAL A   1      19.000  20.920  23.180  1.00 40.44           C
ATOM      3  C   VAL A   1      18.390  20.800  21.800  1.00 39.50           C
ATOM      4  O   VAL A   1      17.480  20.000  21.600  1.00 39.86           O
ATOM      5  CB  VAL A   1      20.530  21.090  23.060  1.00 41.24           C
END`;

const SAMPLE_CIF = `data_1MBN
#
_entry.id   1MBN
#
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_seq_id
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.occupancy
_atom_site.B_iso_or_equiv
ATOM 1  N N   VAL A 1 18.660 19.770 24.040 1.00 41.54
ATOM 2  C CA  VAL A 1 19.000 20.920 23.180 1.00 40.44
ATOM 3  C C   VAL A 1 18.390 20.800 21.800 1.00 39.50
ATOM 4  O O   VAL A 1 17.480 20.000 21.600 1.00 39.86
ATOM 5  C CB  VAL A 1 20.530 21.090 23.060 1.00 41.24
#`;

describe('PDB Parser', () => {
  describe('parsePDB', () => {
    it('should parse PDB format', async () => {
      const result = await parsePDB(SAMPLE_PDB);

      expect(result.format).toBe('pdb');
      expect(result.atoms.length).toBe(5);
      expect(result.metadata.id).toBe('1MBN');
      expect(result.metadata.title).toContain('MYOGLOBIN');
    });

    it('should parse mmCIF format', async () => {
      const result = await parsePDB(SAMPLE_CIF);

      expect(result.format).toBe('cif');
      expect(result.atoms.length).toBe(5);
      expect(result.metadata.id).toBe('1MBN');
    });

    it('should parse atom coordinates correctly', async () => {
      const result = await parsePDB(SAMPLE_PDB);
      const firstAtom = result.atoms[0];

      expect(firstAtom.serial).toBe(1);
      expect(firstAtom.name).toBe('N');
      expect(firstAtom.resName).toBe('VAL');
      expect(firstAtom.chainID).toBe('A');
      expect(firstAtom.resSeq).toBe(1);
      expect(firstAtom.x).toBeCloseTo(18.660);
      expect(firstAtom.y).toBeCloseTo(19.770);
      expect(firstAtom.z).toBeCloseTo(24.040);
      expect(firstAtom.element).toBe('N');
    });

    it('should calculate statistics', async () => {
      const result = await parsePDB(SAMPLE_PDB);

      expect(result.statistics.atomCount).toBe(5);
      expect(result.statistics.chainCount).toBe(1);
      expect(result.statistics.bounds.min.x).toBeCloseTo(17.480);
      expect(result.statistics.bounds.max.x).toBeCloseTo(20.530);
    });

    it('should filter hydrogens when requested', async () => {
      const pdbWithH = SAMPLE_PDB + '\nATOM      6  H   VAL A   1      18.900  19.800  24.900  1.00 40.00           H';

      const withH = await parsePDB(pdbWithH, { includeHydrogens: true });
      const withoutH = await parsePDB(pdbWithH, { includeHydrogens: false });

      expect(withH.atoms.length).toBe(6);
      expect(withoutH.atoms.length).toBe(5);
    });

    it('should filter water when requested', async () => {
      const pdbWithWater = SAMPLE_PDB + '\nHETATM    6  O   HOH A 101      20.000  20.000  20.000  1.00 30.00           O';

      const withWater = await parsePDB(pdbWithWater, { includeWater: true });
      const withoutWater = await parsePDB(pdbWithWater, { includeWater: false });

      expect(withWater.atoms.length).toBe(6);
      expect(withoutWater.atoms.length).toBe(5);
    });

    it('should filter specific chains', async () => {
      const pdbMultiChain = SAMPLE_PDB + '\nATOM      6  N   VAL B   1      30.000  30.000  30.000  1.00 40.00           N';

      const allChains = await parsePDB(pdbMultiChain);
      const chainA = await parsePDB(pdbMultiChain, { chains: ['A'] });

      expect(allChains.atoms.length).toBe(6);
      expect(chainA.atoms.length).toBe(5);
    });

    it('should handle empty files', async () => {
      await expect(parsePDB('')).rejects.toThrow();
    });

    it('should handle malformed PDB', async () => {
      const malformed = 'This is not a PDB file';
      const result = await parsePDB(malformed);

      expect(result.atoms.length).toBe(0);
    });
  });

  describe('validateStructure', () => {
    it('should validate correct structures', async () => {
      const structure = await parsePDB(SAMPLE_PDB);
      const validation = validateStructure(structure);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing atoms', () => {
      const validation = validateStructure({
        atoms: [],
        bonds: [],
        metadata: { id: 'TEST' },
        statistics: {
          atomCount: 0,
          residueCount: 0,
          chainCount: 0,
          modelCount: 0,
          heteroAtomCount: 0,
          waterCount: 0,
          bounds: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 },
            center: { x: 0, y: 0, z: 0 }
          }
        },
        format: 'pdb',
        parseTime: 0
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No atoms found in structure');
    });

    it('should detect invalid coordinates', async () => {
      const structure = await parsePDB(SAMPLE_PDB);
      structure.atoms[0].x = NaN;

      const validation = validateStructure(structure);

      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('invalid coordinates');
    });
  });

  describe('Performance', () => {
    it('should parse small structures quickly', async () => {
      const start = Date.now();
      await parsePDB(SAMPLE_PDB);
      const time = Date.now() - start;

      expect(time).toBeLessThan(100); // Should be under 100ms
    });
  });
});
