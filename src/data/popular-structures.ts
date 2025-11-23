/**
 * Curated list of educational PDB structures
 * Organized by category for easy browsing
 */

export interface PopularStructure {
  id: string;
  pdbId?: string; // Actual PDB code for fetching from RCSB (if different from id)
  name: string;
  description: string;
  category: string;
  tags: string[];
  educationalValue: string;
  resolution?: number;
  method: string;
}

export const POPULAR_STRUCTURES: PopularStructure[] = [
  // Classic Proteins
  {
    id: '1MBN',
    name: 'Myoglobin',
    description: 'First protein structure ever solved (1958)',
    category: 'classic',
    tags: ['protein', 'oxygen-binding', 'alpha-helix', 'historic'],
    educationalValue: 'Demonstrates alpha-helical structure and heme binding',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '2HHB',
    name: 'Hemoglobin',
    description: 'Oxygen transport protein with quaternary structure',
    category: 'classic',
    tags: ['protein', 'quaternary', 'cooperativity', 'allosteric'],
    educationalValue: 'Shows cooperative binding and quaternary structure',
    resolution: 1.74,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '4HHB',
    name: 'Deoxyhemoglobin',
    description: 'Hemoglobin without oxygen bound',
    category: 'classic',
    tags: ['protein', 'conformational-change'],
    educationalValue: 'Compare with 2HHB to see conformational changes',
    resolution: 1.74,
    method: 'X-RAY DIFFRACTION'
  },

  // Enzymes
  {
    id: '1HEW',
    name: 'Lysozyme',
    description: 'Enzyme that breaks down bacterial cell walls',
    category: 'enzyme',
    tags: ['enzyme', 'catalysis', 'substrate-binding'],
    educationalValue: 'Classic example of enzyme-substrate interaction',
    resolution: 1.6,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '1TIM',
    name: 'Triose Phosphate Isomerase',
    description: 'Near-perfect enzyme in glycolysis',
    category: 'enzyme',
    tags: ['enzyme', 'barrel', 'catalytic-perfection'],
    educationalValue: 'Shows TIM barrel fold and catalytic efficiency',
    resolution: 1.9,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '3CPA',
    name: 'Carboxypeptidase A',
    description: 'Zinc metalloprotease',
    category: 'enzyme',
    tags: ['protease', 'metal-binding', 'catalysis'],
    educationalValue: 'Example of metal-dependent catalysis',
    resolution: 1.54,
    method: 'X-RAY DIFFRACTION'
  },

  // DNA and RNA
  {
    id: '1BNA',
    name: 'DNA Double Helix',
    description: 'Classic B-form DNA structure',
    category: 'nucleic-acid',
    tags: ['DNA', 'double-helix', 'base-pairing'],
    educationalValue: 'Demonstrates Watson-Crick base pairing',
    resolution: 1.9,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '1D66',
    name: 'Z-DNA',
    description: 'Left-handed DNA helix',
    category: 'nucleic-acid',
    tags: ['DNA', 'Z-form', 'alternate-conformation'],
    educationalValue: 'Shows alternative DNA structure',
    resolution: 1.3,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '1MSY',
    name: 'tRNA',
    description: 'Transfer RNA with L-shaped structure',
    category: 'nucleic-acid',
    tags: ['RNA', 'translation', 'cloverleaf'],
    educationalValue: 'Shows RNA tertiary structure',
    resolution: 2.9,
    method: 'X-RAY DIFFRACTION'
  },

  // Protein-DNA Complexes
  {
    id: '1LMB',
    name: 'Lambda Repressor',
    description: 'DNA-binding protein',
    category: 'complex',
    tags: ['DNA-binding', 'helix-turn-helix', 'gene-regulation'],
    educationalValue: 'Shows protein-DNA recognition',
    resolution: 2.8,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '1TBP',
    name: 'TATA-Box Binding Protein',
    description: 'Transcription factor bound to DNA',
    category: 'complex',
    tags: ['transcription', 'DNA-bending', 'eukaryotic'],
    educationalValue: 'Demonstrates DNA bending by proteins',
    resolution: 1.9,
    method: 'X-RAY DIFFRACTION'
  },

  // Membrane Proteins
  {
    id: '1OCC',
    name: 'Porin',
    description: 'Beta-barrel membrane protein',
    category: 'membrane',
    tags: ['membrane', 'beta-barrel', 'channel'],
    educationalValue: 'Shows membrane protein architecture',
    resolution: 2.4,
    method: 'X-RAY DIFFRACTION'
  },
  {
    id: '1BL8',
    name: 'Bacteriorhodopsin',
    description: 'Light-driven proton pump',
    category: 'membrane',
    tags: ['membrane', 'photosynthesis', '7-helix'],
    educationalValue: 'Example of transmembrane helices',
    resolution: 2.5,
    method: 'X-RAY DIFFRACTION'
  },

  // Antibodies and Immunoglobulins
  {
    id: '1IGT',
    name: 'Immunoglobulin G',
    description: 'Antibody structure',
    category: 'immune',
    tags: ['antibody', 'immunoglobulin', 'Y-shaped'],
    educationalValue: 'Shows antibody architecture',
    resolution: 2.8,
    method: 'X-RAY DIFFRACTION'
  },

  // Viruses
  {
    id: '1TIM',
    name: 'Tobacco Mosaic Virus',
    description: 'Rod-shaped plant virus',
    category: 'virus',
    tags: ['virus', 'capsid', 'helical'],
    educationalValue: 'Demonstrates viral symmetry',
    method: 'ELECTRON MICROSCOPY'
  },

  // Motor Proteins
  {
    id: '1BG2',
    name: 'Myosin',
    description: 'Molecular motor protein',
    category: 'motor',
    tags: ['motor', 'muscle', 'ATP-binding'],
    educationalValue: 'Shows motor protein mechanism',
    resolution: 1.8,
    method: 'X-RAY DIFFRACTION'
  },

  // Channels and Transporters
  {
    id: '1BL8',
    name: 'Potassium Channel',
    description: 'Ion-selective membrane channel',
    category: 'channel',
    tags: ['ion-channel', 'selectivity', 'membrane'],
    educationalValue: 'Demonstrates ion selectivity',
    resolution: 2.0,
    method: 'X-RAY DIFFRACTION'
  },

  // Small Molecules
  {
    id: '2OLX',
    name: 'Aspirin Bound to COX-1',
    description: 'Drug-protein complex',
    category: 'drug',
    tags: ['drug-binding', 'inhibitor', 'pharmaceutical'],
    educationalValue: 'Shows drug mechanism of action',
    resolution: 2.7,
    method: 'X-RAY DIFFRACTION'
  },

  // Ribosomes
  {
    id: '4V9D',
    name: 'Bacterial Ribosome',
    description: 'Protein synthesis machinery',
    category: 'ribosome',
    tags: ['ribosome', 'translation', 'RNA'],
    educationalValue: 'Shows complex RNA-protein assembly',
    resolution: 2.9,
    method: 'X-RAY DIFFRACTION'
  }
];

