/**
 * Complexity Analyzer - Centralized complexity calculation logic
 * Consolidates complexity analysis for molecular structures
 *
 * This module provides unified complexity analysis functions used across
 * the LOD Manager, PDB Service, and other components.
 */

import type { Atom, StructureMetadata, StructureComplexity } from '../types/pdb';

/**
 * Complexity analyzer configuration
 */
export interface ComplexityConfig {
  /**
   * Vertices per atom for sphere/ball representation
   * Default: 20
   */
  verticesPerAtomSphere?: number;

  /**
   * Vertices per atom for surface representation
   * Default: 50
   */
  verticesPerAtomSurface?: number;

  /**
   * Bonds per atom estimate multiplier
   * Default: 3.5 (rough estimate: 3-4 bonds per atom)
   */
  bondsPerAtomMultiplier?: number;

  /**
   * Alternative bonds estimate from atom count
   * Default: 1.5
   */
  bondsPerAtomAlternative?: number;

  /**
   * Vertices per residue for cartoon representation
   * Default: 10
   */
  verticesPerResidue?: number;
}

/**
 * Extended complexity data with additional metadata
 */
export interface ExtendedComplexity extends StructureComplexity {
  calculationMethod: 'atom-based' | 'metadata-based' | 'hybrid';
  confidenceScore: number;
}

/**
 * Complexity Analyzer class
 */
export class ComplexityAnalyzer {
  private config: Required<ComplexityConfig>;

  /**
   * Initialize with optional configuration
   */
  constructor(config: ComplexityConfig = {}) {
    this.config = {
      verticesPerAtomSphere: config.verticesPerAtomSphere ?? 20,
      verticesPerAtomSurface: config.verticesPerAtomSurface ?? 50,
      bondsPerAtomMultiplier: config.bondsPerAtomMultiplier ?? 3.5,
      bondsPerAtomAlternative: config.bondsPerAtomAlternative ?? 1.5,
      verticesPerResidue: config.verticesPerResidue ?? 10,
    };
  }

  /**
   * Analyze complexity from atom array and metadata
   * Used by: PDB Service for parsed structures
   *
   * @param atoms Array of atoms from the structure
   * @param metadata Structure metadata
   * @returns Calculated complexity object
   */
  analyzeFromAtoms(
    atoms: Atom[],
    metadata: StructureMetadata
  ): StructureComplexity {
    const ligandAtoms = atoms.filter((a) => a.isLigand);

    // Estimate bonds: rough estimate of 3-4 bonds per atom on average
    const estimatedBonds = Math.floor(atoms.length * this.config.bondsPerAtomMultiplier);

    // Estimate vertices for rendering
    // Ball-and-stick: ~50 vertices per atom
    // Cartoon: ~10 vertices per residue
    const estimatedVertices =
      atoms.length * this.config.verticesPerAtomSurface +
      metadata.residueCount * this.config.verticesPerResidue;

    return {
      atomCount: atoms.length,
      bondCount: estimatedBonds,
      residueCount: metadata.residueCount,
      chainCount: metadata.chains.length,
      hasLigands: ligandAtoms.length > 0,
      hasSurfaces: false, // Would require surface calculation
      estimatedVertices,
    };
  }

  /**
   * Analyze complexity from structure metadata only
   * Used by: LOD Manager, MolStar LOD Bridge for metadata-based analysis
   *
   * @param metadata Minimal structure metadata with atom/residue counts
   * @param hasSurfaces Whether the structure has surface representation
   * @returns Calculated complexity object
   */
  analyzeFromMetadata(
    metadata: {
      atomCount: number;
      residueCount: number;
      chains: string[];
      hasLigands?: boolean;
      hasSurfaces?: boolean;
    },
    hasSurfaces: boolean = false
  ): StructureComplexity {
    const atomCount = metadata.atomCount || 0;

    // Estimate bonds: 1.5 bonds per atom (alternative estimate)
    const bondCount = Math.floor(atomCount * this.config.bondsPerAtomAlternative);

    // Estimate vertices based on representation type
    const verticesPerAtom = hasSurfaces
      ? this.config.verticesPerAtomSurface
      : this.config.verticesPerAtomSphere;
    const estimatedVertices = atomCount * verticesPerAtom;

    return {
      atomCount,
      bondCount,
      residueCount: metadata.residueCount || 0,
      chainCount: metadata.chains?.length || 1,
      hasLigands: metadata.hasLigands || false,
      hasSurfaces,
      estimatedVertices,
    };
  }

