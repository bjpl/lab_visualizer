/**
 * Mock Molecular Structure Data Fixtures
 * Sample PDB structures for demo mode with realistic metadata
 */

import type {
  Structure,
  StructureMetadata,
  StructureComplexity,
  Atom,
  SearchResult,
} from '../../types/pdb';

/**
 * Extended mock structure with additional demo properties
 */
export interface MockStructure extends Structure {
  thumbnailUrl?: string;
  category: string;
  educationalValue: string;
  tags: string[];
  isFeatured: boolean;
}

/**
 * Hemoglobin (1HHO) - Oxygen transport protein
 * Classic example of quaternary structure and cooperativity
 */
export const HEMOGLOBIN_1HHO: MockStructure = {
  pdbId: '1HHO',
  content: generateMinimalPDBContent('1HHO', 4460),
  format: 'pdb',
  atoms: generateMockAtoms(4460, ['A', 'B', 'C', 'D']),
  metadata: {
    title: 'HUMAN DEOXYHEMOGLOBIN',
    resolution: 1.74,
    chains: ['A', 'B', 'C', 'D'],
    atomCount: 4460,
    residueCount: 574,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1984-03-07',
    authors: ['Fermi, G.', 'Perutz, M.F.'],
    keywords: ['oxygen transport', 'hemoglobin', 'quaternary structure', 'cooperativity'],
  },
  complexity: {
    atomCount: 4460,
    bondCount: 4523,
    residueCount: 574,
    chainCount: 4,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 178400,
  },
  thumbnailUrl: '/thumbnails/1hho.png',
  category: 'classic',
  educationalValue: 'Demonstrates quaternary structure, cooperative oxygen binding, and the T-R state transition in hemoglobin.',
  tags: ['protein', 'oxygen-binding', 'quaternary', 'cooperativity', 'allosteric'],
  isFeatured: true,
};

/**
 * Insulin (1ZNI) - Hormone structure
 * Example of disulfide bonds and hormone structure
 */
export const INSULIN_1ZNI: MockStructure = {
  pdbId: '1ZNI',
  content: generateMinimalPDBContent('1ZNI', 787),
  format: 'pdb',
  atoms: generateMockAtoms(787, ['A', 'B', 'C', 'D']),
  metadata: {
    title: 'INSULIN (BOVINE) COMPLEXED WITH ZINC',
    resolution: 1.50,
    chains: ['A', 'B', 'C', 'D'],
    atomCount: 787,
    residueCount: 102,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1989-04-17',
    authors: ['Baker, E.N.', 'Blundell, T.L.', 'Cutfield, J.F.'],
    keywords: ['hormone', 'insulin', 'zinc binding', 'disulfide bonds'],
  },
  complexity: {
    atomCount: 787,
    bondCount: 812,
    residueCount: 102,
    chainCount: 4,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 31480,
  },
  thumbnailUrl: '/thumbnails/1zni.png',
  category: 'classic',
  educationalValue: 'Shows hormone structure, disulfide bond formation, and zinc coordination in insulin.',
  tags: ['hormone', 'disulfide-bonds', 'zinc-binding', 'diabetes', 'therapeutic'],
  isFeatured: true,
};

/**
 * Green Fluorescent Protein (1EMA) - Fluorescent marker
 * Beta-barrel structure with chromophore
 */
export const GFP_1EMA: MockStructure = {
  pdbId: '1EMA',
  content: generateMinimalPDBContent('1EMA', 1854),
  format: 'pdb',
  atoms: generateMockAtoms(1854, ['A']),
  metadata: {
    title: 'GREEN FLUORESCENT PROTEIN FROM AEQUOREA VICTORIA',
    resolution: 1.90,
    chains: ['A'],
    atomCount: 1854,
    residueCount: 238,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1996-08-28',
    authors: ['Ormo, M.', 'Cubitt, A.B.', 'Kallio, K.', 'Gross, L.A.', 'Tsien, R.Y.', 'Remington, S.J.'],
    keywords: ['fluorescent protein', 'beta-barrel', 'chromophore', 'jellyfish'],
  },
  complexity: {
    atomCount: 1854,
    bondCount: 1902,
    residueCount: 238,
    chainCount: 1,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 74160,
  },
  thumbnailUrl: '/thumbnails/1ema.png',
  category: 'classic',
  educationalValue: 'Nobel Prize winning structure - demonstrates beta-barrel fold and chromophore chemistry.',
  tags: ['fluorescent', 'beta-barrel', 'chromophore', 'Nobel Prize', 'imaging'],
  isFeatured: true,
};

