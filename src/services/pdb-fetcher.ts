/**
 * PDB Fetcher Service
 * Multi-source fetching with fallbacks, rate limiting, and parallel processing
 */

export interface PDBFetchOptions {
  source?: 'rcsb' | 'pdbe' | 'pdbj' | 'alphafold' | 'auto';
  format?: 'pdb' | 'cif';
  retries?: number;
  timeout?: number;
  onProgress?: (progress: number, message: string) => void;
}

export interface PDBFetchResult {
  id: string;
  content: string;
  format: 'pdb' | 'cif';
  source: string;
  fetchTime: number;
  size: number;
  cached: boolean;
}

export interface PDBSearchResult {
  id: string;
  title: string;
  resolution?: number;
  method: string;
  releaseDate: string;
  authors: string[];
  organisms: string[];
}

// API endpoints for different sources
const PDB_SOURCES = {
  rcsb: {
    base: 'https://files.rcsb.org/download',
    search: 'https://search.rcsb.org/rcsbsearch/v2/query',
    info: 'https://data.rcsb.org/rest/v1/core/entry'
  },
  pdbe: {
    base: 'https://www.ebi.ac.uk/pdbe/entry-files/download',
    search: 'https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary'
  },
  pdbj: {
    base: 'https://pdbj.org/rest/downloadPDBfile',
    search: 'https://pdbj.org/rest/mine2_sql'
  },
  alphafold: {
    base: 'https://alphafold.ebi.ac.uk/files'
  }
};

// Rate limiting
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = 0;
  private lastRequest = 0;

  constructor(
    private maxConcurrent: number = 5,
    private minInterval: number = 200
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.processing >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.processing++;
    this.lastRequest = Date.now();

    try {
      return await fn();
    } finally {
      this.processing--;
    }
  }
}

const rateLimiter = new RateLimiter(5, 200);

/**
 * Fetch PDB file from specified source
 */