// Category definitions
export const CATEGORIES = [
  { id: 'classic', name: 'Classic Structures', icon: '🏛️' },
  { id: 'enzyme', name: 'Enzymes', icon: '⚡' },
  { id: 'nucleic-acid', name: 'DNA & RNA', icon: '🧬' },
  { id: 'complex', name: 'Protein-DNA Complexes', icon: '🔗' },
  { id: 'membrane', name: 'Membrane Proteins', icon: '🧱' },
  { id: 'immune', name: 'Antibodies', icon: '🛡️' },
  { id: 'virus', name: 'Viruses', icon: '🦠' },
  { id: 'motor', name: 'Motor Proteins', icon: '🏃' },
  { id: 'channel', name: 'Channels & Transporters', icon: '🚪' },
  { id: 'drug', name: 'Drug Targets', icon: '💊' },
  { id: 'ribosome', name: 'Ribosomes', icon: '🏭' }
];

// Get structures by category
export function getStructuresByCategory(category: string): PopularStructure[] {
  return POPULAR_STRUCTURES.filter(s => s.category === category);
}

// Get random structures for suggestions
export function getRandomStructures(count: number = 3): PopularStructure[] {
  const shuffled = [...POPULAR_STRUCTURES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get structure by ID
export function getStructureById(id: string): PopularStructure | undefined {
  return POPULAR_STRUCTURES.find(s => s.id === id);
}

// Search structures
export function searchStructures(query: string): PopularStructure[] {
  const lowerQuery = query.toLowerCase();
  return POPULAR_STRUCTURES.filter(
    s =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

// Get all structure IDs for prefetching
export function getAllStructureIds(): string[] {
  return POPULAR_STRUCTURES.map(s => s.id);
}
