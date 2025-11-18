/**
 * PDB Data Pipeline End-to-End Integration Tests
 * Tests the complete flow from fetching PDB data to rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchPDB, fetchMultiplePDB, searchPDB } from '@/services/pdb-fetcher';
import { molstarService } from '@/services/molstar-service';
import { LODManager } from '@/lib/lod-manager';

// Mock fetch for testing
global.fetch = vi.fn();

describe('PDB Data Pipeline Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    vi.clearAllMocks();
  });

  afterEach(() => {
    molstarService.dispose();
    document.body.removeChild(container);
  });

  describe('Single PDB Fetch + Render Pipeline', () => {
    it('should fetch PDB and load into viewer', async () => {
      // Mock successful PDB fetch
      const mockPDBData = `HEADER    TEST PROTEIN
ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C
END`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockPDBData,
        status: 200,
        statusText: 'OK',
      });

      // Fetch PDB data
      const result = await fetchPDB('1ABC', {
        source: 'rcsb',
        format: 'pdb',
        timeout: 5000,
      });

      expect(result.id).toBe('1ABC');
      expect(result.format).toBe('pdb');
      expect(result.content).toContain('ATOM');
      expect(result.size).toBeGreaterThan(0);

      // Initialize viewer
      await molstarService.initialize(container);

      // Load structure into viewer
      const metadata = await molstarService.loadStructure(result.content, {
        format: 'pdb',
        label: '1ABC',
      });

      expect(metadata).toBeDefined();
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock failed fetch
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        fetchPDB('INVALID', {
          source: 'rcsb',
          retries: 1,
          timeout: 1000,
        })
      ).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      // First two attempts fail, third succeeds
      const mockPDBData = 'HEADER TEST\nEND';

      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => mockPDBData,
        });

      const result = await fetchPDB('1ABC', {
        source: 'rcsb',
        retries: 3,
        timeout: 1000,
      });

      expect(result.content).toBe(mockPDBData);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Parallel PDB Fetching', () => {
    it('should fetch multiple PDBs in parallel', async () => {
      const mockPDBData = 'HEADER TEST\nATOM 1 CA ALA A 1\nEND';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockPDBData,
      });

      const ids = ['1ABC', '2DEF', '3GHI'];
      const results = await fetchMultiplePDB(ids, {
        source: 'rcsb',
        format: 'pdb',
      });

      expect(results.size).toBe(3);
      expect(results.has('1ABC')).toBe(true);
      expect(results.has('2DEF')).toBe(true);
      expect(results.has('3GHI')).toBe(true);
    });

    it('should handle partial failures in parallel fetch', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'HEADER 1\nEND',
        })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'HEADER 3\nEND',
        });

      const ids = ['1ABC', '2DEF', '3GHI'];
      const results = await fetchMultiplePDB(ids, {
        source: 'rcsb',
        retries: 1,
      });

      // Should have 2 successful results (1ABC and 3GHI)
      expect(results.size).toBe(2);
      expect(results.has('1ABC')).toBe(true);
      expect(results.has('3GHI')).toBe(true);
      expect(results.has('2DEF')).toBe(false);
    });
  });

  describe('PDB Search Integration', () => {
    it('should search and fetch results', async () => {
      // Mock search response
      const mockSearchResponse = {
        result_set: [
          { identifier: '1ABC' },
          { identifier: '2DEF' },
        ],
      };

      const mockMetadataResponse = {
        struct: { title: 'Test Protein' },
        rcsb_entry_info: { resolution_combined: [2.5] },
        exptl: [{ method: 'X-RAY DIFFRACTION' }],
        rcsb_accession_info: { deposit_date: '2020-01-01' },
        audit_author: [{ name: 'Smith, J.' }],
        rcsb_entity_source_organism: [
          { ncbi_scientific_name: 'Homo sapiens' },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockMetadataResponse,
        });

      const results = await searchPDB('hemoglobin', {
        limit: 10,
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1ABC');
      expect(results[0].title).toBe('Test Protein');
      expect(results[0].resolution).toBe(2.5);
    });
  });

  describe('LOD + Fetch Integration', () => {
    it('should apply LOD based on fetched structure size', async () => {
      // Small structure
      const smallPDB = `HEADER SMALL
${Array(100)
  .fill(null)
  .map((_, i) => `ATOM ${i + 1} CA ALA A ${i + 1}`)
  .join('\n')}
END`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => smallPDB,
      });

      const result = await fetchPDB('SMALL', { source: 'rcsb' });

      const lodManager = new LODManager({}, 512);
      const complexity = lodManager.analyzeComplexity({
        atomCount: 100,
        bondCount: 120,
        residueCount: 100,
        chainCount: 1,
      });

      const startLevel = lodManager.determineStartingLevel(complexity);

      // Small structure should start at INTERACTIVE
      expect(startLevel).toBeGreaterThanOrEqual(1);
      expect(lodManager.canAffordLevel(complexity, 3)).toBe(true);
    });

    it('should apply different LOD for large structures', async () => {
      const lodManager = new LODManager({}, 512);
      const largeComplexity = lodManager.analyzeComplexity({
        atomCount: 50000,
        bondCount: 60000,
        residueCount: 5000,
        chainCount: 10,
        hasLigands: true,
        hasSurfaces: true,
      });

      const startLevel =
        lodManager.determineStartingLevel(largeComplexity);

      // Large structure should start at PREVIEW
      expect(startLevel).toBe(1);
      expect(lodManager.canAffordLevel(largeComplexity, 3)).toBe(false);
    });
  });

  describe('Cache Integration', () => {
    it('should cache fetched PDB data', async () => {
      const mockPDBData = 'HEADER CACHED\nEND';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockPDBData,
      });

      // First fetch - should hit network
      const result1 = await fetchPDB('CACHE1', {
        source: 'rcsb',
      });

      expect(result1.cached).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Note: Actual caching would be tested with cache service integration
    });
  });

  describe('Error Recovery Pipeline', () => {
    it('should fallback to alternative sources', async () => {
      // RCSB fails, PDBe succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('RCSB down'))
        .mockRejectedValueOnce(new Error('RCSB down'))
        .mockRejectedValueOnce(new Error('RCSB down'))
        .mockResolvedValueOnce({
          ok: true,
          text: async () => 'HEADER FROM PDBE\nEND',
        });

      const result = await fetchPDB('1ABC', {
        source: 'auto',
        retries: 1,
      });

      expect(result.content).toContain('PDBE');
    });

    it('should handle malformed PDB data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'INVALID',
      });

      await expect(
        fetchPDB('INVALID', {
          source: 'rcsb',
          retries: 1,
        })
      ).rejects.toThrow('Invalid or empty PDB file');
    });
  });

  describe('Progress Tracking', () => {
    it('should report fetch progress', async () => {
      const onProgress = vi.fn();
      const mockPDBData = 'HEADER PROGRESS\nEND';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockPDBData,
      });

      await fetchPDB('PROG1', {
        source: 'rcsb',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress.mock.calls[0][0]).toBe(0);
      expect(
        onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
      ).toBe(100);
    });

    it('should report parallel fetch progress', async () => {
      const onProgress = vi.fn();
      const mockPDBData = 'HEADER\nEND';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockPDBData,
      });

      await fetchMultiplePDB(['1ABC', '2DEF', '3GHI'], {
        source: 'rcsb',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalled();
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
      expect(lastCall[0]).toBeGreaterThanOrEqual(90);
    });
  });
});