export async function fetchPDB(
  id: string,
  options: PDBFetchOptions = {}
): Promise<PDBFetchResult> {
  const {
    source = 'auto',
    format = 'pdb',
    retries = 3,
    timeout = 10000,
    onProgress
  } = options;

  const startTime = Date.now();
  onProgress?.(0, `Starting fetch for ${id}...`);

  // Try sources in order if auto
  const sources = source === 'auto'
    ? ['rcsb', 'pdbe', 'pdbj'] as const
    : [source] as const;

  let lastError: Error | null = null;

  for (const src of sources) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        onProgress?.(
          20 + (attempt / retries) * 30,
          `Fetching from ${src} (attempt ${attempt + 1}/${retries})...`
        );

        const result = await rateLimiter.execute(() =>
          fetchFromSource(id, src, format, timeout)
        );

        onProgress?.(100, `Successfully fetched from ${src}`);

        return {
          ...result,
          id,
          format,
          source: src,
          fetchTime: Date.now() - startTime,
          cached: false
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to fetch ${id} from ${src} (attempt ${attempt + 1}):`, error);

        if (attempt < retries - 1) {
          const backoff = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
  }

  throw new Error(
    `Failed to fetch PDB ${id} from all sources. Last error: ${lastError?.message}`
  );
}

/**
 * Fetch from specific source
 */
async function fetchFromSource(
  id: string,
  source: 'rcsb' | 'pdbe' | 'pdbj' | 'alphafold',
  format: 'pdb' | 'cif',
  timeout: number
): Promise<{ content: string; size: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let url: string;

    switch (source) {
      case 'rcsb':
        url = format === 'cif'
          ? `${PDB_SOURCES.rcsb.base}/${id}.cif`
          : `${PDB_SOURCES.rcsb.base}/${id}.pdb`;
        break;

      case 'pdbe':
        url = format === 'cif'
          ? `${PDB_SOURCES.pdbe.base}/pdb${id}.ent`
          : `${PDB_SOURCES.pdbe.base}/${id}.cif`;
        break;

      case 'pdbj':
        url = `${PDB_SOURCES.pdbj.base}?id=${id}&format=${format}`;
        break;

      case 'alphafold':
        // AlphaFold uses UniProt IDs
        url = `${PDB_SOURCES.alphafold.base}/AF-${id}-F1-model_v4.pdb`;
        break;
    }

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    if (!content || content.length < 100) {
      throw new Error('Invalid or empty PDB file');
    }

    return {
      content,
      size: content.length
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch multiple PDB files in parallel
 */
export async function fetchMultiplePDB(
  ids: string[],
  options: PDBFetchOptions = {}
): Promise<Map<string, PDBFetchResult>> {
  const { onProgress } = options;
  const results = new Map<string, PDBFetchResult>();

  let completed = 0;
  const total = ids.length;

  onProgress?.(0, `Starting parallel fetch of ${total} structures...`);

  const promises = ids.map(async (id) => {
    try {
      const result = await fetchPDB(id, {
        ...options,
        onProgress: undefined // Don't propagate individual progress
      });

      results.set(id, result);
      completed++;
      onProgress?.(
        (completed / total) * 100,
        `Completed ${completed}/${total}: ${id}`
      );
    } catch (error) {
      console.error(`Failed to fetch ${id}:`, error);
      completed++;
      onProgress?.(
        (completed / total) * 100,
        `Failed ${completed}/${total}: ${id}`
      );
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Search PDB database
 */
export async function searchPDB(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: {
      resolution?: { min?: number; max?: number };
      releaseDate?: { min?: string; max?: string };
      method?: string[];
      organisms?: string[];
    };
  } = {}
): Promise<PDBSearchResult[]> {
  const { limit = 20, offset = 0, filters = {} } = options;

  // Build RCSB search query
  const searchQuery = {
    query: {
      type: 'terminal',
      service: 'text',
      parameters: {
        value: query
      }
    },
    request_options: {
      pager: {
        start: offset,
        rows: limit
      }
    },
    return_type: 'entry'
  };

  // Add filters
  if (filters.resolution) {
    searchQuery.query = {
      type: 'group',
      logical_operator: 'and',
      nodes: [
        searchQuery.query,
        {
          type: 'terminal',
          service: 'text',
          parameters: {
            attribute: 'rcsb_entry_info.resolution_combined',
            operator: 'range',
            value: {
              from: filters.resolution.min,
              to: filters.resolution.max,
              include_lower: true,
              include_upper: true
            }
          }
        }
      ]
    } as any;
  }

  try {
    const response = await rateLimiter.execute(() =>
      fetch(PDB_SOURCES.rcsb.search, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchQuery)
      })
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    // Fetch metadata for each result
    const ids = data.result_set?.map((r: any) => r.identifier) || [];
    const metadata = await fetchMetadata(ids);

    return metadata;
  } catch (error) {
    console.error('PDB search failed:', error);
    throw error;
  }
}

/**
 * Fetch metadata for PDB IDs
 */
export async function fetchMetadata(
  ids: string[]
): Promise<PDBSearchResult[]> {
  const promises = ids.map(async (id) => {
    try {
      const response = await rateLimiter.execute(() =>
        fetch(`${PDB_SOURCES.rcsb.info}/${id}`)
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata for ${id}`);
      }

      const data = await response.json();

      return {
        id,
        title: data.struct?.title || 'Unknown',
        resolution: data.rcsb_entry_info?.resolution_combined?.[0],
        method: data.exptl?.[0]?.method || 'Unknown',
        releaseDate: data.rcsb_accession_info?.deposit_date || '',
        authors: data.audit_author?.map((a: any) => a.name) || [],
        organisms: data.rcsb_entity_source_organism?.map((o: any) =>
          o.ncbi_scientific_name
        ) || []
      };
    } catch (error) {
      console.error(`Failed to fetch metadata for ${id}:`, error);
      return {
        id,
        title: 'Error fetching metadata',
        method: 'Unknown',
        releaseDate: '',
        authors: [],
        organisms: []
      };
    }
  });

  return Promise.all(promises);
}

/**
 * Fetch AlphaFold prediction by UniProt ID
 */
export async function fetchAlphaFold(
  uniprotId: string,
  options: PDBFetchOptions = {}
): Promise<PDBFetchResult> {
  const { onProgress, timeout = 10000 } = options;

  onProgress?.(0, `Fetching AlphaFold prediction for ${uniprotId}...`);

  try {
    const result = await fetchFromSource(
      uniprotId,
      'alphafold',
      'pdb',
      timeout
    );

    onProgress?.(100, 'Successfully fetched AlphaFold prediction');

    return {
      id: uniprotId,
      content: result.content,
      format: 'pdb',
      source: 'alphafold',
      fetchTime: 0,
      size: result.size,
      cached: false
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch AlphaFold prediction for ${uniprotId}: ${(error as Error).message}`
    );
  }
}

/**
 * Validate PDB ID format
 */
export function isValidPDBId(id: string): boolean {
  // Standard PDB ID: 4 characters (1 digit + 3 alphanumeric)
  return /^[0-9][a-zA-Z0-9]{3}$/i.test(id);
}

/**
 * Validate UniProt ID format
 */
export function isValidUniProtId(id: string): boolean {
  // UniProt ID: 6-10 alphanumeric characters
  return /^[A-Z0-9]{6,10}$/i.test(id);
}

/**
 * Extract PDB ID from various formats
 */
export function normalizePDBId(input: string): string {
  // Remove common prefixes and extensions
  const cleaned = input
    .toUpperCase()
    .replace(/^PDB:?/i, '')
    .replace(/\.(PDB|CIF)$/i, '')
    .trim();

  return cleaned;
}
