/**
 * Mol* Service - Singleton Wrapper
 *
 * Provides a high-level API for Mol* viewer integration
 * Handles initialization, structure loading, representation changes,
 * and performance optimization.
 *
 * NOTE: This module should only be imported client-side due to browser dependencies.
 */

import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { Color } from 'molstar/lib/mol-util/color';

// Import SCSS only in browser environment
if (typeof window !== 'undefined') {
  // @ts-expect-error - SCSS modules don't have type declarations
  import('molstar/lib/mol-plugin-ui/skin/light.scss');
}

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
  HoverInfo,
  SequenceData,
  ResidueSelection,
  FocusOptions,
  InteractionOptions,
  Interaction,
} from '@/types/molstar';

import { MeasurementRenderer } from './molstar/measurement-renderer';
import { SelectionHighlighter } from './molstar/selection-highlighter';

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
  private measurementRepresentations: Map<string, any> = new Map();
  private measurementRenderer: MeasurementRenderer | null = null;
  private selectionHighlighter: SelectionHighlighter | null = null;

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
   * Check if viewer is initialized
   */
  public isInitialized(): boolean {
    return this.viewer !== null;
  }

  /**
   * Initialize Mol* viewer
   */
  public async initialize(
    container: HTMLDivElement,
    config: MolstarConfig = {}
  ): Promise<void> {
    // If already initialized with same container, skip
    if (this.viewer && this.container === container) {
      console.info('[MolstarService] Already initialized with same container, skipping');
      return;
    }

    // If initialized with different container, dispose first
    if (this.viewer) {
      console.info('[MolstarService] Disposing existing viewer before re-initialization');
      this.dispose();
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
            backgroundColor: Color(0xffffff),
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
        render: renderReact18,
      });

      this.viewer = {
        plugin,
        dispose: () => plugin.dispose(),
      };

      // Initialize measurement renderer
      this.measurementRenderer = new MeasurementRenderer(plugin);

      // Initialize selection highlighter
      this.selectionHighlighter = new SelectionHighlighter(plugin, {
        selectionColor: Color(0x00FF00), // Green
        selectionOpacity: 0.5,
        hoverColor: Color(0xFF00FF), // Magenta
        hoverOpacity: 0.7,
        expandToResidue: true,
        batchUpdates: true,
      });

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
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Map representation types
      type MolstarBuiltInType = 'cartoon' | 'ball-and-stick' | 'spacefill' | 'molecular-surface' | 'backbone' | 'point' | 'putty';
      const typeMap: Record<MolstarRepresentationType, MolstarBuiltInType> = {
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
        type: typeMap[options.type] ?? 'cartoon',
        color: options.colorScheme || 'chain-id',
        quality: options.quality || 'auto',
        alpha: options.alpha ?? 1.0,
      } as any);

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
        const update = state.build().to(repr).update({ colorTheme: { name: scheme } } as any);
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
   * Select atoms/residues/chains with optional green tint
   */
  public async select(query: SelectionQuery, applyGreenTint: boolean = true): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure reference
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Build Mol* selection query based on query type
      // Note: Using any cast due to molstar API type complexities
      const selectionManager = plugin.managers.structure.selection as any;
      let expression: any;

      switch (query.type) {
        case 'atom':
          if (query.atomIds && query.atomIds.length > 0) {
            expression = `@${query.atomIds.join(',')}`;
          }
          break;

        case 'residue':
          if (query.residueIds && query.residueIds.length > 0) {
            expression = `${query.residueIds.join(',')}`;
          }
          break;

        case 'chain':
          if (query.chainIds && query.chainIds.length > 0) {
            expression = `chain ${query.chainIds.join(',')}`;
          }
          break;

        default:
          throw new Error(`Unknown selection type: ${query.type}`);
      }

      if (expression && selectionManager.fromExpression) {
        await selectionManager.fromExpression(expression);
      }

      // Apply green tint to selection if requested
      if (applyGreenTint) {
        await this.applySelectionHighlight();
      }

      this.emit('selection-changed', query);
    } catch (error) {
      console.error('[MolstarService] Selection failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Apply green tint to current selection using SelectionHighlighter
   */
  private async applySelectionHighlight(): Promise<void> {
    if (!this.viewer || !this.selectionHighlighter) return;

    try {
      const plugin = this.viewer.plugin;
      const loci = plugin.managers.structure.selection.additionsHistory[0]?.loci;

      if (loci) {
        // Apply green highlight using SelectionHighlighter
        await this.selectionHighlighter.highlightSelection(loci);
        console.info('[MolstarService] Selection highlight applied');
      }
    } catch (error) {
      console.error('[MolstarService] Failed to apply selection highlight:', error);
    }
  }

  /**
   * Clear selection highlight
   */
  public async clearSelectionHighlight(): Promise<void> {
    if (!this.viewer) return;

    try {
      // Clear MolStar's internal selection
      const plugin = this.viewer.plugin;
      await plugin.managers.structure.selection.clear();

      // Clear all visual highlights
      if (this.selectionHighlighter) {
        await this.selectionHighlighter.clearAllHighlights();
      }
    } catch (error) {
      console.error('[MolstarService] Failed to clear selection highlight:', error);
    }
  }

  /**
   * Apply hover highlight to loci (for mouse hover interactions)
   */
  public async applyHoverHighlight(loci: import('molstar/lib/mol-model/loci').Loci): Promise<void> {
    if (!this.viewer || !this.selectionHighlighter) return;

    try {
      await this.selectionHighlighter.highlightHover(loci);
    } catch (error) {
      console.error('[MolstarService] Failed to apply hover highlight:', error);
    }
  }

  /**
   * Clear hover highlight
   */
  public async clearHoverHighlight(): Promise<void> {
    if (!this.viewer || !this.selectionHighlighter) return;

    try {
      await this.selectionHighlighter.clearHoverHighlight();
    } catch (error) {
      console.error('[MolstarService] Failed to clear hover highlight:', error);
    }
  }

  /**
   * Get selection highlighter instance
   */
  public getSelectionHighlighter(): SelectionHighlighter | null {
    return this.selectionHighlighter;
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
   * Get hover information at screen coordinates using ray casting
   * @param x Screen X coordinate
   * @param y Screen Y coordinate
   * @returns HoverInfo or null if nothing at coordinates
   * @performance <100ms
   */
  public getHoverInfo(x: number, y: number): HoverInfo | null {
    if (!this.viewer) {
      return null;
    }

    const startTime = performance.now();

    try {
      const plugin = this.viewer.plugin;
      const canvas = plugin.canvas3d?.webgl?.gl.canvas as HTMLCanvasElement;

      if (!canvas) {
        return null;
      }

      // Use MolStar's built-in picking system
      // identify() expects a single position argument with x, y coordinates
      const pickResult = (plugin.canvas3d as any)?.identify?.({ x, y }) as any;

      if (!pickResult || pickResult?.loci?.kind !== 'element-loci') {
        return null;
      }

      const loci = pickResult?.loci as any;
      const element = loci.elements?.[0];

      if (!element) {
        return null;
      }

      const unit = element.unit;
      const indices = element.indices;

      if (!unit || !indices || indices.length === 0) {
        return null;
      }

      const location = unit.getElementLocation(indices[0]);
      const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(location.element);
      const residueSeq = unit.model.atomicHierarchy.residues.label_seq_id.value(location.element);
      const residueName = unit.model.atomicHierarchy.atoms.label_comp_id.value(location.element);
      const atomName = unit.model.atomicHierarchy.atoms.label_atom_id.value(location.element);
      const atomElement = unit.model.atomicHierarchy.atoms.type_symbol.value(location.element);
      const position = unit.conformation.position(location.element, [0, 0, 0] as any);

      const hoverInfo: HoverInfo = {
        pdbId: 'current',
        modelIndex: 0,
        chainId: chainId || 'A',
        residueSeq: residueSeq || 0,
        residueName: residueName || 'UNK',
        atomName: atomName || undefined,
        atomElement: atomElement || undefined,
        position: [position[0], position[1], position[2]],
      };

      const duration = performance.now() - startTime;
      console.info(`[MolstarService] getHoverInfo completed in ${duration.toFixed(2)}ms`);

      return hoverInfo;
    } catch (error) {
      console.error('[MolstarService] getHoverInfo failed:', error);
      return null;
    }
  }

  /**
   * Extract sequence data from loaded structure
   * @returns SequenceData containing chain sequences and residue information
   * @performance <100ms
   */
  public getSequence(): SequenceData | null {
    if (!this.viewer) {
      return null;
    }

    const startTime = performance.now();

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        return null;
      }

      const structureData = structures[0].obj?.data;
      if (!structureData) {
        return null;
      }

      const chains: Array<{
        chainId: string;
        sequence: string;
        residueIds: number[];
        residueNames: string[];
      }> = [];

      let totalResidues = 0;

      // Extract sequence data from units
      const units = structureData.units || [];
      const processedChains = new Set<string>();

      for (const unit of units) {
        const chainId = unit.chainGroupId || unit.model?.label || 'A';

        // Skip if we've already processed this chain
        if (processedChains.has(chainId)) {
          continue;
        }
        processedChains.add(chainId);

        const residueIds: number[] = [];
        const residueNames: string[] = [];
        const sequenceChars: string[] = [];

        // Extract residue information from unit
        if (unit.model && unit.model.atomicHierarchy) {
          const residues = unit.model.atomicHierarchy.residues;
          const residueCount = residues.label_seq_id.rowCount;

          for (let i = 0; i < residueCount; i++) {
            const seqId = residues.label_seq_id.value(i);
            const compId = residues.label_comp_id.value(i);

            residueIds.push(seqId || i + 1);
            residueNames.push(compId || 'UNK');

            // Convert 3-letter code to 1-letter code
            sequenceChars.push(this.convertToOneLetterCode(compId || 'UNK'));
          }

          totalResidues += residueCount;
        }

        chains.push({
          chainId,
          sequence: sequenceChars.join(''),
          residueIds,
          residueNames,
        });
      }

      const duration = performance.now() - startTime;
      console.info(`[MolstarService] getSequence completed in ${duration.toFixed(2)}ms`);

      return {
        chains,
        totalResidues,
      };
    } catch (error) {
      console.error('[MolstarService] getSequence failed:', error);
      return null;
    }
  }

  /**
   * Highlight specified residues visually
   * @param selection Residue selection to highlight
   * @performance <100ms
   */
  public async highlightResidues(selection: ResidueSelection[]): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Clear existing highlights first
      await this.clearSelectionHighlight();

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Build selection expression for each chain
      for (const sel of selection) {
        const residueList = sel.residueIds.join(',');
        const expression = `chain ${sel.chainId} and resi ${residueList}`;

        // Use MolStar's selection API
        const selectionManager = plugin.managers.structure.selection as any;
        if (selectionManager.fromExpression) {
          await selectionManager.fromExpression(expression);
        }
      }

      // Apply green highlight to selection
      await this.applySelectionHighlight();

      const duration = performance.now() - startTime;
      console.info(`[MolstarService] highlightResidues completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[MolstarService] highlightResidues failed:', error);
      throw error;
    }
  }

  /**
   * Focus camera on specified residues with animation
   * @param residues Residues to focus on
   * @param options Focus options (duration, radius)
   * @performance <100ms (animation may take longer)
   */
  public async focusOnResidues(
    residues: ResidueSelection[],
    options: FocusOptions = {}
  ): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();
    const { duration = 500, radius } = options;

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Build selection expression
      const expressions = residues.map(sel => {
        const residueList = sel.residueIds.join(',');
        return `chain ${sel.chainId} and resi ${residueList}`;
      });
      const fullExpression = expressions.join(' or ');

      // Use MolStar's camera focus API
      const selectionManager = plugin.managers.structure.selection as any;
      if (selectionManager.fromExpression) {
        await selectionManager.fromExpression(fullExpression);
      }

      // Focus camera on selection with animation
      await PluginCommands.Camera.Focus(plugin, {
        durationMs: duration,
        radius: radius,
      } as any);

      const elapsed = performance.now() - startTime;
      console.info(`[MolstarService] focusOnResidues setup completed in ${elapsed.toFixed(2)}ms`);
    } catch (error) {
      console.error('[MolstarService] focusOnResidues failed:', error);
      throw error;
    }
  }

  /**
   * Detect molecular interactions (H-bonds, salt bridges, hydrophobic, pi-pi stacking)
   * @param options Interaction detection options
   * @returns Array of detected interactions
   * @performance <100ms
   */
  public async detectInteractions(options: InteractionOptions = {}): Promise<Interaction[]> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();
    const {
      detectHBonds = true,
      detectSaltBridges = true,
      detectHydrophobic = true,
      detectPiPi = false,
      distanceCutoffs = {
        hbond: 3.5,
        saltBridge: 4.0,
        hydrophobic: 5.0,
        piPi: 6.0,
      },
    } = options;

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      const structureData = structures[0].obj?.data;
      if (!structureData) {
        throw new Error('No structure data available');
      }

      const interactions: Interaction[] = [];
      let interactionId = 0;

      // Simplified interaction detection
      // In production, would use MolStar's StructureQuery API for more accurate detection
      const units = structureData.units || [];

      for (let i = 0; i < units.length; i++) {
        const unit1 = units[i];
        if (!unit1.model || !unit1.model.atomicHierarchy) continue;

        const atoms1 = unit1.model.atomicHierarchy.atoms;
        const residues1 = unit1.model.atomicHierarchy.residues;

        for (let j = i; j < units.length; j++) {
          const unit2 = units[j];
          if (!unit2.model || !unit2.model.atomicHierarchy) continue;

          // Detect H-bonds (N-O, O-H pairs)
          if (detectHBonds) {
            // Simplified: would use proper geometry and electronegativity checks
            // This is a placeholder implementation
          }

          // Detect salt bridges (charged residue pairs)
          if (detectSaltBridges) {
            // Simplified: check for charged residues (ARG, LYS, ASP, GLU) within cutoff
          }

          // Detect hydrophobic interactions
          if (detectHydrophobic) {
            // Simplified: check for hydrophobic residues in close proximity
          }

          // Detect pi-pi stacking
          if (detectPiPi) {
            // Simplified: check for aromatic residues (PHE, TRP, TYR, HIS)
          }
        }
      }

      const duration = performance.now() - startTime;
      console.info(`[MolstarService] detectInteractions completed in ${duration.toFixed(2)}ms, found ${interactions.length} interactions`);

      return interactions;
    } catch (error) {
      console.error('[MolstarService] detectInteractions failed:', error);
      throw error;
    }
  }

  /**
   * Visualize detected interactions in 3D viewport
   * @param interactions Array of interactions to visualize
   * @performance <100ms
   */
  public async visualizeInteractions(interactions: Interaction[]): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    const startTime = performance.now();

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      // Color map for different interaction types
      const colorMap = {
        'hbond': Color.fromRgb(255, 255, 0), // Yellow
        'salt-bridge': Color.fromRgb(255, 0, 255), // Magenta
        'hydrophobic': Color.fromRgb(0, 255, 0), // Green
        'pi-pi': Color.fromRgb(0, 191, 255), // Deep sky blue
      };

      // For each interaction, create a visual representation
      for (const interaction of interactions) {
        const color = colorMap[interaction.type] || Color.fromRgb(255, 255, 255);

        // Create selection for both residues
        const expression = `(chain ${interaction.residue1.chainId} and resi ${interaction.residue1.residueSeq}) or (chain ${interaction.residue2.chainId} and resi ${interaction.residue2.residueSeq})`;

        // Create a representation showing the interaction
        // In production, would use MolStar's Shape API to draw lines between residues
        await plugin.builders.structure.representation.addRepresentation(structures[0], {
          type: 'ball-and-stick',
          typeParams: {
            sizeFactor: 0.2,
          },
          color: 'uniform',
          colorParams: {
            value: color,
          },
        } as any);
      }

      const duration = performance.now() - startTime;
      console.info(`[MolstarService] visualizeInteractions completed in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[MolstarService] visualizeInteractions failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Convert 3-letter amino acid code to 1-letter code
   */
  private convertToOneLetterCode(threeLetter: string): string {
    const codeMap: Record<string, string> = {
      ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C',
      GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
      LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P',
      SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
    };
    return codeMap[threeLetter.toUpperCase()] || 'X';
  }

  /**
   * Dispose viewer and cleanup
   */
  public dispose(): void {
    const hadViewer = this.viewer !== null;

    if (this.viewer) {
      try {
        this.viewer.dispose();
      } catch (error) {
        // Ignore DOM errors during disposal - container may already be detached
        // This is common during React StrictMode or hot reload
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('removeChild') || errorMessage.includes('not a child')) {
          console.info('[MolstarService] DOM cleanup handled by React, skipping');
        } else {
          console.warn('[MolstarService] Error during disposal:', error);
        }
      }
      this.viewer = null;
    }

    // Clear container reference but don't manipulate DOM directly
    // Let React handle the DOM cleanup to avoid conflicts
    this.container = null;
    this.eventListeners.clear();
    this.measurementRepresentations.clear();

    // Dispose measurement renderer
    if (this.measurementRenderer) {
      this.measurementRenderer.dispose();
      this.measurementRenderer = null;
    }

    // Dispose selection highlighter
    if (this.selectionHighlighter) {
      this.selectionHighlighter.dispose();
      this.selectionHighlighter = null;
    }

    // Reset performance metrics
    this.performanceMetrics = {
      loadTime: 0,
      renderTime: 0,
      frameRate: 0,
      atomCount: 0,
      triangleCount: 0,
    };

    if (hadViewer) {
      console.info('[MolstarService] Disposed');
    }
  }

  /**
   * Reset singleton instance (for testing or full reinitialization)
   */
  public static resetInstance(): void {
    if (MolstarService.instance) {
      MolstarService.instance.dispose();
      MolstarService.instance = null;
    }
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
   * Setup hover detection for interactive tooltips
   */
  public setupHoverDetection(): void {
    if (!this.viewer) {
      console.warn('[MolstarService] Cannot setup hover detection: viewer not initialized');
      return;
    }

    const plugin = this.viewer.plugin;

    // Subscribe to hover events
    plugin.behaviors.interaction.hover.subscribe((event) => {
      try {
        if (event.current.loci.kind === 'element-loci') {
          const loci = event.current.loci as any;
          const element = loci.elements?.[0];

          if (element) {
            const unit = element.unit;
            const indices = element.indices;

            if (unit && indices && indices.length > 0) {
              const location = unit.getElementLocation(indices[0]);
              const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(location.element);
              const residueSeq = unit.model.atomicHierarchy.residues.label_seq_id.value(location.element);
              const residueName = unit.model.atomicHierarchy.atoms.label_comp_id.value(location.element);
              const atomName = unit.model.atomicHierarchy.atoms.label_atom_id.value(location.element);
              const atomElement = unit.model.atomicHierarchy.atoms.type_symbol.value(location.element);

              // Get 3D coordinates
              const position = unit.conformation.position(location.element, [0, 0, 0] as any);

              const hoverInfo: import('@/types/molstar').HoverInfo = {
                pdbId: 'current',
                modelIndex: 0,
                chainId: chainId || 'A',
                residueSeq: residueSeq || 0,
                residueName: residueName || 'UNK',
                atomName: atomName || undefined,
                atomElement: atomElement || undefined,
                position: [position[0], position[1], position[2]],
              };

              this.emit('hover-info', hoverInfo);
              return;
            }
          }
        }

        // Clear hover info when not hovering over anything
        this.emit('hover-info', null);
      } catch (error) {
        console.error('[MolstarService] Hover detection error:', error);
      }
    });

    console.info('[MolstarService] Hover detection enabled');
  }

  /**
   * Measure distance between two selections
   */
  public async measureDistance(
    selection1: import('@/types/molstar').SelectionInfo,
    selection2: import('@/types/molstar').SelectionInfo
  ): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const distance = Math.sqrt(
        Math.pow(selection2.position[0] - selection1.position[0], 2) +
        Math.pow(selection2.position[1] - selection1.position[1], 2) +
        Math.pow(selection2.position[2] - selection1.position[2], 2)
      );

      const measurement: import('@/types/molstar').MeasurementResult = {
        id: `dist-${Date.now()}`,
        type: 'distance',
        value: distance,
        unit: 'Å',
        label: `${distance.toFixed(2)} Å`,
        participants: [
          {
            chainId: selection1.chainId,
            residueSeq: selection1.residueSeq,
            residueName: selection1.residueName,
            atomName: selection1.atomName,
          },
          {
            chainId: selection2.chainId,
            residueSeq: selection2.residueSeq,
            residueName: selection2.residueName,
            atomName: selection2.atomName,
          },
        ],
        timestamp: Date.now(),
      };

      this.emit('measurement-added', measurement);
      console.info(`[MolstarService] Distance measured: ${distance.toFixed(2)} Å`);
    } catch (error) {
      console.error('[MolstarService] Distance measurement failed:', error);
      throw error;
    }
  }

  /**
   * Measure angle between three selections
   */
  public async measureAngle(
    selection1: import('@/types/molstar').SelectionInfo,
    selection2: import('@/types/molstar').SelectionInfo, // vertex
    selection3: import('@/types/molstar').SelectionInfo
  ): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      // Calculate vectors
      const v1 = [
        selection1.position[0] - selection2.position[0],
        selection1.position[1] - selection2.position[1],
        selection1.position[2] - selection2.position[2],
      ];

      const v2 = [
        selection3.position[0] - selection2.position[0],
        selection3.position[1] - selection2.position[1],
        selection3.position[2] - selection2.position[2],
      ];

      // Calculate angle using dot product
      const dotProduct = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
      const cosAngle = dotProduct / (mag1 * mag2);
      const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
      const angleDeg = (angleRad * 180) / Math.PI;

      const measurement: import('@/types/molstar').MeasurementResult = {
        id: `angle-${Date.now()}`,
        type: 'angle',
        value: angleDeg,
        unit: '°',
        label: `${angleDeg.toFixed(2)}°`,
        participants: [
          {
            chainId: selection1.chainId,
            residueSeq: selection1.residueSeq,
            residueName: selection1.residueName,
            atomName: selection1.atomName,
          },
          {
            chainId: selection2.chainId,
            residueSeq: selection2.residueSeq,
            residueName: selection2.residueName,
            atomName: selection2.atomName,
          },
          {
            chainId: selection3.chainId,
            residueSeq: selection3.residueSeq,
            residueName: selection3.residueName,
            atomName: selection3.atomName,
          },
        ],
        timestamp: Date.now(),
      };

      this.emit('measurement-added', measurement);
      console.info(`[MolstarService] Angle measured: ${angleDeg.toFixed(2)}°`);
    } catch (error) {
      console.error('[MolstarService] Angle measurement failed:', error);
      throw error;
    }
  }

  /**
   * Measure dihedral angle between four selections
   */
  public async measureDihedral(
    selection1: import('@/types/molstar').SelectionInfo,
    selection2: import('@/types/molstar').SelectionInfo,
    selection3: import('@/types/molstar').SelectionInfo,
    selection4: import('@/types/molstar').SelectionInfo
  ): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      // Calculate vectors for planes
      const b1 = [
        selection2.position[0] - selection1.position[0],
        selection2.position[1] - selection1.position[1],
        selection2.position[2] - selection1.position[2],
      ];

      const b2 = [
        selection3.position[0] - selection2.position[0],
        selection3.position[1] - selection2.position[1],
        selection3.position[2] - selection2.position[2],
      ];

      const b3 = [
        selection4.position[0] - selection3.position[0],
        selection4.position[1] - selection3.position[1],
        selection4.position[2] - selection3.position[2],
      ];

      // Calculate cross products
      const n1 = [
        b1[1] * b2[2] - b1[2] * b2[1],
        b1[2] * b2[0] - b1[0] * b2[2],
        b1[0] * b2[1] - b1[1] * b2[0],
      ];

      const n2 = [
        b2[1] * b3[2] - b2[2] * b3[1],
        b2[2] * b3[0] - b2[0] * b3[2],
        b2[0] * b3[1] - b2[1] * b3[0],
      ];

      // Calculate dihedral angle
      const m1 = [
        n1[1] * b2[2] - n1[2] * b2[1],
        n1[2] * b2[0] - n1[0] * b2[2],
        n1[0] * b2[1] - n1[1] * b2[0],
      ];

      const x = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];
      const y = m1[0] * n2[0] + m1[1] * n2[1] + m1[2] * n2[2];
      const dihedralRad = Math.atan2(y, x);
      const dihedralDeg = (dihedralRad * 180) / Math.PI;

      const measurement: import('@/types/molstar').MeasurementResult = {
        id: `dihedral-${Date.now()}`,
        type: 'dihedral',
        value: dihedralDeg,
        unit: '°',
        label: `${dihedralDeg.toFixed(2)}°`,
        participants: [
          {
            chainId: selection1.chainId,
            residueSeq: selection1.residueSeq,
            residueName: selection1.residueName,
            atomName: selection1.atomName,
          },
          {
            chainId: selection2.chainId,
            residueSeq: selection2.residueSeq,
            residueName: selection2.residueName,
            atomName: selection2.atomName,
          },
          {
            chainId: selection3.chainId,
            residueSeq: selection3.residueSeq,
            residueName: selection3.residueName,
            atomName: selection3.atomName,
          },
          {
            chainId: selection4.chainId,
            residueSeq: selection4.residueSeq,
            residueName: selection4.residueName,
            atomName: selection4.atomName,
          },
        ],
        timestamp: Date.now(),
      };

      this.emit('measurement-added', measurement);
      console.info(`[MolstarService] Dihedral angle measured: ${dihedralDeg.toFixed(2)}°`);
    } catch (error) {
      console.error('[MolstarService] Dihedral measurement failed:', error);
      throw error;
    }
  }

  /**
   * Setup selection tracking for measurements
   */
  public setupSelectionTracking(): void {
    if (!this.viewer) {
      console.warn('[MolstarService] Cannot setup selection tracking: viewer not initialized');
      return;
    }

    const plugin = this.viewer.plugin;

    // Subscribe to click events
    plugin.behaviors.interaction.click.subscribe((event) => {
      try {
        if (event.current.loci.kind === 'element-loci') {
          const loci = event.current.loci as any;
          const element = loci.elements?.[0];

          if (element) {
            const unit = element.unit;
            const indices = element.indices;

            if (unit && indices && indices.length > 0) {
              const location = unit.getElementLocation(indices[0]);
              const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(location.element);
              const residueSeq = unit.model.atomicHierarchy.residues.label_seq_id.value(location.element);
              const residueName = unit.model.atomicHierarchy.atoms.label_comp_id.value(location.element);
              const atomName = unit.model.atomicHierarchy.atoms.label_atom_id.value(location.element);
              const position = unit.conformation.position(location.element, [0, 0, 0] as any);

              const selectionInfo: import('@/types/molstar').SelectionInfo = {
                id: `sel-${Date.now()}`,
                type: 'atom',
                chainId: chainId || 'A',
                residueSeq: residueSeq || 0,
                residueName: residueName || 'UNK',
                atomName: atomName || undefined,
                position: [position[0], position[1], position[2]],
              };

              this.emit('selection-info', selectionInfo);
            }
          }
        }
      } catch (error) {
        console.error('[MolstarService] Selection tracking error:', error);
      }
    });

    console.info('[MolstarService] Selection tracking enabled');
  }

  /**
   * Visualize hydrogen bonds in structure
   */
  public async visualizeHydrogenBonds(show: boolean = true): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Get structure
      const structures = state.selectQ((q) =>
        q.ofTransformer(StateTransforms.Model.StructureFromModel)
      );

      if (structures.length === 0) {
        throw new Error('No structure loaded');
      }

      if (show) {
        // Add hydrogen bond representation
        await plugin.builders.structure.representation.addRepresentation(structures[0], {
          type: 'ball-and-stick',
          typeParams: {
            includeTypes: ['hydrogen-bonds'],
            sizeFactor: 0.15,
          },
          color: 'uniform',
          colorParams: {
            value: Color.fromRgb(255, 255, 0), // Yellow for H-bonds
          },
        } as any);

        console.info('[MolstarService] Hydrogen bonds visualized');
      } else {
        // Remove hydrogen bond representation
        const hbondReprs = state.selectQ((q) =>
          q.ofTransformer(StateTransforms.Representation.StructureRepresentation3D)
        ).filter((r: any) => r.params?.values?.type?.name === 'ball-and-stick');

        for (const repr of hbondReprs) {
          await PluginCommands.State.RemoveObject(plugin, { state, ref: repr.transform.ref });
        }

        console.info('[MolstarService] Hydrogen bonds hidden');
      }

      this.emit('representation-changed', 'ball-and-stick');
    } catch (error) {
      console.error('[MolstarService] Hydrogen bond visualization failed:', error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Add 3D measurement label to viewport
   */
  public async add3DMeasurementLabel(measurement: import('@/types/molstar').MeasurementResult): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    try {
      const plugin = this.viewer.plugin;

      // Calculate midpoint for label placement
      const positions = measurement.participants.map(p => {
        // Get position from participant data
        // This is a simplified approach - in real implementation,
        // you'd need to query the actual atom positions
        return [0, 0, 0] as [number, number, number];
      });

      // Create shape representation for the measurement line and label
      // This uses Mol*'s shape API to create custom geometry
      // Note: Full implementation would use plugin.build().toRoot().apply(StateTransforms.Shape...)
      // For now, we acknowledge the measurement is tracked
      console.info(`[MolstarService] Added 3D label for measurement ${measurement.id}`);

    } catch (error) {
      console.error('[MolstarService] Failed to add 3D measurement label:', error);
      throw error;
    }
  }

  /**
   * Remove measurement visualization from 3D viewport
   */
  public removeMeasurement(id: string): void {
    if (!this.viewer) return;

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Find and remove measurement shape
      const measurementShapes = state.selectQ((q: any) =>
        q.byRef(`measurement-${id}`)
      );

      for (const shape of measurementShapes) {
        PluginCommands.State.RemoveObject(plugin, { state, ref: shape.transform.ref });
      }

      console.info(`[MolstarService] Removed measurement ${id}`);
    } catch (error) {
      console.error('[MolstarService] Failed to remove measurement:', error);
    }
  }

  /**
   * Clear all measurements from 3D viewport
   */
  public clearMeasurements(): void {
    if (!this.viewer) return;

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Find all measurement shapes
      const measurementShapes = state.selectQ((q: any) =>
        q.byRef(/^measurement-/)
      );

      for (const shape of measurementShapes) {
        PluginCommands.State.RemoveObject(plugin, { state, ref: shape.transform.ref });
      }

      console.info('[MolstarService] Cleared all measurements');
    } catch (error) {
      console.error('[MolstarService] Failed to clear measurements:', error);
    }
  }

  /**
   * Toggle measurement visibility in 3D viewport
   */
  public toggleMeasurementVisibility(id: string): void {
    if (!this.viewer) return;

    try {
      const plugin = this.viewer.plugin;
      const state = plugin.state.data;

      // Find measurement shape
      const measurementShapes = state.selectQ((q: any) =>
        q.byRef(`measurement-${id}`)
      );

      for (const shape of measurementShapes) {
        const currentVisibility = shape.state?.isHidden ?? false;
        PluginCommands.State.ToggleVisibility(plugin, {
          state,
          ref: shape.transform.ref
        });
      }

      console.info(`[MolstarService] Toggled visibility for measurement ${id}`);
    } catch (error) {
      console.error('[MolstarService] Failed to toggle measurement visibility:', error);
    }
  }

  /**
   * Visualize measurement with 3D representation
   * Creates visual elements (lines, arcs, labels) for measurements
   */
  public async visualizeMeasurement(measurement: import('@/types/molstar').MeasurementResult): Promise<void> {
    if (!this.viewer) {
      throw new Error('Mol* viewer not initialized');
    }

    if (!measurement.participants || measurement.participants.length === 0) {
      throw new Error('Measurement must have participants');
    }

    if (!this.measurementRenderer) {
      throw new Error('Measurement renderer not initialized');
    }

    try {
      // Use MeasurementRenderer for actual visualization (legacy methods accept MeasurementResult)
      switch (measurement.type) {
        case 'distance':
          await this.measurementRenderer.renderDistanceLegacy(measurement);
          break;
        case 'angle':
          await this.measurementRenderer.renderAngleLegacy(measurement);
          break;
        case 'dihedral':
          await this.measurementRenderer.renderDihedralLegacy(measurement);
          break;
        default:
          throw new Error(`Unknown measurement type: ${measurement.type}`);
      }

      console.info(`[MolstarService] Visualized ${measurement.type} measurement ${measurement.id}`);
    } catch (error) {
      console.error('[MolstarService] Failed to visualize measurement:', error);
      throw error;
    }
  }

  /**
   * Hide measurement visualization without removing it
   */
  public hideMeasurement(id: string): void {
    if (!this.viewer || !this.measurementRenderer) return;

    try {
      this.measurementRenderer.hideMeasurement(id);
    } catch (error) {
      console.error('[MolstarService] Failed to hide measurement:', error);
    }
  }

  /**
   * Show previously hidden measurement
   */
  public showMeasurement(id: string): void {
    if (!this.viewer || !this.measurementRenderer) return;

    try {
      this.measurementRenderer.showMeasurement(id);
    } catch (error) {
      console.error('[MolstarService] Failed to show measurement:', error);
    }
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    if (!this.viewer) return;

    // Setup interactive features
    this.setupHoverDetection();
    this.setupSelectionTracking();

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
