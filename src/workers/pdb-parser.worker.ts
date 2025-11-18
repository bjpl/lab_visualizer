/**
 * PDB Parser Web Worker
 *
 * Offloads PDB file parsing to a Web Worker
 * to prevent blocking the main thread
 */

/**
 * Message types
 */
interface ParsePDBMessage {
  type: 'parse';
  data: string | ArrayBuffer;
  format: 'pdb' | 'cif' | 'sdf';
}

interface ParseResultMessage {
  type: 'result';
  data: ParsedStructure;
}

interface ParseErrorMessage {
  type: 'error';
  error: string;
}

type WorkerMessage = ParsePDBMessage;
type WorkerResponse = ParseResultMessage | ParseErrorMessage;

/**
 * Parsed structure data
 */
interface ParsedStructure {
  atoms: Atom[];
  residues: Residue[];
  chains: Chain[];
  metadata: StructureMetadata;
}

interface Atom {
  id: number;
  element: string;
  name: string;
  x: number;
  y: number;
  z: number;
  residueId: number;
  chainId: string;
}

interface Residue {
  id: number;
  name: string;
  chainId: string;
  sequence: number;
}

interface Chain {
  id: string;
  name: string;
  type: 'protein' | 'dna' | 'rna' | 'other';
}

interface StructureMetadata {
  title: string;
  pdbId?: string;
  resolution?: number;
  experimentMethod?: string;
  depositionDate?: string;
}

/**
 * Parse PDB format
 */
function parsePDB(data: string): ParsedStructure {
  const lines = data.split('\n');
  const atoms: Atom[] = [];
  const residues: Map<string, Residue> = new Map();
  const chains: Map<string, Chain> = new Map();
  const metadata: StructureMetadata = { title: 'Unknown' };

  for (const line of lines) {
    const recordType = line.substring(0, 6).trim();

    // Parse HEADER
    if (recordType === 'HEADER') {
      metadata.title = line.substring(10, 50).trim();
      metadata.pdbId = line.substring(62, 66).trim();
      metadata.depositionDate = line.substring(50, 59).trim();
    }

    // Parse REMARK 2 (resolution)
    if (recordType === 'REMARK' && line.substring(7, 10).trim() === '2') {
      const resMatch = line.match(/RESOLUTION\.\s+([\d.]+)/);
      if (resMatch) {
        metadata.resolution = parseFloat(resMatch[1]);
      }
    }

    // Parse EXPDTA (experiment method)
    if (recordType === 'EXPDTA') {
      metadata.experimentMethod = line.substring(10).trim();
    }

    // Parse ATOM/HETATM
    if (recordType === 'ATOM' || recordType === 'HETATM') {
      const atomId = parseInt(line.substring(6, 11).trim());
      const atomName = line.substring(12, 16).trim();
      const residueName = line.substring(17, 20).trim();
      const chainId = line.substring(21, 22).trim();
      const residueSeq = parseInt(line.substring(22, 26).trim());
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const element = line.substring(76, 78).trim() || atomName.substring(0, 1);

      atoms.push({
        id: atomId,
        element,
        name: atomName,
        x,
        y,
        z,
        residueId: residueSeq,
        chainId,
      });

      // Track residue
      const residueKey = `${chainId}-${residueSeq}`;
      if (!residues.has(residueKey)) {
        residues.set(residueKey, {
          id: residueSeq,
          name: residueName,
          chainId,
          sequence: residueSeq,
        });
      }

      // Track chain
      if (!chains.has(chainId)) {
        chains.set(chainId, {
          id: chainId,
          name: chainId,
          type: recordType === 'ATOM' ? 'protein' : 'other',
        });
      }
    }
  }

  return {
    atoms,
    residues: Array.from(residues.values()),
    chains: Array.from(chains.values()),
    metadata,
  };
}

/**
 * Parse CIF format (simplified - full implementation would use Mol* parser)
 */
function parseCIF(data: string): ParsedStructure {
  // Simplified CIF parsing
  // In production, would use Mol* CIF parser
  return {
    atoms: [],
    residues: [],
    chains: [],
    metadata: { title: 'CIF Structure' },
  };
}

/**
 * Parse SDF format
 */
function parseSDF(data: string): ParsedStructure {
  // Simplified SDF parsing
  return {
    atoms: [],
    residues: [],
    chains: [],
    metadata: { title: 'SDF Structure' },
  };
}

/**
 * Main worker message handler
 */
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === 'parse') {
      const dataStr =
        typeof message.data === 'string' ? message.data : new TextDecoder().decode(message.data);

      let result: ParsedStructure;

      switch (message.format) {
        case 'pdb':
          result = parsePDB(dataStr);
          break;
        case 'cif':
          result = parseCIF(dataStr);
          break;
        case 'sdf':
          result = parseSDF(dataStr);
          break;
        default:
          throw new Error(`Unknown format: ${message.format}`);
      }

      const response: ParseResultMessage = {
        type: 'result',
        data: result,
      };

      self.postMessage(response);
    }
  } catch (error) {
    const response: ParseErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
});

// Export empty object for TypeScript
export {};
