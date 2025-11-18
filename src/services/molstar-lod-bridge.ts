/**
 * MolStar-LOD Integration Bridge
 *
 * Bridges the LOD Manager with MolStar viewer for progressive loading
 * Coordinates quality levels, caching, and performance monitoring
 */

import {
  LODManager,
  LODLevel,
  LODCallbacks,
  LODStageResult,
  StructureComplexity,
  RenderFeatures,
  createLODManager,
} from '@/lib/lod-manager';
import { molstarService } from '@/services/molstar-service';
import type {
  MolstarRepresentationType,
  MolstarColorScheme,
  RepresentationOptions,
  StructureMetadata,
} from '@/types/molstar';

/**
 * LOD-aware rendering adapter
 * Translates LOD render features to MolStar representation options
 */
export interface LODRenderAdapter {
  level: LODLevel;
  representation: MolstarRepresentationType;
  quality: RepresentationOptions['quality'];
  colorScheme: MolstarColorScheme;
  alpha?: number;
}

/**
 * Progressive loading progress callback
 */
export interface ProgressCallback {
  (progress: number, level: LODLevel, message: string): void;
}

/**
 * Integration bridge configuration
 */
export interface BridgeConfig {
  memoryBudgetMB?: number;
  enableCaching?: boolean;
  autoProgressToFull?: boolean;
  targetFPS?: number;
  onProgress?: ProgressCallback;
}

/**
 * Structure data interface
 */
export interface StructureData {
  content: string | ArrayBuffer;
  label?: string;
  metadata?: Partial<StructureMetadata>;
}

/**
 * MolStar-LOD Integration Bridge
 */
export class MolstarLODBridge {
  private lodManager: LODManager;
  private config: BridgeConfig;
  private currentStructure: StructureData | null = null;
  private complexity: StructureComplexity | null = null;
  private isLoading = false;
  private cachedRepresentations = new Map<LODLevel, RepresentationOptions>();

  constructor(config: BridgeConfig = {}) {
    this.config = {
      memoryBudgetMB: 512,
      enableCaching: true,
      autoProgressToFull: true,
      targetFPS: 60,
      ...config,
    };

    // Initialize LOD manager with callbacks
    const lodCallbacks: LODCallbacks = {
      onStageStart: this.handleStageStart.bind(this),
      onStageComplete: this.handleStageComplete.bind(this),
      onProgress: this.handleProgress.bind(this),
      onError: this.handleError.bind(this),
    };

    this.lodManager = createLODManager(
      lodCallbacks,
      this.config.memoryBudgetMB
    );
  }

