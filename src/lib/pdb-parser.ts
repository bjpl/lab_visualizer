/**
 * PDB Parser - Handles PDB and mmCIF formats
 * Optimized for large files with Web Worker support
 */

export interface Atom {
  serial: number;
  name: string;
  altLoc?: string;
  resName: string;
  chainID: string;
  resSeq: number;
  iCode?: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  element: string;
  charge?: string;
}

export interface Bond {
  atom1: number;
  atom2: number;
  order: number;
}

export interface Metadata {
  id: string;
  title?: string;
  authors?: string[];
  resolution?: number;
  method?: string;
  releaseDate?: string;
  keywords?: string[];
  organisms?: string[];
  sequence?: Map<string, string>;
}

export interface Statistics {
  atomCount: number;
  residueCount: number;
  chainCount: number;
  modelCount: number;
  heteroAtomCount: number;
  waterCount: number;
  bounds: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
    center: { x: number; y: number; z: number };
  };
}

export interface ParsedStructure {
  atoms: Atom[];
  bonds: Bond[];
  metadata: Metadata;
  statistics: Statistics;
  format: 'pdb' | 'cif';
  parseTime: number;
}

export interface ParseOptions {
  includeHydrogens?: boolean;
  includeWater?: boolean;
  includeHeteroAtoms?: boolean;
  model?: number; // For NMR structures with multiple models
  chains?: string[]; // Parse only specific chains
  onProgress?: (progress: number, message: string) => void;
  useWorker?: boolean;
}

/**
 * Main parser function - auto-detects format
 */
export async function parsePDB(
  content: string,
  options: ParseOptions = {}
): Promise<ParsedStructure> {
  const startTime = Date.now();
  const { onProgress } = options;

  onProgress?.(0, 'Detecting format...');

  // Auto-detect format
  const format = detectFormat(content);

  onProgress?.(10, `Parsing ${format.toUpperCase()} format...`);

  let result: ParsedStructure;

  if (format === 'cif') {
    result = await parseMMCIF(content, options);
  } else {
    result = await parsePDBFormat(content, options);
  }

  result.parseTime = Date.now() - startTime;

  onProgress?.(100, 'Parsing complete');

  return result;
}

/**
 * Detect file format
 */
function detectFormat(content: string): 'pdb' | 'cif' {
  const firstLine = content.trim().split('\n')[0];

  // mmCIF files start with data_ or loop_
  if (firstLine.startsWith('data_') || firstLine.startsWith('loop_')) {
    return 'cif';
  }

  // PDB files typically start with HEADER, TITLE, or ATOM
  return 'pdb';
}

/**
 * Parse PDB format
 */
async function parsePDBFormat(
  content: string,
  options: ParseOptions = {}
): Promise<ParsedStructure> {
  const {
    includeHydrogens = true,
    includeWater = false,
    includeHeteroAtoms = true,
    model = 1,
    chains,
    onProgress
  } = options;

  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const metadata: Metadata = { id: 'UNKNOWN' };
  const chainSequences = new Map<string, string>();

  const lines = content.split('\n');
  let currentModel = 0;
  let inModel = false;

  onProgress?.(20, 'Parsing atoms...');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const recordType = line.substring(0, 6).trim();

    // Report progress every 1000 lines
    if (i % 1000 === 0) {
      const progress = 20 + (i / lines.length) * 60;
      onProgress?.(progress, `Processing line ${i}/${lines.length}...`);
    }

    switch (recordType) {
      case 'HEADER':
        metadata.id = line.substring(62, 66).trim();
        metadata.releaseDate = line.substring(50, 59).trim();
        break;

      case 'TITLE':
        metadata.title = (metadata.title || '') + ' ' + line.substring(10).trim();
        break;

      case 'AUTHOR':
        if (!metadata.authors) metadata.authors = [];
        metadata.authors.push(...line.substring(10).split(',').map(s => s.trim()));
        break;

      case 'EXPDTA':
        metadata.method = line.substring(10).trim();
        break;

      case 'REMARK':
        // Parse resolution from REMARK 2
        if (line.startsWith('REMARK   2 RESOLUTION.')) {
          const match = line.match(/(\d+\.\d+)\s+ANGSTROMS/);
          if (match) {
            metadata.resolution = parseFloat(match[1]);
          }
        }
        break;

      case 'SEQRES':
        const chainId = line.substring(11, 12).trim();
        const sequence = line.substring(19).trim().split(/\s+/).join('');
        chainSequences.set(
          chainId,
          (chainSequences.get(chainId) || '') + sequence
        );
        break;

      case 'MODEL':
        currentModel = parseInt(line.substring(10, 14).trim());
        inModel = true;
        if (currentModel > model) {
          // Stop parsing if we've passed the requested model
          i = lines.length;
        }
        break;

      case 'ENDMDL':
        inModel = false;
        break;

      case 'ATOM':
      case 'HETATM':
        // Skip if not in the right model
        if (currentModel > 0 && currentModel !== model) continue;
        if (currentModel === 0 && model !== 1) continue;

        const isHetero = recordType === 'HETATM';

        // Skip based on options
        if (isHetero && !includeHeteroAtoms) continue;

        const atom = parseAtomLine(line);

        // Filter chains
        if (chains && !chains.includes(atom.chainID)) continue;

        // Filter hydrogens
        if (!includeHydrogens && atom.element === 'H') continue;

        // Filter water
        if (!includeWater && atom.resName === 'HOH') continue;

        atoms.push(atom);
        break;

      case 'CONECT':
        // Parse connectivity
        const serial = parseInt(line.substring(6, 11).trim());
        for (let j = 0; j < 4; j++) {
          const start = 11 + j * 5;
          const bonded = line.substring(start, start + 5).trim();
          if (bonded) {
            const bondedSerial = parseInt(bonded);
            // Only add each bond once (atom1 < atom2)
            if (serial < bondedSerial) {
              bonds.push({
                atom1: serial,
                atom2: bondedSerial,
                order: 1
              });
            }
          }
        }
        break;
    }
  }

  metadata.sequence = chainSequences;

  onProgress?.(80, 'Calculating statistics...');

  const statistics = calculateStatistics(atoms);

  onProgress?.(90, 'Inferring bonds...');

  // If no CONECT records, infer bonds from distance
  if (bonds.length === 0 && atoms.length > 0) {
    inferBonds(atoms, bonds);
  }

  return {
    atoms,
    bonds,
    metadata,
    statistics,
    format: 'pdb',
    parseTime: 0
  };
}

