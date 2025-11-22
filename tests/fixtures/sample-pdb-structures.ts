/**
 * Sample PDB Test Data for Smoke Tests
 *
 * These fixtures provide test data for validating molecular visualization features.
 * Use these for unit tests, integration tests, and manual smoke testing.
 */

/**
 * Minimal PDB structure for basic parsing tests
 * Crambin (1CRN) - 46 residues, 327 atoms
 */
export const SAMPLE_PDB_SMALL = `HEADER    PLANT SEED PROTEIN                     30-APR-81   1CRN
TITLE     WATER STRUCTURE OF A HYDROPHOBIC PROTEIN AT ATOMIC RESOLUTION.
TITLE    2 PENTAGON RINGS OF WATER MOLECULES IN CRYSTALS OF CRAMBIN
COMPND    MOL_ID: 1;
COMPND   2 MOLECULE: CRAMBIN;
COMPND   3 CHAIN: A
ATOM      1  N   THR A   1      17.047  14.099   3.625  1.00 13.79           N
ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C
ATOM      3  C   THR A   1      15.685  12.755   5.133  1.00  9.19           C
ATOM      4  O   THR A   1      15.268  13.825   5.594  1.00  9.85           O
ATOM      5  CB  THR A   1      18.170  12.703   5.337  1.00 13.02           C
ATOM      6  OG1 THR A   1      19.334  12.829   4.463  1.00 15.06           O
ATOM      7  CG2 THR A   1      18.150  11.546   6.304  1.00 14.23           C
ATOM      8  N   THR A   2      15.115  11.545   5.265  1.00  7.81           N
ATOM      9  CA  THR A   2      13.856  11.469   6.066  1.00  8.31           C
ATOM     10  C   THR A   2      14.164  10.785   7.379  1.00  5.80           C
END
`;

/**
 * Medium complexity structure for LOD testing
 * ATP bound protein - approximately 1000 atoms
 */
export const SAMPLE_PDB_MEDIUM_HEADER = `HEADER    TRANSFERASE                             10-MAY-94   1ATP
TITLE     CRYSTAL STRUCTURE OF THE TERNARY COMPLEX OF CAMP-DEPENDENT
TITLE    2 PROTEIN KINASE CATALYTIC SUBUNIT, MG-ATP, AND A PEPTIDE
TITLE    3 INHIBITOR
`;

/**
 * Test structure metadata
 */
export const TEST_STRUCTURES = {
  small: {
    pdbId: '1CRN',
    name: 'Crambin',
    atomCount: 327,
    residueCount: 46,
    expectedLoadTime: 200, // ms
    category: 'plant-protein',
  },
  medium: {
    pdbId: '1ATP',
    name: 'cAMP-Dependent Protein Kinase',
    atomCount: 2771,
    residueCount: 350,
    expectedLoadTime: 1000, // ms
    category: 'enzyme',
  },
  large: {
    pdbId: '3J3Q',
    name: 'Human 80S Ribosome',
    atomCount: 110000,
    residueCount: 12000,
    expectedLoadTime: 10000, // ms
    category: 'ribosome',
  },
};

/**
 * Invalid PDB data for error handling tests
 */
export const INVALID_PDB_DATA = {
  empty: '',
  malformed: 'NOT A VALID PDB FILE\nRANDOM TEXT',
  wrongFormat: '{"format": "json", "not": "pdb"}',
  truncated: 'HEADER    TEST\nATOM      1  N',
  oversized: 'X'.repeat(100 * 1024 * 1024), // 100MB string
};

/**
 * Expected API responses for mock testing
 */
export const EXPECTED_API_RESPONSES = {
  validStructure: {
    id: '1ATP',
    title: 'CRYSTAL STRUCTURE OF THE TERNARY COMPLEX',
    resolution: 2.2,
    experimentType: 'X-RAY DIFFRACTION',
    releaseDate: '1994-05-10',
  },
  searchResults: {
    results: [
      { id: '1ATP', title: 'Protein Kinase Complex' },
      { id: '1CRN', title: 'Crambin' },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
  },
  notFound: {
    error: 'Structure not found',
    statusCode: 404,
    message: 'The requested PDB structure does not exist',
  },
};

/**
 * Test user credentials (staging only)
 */
export const TEST_CREDENTIALS = {
  validUser: {
    email: 'test@labvisualizer.staging',
    password: 'TestPassword123!',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

/**
 * API endpoint definitions for smoke tests
 */
export const API_ENDPOINTS = {
  health: {
    main: '/api/health',
    ready: '/api/health/ready',
    live: '/api/health/live',
  },
  pdb: {
    fetch: (id: string) => `/api/pdb/${id}`,
    search: (query: string) => `/api/pdb/search?q=${encodeURIComponent(query)}`,
    upload: '/api/pdb/upload',
    alphafold: (uniprot: string) => `/api/pdb/alphafold/${uniprot}`,
  },
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    session: '/api/auth/session',
  },
  learning: {
    modules: '/api/learning/modules',
    module: (id: string) => `/api/learning/modules/${id}`,
    progress: '/api/learning/progress',
  },
  export: {
    image: '/api/export/image',
    pdf: '/api/export/pdf',
    model: '/api/export/model',
  },
};

/**
 * Performance thresholds for smoke tests
 */
export const PERFORMANCE_THRESHOLDS = {
  homepage: {
    loadTime: 3000, // ms
    ttfb: 500, // ms
  },
  api: {
    health: 200, // ms
    pdbFetch: 2000, // ms
    search: 3000, // ms
  },
  viewer: {
    smallStructure: 2000, // ms
    mediumStructure: 5000, // ms
    largeStructure: 10000, // ms
  },
};

/**
 * Security test cases
 */
export const SECURITY_TEST_CASES = {
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert('XSS')",
  ],
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    '1 OR 1=1',
    "' UNION SELECT * FROM users --",
  ],
  pathTraversalPayloads: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f',
  ],
};

/**
 * Rate limiting test configuration
 */
export const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 60,
  authAttemptsPerHour: 5,
  uploadSizeLimitMB: 50,
  burstLimit: 10,
};

export default {
  SAMPLE_PDB_SMALL,
  SAMPLE_PDB_MEDIUM_HEADER,
  TEST_STRUCTURES,
  INVALID_PDB_DATA,
  EXPECTED_API_RESPONSES,
  TEST_CREDENTIALS,
  API_ENDPOINTS,
  PERFORMANCE_THRESHOLDS,
  SECURITY_TEST_CASES,
  RATE_LIMIT_CONFIG,
};