/**
 * Lysozyme (1LYZ) - Antibacterial enzyme
 * Classic enzyme structure with catalytic mechanism
 */
export const LYSOZYME_1LYZ: MockStructure = {
  pdbId: '1LYZ',
  content: generateMinimalPDBContent('1LYZ', 1001),
  format: 'pdb',
  atoms: generateMockAtoms(1001, ['A']),
  metadata: {
    title: 'CHICKEN EGG WHITE LYSOZYME',
    resolution: 1.50,
    chains: ['A'],
    atomCount: 1001,
    residueCount: 129,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1965-11-15',
    authors: ['Blake, C.C.F.', 'Johnson, L.N.', 'Mair, G.A.', 'North, A.C.T.', 'Phillips, D.C.', 'Sarma, V.R.'],
    keywords: ['enzyme', 'lysozyme', 'antibacterial', 'catalysis'],
  },
  complexity: {
    atomCount: 1001,
    bondCount: 1027,
    residueCount: 129,
    chainCount: 1,
    hasLigands: false,
    hasSurfaces: false,
    estimatedVertices: 40040,
  },
  thumbnailUrl: '/thumbnails/1lyz.png',
  category: 'enzyme',
  educationalValue: 'First enzyme structure solved - demonstrates enzyme-substrate interactions and catalytic mechanism.',
  tags: ['enzyme', 'lysozyme', 'catalysis', 'antibacterial', 'historic'],
  isFeatured: true,
};

/**
 * Myoglobin (1MBO) - First protein structure
 * Historic first protein structure solved
 */
export const MYOGLOBIN_1MBO: MockStructure = {
  pdbId: '1MBO',
  content: generateMinimalPDBContent('1MBO', 1260),
  format: 'pdb',
  atoms: generateMockAtoms(1260, ['A']),
  metadata: {
    title: 'SPERM WHALE MYOGLOBIN',
    resolution: 2.00,
    chains: ['A'],
    atomCount: 1260,
    residueCount: 153,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1958-02-15',
    authors: ['Kendrew, J.C.', 'Bodo, G.', 'Dintzis, H.M.', 'Parrish, R.G.', 'Wyckoff, H.', 'Phillips, D.C.'],
    keywords: ['oxygen storage', 'myoglobin', 'heme', 'alpha-helix', 'historic'],
  },
  complexity: {
    atomCount: 1260,
    bondCount: 1295,
    residueCount: 153,
    chainCount: 1,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 50400,
  },
  thumbnailUrl: '/thumbnails/1mbo.png',
  category: 'classic',
  educationalValue: 'First protein structure ever solved (Nobel Prize 1962) - demonstrates alpha-helical structure and heme binding.',
  tags: ['protein', 'oxygen-binding', 'alpha-helix', 'historic', 'Nobel Prize', 'heme'],
  isFeatured: true,
};

/**
 * DNA B-form Double Helix (1BNA) - Classic DNA structure
 */
export const DNA_1BNA: MockStructure = {
  pdbId: '1BNA',
  content: generateMinimalPDBContent('1BNA', 486),
  format: 'pdb',
  atoms: generateMockAtoms(486, ['A', 'B']),
  metadata: {
    title: 'STRUCTURE OF A B-DNA DODECAMER',
    resolution: 1.90,
    chains: ['A', 'B'],
    atomCount: 486,
    residueCount: 24,
    experimentMethod: 'X-RAY DIFFRACTION',
    depositionDate: '1981-12-28',
    authors: ['Drew, H.R.', 'Wing, R.M.', 'Takano, T.', 'Broka, C.', 'Tanaka, S.', 'Itakura, K.', 'Dickerson, R.E.'],
    keywords: ['DNA', 'double helix', 'B-form', 'base pairing'],
  },
  complexity: {
    atomCount: 486,
    bondCount: 504,
    residueCount: 24,
    chainCount: 2,
    hasLigands: false,
    hasSurfaces: false,
    estimatedVertices: 19440,
  },
  thumbnailUrl: '/thumbnails/1bna.png',
  category: 'nucleic-acid',
  educationalValue: 'Classic B-form DNA structure demonstrating Watson-Crick base pairing and helical geometry.',
  tags: ['DNA', 'double-helix', 'base-pairing', 'B-form', 'genetics'],
  isFeatured: false,
};

