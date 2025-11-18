/**
 * PDB Type Definitions for LAB Visualizer
 * Implements contracts from docs/architecture/API_CONTRACTS.md
 */

export interface Atom {
  serial: number;
  name: string;
  element: string;
  residue: string;
  residueSeq: number;
  chain: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  isLigand?: boolean;
}

export interface StructureMetadata {
  title?: string;
  resolution?: number;
  chains: string[];
  atomCount: number;
  residueCount: number;
  experimentMethod?: string;
  depositionDate?: string;
  authors?: string[];
  keywords?: string[];
}

export interface StructureComplexity {
  atomCount: number;
  bondCount: number;
  residueCount: number;
  chainCount: number;
  hasLigands: boolean;
  hasSurfaces: boolean;
  estimatedVertices: number;
}

export interface Structure {
  pdbId: string;
  content: string; // PDB/mmCIF format
  format: 'pdb' | 'cif';
  atoms: Atom[];
  metadata: StructureMetadata;
  complexity: StructureComplexity;
}

export interface FetchOptions {
  assemblyId?: string;
  chains?: string[];
  cache?: boolean;
  timeout?: number;
}

export interface SearchFilters {
  resolution?: { min?: number; max?: number };
  experimentType?: string[];
  depositionDate?: { from?: string; to?: string };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  pdbId: string;
  title: string;
  resolution?: number;
  experimentMethod?: string;
  depositionDate?: string;
  chains: string[];
  relevanceScore: number;
}

export interface PDBService {
  /**
   * Fetch structure by PDB ID
   */
  fetchStructure(pdbId: string, options?: FetchOptions): Promise<Structure>;

  /**
   * Fetch AlphaFold prediction by UniProt ID
   */
  fetchAlphaFoldStructure(uniprotId: string): Promise<Structure>;

  /**
   * Search structures by query
   */
  searchStructures(query: string, filters?: SearchFilters): Promise<SearchResult[]>;

  /**
   * Upload custom structure
   */
  uploadStructure(file: File): Promise<Structure>;

  /**
   * Check if structure is cached
   */
  isCached(pdbId: string): Promise<boolean>;

  /**
   * Get structure metadata
   */
  getMetadata(pdbId: string): Promise<StructureMetadata>;
}

export interface CachedStructure {
  id: string;
  content: string;
  format: 'pdb' | 'cif';
  metadata: StructureMetadata;
  complexity: StructureComplexity;
  cachedAt: number;
  lastAccessed: number;
}

export interface AlphaFoldMetadata {
  uniprotId: string;
  uniprotAccession: string;
  geneName?: string;
  organismScientificName: string;
  modelVersion: number;
  modelCreatedDate: string;
  pLDDT: number; // Confidence score
}

export interface PDBError extends Error {
  code: 'NOT_FOUND' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'CACHE_ERROR' | 'INVALID_FORMAT';
  details?: unknown;
}
