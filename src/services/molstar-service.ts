/**
 * Mol* Service - Singleton Wrapper
 *
 * Provides a high-level API for Mol* viewer integration
 * Handles initialization, structure loading, representation changes,
 * and performance optimization.
 */

import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

import type {
  MolstarConfig,
  MolstarViewer,
  LoadStructureOptions,
  MolstarRepresentationType,
  MolstarColorScheme,
  RepresentationOptions,
  CameraSnapshot,
  SelectionQuery,
  StructureMetadata,
  ExportImageOptions,
  PerformanceMetrics,
  TrajectoryOptions,
  MolstarEvents,
} from '@/types/molstar';

/**
 * Mol* Service Singleton
 */
export class MolstarService {
  private static instance: MolstarService | null = null;
  private viewer: MolstarViewer | null = null;
  private container: HTMLDivElement | null = null;
  private eventListeners: Map<keyof MolstarEvents, Set<Function>> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    frameRate: 0,
    atomCount: 0,
    triangleCount: 0,
  };

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MolstarService {
    if (!MolstarService.instance) {
      MolstarService.instance = new MolstarService();
    }
    return MolstarService.instance;
  }

  /**
   * Initialize Mol* viewer
   */
  public async initialize(
    container: HTMLDivElement,
    config: MolstarConfig = {}
  ): Promise<void> {
    if (this.viewer) {
      throw new Error('Mol* viewer already initialized');
    }

    const startTime = performance.now();
    this.container = container;

    try {
      // Custom plugin specification with optimized settings
      const spec: PluginUISpec = {
        ...DefaultPluginUISpec(),
        layout: {
          initial: {
            isExpanded: config.layoutIsExpanded ?? false,
            showControls: config.layoutShowControls ?? false,
            controlsDisplay: 'reactive',
          },
        },
        canvas3d: {
          renderer: {
            backgroundColor: 0xffffff,
            pickingAlphaThreshold: 0.5,
          },
          camera: {
            helper: {
              axes: { name: 'off', params: {} },
            },
          },
        },
        config: [
          [PluginConfig.VolumeStreaming.Enabled, false],
          [PluginConfig.Viewport.ShowExpand, config.viewportShowExpand ?? true],
          [PluginConfig.Viewport.ShowSelectionMode, config.viewportShowSelectionMode ?? true],
          [PluginConfig.Viewport.ShowAnimation, config.viewportShowAnimation ?? false],
        ],
      };

      // Create plugin UI
      const plugin = await createPluginUI({
        target: container,
        spec,
      });

      this.viewer = {
        plugin,
        dispose: () => plugin.dispose(),
      };

      // Setup event listeners
      this.setupEventListeners();

      const initTime = performance.now() - startTime;
      this.performanceMetrics.loadTime = initTime;

      console.info(`[MolstarService] Initialized in ${initTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('[MolstarService] Initialization failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Load structure from PDB data
   */
  public async loadStructure(
    data: string | ArrayBuffer,
    options: LoadStructureOptions = {}
  ): Promise<StructureMetadata> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();
    const { format = 'pdb', label = 'Structure', assemblyId = '1' } = options;

    try {
      const plugin = this.viewer.plugin;

      // Clear previous structure
      await plugin.clear();

      // Download structure data
      const dataState = await plugin.builders.data.rawData({
        data: typeof data === 'string' ? data : new Uint8Array(data),
        label,
      });

      // Parse structure
      const trajectory = await plugin.builders.structure.parseTrajectory(dataState, format);

      // Create model
      const model = await plugin.builders.structure.createModel(trajectory);

      // Create structure
      const structure = await plugin.builders.structure.createStructure(
        model,
        assemblyId ? { name: 'assembly', params: { id: assemblyId } } : undefined
      );

      // Extract metadata
      const metadata = this.extractMetadata(structure);

      // Create default representation
      await this.applyRepresentation({
        type: 'cartoon',
        colorScheme: 'chain-id',
        quality: 'auto',
      });

      // Center camera on structure
      await this.centerCamera();

      const loadTime = performance.now() - startTime;
      this.performanceMetrics.loadTime = loadTime;
      this.performanceMetrics.atomCount = metadata.atomCount;

      this.emit('structure-loaded', metadata);

      console.info(`[MolstarService] Structure loaded in ${loadTime.toFixed(2)}ms`);

      return metadata;
    } catch (error) {
      console.error('[MolstarService] Structure loading failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Load structure from PDB ID
   */
  public async loadStructureById(pdbId: string): Promise<StructureMetadata> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;

      // Clear previous structure
      await plugin.clear();

      // Download from PDB
      const data = await plugin.builders.data.download({
        url: `https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`,
        isBinary: false,
        label: pdbId.toUpperCase(),
      });

      // Parse as PDB
      const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');
      const model = await plugin.builders.structure.createModel(trajectory);
      const structure = await plugin.builders.structure.createStructure(model);

      const metadata = this.extractMetadata(structure);

      await this.applyRepresentation({
        type: 'cartoon',
        colorScheme: 'chain-id',
        quality: 'auto',
      });

      await this.centerCamera();

      this.emit('structure-loaded', metadata);

      return metadata;
    } catch (error) {
      console.error('[MolstarService] PDB download failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Apply representation to current structure
   */
  public async applyRepresentation(options: RepresentationOptions): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Remove existing representations
      const reprs = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Representation.StructureRepresentation3D)
      );

      for (const repr of reprs) {
        await PluginCommands.State.RemoveObject(plugin, { state, ref: repr.transform.ref });
      }

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofType(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Map representation types
      const typeMap: Record<MolstarRepresentationType, string> = {
        cartoon: 'cartoon',
        'ball-and-stick': 'ball-and-stick',
        spacefill: 'spacefill',
        surface: 'molecular-surface',
        backbone: 'backbone',
        point: 'point',
        putty: 'putty',
      };

      // Create new representation
      await plugin.builders.structure.representation.addRepresentation(structures[0], {
        type: typeMap[options.type] || 'cartoon',
        color: options.colorScheme || 'chain-id',
        quality: options.quality || 'auto',
        alpha: options.alpha ?? 1.0,
      });

      const renderTime = performance.now() - startTime;
      this.performanceMetrics.renderTime = renderTime;

      this.emit('representation-changed', options.type);

      console.info(`[MolstarService] Representation applied in ${renderTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('[MolstarService] Representation change failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Change color scheme
   */
  public async setColorScheme(scheme: MolstarColorScheme): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      const reprs = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Representation.StructureRepresentation3D)
      );

      for (const repr of reprs) {
        const update = state.build().to(repr).update({ color: scheme });
        await PluginCommands.State.Update(plugin, { state, tree: update });
      }

      this.emit('color-scheme-changed', scheme);
    } catch (error) {
      console.error('[MolstarService] Color scheme change failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Select atoms/residues/chains
   */
  public async select(query: SelectionQuery): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure reference
      const structures = state.selectQ((q) =>
        q.ofType(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Build Mol* selection query based on query type
      let expression: any;

      switch (query.type) {
        case 'atom':
          if (query.atomIds && query.atomIds.length > 0) {
            expression = plugin.managers.structure.selection.fromExpression(
              `@${query.atomIds.join(',')}`
            );
          }
          break;

        case 'residue':
          if (query.residueIds && query.residueIds.length > 0) {
            expression = plugin.managers.structure.selection.fromExpression(
              `${query.residueIds.join(',')}`
            );
          }
          break;

        case 'chain':
          if (query.chainIds && query.chainIds.length > 0) {
            expression = plugin.managers.structure.selection.fromExpression(
              `chain ${query.chainIds.join(',')}`
            );
          }
          break;

        default:
          throw new Error(`Unknown selection type: ${query.type}`);
      }

      if (expression) {
        await plugin.managers.structure.selection.fromExpression(expression);
      }

      this.emit('selection-changed', query);
    } catch (error) {
      console.error('[MolstarService] Selection failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Center camera on structure
   */
  public async centerCamera(): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      await PluginCommands.Camera.Reset(this.viewer.plugin, {});
    } catch (error) {
      console.error('[MolstarService] Camera reset failed:', error);
      throw error;
    }
  }

  /**
   * Get camera snapshot
   */
  public getCameraSnapshot(): CameraSnapshot | null {
    if (!this.viewer) return null;

    const camera = this.viewer.plugin.canvas3d?.camera;
    if (!camera) return null;

    return {
      position: [camera.state.position[0], camera.state.position[1], camera.state.position[2]],
      target: [camera.state.target[0], camera.state.target[1], camera.state.target[2]],
      up: [camera.state.up[0], camera.state.up[1], camera.state.up[2]],
      fov: camera.state.fov,
    };
  }

  /**
   * Export image
   */
  public async exportImage(options: ExportImageOptions): Promise<Blob> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const { format = 'png', width = 1920, height = 1080, quality = 0.95 } = options;

    try {
      const canvas = this.viewer.plugin.canvas3d?.webgl?.gl.canvas as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to export image'));
            }
          },
          `image/${format}`,
          quality
        );
      });
    } catch (error) {
      console.error('[MolstarService] Image export failed:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Dispose viewer and cleanup
   */
  public dispose(): void {
    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }

    this.eventListeners.clear();
    this.container = null;

    console.info('[MolstarService] Disposed');
  }

  /**
   * Event emitter
   */
  public on<K extends keyof MolstarEvents>(event: K, listener: MolstarEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as Function);
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof MolstarEvents>(event: K, listener: MolstarEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener as Function);
    }
  }

  /**
   * Emit event
   */
  private emit<K extends keyof MolstarEvents>(event: K, ...args: Parameters<MolstarEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
    }
  }

  /**
   * Extract metadata from structure
   */
  private extractMetadata(structure: any): StructureMetadata {
    try {
      // Access the structure object from the state object
      const structureData = structure.obj?.data;

      if (!structureData) {
        console.warn('[MolstarService] No structure data available for metadata extraction');
        return {
          title: 'Unknown Structure',
          chains: ['A'],
          atomCount: 0,
          residueCount: 0,
        };
      }

      // Extract basic information
      const model = structureData.models?.[0];
      const title = model?.label || structureData.label || 'Unknown Structure';

      // Extract chain information
      const chains: string[] = [];
      const units = structureData.units || [];

      for (const unit of units) {
        const chainId = unit.chainGroupId || unit.model?.label;
        if (chainId && !chains.includes(chainId)) {
          chains.push(chainId);
        }
      }

      // Extract atom and residue counts
      const atomCount = structureData.elementCount || 0;

      // Estimate residue count from atom count (approximate: 1 residue ~ 8-10 atoms)
      const residueCount = structureData.residueCount || Math.floor(atomCount / 9);

      return {
        title,
        chains: chains.length > 0 ? chains : ['A'],
        atomCount,
        residueCount,
      };
    } catch (error) {
      console.error('[MolstarService] Metadata extraction failed:', error);

      // Return default metadata on error
      return {
        title: 'Unknown Structure',
        chains: ['A'],
        atomCount: 0,
        residueCount: 0,
      };
    }
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    if (!this.viewer) return;

    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      if (elapsed >= 1000) {
        this.performanceMetrics.frameRate = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.viewer) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }
}

/**
 * Export singleton instance
 */
export const molstarService = MolstarService.getInstance();
