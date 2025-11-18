/**
 * Mock PDB Data Fixtures
 * Provides realistic test data for integration tests
 */

export const SMALL_PROTEIN_PDB = `HEADER    SMALL TEST PROTEIN                      01-JAN-20   TEST
TITLE     SMALL TEST PROTEIN FOR UNIT TESTING
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: TEST PROTEIN;
COMPND   3 CHAIN: A;
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: TEST ORGANISM;
KEYWDS    TEST, BENCHMARK
EXPDTA    X-RAY DIFFRACTION
AUTHOR    TEST AUTHOR
REMARK   2 RESOLUTION.    2.50 ANGSTROMS.
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00 20.00           N
ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00 20.00           C
ATOM      3  C   ALA A   1       2.009   1.420   0.000  1.00 20.00           C
ATOM      4  O   ALA A   1       1.251   2.389   0.000  1.00 20.00           O
ATOM      5  CB  ALA A   1       1.993  -0.750   1.224  1.00 20.00           C
ATOM      6  N   GLY A   2       3.331   1.549   0.000  1.00 20.00           N
ATOM      7  CA  GLY A   2       3.997   2.844   0.000  1.00 20.00           C
ATOM      8  C   GLY A   2       5.509   2.700   0.000  1.00 20.00           C
ATOM      9  O   GLY A   2       6.079   1.609   0.000  1.00 20.00           O
ATOM     10  N   VAL A   3       6.184   3.848   0.000  1.00 20.00           N
ATOM     11  CA  VAL A   3       7.633   3.885   0.000  1.00 20.00           C
ATOM     12  C   VAL A   3       8.184   5.305   0.000  1.00 20.00           C
ATOM     13  O   VAL A   3       7.426   6.274   0.000  1.00 20.00           O
ATOM     14  CB  VAL A   3       8.168   3.135   1.224  1.00 20.00           C
ATOM     15  CG1 VAL A   3       9.686   3.173   1.224  1.00 20.00           C
ATOM     16  CG2 VAL A   3       7.633   1.715   1.224  1.00 20.00           C
END`;

export const LARGE_PROTEIN_PDB_HEADER = `HEADER    LARGE TEST PROTEIN                      01-JAN-20   LARG
TITLE     LARGE TEST PROTEIN WITH MULTIPLE CHAINS
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: LARGE TEST PROTEIN;
COMPND   3 CHAIN: A, B, C, D;
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: TEST ORGANISM;
KEYWDS    TEST, BENCHMARK, LARGE STRUCTURE
EXPDTA    X-RAY DIFFRACTION
AUTHOR    TEST AUTHOR
REMARK   2 RESOLUTION.    1.80 ANGSTROMS.`;

/**
 * Generate large PDB with specified atom count
 */
export function generateLargePDB(atomCount: number): string {
  const atoms: string[] = [LARGE_PROTEIN_PDB_HEADER];

  for (let i = 1; i <= atomCount; i++) {
    const chain = String.fromCharCode(65 + Math.floor(i / 1000) % 4); // A, B, C, D
    const resNum = Math.floor((i - 1) / 5) + 1;
    const atomType = ['N', 'CA', 'C', 'O', 'CB'][i % 5];
    const residue = ['ALA', 'GLY', 'VAL', 'LEU', 'ILE'][Math.floor(Math.random() * 5)];

    const x = (Math.random() * 100 - 50).toFixed(3);
    const y = (Math.random() * 100 - 50).toFixed(3);
    const z = (Math.random() * 100 - 50).toFixed(3);

    atoms.push(
      `ATOM  ${i.toString().padStart(5)} ${atomType.padEnd(4)}${residue} ${chain}${resNum.toString().padStart(4)}    ${x.padStart(8)}${y.padStart(8)}${z.padStart(8)}  1.00 20.00           ${atomType.charAt(0)}`
    );
  }

  atoms.push('END');
  return atoms.join('\n');
}

export const HEMOGLOBIN_PDB_SNIPPET = `HEADER    OXYGEN STORAGE/TRANSPORT                28-FEB-96   1A3N
TITLE     HUMAN HEMOGLOBIN
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: HEMOGLOBIN ALPHA CHAIN;
COMPND   3 CHAIN: A, C;
COMPND   4 ENGINEERED: YES;
COMPND   5 MOL_ID: 2;
COMPND   6 MOLECULE: HEMOGLOBIN BETA CHAIN;
COMPND   7 CHAIN: B, D;
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: HOMO SAPIENS;
SOURCE   3 ORGANISM_COMMON: HUMAN;
KEYWDS    OXYGEN STORAGE/TRANSPORT
EXPDTA    X-RAY DIFFRACTION
REMARK   2 RESOLUTION.    2.10 ANGSTROMS.`;

