/**
 * Molecular Structure Type Definitions
 * Types for atoms, molecules, and protein structures
 */

/**
 * Basic atom representation
 */
export interface Atom {
  id?: number;
  name: string;
  element: string;
  x: number;
  y: number;
  z: number;
  residue?: string;
  residueId?: number;
  chain?: string;
  atomName?: string;
  bFactor?: number;
  occupancy?: number;
  isLigand?: boolean;
  isBackbone?: boolean;
}

/**
 * Generic structure representation
 * Used for molecular visualization and analysis
 */
export interface MolecularStructure {
  atoms?: Atom[];
  bonds?: Bond[];
  chains?: Chain[];
  residues?: Residue[];
  metadata?: StructureMetadataExtended;
  [key: string]: unknown;
}

/**
 * Bond between two atoms
 */
export interface Bond {
  atom1: number;
  atom2: number;
  order: 1 | 2 | 3 | 4; // single, double, triple, aromatic
}

/**
 * Protein chain
 */
export interface Chain {
  id: string;
  name?: string;
  atomIndices: number[];
  residueIndices: number[];
}

/**
 * Amino acid residue
 */
export interface Residue {
  id: number;
  name: string;
  chainId: string;
  atomIndices: number[];
  secondaryStructure?: 'helix' | 'sheet' | 'coil';
}

/**
 * Extended structure metadata
 */
export interface StructureMetadataExtended {
  id?: string;
  title?: string;
  pdbId?: string;
  resolution?: number;
  chains?: string[];
  atomCount: number;
  residueCount: number;
  experimentMethod?: string;
  depositionDate?: string;
  authors?: string[];
  organisms?: string[];
}

/**
 * Renderer interface for molecular visualization
 * Abstract interface for different rendering engines
 */
export interface MolecularRenderer {
  render: (atoms: Atom[], config: RenderConfig) => void | Promise<void>;
  clear: () => void;
  updateCamera?: (position: [number, number, number]) => void;
  getPerformanceMetrics?: () => PerformanceMetrics;
  [key: string]: unknown;
}

/**
 * Rendering configuration
 */
export interface RenderConfig {
  representation?: 'cartoon' | 'ball-and-stick' | 'spacefill' | 'surface';
  colorScheme?: 'element' | 'chain' | 'secondary-structure';
  quality?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
}

/**
 * Performance metrics for rendering
 */
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  vertexCount?: number;
  triangleCount?: number;
}