  /**
   * Load structure with progressive LOD
   */
  async loadStructureProgressive(
    structure: StructureData,
    targetLevel: LODLevel = LODLevel.FULL
  ): Promise<LODStageResult[]> {
    if (this.isLoading) {
      throw new Error('Another structure is currently loading');
    }

    this.isLoading = true;
    this.currentStructure = structure;

    try {
      // First, load structure to analyze complexity
      const metadata = await this.loadInitialStructure(structure);

      // Analyze complexity from metadata
      this.complexity = this.analyzeFromMetadata(metadata);

      // Create renderer adapter
      const renderer = this.createRendererAdapter();

      // Progressive load with LOD manager
      const results = await this.lodManager.loadProgressive(
        { atoms: [], metadata },
        renderer,
        targetLevel
      );

      return results;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load initial structure at preview quality
   */
  private async loadInitialStructure(
    structure: StructureData
  ): Promise<StructureMetadata> {
    const { content, label = 'Structure' } = structure;

    // Load with minimal representation first
    const metadata = await molstarService.loadStructure(content, {
      format: 'pdb',
      label,
    });

    return metadata;
  }

  /**
   * Analyze structure complexity from metadata
   */
  private analyzeFromMetadata(
    metadata: StructureMetadata
  ): StructureComplexity {
    const { atomCount, residueCount, chains } = metadata;

    // Estimate bond count (approximate: 1.5 bonds per atom)
    const bondCount = Math.floor(atomCount * 1.5);

    // Estimate if structure has ligands (heuristic: non-protein chains)
    const hasLigands = chains.length > 1;

    // Surfaces are expensive, assume false for now
    const hasSurfaces = false;

    // Estimate vertices for rendering
    const estimatedVertices = atomCount * (hasSurfaces ? 50 : 20);

    return {
      atomCount,
      bondCount,
      residueCount,
      chainCount: chains.length,
      hasLigands,
      hasSurfaces,
      estimatedVertices,
    };
  }

  /**
   * Create renderer adapter for LOD manager
   */
  private createRendererAdapter() {
    return {
      render: async (atoms: any[], features: RenderFeatures) => {
        const representation = this.translateFeaturesToRepresentation(features);
        await molstarService.applyRepresentation(representation);
      },
    };
  }

  /**
   * Translate LOD render features to MolStar representation
   */
  private translateFeaturesToRepresentation(
    features: RenderFeatures
  ): RepresentationOptions {
    // Determine representation type
    let type: MolstarRepresentationType;
    if (features.backboneOnly) {
      type = 'backbone';
    } else if (features.surfaces) {
      type = 'surface';
    } else if (features.secondaryStructure && !features.sidechains) {
      type = 'cartoon';
    } else if (features.sidechains) {
      type = 'ball-and-stick';
    } else {
      type = 'cartoon';
    }

    // Determine quality
    let quality: RepresentationOptions['quality'] = 'medium';
    if (features.antialiasing === 'msaa' && features.ambientOcclusion) {
      quality = 'highest';
    } else if (features.antialiasing === 'fxaa') {
      quality = 'high';
    } else if (features.antialiasing === 'none') {
      quality = 'low';
    }

    return {
      type,
      colorScheme: 'secondary-structure',
      quality,
      alpha: 1.0,
    };
  }

  /**
   * Get LOD adapter for current level
   */
  getLODAdapter(level: LODLevel): LODRenderAdapter {
    const config = this.lodManager.getConfig(level);
    const representation = this.translateFeaturesToRepresentation(
      config.features
    );

    return {
      level,
      representation: representation.type,
      quality: representation.quality,
      colorScheme: representation.colorScheme,
      alpha: representation.alpha,
    };
  }

  /**
   * Switch to specific LOD level
   */
  async switchToLevel(level: LODLevel): Promise<void> {
    if (!this.currentStructure) {
      throw new Error('No structure loaded');
    }

    const adapter = this.getLODAdapter(level);

    // Check cache first
    let representation: RepresentationOptions;

    if (this.config.enableCaching && this.cachedRepresentations.has(level)) {
      representation = this.cachedRepresentations.get(level)!;
    } else {
      const config = this.lodManager.getConfig(level);
      representation = this.translateFeaturesToRepresentation(config.features);

      if (this.config.enableCaching) {
        this.cachedRepresentations.set(level, representation);
      }
    }

    await molstarService.applyRepresentation(representation);
  }

  /**
   * Get current complexity analysis
   */
  getComplexity(): StructureComplexity | null {
    return this.complexity;
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel(): LODLevel {
    return this.lodManager.getCurrentLevel();
  }

  /**
   * Estimate memory usage for level
   */
  estimateMemoryUsage(level: LODLevel): number | null {
    if (!this.complexity) return null;
    return this.lodManager.estimateMemoryUsage(this.complexity, level);
  }

  /**
   * Check if level is affordable
   */
  canAffordLevel(level: LODLevel): boolean {
    if (!this.complexity) return false;
    return this.lodManager.canAffordLevel(this.complexity, level);
  }

  /**
   * Cancel progressive loading
   */
  cancelLoading(): void {
    this.lodManager.cancelLoading();
    this.isLoading = false;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedRepresentations.clear();
  }

  /**
   * Handle stage start callback
   */
  private handleStageStart(level: LODLevel): void {
    this.config.onProgress?.(0, level, `Starting ${LODLevel[level]} stage...`);
  }

  /**
   * Handle stage complete callback
   */
  private handleStageComplete(result: LODStageResult): void {
    const { level, duration, atomsRendered, fps, success } = result;

    const message = success
      ? `Completed ${LODLevel[level]}: ${atomsRendered} atoms in ${duration.toFixed(0)}ms @ ${fps.toFixed(1)} FPS`
      : `Failed ${LODLevel[level]} stage`;

    this.config.onProgress?.(100, level, message);

    // Log performance
    console.log('[MolstarLODBridge] Stage complete:', {
      level: LODLevel[level],
      duration: `${duration.toFixed(0)}ms`,
      atoms: atomsRendered,
      fps: fps.toFixed(1),
      success,
    });
  }

  /**
   * Handle progress callback
   */
  private handleProgress(progress: number, level: LODLevel): void {
    this.config.onProgress?.(
      progress,
      level,
      `Loading ${LODLevel[level]}: ${progress}%`
    );
  }

  /**
   * Handle error callback
   */
  private handleError(error: Error, level: LODLevel): void {
    console.error(`[MolstarLODBridge] Error at ${LODLevel[level]}:`, error);
    this.isLoading = false;
  }

  /**
   * Dispose bridge and cleanup resources
   */
  dispose(): void {
    this.cancelLoading();
    this.clearCache();
    this.currentStructure = null;
    this.complexity = null;
  }
}

/**
 * Factory function for creating bridge instance
 */
export function createMolstarLODBridge(
  config?: BridgeConfig
): MolstarLODBridge {
  return new MolstarLODBridge(config);
}
