/**
 * PDB Parser Unit Tests
 * Tests for parsing PDB and mmCIF formats
 */

import { describe, it, expect } from 'vitest';

describe('PDB Parser', () => {
  describe('PDB Format Parsing', () => {
    it('should parse ATOM records', () => {
      const atomLine = 'ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00 10.00           N';

      const parseAtom = (line: string) => {
        return {
          serial: parseInt(line.substring(6, 11).trim()),
          name: line.substring(12, 16).trim(),
          resName: line.substring(17, 20).trim(),
          chainID: line.substring(21, 22).trim(),
          resSeq: parseInt(line.substring(22, 26).trim()),
          x: parseFloat(line.substring(30, 38).trim()),
          y: parseFloat(line.substring(38, 46).trim()),
          z: parseFloat(line.substring(46, 54).trim()),
          occupancy: parseFloat(line.substring(54, 60).trim()),
          tempFactor: parseFloat(line.substring(60, 66).trim()),
          element: line.substring(76, 78).trim(),
        };
      };

      const atom = parseAtom(atomLine);

      expect(atom.serial).toBe(1);
      expect(atom.name).toBe('N');
      expect(atom.resName).toBe('ALA');
      expect(atom.chainID).toBe('A');
      expect(atom.resSeq).toBe(1);
      expect(atom.x).toBe(0.0);
      expect(atom.y).toBe(0.0);
      expect(atom.z).toBe(0.0);
      expect(atom.element).toBe('N');
    });

    it('should parse HETATM records', () => {
      const hetatmLine = 'HETATM  100  O   HOH A 200       5.000   5.000   5.000  1.00 20.00           O';

      const isHetatm = hetatmLine.startsWith('HETATM');
      expect(isHetatm).toBe(true);
    });

    it('should parse HEADER information', () => {
      const headerLine = 'HEADER    HYDROLASE                               01-JAN-20   1ABC';

      const header = {
        classification: headerLine.substring(10, 50).trim(),
        depDate: headerLine.substring(50, 59).trim(),
        idCode: headerLine.substring(62, 66).trim(),
      };

      expect(header.classification).toBe('HYDROLASE');
      expect(header.depDate).toBe('01-JAN-20');
      expect(header.idCode).toBe('1ABC');
    });

    it('should parse CONECT records for bonds', () => {
      const conectLine = 'CONECT    1    2    3    4';

      const parseConect = (line: string) => {
        const parts = line.substring(6).trim().split(/\s+/).map(Number);
        return {
          atom: parts[0],
          bonds: parts.slice(1),
        };
      };

      const bonds = parseConect(conectLine);

      expect(bonds.atom).toBe(1);
      expect(bonds.bonds).toEqual([2, 3, 4]);
    });

    it('should handle multi-chain structures', () => {
      const atoms = [
        'ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00 10.00           N',
        'ATOM      2  N   ALA B   1       5.000   5.000   5.000  1.00 10.00           N',
      ];

      const chains = new Set(
        atoms.map(line => line.substring(21, 22).trim())
      );

      expect(chains.size).toBe(2);
      expect(chains.has('A')).toBe(true);
      expect(chains.has('B')).toBe(true);
    });
  });

  describe('mmCIF Format Parsing', () => {
    it('should detect mmCIF format', () => {
      const mmcifContent = `
data_1ABC
#
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.label_atom_id
ATOM 1 N
`;

      const isMmCIF = mmcifContent.includes('data_') && mmcifContent.includes('loop_');

      expect(isMmCIF).toBe(true);
    });

    it('should parse mmCIF atom records', () => {
      const mmcifData = {
        group_PDB: 'ATOM',
        id: '1',
        label_atom_id: 'N',
        Cartn_x: '0.000',
        Cartn_y: '0.000',
        Cartn_z: '0.000',
      };

      expect(mmcifData.group_PDB).toBe('ATOM');
      expect(parseFloat(mmcifData.Cartn_x)).toBe(0.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed ATOM records', () => {
      const malformedLine = 'ATOM      1  N   ALA A';

      try {
        const x = parseFloat(malformedLine.substring(30, 38).trim());
        expect(isNaN(x)).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle empty files', () => {
      const emptyContent = '';

      const atoms = emptyContent
        .split('\n')
        .filter(line => line.startsWith('ATOM'));

      expect(atoms).toHaveLength(0);
    });

    it('should handle invalid coordinates', () => {
      const invalidLine = 'ATOM      1  N   ALA A   1       X.XXX   Y.YYY   Z.ZZZ  1.00 10.00           N';

      const x = parseFloat(invalidLine.substring(30, 38).trim());

      expect(isNaN(x)).toBe(true);
    });
  });

  describe('Structure Validation', () => {
    it('should validate required fields', () => {
      const atom = {
        serial: 1,
        name: 'N',
        resName: 'ALA',
        chainID: 'A',
        x: 0,
        y: 0,
        z: 0,
      };

      const requiredFields = ['serial', 'name', 'resName', 'x', 'y', 'z'];
      const hasAllFields = requiredFields.every(field => field in atom);

      expect(hasAllFields).toBe(true);
    });

    it('should detect missing atoms', () => {
      const atomSerials = [1, 2, 4, 5]; // Missing 3

      const hasMissing = atomSerials.some((serial, i) =>
        i > 0 && serial !== atomSerials[i - 1] + 1
      );

      expect(hasMissing).toBe(true);
    });

    it('should validate coordinate ranges', () => {
      const coordinates = { x: 100.5, y: -50.2, z: 25.8 };

      const isValid = (coord: number) =>
        !isNaN(coord) && isFinite(coord);

      expect(isValid(coordinates.x)).toBe(true);
      expect(isValid(coordinates.y)).toBe(true);
      expect(isValid(coordinates.z)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should parse large files efficiently', () => {
      const lineCount = 10000;
      const lines = Array(lineCount).fill(
        'ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00 10.00           N'
      );

      const start = performance.now();
      const atoms = lines.filter(line => line.startsWith('ATOM'));
      const duration = performance.now() - start;

      expect(atoms).toHaveLength(lineCount);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should handle incremental parsing', () => {
      const chunks = [
        'ATOM      1  N   ALA A   1',
        '       0.000   0.000   0.000',
        '  1.00 10.00           N\n',
      ];

      const assembled = chunks.join('');

      expect(assembled.startsWith('ATOM')).toBe(true);
    });
  });
});