  /**
   * Analyze generic structure object
   * Used by: LOD Manager for flexible input
   *
   * @param structure Object with complexity properties
   * @returns Calculated complexity object
   */
  analyzeGenericStructure(structure: {
    atomCount?: number;
    bondCount?: number;
    residueCount?: number;
    chainCount?: number;
    hasLigands?: boolean;
    hasSurfaces?: boolean;
  }): StructureComplexity {
    const atomCount = structure.atomCount || 0;
    const hasLigands = structure.hasLigands || false;
    const hasSurfaces = structure.hasSurfaces || false;

    // Use provided values or estimate from atom count
    const bondCount =
      structure.bondCount || Math.floor(atomCount * this.config.bondsPerAtomAlternative);

    // Estimate vertex count for rendering
    const verticesPerAtom = hasSurfaces
      ? this.config.verticesPerAtomSurface
      : this.config.verticesPerAtomSphere;
    const estimatedVertices = atomCount * verticesPerAtom;

    return {
      atomCount,
      bondCount,
      residueCount: structure.residueCount || 0,
      chainCount: structure.chainCount || 1,
      hasLigands,
      hasSurfaces,
      estimatedVertices,
    };
  }

  /**
   * Estimate memory usage for a given complexity and LOD level
   * Used by: LOD Manager for memory budgeting
   *
   * @param complexity The structure complexity
   * @param verticesPerAtom Expected vertices per atom at this LOD level
   * @returns Estimated memory in bytes
   */
  estimateMemoryUsage(complexity: StructureComplexity, verticesPerAtom: number = 32): number {
    // Memory estimate components:
    // - Geometry: 32 bytes per vertex
    // - Textures: additional 20%
    // - Buffers: additional 10%
    const geometryMemory = complexity.estimatedVertices * verticesPerAtom;
    const totalMemory = geometryMemory * 1.3; // Add 30% overhead

    return totalMemory;
  }

  /**
   * Determine if memory budget allows a certain complexity level
   * Used by: LOD Manager for affordability checks
   *
   * @param complexity The structure complexity
   * @param memoryBudgetBytes Available memory in bytes
   * @param verticesPerAtom Expected vertices per atom
   * @param thresholdPercent Maximum percentage of budget to use (default: 80%)
   * @returns True if complexity fits within budget
   */
  canAffordComplexity(
    complexity: StructureComplexity,
    memoryBudgetBytes: number,
    verticesPerAtom: number = 32,
    thresholdPercent: number = 0.8
  ): boolean {
    const estimatedMemory = this.estimateMemoryUsage(complexity, verticesPerAtom);
    return estimatedMemory <= memoryBudgetBytes * thresholdPercent;
  }

  /**
   * Get extended complexity analysis with metadata
   * Used by: Advanced analysis and diagnostics
   *
   * @param complexity Base complexity object
   * @param method How the complexity was calculated
   * @returns Extended complexity with metadata
   */
  getExtendedAnalysis(
    complexity: StructureComplexity,
    method: 'atom-based' | 'metadata-based' | 'hybrid' = 'hybrid'
  ): ExtendedComplexity {
    // Confidence score: 1.0 for atom-based (most accurate), 0.7 for metadata-based
    const confidenceScore = method === 'atom-based' ? 1.0 : method === 'metadata-based' ? 0.7 : 0.85;

    return {
      ...complexity,
      calculationMethod: method,
      confidenceScore,
    };
  }