/**
 * Parse single ATOM/HETATM line
 */
function parseAtomLine(line: string): Atom {
  return {
    serial: parseInt(line.substring(6, 11).trim()),
    name: line.substring(12, 16).trim(),
    altLoc: line.substring(16, 17).trim() || undefined,
    resName: line.substring(17, 20).trim(),
    chainID: line.substring(21, 22).trim(),
    resSeq: parseInt(line.substring(22, 26).trim()),
    iCode: line.substring(26, 27).trim() || undefined,
    x: parseFloat(line.substring(30, 38).trim()),
    y: parseFloat(line.substring(38, 46).trim()),
    z: parseFloat(line.substring(46, 54).trim()),
    occupancy: parseFloat(line.substring(54, 60).trim() || '1.0'),
    tempFactor: parseFloat(line.substring(60, 66).trim() || '0.0'),
    element: line.substring(76, 78).trim() || line.substring(12, 14).trim().replace(/[0-9]/g, ''),
    charge: line.substring(78, 80).trim() || undefined
  };
}

/**
 * Parse mmCIF format
 */
async function parseMMCIF(
  content: string,
  options: ParseOptions = {}
): Promise<ParsedStructure> {
  const { onProgress } = options;

  onProgress?.(20, 'Parsing mmCIF data blocks...');

  // Simplified mmCIF parser - production would use a proper CIF parser library
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const metadata: Metadata = { id: 'UNKNOWN' };

  const lines = content.split('\n');
  let inAtomSite = false;
  let columnMap: Map<string, number> = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (i % 1000 === 0) {
      const progress = 20 + (i / lines.length) * 70;
      onProgress?.(progress, `Processing line ${i}/${lines.length}...`);
    }

    // Extract metadata
    if (line.startsWith('data_')) {
      metadata.id = line.substring(5).trim();
    } else if (line.startsWith('_struct.title')) {
      metadata.title = lines[i + 1]?.trim().replace(/^['"]|['"]$/g, '');
    } else if (line.startsWith('_refine.ls_d_res_high')) {
      metadata.resolution = parseFloat(lines[i + 1]?.trim() || '0');
    }

    // Parse atom_site loop
    if (line.startsWith('loop_')) {
      inAtomSite = false;
      columnMap.clear();
    } else if (line.startsWith('_atom_site.')) {
      inAtomSite = true;
      const columnName = line.split('.')[1].split(/\s/)[0];
      columnMap.set(columnName, columnMap.size);
    } else if (inAtomSite && !line.startsWith('_') && !line.startsWith('#')) {
      if (line.length === 0) {
        inAtomSite = false;
        continue;
      }

      const values = line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

      const atom: Atom = {
        serial: parseInt(values[columnMap.get('id') || 0] || '0'),
        name: (values[columnMap.get('label_atom_id') || 0] || '').replace(/['"]/g, ''),
        resName: (values[columnMap.get('label_comp_id') || 0] || '').replace(/['"]/g, ''),
        chainID: (values[columnMap.get('label_asym_id') || 0] || '').replace(/['"]/g, ''),
        resSeq: parseInt(values[columnMap.get('label_seq_id') || 0] || '0'),
        x: parseFloat(values[columnMap.get('Cartn_x') || 0] || '0'),
        y: parseFloat(values[columnMap.get('Cartn_y') || 0] || '0'),
        z: parseFloat(values[columnMap.get('Cartn_z') || 0] || '0'),
        occupancy: parseFloat(values[columnMap.get('occupancy') || 0] || '1.0'),
        tempFactor: parseFloat(values[columnMap.get('B_iso_or_equiv') || 0] || '0'),
        element: (values[columnMap.get('type_symbol') || 0] || '').replace(/['"]/g, '')
      };

      atoms.push(atom);
    }
  }

  onProgress?.(90, 'Calculating statistics...');

  const statistics = calculateStatistics(atoms);

  return {
    atoms,
    bonds,
    metadata,
    statistics,
    format: 'cif',
    parseTime: 0
  };
}

/**
 * Calculate structure statistics
 */
function calculateStatistics(atoms: Atom[]): Statistics {
  if (atoms.length === 0) {
    return {
      atomCount: 0,
      residueCount: 0,
      chainCount: 0,
      modelCount: 1,
      heteroAtomCount: 0,
      waterCount: 0,
      bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
        center: { x: 0, y: 0, z: 0 }
      }
    };
  }

  // Calculate bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const chains = new Set<string>();
  const residues = new Set<string>();
  let waterCount = 0;

  for (const atom of atoms) {
    minX = Math.min(minX, atom.x);
    minY = Math.min(minY, atom.y);
    minZ = Math.min(minZ, atom.z);
    maxX = Math.max(maxX, atom.x);
    maxY = Math.max(maxY, atom.y);
    maxZ = Math.max(maxZ, atom.z);

    chains.add(atom.chainID);
    residues.add(`${atom.chainID}:${atom.resSeq}`);

    if (atom.resName === 'HOH') waterCount++;
  }

  return {
    atomCount: atoms.length,
    residueCount: residues.size,
    chainCount: chains.size,
    modelCount: 1,
    heteroAtomCount: 0, // Would need to track from parsing
    waterCount,
    bounds: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2
      }
    }
  };
}

/**
 * Infer bonds from atomic distances
 */
function inferBonds(atoms: Atom[], bonds: Bond[]): void {
  // Only infer for small molecules to avoid performance issues
  if (atoms.length > 5000) return;

  const MAX_BOND_DISTANCE = 2.0; // Angstroms

  for (let i = 0; i < atoms.length; i++) {
    const atom1 = atoms[i];

    // Only check nearby atoms
    for (let j = i + 1; j < atoms.length; j++) {
      const atom2 = atoms[j];

      // Skip if different residues (unless hetero atoms)
      if (atom1.resSeq !== atom2.resSeq &&
          !['HOH', 'GOL', 'EDO'].includes(atom1.resName)) {
        continue;
      }

      const dx = atom1.x - atom2.x;
      const dy = atom1.y - atom2.y;
      const dz = atom1.z - atom2.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance <= MAX_BOND_DISTANCE) {
        bonds.push({
          atom1: atom1.serial,
          atom2: atom2.serial,
          order: 1
        });
      }
    }
  }
}

/**
 * Validate parsed structure
 */
export function validateStructure(structure: ParsedStructure): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for atoms
  if (structure.atoms.length === 0) {
    errors.push('No atoms found in structure');
  }

  // Check for invalid coordinates
  const invalidCoords = structure.atoms.filter(
    atom => !isFinite(atom.x) || !isFinite(atom.y) || !isFinite(atom.z)
  );
  if (invalidCoords.length > 0) {
    errors.push(`${invalidCoords.length} atoms have invalid coordinates`);
  }

  // Check for duplicate serial numbers
  const serials = new Set<number>();
  const duplicates = structure.atoms.filter(atom => {
    if (serials.has(atom.serial)) return true;
    serials.add(atom.serial);
    return false;
  });
  if (duplicates.length > 0) {
    warnings.push(`${duplicates.length} duplicate atom serial numbers`);
  }

  // Check for missing elements
  const missingElements = structure.atoms.filter(atom => !atom.element);
  if (missingElements.length > 0) {
    warnings.push(`${missingElements.length} atoms missing element symbols`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