export const DNA_STRUCTURE_PDB = `HEADER    DNA                                     01-JAN-80   1BNA
TITLE     STRUCTURE OF A B-DNA DODECAMER
ATOM      1  O5'  DC A   1      18.935  34.195  25.617  1.00 64.35           O
ATOM      2  C5'  DC A   1      19.130  33.921  24.220  1.00 62.16           C
ATOM      3  C4'  DC A   1      18.012  33.105  23.613  1.00 58.45           C
ATOM      4  O4'  DC A   1      16.810  33.909  23.562  1.00 55.71           O
ATOM      5  C3'  DC A   1      18.284  32.642  22.181  1.00 57.25           C
ATOM      6  O3'  DC A   1      18.995  31.409  22.181  1.00 58.45           O
ATOM      7  C2'  DC A   1      16.920  32.460  21.531  1.00 53.86           C
ATOM      8  C1'  DC A   1      16.139  33.698  21.997  1.00 51.91           C
ATOM      9  N1   DC A   1      14.693  33.456  22.194  1.00 49.32           N
ATOM     10  C2   DC A   1      13.847  33.583  21.099  1.00 47.61           C
END`;

export const MEMBRANE_PROTEIN_PDB = `HEADER    MEMBRANE PROTEIN                        15-MAR-98   1BL8
TITLE     BACTERIORHODOPSIN
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: BACTERIORHODOPSIN;
COMPND   3 CHAIN: A;
SOURCE    MOL_ID: 1;
SOURCE   2 ORGANISM_SCIENTIFIC: HALOBACTERIUM SALINARUM;
KEYWDS    MEMBRANE PROTEIN, PROTON PUMP, RETINAL PROTEIN
EXPDTA    X-RAY DIFFRACTION
REMARK   2 RESOLUTION.    2.50 ANGSTROMS.`;

/**
 * Mock PDB search results
 */
export const MOCK_SEARCH_RESULTS = [
  {
    id: '1ABC',
    title: 'Test Protein Alpha',
    resolution: 2.5,
    method: 'X-RAY DIFFRACTION',
    releaseDate: '2020-01-01',
    authors: ['Smith, J.', 'Doe, J.'],
    organisms: ['Homo sapiens'],
  },
  {
    id: '2DEF',
    title: 'Test Protein Beta',
    resolution: 1.8,
    method: 'X-RAY DIFFRACTION',
    releaseDate: '2020-06-15',
    authors: ['Johnson, A.'],
    organisms: ['Mus musculus'],
  },
  {
    id: '3GHI',
    title: 'Test Protein Gamma',
    resolution: 3.0,
    method: 'CRYO-EM',
    releaseDate: '2021-03-20',
    authors: ['Williams, B.', 'Brown, C.'],
    organisms: ['Escherichia coli'],
  },
];

/**
 * Mock structure metadata
 */
export const MOCK_STRUCTURE_METADATA = {
  title: 'Test Protein Structure',
  resolution: 2.5,
  chains: ['A', 'B'],
  atomCount: 1543,
  residueCount: 194,
  experimentMethod: 'X-RAY DIFFRACTION',
  depositionDate: '2020-01-01',
};

/**
 * Generate mock atoms for testing
 */
export function generateMockAtoms(count: number, options: {
  includeLigands?: boolean;
  chains?: number;
} = {}): any[] {
  const { includeLigands = false, chains = 1 } = options;
  const atomNames = ['CA', 'CB', 'C', 'N', 'O', 'CG', 'CD', 'CE', 'NZ'];
  const atoms: any[] = [];

  for (let i = 0; i < count; i++) {
    const chain = String.fromCharCode(65 + (i % chains));
    const isLigand = includeLigands && i % 50 === 0;

    atoms.push({
      name: atomNames[i % atomNames.length],
      chain,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      z: Math.random() * 100 - 50,
      isLigand,
      residue: isLigand ? 'LIG' : 'ALA',
      residueNumber: Math.floor(i / 5) + 1,
    });
  }

  return atoms;
}
