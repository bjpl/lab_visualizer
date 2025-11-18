/**
 * PDB Service - Unified data pipeline for protein structures
 * Implements PDBService contract from API_CONTRACTS.md
 *
 * Features:
 * - RCSB PDB API integration
 * - AlphaFold Database integration
 * - Local file uploads (PDB/mmCIF)
 * - IndexedDB caching
 * - Search functionality
 */

import { getComplexityAnalyzer } from '../lib/complexity-analyzer';
import type {
  Structure,
  StructureMetadata,
  StructureComplexity,
  Atom,
  FetchOptions,
  SearchFilters,
  SearchResult,
  CachedStructure,
  AlphaFoldMetadata,
  PDBError,
  PDBService as IPDBService,
} from '../types/pdb';

const RCSB_BASE_URL = 'https://files.rcsb.org/download';
const RCSB_SEARCH_URL = 'https://search.rcsb.org/rcsbsearch/v2/query';
const ALPHAFOLD_BASE_URL = 'https://alphafold.ebi.ac.uk/files';

const CACHE_DB_NAME = 'lab-visualizer-pdb-cache';
const CACHE_STORE_NAME = 'structures';
const CACHE_VERSION = 1;
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

class PDBServiceImpl implements IPDBService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB for caching
   */
  private async initializeDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_DB_NAME, CACHE_VERSION);

      request.onerror = () => reject(this.createError('CACHE_ERROR', request.error));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
          const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'id' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  /**
   * Fetch structure by PDB ID
   */
  async fetchStructure(pdbId: string, options: FetchOptions = {}): Promise<Structure> {
    const normalizedId = pdbId.toUpperCase();

    // Check cache first if enabled
    if (options.cache !== false) {
      const cached = await this.getFromCache(normalizedId);
      if (cached) {
        return this.cacheToStructure(cached);
      }
    }

    try {
      // Fetch from RCSB PDB
      const format = 'pdb'; // Default to PDB format
      const url = `${RCSB_BASE_URL}/${normalizedId}.${format}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createError('NOT_FOUND', `Structure ${normalizedId} not found`);
      }

      const content = await response.text();

      // Parse structure
      const structure = await this.parseStructure(normalizedId, content, format);

      // Cache for future use
      if (options.cache !== false) {
        await this.saveToCache(structure);
      }

      return structure;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('NETWORK_ERROR', 'Request timeout');
      }
      throw error;
    }
  }

  /**
   * Fetch AlphaFold prediction by UniProt ID
   */
  async fetchAlphaFoldStructure(uniprotId: string): Promise<Structure> {
    const normalizedId = uniprotId.toUpperCase();
    const cacheKey = `AF-${normalizedId}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return this.cacheToStructure(cached);
    }

    try {
      // Fetch PDB file from AlphaFold
      const url = `${ALPHAFOLD_BASE_URL}/AF-${normalizedId}-F1-model_v4.pdb`;
      const response = await fetch(url);

      if (!response.ok) {
        throw this.createError('NOT_FOUND', `AlphaFold structure for ${normalizedId} not found`);
      }

      const content = await response.text();

      // Parse structure
      const structure = await this.parseStructure(cacheKey, content, 'pdb');

      // Add AlphaFold-specific metadata
      structure.metadata.experimentMethod = 'AlphaFold prediction';

      // Cache
      await this.saveToCache(structure);

      return structure;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createError('NETWORK_ERROR', error.message);
      }
      throw error;
    }
  }

  /**
   * Search structures by query
   */
  async searchStructures(query: string, filters: SearchFilters = {}): Promise<SearchResult[]> {
    const searchQuery = {
      query: {
        type: 'terminal',
        service: 'text',
        parameters: {
          attribute: 'struct.title',
          operator: 'contains_words',
          value: query,
        },
      },
      return_type: 'entry',
      request_options: {
        paginate: {
          start: filters.offset || 0,
          rows: filters.limit || 10,
        },
        results_content_type: ['experimental'],
        sort: [{ sort_by: 'score', direction: 'desc' }],
      },
    };

    try {
      const response = await fetch(RCSB_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchQuery),
      });

      if (!response.ok) {
        throw this.createError('NETWORK_ERROR', 'Search failed');
      }

      const data = await response.json();

      return (data.result_set || []).map((result: any) => ({
        pdbId: result.identifier,
        title: result.title || '',
        resolution: result.resolution,
        experimentMethod: result.experiment_method,
        depositionDate: result.deposition_date,
        chains: result.chains || [],
        relevanceScore: result.score || 0,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw this.createError('NETWORK_ERROR', error.message);
      }
      throw error;
    }
  }

  /**
   * Upload custom structure file
   */
  async uploadStructure(file: File): Promise<Structure> {
    const content = await file.text();
    const format = this.detectFormat(file.name, content);

    if (!format) {
      throw this.createError('INVALID_FORMAT', 'Unsupported file format. Use .pdb or .cif files.');
    }

    const pdbId = `UPLOAD-${Date.now()}`;
    return this.parseStructure(pdbId, content, format);
  }

  /**
   * Check if structure is cached
   */
  async isCached(pdbId: string): Promise<boolean> {
    const cached = await this.getFromCache(pdbId.toUpperCase());
    return cached !== null;
  }

  /**
   * Get structure metadata only
   */
  async getMetadata(pdbId: string): Promise<StructureMetadata> {
    const structure = await this.fetchStructure(pdbId, { cache: true });
    return structure.metadata;
  }

  /**
   * Parse PDB/mmCIF content into Structure object
   */
  private async parseStructure(
    pdbId: string,
    content: string,
    format: 'pdb' | 'cif'
  ): Promise<Structure> {
    const atoms: Atom[] = [];
    const chains = new Set<string>();
    const metadata: StructureMetadata = {
      chains: [],
      atomCount: 0,
      residueCount: 0,
    };

    if (format === 'pdb') {
      const lines = content.split('\n');
      const residues = new Set<string>();

      for (const line of lines) {
        const recordType = line.substring(0, 6).trim();

        if (recordType === 'ATOM' || recordType === 'HETATM') {
          const atom: Atom = {
            serial: parseInt(line.substring(6, 11).trim()),
            name: line.substring(12, 16).trim(),
            residue: line.substring(17, 20).trim(),
            chain: line.substring(21, 22).trim(),
            residueSeq: parseInt(line.substring(22, 26).trim()),
            x: parseFloat(line.substring(30, 38).trim()),
            y: parseFloat(line.substring(38, 46).trim()),
            z: parseFloat(line.substring(46, 54).trim()),
            occupancy: parseFloat(line.substring(54, 60).trim() || '1.0'),
            tempFactor: parseFloat(line.substring(60, 66).trim() || '0.0'),
            element: line.substring(76, 78).trim() || line.substring(12, 14).trim(),
            isLigand: recordType === 'HETATM',
          };

          atoms.push(atom);
          chains.add(atom.chain);
          residues.add(`${atom.chain}:${atom.residueSeq}`);
        } else if (recordType === 'HEADER') {
          metadata.title = line.substring(10, 50).trim();
          metadata.depositionDate = line.substring(50, 59).trim();
        } else if (recordType === 'EXPDTA') {
          metadata.experimentMethod = line.substring(10).trim();
        } else if (recordType === 'REMARK' && line.includes('RESOLUTION')) {
          const match = line.match(/(\d+\.\d+)\s+ANGSTROMS/);
          if (match) {
            metadata.resolution = parseFloat(match[1]);
          }
        }
      }

      metadata.atomCount = atoms.length;
      metadata.residueCount = residues.size;
      metadata.chains = Array.from(chains).sort();
    } else {
      // Basic mmCIF parsing (simplified)
      throw this.createError('PARSE_ERROR', 'mmCIF parsing not yet implemented');
    }

    const complexity = this.analyzeComplexity(atoms, metadata);

    return {
      pdbId,
      content,
      format,
      atoms,
      metadata,
      complexity,
    };
  }

  /**
   * Analyze structure complexity for LOD decisions
   * Uses centralized complexity analyzer
   */
  private analyzeComplexity(atoms: Atom[], metadata: StructureMetadata): StructureComplexity {
    const analyzer = getComplexityAnalyzer();
    return analyzer.analyzeFromAtoms(atoms, metadata);
  }

  /**
   * Detect file format from filename and content
   */
  private detectFormat(filename: string, content: string): 'pdb' | 'cif' | null {
    const ext = filename.toLowerCase().split('.').pop();

    if (ext === 'pdb') return 'pdb';
    if (ext === 'cif' || ext === 'mmcif') return 'cif';

    // Content-based detection
    if (content.includes('ATOM  ') || content.includes('HETATM')) return 'pdb';
    if (content.includes('data_') && content.includes('_atom_site.')) return 'cif';

    return null;
  }

  /**
   * Cache operations
   */
  private async getFromCache(pdbId: string): Promise<CachedStructure | null> {
    if (!this.db) await this.initializeDB();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.get(pdbId);

      request.onsuccess = () => {
        const cached = request.result as CachedStructure | undefined;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is stale
        if (Date.now() - cached.cachedAt > CACHE_MAX_AGE) {
          this.deleteFromCache(pdbId);
          resolve(null);
          return;
        }

        // Update last accessed time
        this.updateLastAccessed(pdbId);
        resolve(cached);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async saveToCache(structure: Structure): Promise<void> {
    if (!this.db) await this.initializeDB();
    if (!this.db) return;

    const cached: CachedStructure = {
      id: structure.pdbId,
      content: structure.content,
      format: structure.format,
      metadata: structure.metadata,
      complexity: structure.complexity,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromCache(pdbId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE_NAME);
      const request = store.delete(pdbId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateLastAccessed(pdbId: string): Promise<void> {
    if (!this.db) return;

    const cached = await this.getFromCache(pdbId);
    if (!cached) return;

    cached.lastAccessed = Date.now();
    await this.saveToCache(this.cacheToStructure(cached));
  }

  private cacheToStructure(cached: CachedStructure): Structure {
    return {
      pdbId: cached.id,
      content: cached.content,
      format: cached.format,
      atoms: [], // Not stored in cache to save space
      metadata: cached.metadata,
      complexity: cached.complexity,
    };
  }

  /**
   * Error handling
   */
  private createError(
    code: PDBError['code'],
    message: string,
    details?: unknown
  ): PDBError {
    const error = new Error(message) as PDBError;
    error.name = 'PDBError';
    error.code = code;
    error.details = details;
    return error;
  }
}

// Export singleton instance
export const pdbService = new PDBServiceImpl();
export default pdbService;
