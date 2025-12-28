/**
 * Tests for PDB fetcher service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPDB,
  searchPDB,
  fetchMultiplePDB,
  isValidPDBId,
  isValidUniProtId,
  normalizePDBId
} from '@/services/pdb-fetcher';

// Mock fetch for testing
global.fetch = vi.fn();

// Valid mock PDB content (must be at least 100 chars)
const MOCK_PDB_CONTENT = `HEADER    OXYGEN STORAGE/TRANSPORT                11-MAR-98   1MBN
TITLE     MYOGLOBIN FROM SPERM WHALE
ATOM      1  N   VAL A   1      18.660  19.770  24.040  1.00 41.54           N
ATOM      2  CA  VAL A   1      19.000  20.920  23.180  1.00 40.44           C
END`;

describe('PDB Fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ID Validation', () => {
    it('should validate correct PDB IDs', () => {
      expect(isValidPDBId('1MBN')).toBe(true);
      expect(isValidPDBId('2HHB')).toBe(true);
      expect(isValidPDBId('4V9D')).toBe(true);
    });

    it('should reject invalid PDB IDs', () => {
      expect(isValidPDBId('ABCD')).toBe(false); // No digit
      expect(isValidPDBId('12345')).toBe(false); // Too long
      expect(isValidPDBId('1AB')).toBe(false); // Too short
      expect(isValidPDBId('')).toBe(false); // Empty
    });

    it('should validate correct UniProt IDs', () => {
      expect(isValidUniProtId('P69905')).toBe(true);
      expect(isValidUniProtId('Q9Y6K9')).toBe(true);
      expect(isValidUniProtId('A0A0B4J2F2')).toBe(true);
    });

    it('should reject invalid UniProt IDs', () => {
      expect(isValidUniProtId('ABC')).toBe(false); // Too short
      expect(isValidUniProtId('12345678901')).toBe(false); // Too long
      expect(isValidUniProtId('abc123')).toBe(false); // Lowercase
    });

    it('should normalize PDB IDs', () => {
      expect(normalizePDBId('1mbn')).toBe('1MBN');
      expect(normalizePDBId('PDB:2HHB')).toBe('2HHB');
      expect(normalizePDBId('1TIM.pdb')).toBe('1TIM');
      expect(normalizePDBId(' 3CPA ')).toBe('3CPA');
    });
  });

  describe('fetchPDB', () => {
    it('should fetch from RCSB by default', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_PDB_CONTENT
      });

      const result = await fetchPDB('1MBN');

      expect(result.id).toBe('1MBN');
      expect(result.content).toBe(MOCK_PDB_CONTENT);
      expect(result.source).toBe('rcsb');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('rcsb.org'),
        expect.any(Object)
      );
    });

    it('should retry on failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => MOCK_PDB_CONTENT
        });

      const result = await fetchPDB('1MBN', { retries: 2 });

      expect(result.content).toContain('HEADER');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback to alternate sources', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('RCSB failed'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => MOCK_PDB_CONTENT
        });

      const result = await fetchPDB('1MBN', { source: 'auto', retries: 1 });

      expect(result.content).toContain('HEADER');
    });

    it('should handle timeout', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      await expect(
        fetchPDB('1MBN', { timeout: 100, retries: 1 })
      ).rejects.toThrow();
    });

    it('should report progress', async () => {
      const progressUpdates: Array<{ progress: number; message: string }> = [];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_PDB_CONTENT
      });

      await fetchPDB('1MBN', {
        onProgress: (progress, message) => {
          progressUpdates.push({ progress, message });
        }
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].progress).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });

    it('should fetch mmCIF format', async () => {
      const mockCIF = 'data_1MBN\nloop_\n_atom_site.id';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => mockCIF
      });

      const result = await fetchPDB('1MBN', { format: 'cif' });

      expect(result.content).toContain('data_1MBN');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('.cif'),
        expect.any(Object)
      );
    });
  });

  describe('fetchMultiplePDB', () => {
    it('should fetch multiple structures in parallel', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: async () => MOCK_PDB_CONTENT
      });

      const ids = ['1MBN', '2HHB', '1HEW'];
      const results = await fetchMultiplePDB(ids);

      expect(results.size).toBe(3);
      expect(results.has('1MBN')).toBe(true);
      expect(results.has('2HHB')).toBe(true);
      expect(results.has('1HEW')).toBe(true);
    });

    it('should continue on individual failures', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, text: async () => MOCK_PDB_CONTENT })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ ok: true, text: async () => MOCK_PDB_CONTENT });

      const ids = ['1MBN', '2HHB', '1HEW'];
      const results = await fetchMultiplePDB(ids, { retries: 1 });

      expect(results.size).toBe(2); // 2 succeeded, 1 failed
    });

    it('should report overall progress', async () => {
      const progressUpdates: number[] = [];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: async () => MOCK_PDB_CONTENT
      });

      await fetchMultiplePDB(['1MBN', '2HHB'], {
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(Math.max(...progressUpdates)).toBe(100);
    });
  });

  describe('searchPDB', () => {
    it('should search RCSB database', async () => {
      const mockSearchResults = {
        result_set: [
          { identifier: '1MBN' },
          { identifier: '2HHB' }
        ]
      };

      const mockMetadata = {
        struct: { title: 'Test Structure' },
        rcsb_entry_info: { resolution_combined: [2.0] },
        exptl: [{ method: 'X-RAY DIFFRACTION' }],
        rcsb_accession_info: { deposit_date: '2020-01-01' },
        audit_author: [{ name: 'Test Author' }],
        rcsb_entity_source_organism: []
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResults
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockMetadata
        });

      const results = await searchPDB('myoglobin');

      expect(results.length).toBe(2);
      expect(results[0].id).toBe('1MBN');
      expect(results[0].title).toBe('Test Structure');
    });

    it('should handle search errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(searchPDB('invalid query')).rejects.toThrow();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        text: async () => MOCK_PDB_CONTENT
      });

      const start = Date.now();

      // Fetch 3 structures rapidly
      await Promise.all([
        fetchPDB('1MBN'),
        fetchPDB('2HHB'),
        fetchPDB('1HEW')
      ]);

      const elapsed = Date.now() - start;

      // Should take at least 400ms (200ms interval * 2)
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance', () => {
    it('should fetch within target time', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: async () => MOCK_PDB_CONTENT.repeat(1000)
      });

      const start = Date.now();
      await fetchPDB('1MBN');
      const time = Date.now() - start;

      // Should be under 2 seconds
      expect(time).toBeLessThan(2000);
    });
  });
});
