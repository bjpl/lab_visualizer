/**
 * Level of Detail (LOD) Manager
 * Orchestrates progressive rendering from preview to full detail
 * Analyzes structure complexity and manages rendering stages
 */

export enum LODLevel {
  PREVIEW = 1,
  INTERACTIVE = 2,
  FULL = 3,
}

export interface LODConfig {
  level: LODLevel;
  maxAtoms: number;
  targetFPS: number;
  loadTime: number;
  features: RenderFeatures;
}

export interface RenderFeatures {
  backboneOnly: boolean;
  secondaryStructure: boolean;
  sidechains: boolean;
  surfaces: boolean;
  shadows: boolean;
  ambientOcclusion: boolean;
  antialiasing: 'none' | 'fxaa' | 'msaa';
  ligands: 'none' | 'simple' | 'detailed';
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

export interface LODStageResult {
  level: LODLevel;
  duration: number;
  atomsRendered: number;
  fps: number;
  success: boolean;
}

/**
 * LOD configuration presets for each level
 */
export const LOD_CONFIGS: Record<LODLevel, LODConfig> = {
  [LODLevel.PREVIEW]: {
    level: LODLevel.PREVIEW,
    maxAtoms: 100,
    targetFPS: 60,
    loadTime: 200,
    features: {
      backboneOnly: true,
      secondaryStructure: false,
      sidechains: false,
      surfaces: false,
      shadows: false,
      ambientOcclusion: false,
      antialiasing: 'none',
      ligands: 'none',
    },
  },
  [LODLevel.INTERACTIVE]: {
    level: LODLevel.INTERACTIVE,
    maxAtoms: 1000,
    targetFPS: 60,
    loadTime: 1000,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: false,
      surfaces: false,
      shadows: false,
      ambientOcclusion: false,
      antialiasing: 'fxaa',
      ligands: 'simple',
    },
  },
  [LODLevel.FULL]: {
    level: LODLevel.FULL,
    maxAtoms: 100000,
    targetFPS: 30,
    loadTime: 3000,
    features: {
      backboneOnly: false,
      secondaryStructure: true,
      sidechains: true,
      surfaces: true,
      shadows: true,
      ambientOcclusion: true,
      antialiasing: 'msaa',
      ligands: 'detailed',
    },
  },
};

/**
 * Progressive loading callbacks
 */
export interface LODCallbacks {
  onStageStart?: (level: LODLevel) => void;
  onStageComplete?: (result: LODStageResult) => void;
  onProgress?: (progress: number, level: LODLevel) => void;
  onError?: (error: Error, level: LODLevel) => void;
}

export class LODManager {
  private currentLevel: LODLevel = LODLevel.PREVIEW;
  private complexity: StructureComplexity | null = null;
  private callbacks: LODCallbacks;
  private memoryBudget: number;
  private abortController: AbortController | null = null;

  constructor(callbacks: LODCallbacks = {}, memoryBudgetMB: number = 512) {
    this.callbacks = callbacks;
    this.memoryBudget = memoryBudgetMB * 1024 * 1024; // Convert to bytes
  }

  /**
   * Analyze structure complexity
   */
  analyzeComplexity(structure: any): StructureComplexity {
    const atomCount = structure.atomCount || 0;
    const bondCount = structure.bondCount || 0;
    const residueCount = structure.residueCount || 0;
    const chainCount = structure.chainCount || 1;
    const hasLigands = structure.hasLigands || false;
    const hasSurfaces = structure.hasSurfaces || false;

    // Estimate vertex count for rendering
    // Rough estimate: 20 vertices per atom for sphere, 50 for surface
    const estimatedVertices = atomCount * (hasSurfaces ? 50 : 20);

    this.complexity = {
      atomCount,
      bondCount,
      residueCount,
      chainCount,
      hasLigands,
      hasSurfaces,
      estimatedVertices,
    };

    return this.complexity;
  }

  /**
   * Determine appropriate starting LOD level based on complexity
   */
  determineStartingLevel(complexity: StructureComplexity): LODLevel {
    const { atomCount, estimatedVertices } = complexity;

    // Use memory budget to determine capability
    const estimatedMemory = estimatedVertices * 32; // ~32 bytes per vertex
    const memoryRatio = estimatedMemory / this.memoryBudget;

    if (atomCount < 500 && memoryRatio < 0.1) {
      // Small structure, skip to interactive
      return LODLevel.INTERACTIVE;
    } else if (atomCount < 5000 && memoryRatio < 0.3) {
      // Medium structure, use preview then interactive
      return LODLevel.PREVIEW;
    } else {
      // Large structure, use all stages
      return LODLevel.PREVIEW;
    }
  }

  /**
   * Get configuration for specific LOD level
   */
  getConfig(level: LODLevel): LODConfig {
    return { ...LOD_CONFIGS[level] };
  }

  /**
   * Filter atoms based on LOD level
   */
  filterAtomsForLevel(
    atoms: any[],
    level: LODLevel,
    complexity: StructureComplexity
  ): any[] {
    const config = this.getConfig(level);

    if (level === LODLevel.PREVIEW) {
      // Backbone only (Cα atoms)
      return this.selectBackboneAtoms(atoms).slice(0, config.maxAtoms);
    } else if (level === LODLevel.INTERACTIVE) {
      // Key atoms for secondary structure
      return this.selectKeyAtoms(atoms, complexity).slice(0, config.maxAtoms);
    } else {
      // All atoms, but respect max limit
      return atoms.slice(0, config.maxAtoms);
    }
  }