/**
 * ATP Synthase (5ARA) - Molecular motor
 */
export const ATP_SYNTHASE_5ARA: MockStructure = {
  pdbId: '5ARA',
  content: generateMinimalPDBContent('5ARA', 12543),
  format: 'pdb',
  atoms: generateMockAtoms(12543, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']),
  metadata: {
    title: 'BOVINE MITOCHONDRIAL ATP SYNTHASE',
    resolution: 2.80,
    chains: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    atomCount: 12543,
    residueCount: 1567,
    experimentMethod: 'ELECTRON MICROSCOPY',
    depositionDate: '2016-01-15',
    authors: ['Zhou, A.', 'Rohou, A.', 'Schep, D.G.', 'Bason, J.V.', 'Montgomery, M.G.', 'Walker, J.E.', 'Grigorieff, N.', 'Rubinstein, J.L.'],
    keywords: ['ATP synthase', 'molecular motor', 'membrane protein', 'bioenergetics'],
  },
  complexity: {
    atomCount: 12543,
    bondCount: 12876,
    residueCount: 1567,
    chainCount: 9,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 501720,
  },
  thumbnailUrl: '/thumbnails/5ara.png',
  category: 'motor',
  educationalValue: 'Demonstrates rotary motor mechanism of ATP synthesis in mitochondria.',
  tags: ['motor', 'ATP synthase', 'membrane', 'bioenergetics', 'mitochondria'],
  isFeatured: false,
};

/**
 * SARS-CoV-2 Spike Protein (6VXX) - COVID-19 virus
 */
export const SPIKE_6VXX: MockStructure = {
  pdbId: '6VXX',
  content: generateMinimalPDBContent('6VXX', 21567),
  format: 'pdb',
  atoms: generateMockAtoms(21567, ['A', 'B', 'C']),
  metadata: {
    title: 'SARS-COV-2 SPIKE GLYCOPROTEIN',
    resolution: 2.80,
    chains: ['A', 'B', 'C'],
    atomCount: 21567,
    residueCount: 2905,
    experimentMethod: 'ELECTRON MICROSCOPY',
    depositionDate: '2020-02-26',
    authors: ['Walls, A.C.', 'Park, Y.J.', 'Tortorici, M.A.', 'Wall, A.', 'McGuire, A.T.', 'Veesler, D.'],
    keywords: ['coronavirus', 'spike protein', 'viral entry', 'COVID-19', 'vaccine target'],
  },
  complexity: {
    atomCount: 21567,
    bondCount: 22134,
    residueCount: 2905,
    chainCount: 3,
    hasLigands: true,
    hasSurfaces: false,
    estimatedVertices: 862680,
  },
  thumbnailUrl: '/thumbnails/6vxx.png',
  category: 'virus',
  educationalValue: 'COVID-19 spike protein structure - key target for vaccines and therapeutics.',
  tags: ['virus', 'coronavirus', 'COVID-19', 'vaccine', 'pandemic', 'spike'],
  isFeatured: true,
};

/**
 * All mock structures for iteration
 */
export const MOCK_STRUCTURES: MockStructure[] = [
  HEMOGLOBIN_1HHO,
  INSULIN_1ZNI,
  GFP_1EMA,
  LYSOZYME_1LYZ,
  MYOGLOBIN_1MBO,
  DNA_1BNA,
  ATP_SYNTHASE_5ARA,
  SPIKE_6VXX,
];

/**
 * Get featured structures for homepage
 */
export function getFeaturedStructures(): MockStructure[] {
  return MOCK_STRUCTURES.filter((s) => s.isFeatured);
}

/**
 * Get structures by category
 */
export function getStructuresByCategory(category: string): MockStructure[] {
  return MOCK_STRUCTURES.filter((s) => s.category === category);
}

/**
 * Get structure by PDB ID
 */
export function getMockStructureById(pdbId: string): MockStructure | null {
  return MOCK_STRUCTURES.find((s) => s.pdbId.toLowerCase() === pdbId.toLowerCase()) || null;
}

/**
 * Search mock structures
 */
export function searchMockStructures(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_STRUCTURES
    .filter(
      (s) =>
        s.pdbId.toLowerCase().includes(lowerQuery) ||
        s.metadata.title?.toLowerCase().includes(lowerQuery) ||
        s.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
        s.metadata.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
    )
    .map((s) => ({
      pdbId: s.pdbId,
      title: s.metadata.title || s.pdbId,
      resolution: s.metadata.resolution,
      experimentMethod: s.metadata.experimentMethod,
      depositionDate: s.metadata.depositionDate,
      chains: s.metadata.chains,
      relevanceScore: calculateRelevanceScore(s, lowerQuery),
    }));
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(structure: MockStructure, query: string): number {
  let score = 0;

  // Exact PDB ID match
  if (structure.pdbId.toLowerCase() === query) score += 100;

  // Partial PDB ID match
  if (structure.pdbId.toLowerCase().includes(query)) score += 50;

  // Title match
  if (structure.metadata.title?.toLowerCase().includes(query)) score += 30;

  // Tag match
  if (structure.tags.some((t) => t.toLowerCase().includes(query))) score += 20;

  // Keyword match
  if (structure.metadata.keywords?.some((k) => k.toLowerCase().includes(query))) score += 10;

  // Featured bonus
  if (structure.isFeatured) score += 5;

  return score;
}

/**
 * Generate minimal PDB content for mock structures
 */
function generateMinimalPDBContent(pdbId: string, atomCount: number): string {
  const header = [
    `HEADER    MOCK STRUCTURE                          ${new Date().toISOString().split('T')[0].replace(/-/g, '')}   ${pdbId}`,
    `TITLE     MOCK ${pdbId} STRUCTURE FOR DEMO MODE`,
    `REMARK   1 THIS IS MOCK DATA FOR DEMONSTRATION PURPOSES`,
    `REMARK   2 RESOLUTION.    2.00 ANGSTROMS.`,
  ].join('\n');

  return header;
}

/**
 * Generate mock atoms array
 */
function generateMockAtoms(count: number, chains: string[]): Atom[] {
  const atoms: Atom[] = [];
  const elements = ['C', 'N', 'O', 'S', 'H'];
  const residues = ['ALA', 'GLY', 'VAL', 'LEU', 'ILE', 'PRO', 'PHE', 'TYR', 'TRP', 'SER', 'THR', 'CYS', 'MET', 'ASN', 'GLN', 'ASP', 'GLU', 'LYS', 'ARG', 'HIS'];

  for (let i = 0; i < count; i++) {
    const chainIndex = Math.floor(i / (count / chains.length));
    const chain = chains[Math.min(chainIndex, chains.length - 1)];

    atoms.push({
      serial: i + 1,
      name: `${elements[i % 5]}${(i % 3) + 1}`,
      element: elements[i % 5],
      residue: residues[i % 20],
      residueSeq: Math.floor(i / 10) + 1,
      chain,
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100,
      occupancy: 1.0,
      tempFactor: 20 + Math.random() * 30,
      isLigand: i % 100 === 0,
    });
  }

  return atoms;
}

/**
 * Structure categories for browsing
 */
export const STRUCTURE_CATEGORIES = [
  { id: 'classic', name: 'Classic Structures', description: 'Historic and fundamental protein structures' },
  { id: 'enzyme', name: 'Enzymes', description: 'Catalytic proteins and mechanisms' },
  { id: 'nucleic-acid', name: 'DNA & RNA', description: 'Nucleic acid structures' },
  { id: 'membrane', name: 'Membrane Proteins', description: 'Proteins embedded in membranes' },
  { id: 'motor', name: 'Molecular Motors', description: 'Motor proteins and machines' },
  { id: 'virus', name: 'Viral Proteins', description: 'Structures from viruses' },
  { id: 'drug', name: 'Drug Targets', description: 'Pharmaceutical targets' },
];