  /**
   * Categorize structure complexity level
   * Used by: LOD selection and performance prediction
   *
   * @param complexity The structure complexity
   * @returns Category: 'tiny', 'small', 'medium', 'large', 'very-large'
   */
  categorizeComplexity(
    complexity: StructureComplexity
  ): 'tiny' | 'small' | 'medium' | 'large' | 'very-large' {
    const atomCount = complexity.atomCount;

    if (atomCount < 100) return 'tiny';
    if (atomCount < 500) return 'small';
    if (atomCount < 5000) return 'medium';
    if (atomCount < 50000) return 'large';
    return 'very-large';
  }

  /**
   * Estimate rendering vertices for a given LOD level
   * Used by: Progressive loading and LOD level selection
   *
   * @param atomCount Number of atoms to render
   * @param hasSurfaces Whether surfaces are enabled
   * @returns Estimated vertex count
   */
  estimateVertices(atomCount: number, hasSurfaces: boolean = false): number {
    const verticesPerAtom = hasSurfaces
      ? this.config.verticesPerAtomSurface
      : this.config.verticesPerAtomSphere;
    return atomCount * verticesPerAtom;
  }

  /**
   * Compare complexity between two structures
   * Used by: Analysis and optimization decisions
   *
   * @param complexity1 First complexity
   * @param complexity2 Second complexity
   * @returns Comparison object with ratios
   */
  compareComplexity(
    complexity1: StructureComplexity,
    complexity2: StructureComplexity
  ): {
    atomRatio: number;
    vertexRatio: number;
    estimatedLoadTimeFactor: number;
  } {
    const atomRatio = complexity2.atomCount / complexity1.atomCount;
    const vertexRatio = complexity2.estimatedVertices / complexity1.estimatedVertices;
    // Load time is roughly proportional to vertex count
    const estimatedLoadTimeFactor = vertexRatio;

    return {
      atomRatio,
      vertexRatio,
      estimatedLoadTimeFactor,
    };
  }
}

/**
 * Singleton instance for global use
 */
let globalAnalyzer: ComplexityAnalyzer | null = null;

/**
 * Get or create global analyzer instance
 * Used by: All modules that need complexity analysis
 */
export function getComplexityAnalyzer(config?: ComplexityConfig): ComplexityAnalyzer {
  if (!globalAnalyzer || config) {
    globalAnalyzer = new ComplexityAnalyzer(config);
  }
  return globalAnalyzer;
}

/**
 * Reset global analyzer (mainly for testing)
 */
export function resetComplexityAnalyzer(): void {
  globalAnalyzer = null;
}

/**
 * Utility functions for direct use without instantiation
 */

/**
 * Quickly analyze from atoms
 */
export function analyzeFromAtoms(
  atoms: Atom[],
  metadata: StructureMetadata
): StructureComplexity {
  return getComplexityAnalyzer().analyzeFromAtoms(atoms, metadata);
}

/**
 * Quickly analyze from metadata
 */
export function analyzeFromMetadata(
  metadata: {
    atomCount: number;
    residueCount: number;
    chains: string[];
    hasLigands?: boolean;
    hasSurfaces?: boolean;
  },
  hasSurfaces?: boolean
): StructureComplexity {
  return getComplexityAnalyzer().analyzeFromMetadata(metadata, hasSurfaces);
}

/**
 * Quickly categorize complexity
 */
export function categorizeComplexity(
  complexity: StructureComplexity
): 'tiny' | 'small' | 'medium' | 'large' | 'very-large' {
  return getComplexityAnalyzer().categorizeComplexity(complexity);
}

/**
 * Quickly estimate memory usage
 */
export function estimateMemoryUsage(
  complexity: StructureComplexity,
  verticesPerAtom?: number
): number {
  return getComplexityAnalyzer().estimateMemoryUsage(complexity, verticesPerAtom);
}