  /**
   * Select backbone atoms (Cα, C, N, O)
   */
  private selectBackboneAtoms(atoms: any[]): any[] {
    const backboneNames = new Set(['CA', 'C', 'N', 'O']);
    return atoms.filter((atom) => backboneNames.has(atom.name));
  }

  /**
   * Select key atoms for structure representation
   */
  private selectKeyAtoms(atoms: any[], complexity: StructureComplexity): any[] {
    // Include backbone + Cβ for side chain indication
    const keyNames = new Set(['CA', 'C', 'N', 'O', 'CB']);

    // Add ligand atoms if present
    const filtered = atoms.filter((atom) => {
      return keyNames.has(atom.name) || atom.isLigand;
    });

    return filtered;
  }

  /**
   * Progressive loading scheduler
   */
  async loadProgressive(
    structure: any,
    renderer: any,
    targetLevel: LODLevel = LODLevel.FULL
  ): Promise<LODStageResult[]> {
    this.abortController = new AbortController();
    const results: LODStageResult[] = [];

    try {
      // Analyze complexity
      const complexity = this.analyzeComplexity(structure);
      const startLevel = this.determineStartingLevel(complexity);

      // Load stages progressively
      for (let level = startLevel; level <= targetLevel; level++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Loading cancelled');
        }

        const result = await this.loadStage(
          structure,
          renderer,
          level as LODLevel,
          complexity
        );

        results.push(result);

        if (!result.success) {
          console.warn(`Stage ${level} failed, stopping progression`);
          break;
        }

        // Brief pause between stages to allow UI updates
        await this.delay(50);
      }

      return results;
    } catch (error) {
      if (error instanceof Error) {
        this.callbacks.onError?.(error, this.currentLevel);
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Load a single LOD stage
   */
  private async loadStage(
    structure: any,
    renderer: any,
    level: LODLevel,
    complexity: StructureComplexity
  ): Promise<LODStageResult> {
    const startTime = performance.now();
    this.currentLevel = level;
    this.callbacks.onStageStart?.(level);

    try {
      const config = this.getConfig(level);

      // Filter atoms for this level
      const atoms = this.filterAtomsForLevel(
        structure.atoms || [],
        level,
        complexity
      );

      // Render with LOD-specific features
      await renderer.render(atoms, config.features);

      // Measure performance
      const duration = performance.now() - startTime;
      const fps = await this.measureFPS(renderer, 60); // Sample 60 frames

      const result: LODStageResult = {
        level,
        duration,
        atomsRendered: atoms.length,
        fps,
        success: duration <= config.loadTime * 1.5, // Allow 50% tolerance
      };

      this.callbacks.onStageComplete?.(result);
      return result;
    } catch (error) {
      console.error(`Stage ${level} rendering failed:`, error);
      return {
        level,
        duration: performance.now() - startTime,
        atomsRendered: 0,
        fps: 0,
        success: false,
      };
    }
  }

  /**
   * Measure average FPS over sample frames
   */
  private async measureFPS(
    renderer: any,
    sampleFrames: number = 60
  ): Promise<number> {
    const frameTimes: number[] = [];
    let lastTime = performance.now();

    for (let i = 0; i < sampleFrames; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      frameTimes.push(deltaTime);
      lastTime = currentTime;
    }

    // Calculate average FPS
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    return 1000 / avgFrameTime;
  }

  /**
   * Cancel progressive loading
   */
  cancelLoading(): void {
    this.abortController?.abort();
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel(): LODLevel {
    return this.currentLevel;
  }

  /**
   * Get structure complexity
   */
  getComplexity(): StructureComplexity | null {
    return this.complexity;
  }

  /**
   * Calculate memory estimate for structure at a given LOD level
   */
  estimateMemoryUsage(complexity: StructureComplexity, level: LODLevel): number {
    const config = this.getConfig(level);
    const atomsToRender = Math.min(complexity.atomCount, config.maxAtoms);

    // Rough memory estimate
    // - Geometry: 32 bytes per vertex * vertices per atom
    // - Textures: additional 20%
    // - Buffers: additional 10%

    // Use level config to determine features (surfaces add more vertices)
    // Higher LOD levels include surfaces which use more memory
    const hasSurfacesForLevel = config.features.surfaces && complexity.hasSurfaces;
    const verticesPerAtom = hasSurfacesForLevel ? 50 : 20;

    const geometryMemory = atomsToRender * verticesPerAtom * 32;

    // For FULL level, also account for structure data overhead
    // when dealing with very large structures
    const structureDataOverhead =
      level === LODLevel.FULL && complexity.atomCount > config.maxAtoms
        ? (complexity.atomCount - config.maxAtoms) * 8 // ~8 bytes per additional atom for data
        : 0;

    const totalMemory = (geometryMemory + structureDataOverhead) * 1.3;

    return totalMemory;
  }

  /**
   * Check if memory budget allows level
   */
  canAffordLevel(complexity: StructureComplexity, level: LODLevel): boolean {
    const estimatedMemory = this.estimateMemoryUsage(complexity, level);
    return estimatedMemory <= this.memoryBudget * 0.8; // Use 80% threshold
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Factory function for easy instantiation
 */
export function createLODManager(
  callbacks?: LODCallbacks,
  memoryBudgetMB?: number
): LODManager {
  return new LODManager(callbacks, memoryBudgetMB);
}
