/**
 * Mol* TypeScript Type Definitions
 *
 * Custom type definitions for Mol* integration with the LAB Visualizer
 */

import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { StateTransformer } from 'molstar/lib/mol-state';

/**
 * Mol* viewer configuration options
 */
export interface MolstarConfig {
  layoutIsExpanded?: boolean;
  layoutShowControls?: boolean;
  layoutShowRemoteState?: boolean;
  layoutShowSequence?: boolean;
  layoutShowLog?: boolean;
  layoutShowLeftPanel?: boolean;
  viewportShowExpand?: boolean;
  viewportShowSelectionMode?: boolean;
  viewportShowAnimation?: boolean;
  pdbProvider?: 'pdbe' | 'rcsb';
  emdbProvider?: 'pdbe' | 'rcsb';
}

/**
 * Mol* viewer instance wrapper
 */
export interface MolstarViewer {
  plugin: PluginContext;
  dispose: () => void;
}

/**
 * Structure loading options
 */
export interface LoadStructureOptions {
  format?: 'pdb' | 'mmcif' | 'sdf' | 'mol2';
  label?: string;
  assemblyId?: string;
}

/**
 * Representation types supported
 */
export type MolstarRepresentationType =
  | 'cartoon'
  | 'ball-and-stick'
  | 'spacefill'
  | 'surface'
  | 'backbone'
  | 'point'
  | 'putty';

/**
 * Color scheme types
 */
export type MolstarColorScheme =
  | 'element-symbol'
  | 'chain-id'
  | 'entity-id'
  | 'model-index'
  | 'structure-index'
  | 'residue-name'
  | 'secondary-structure'
  | 'uniform';

/**
 * Structure representation options
 */
export interface RepresentationOptions {
  type: MolstarRepresentationType;
  colorScheme: MolstarColorScheme;
  quality?: 'auto' | 'highest' | 'higher' | 'high' | 'medium' | 'low' | 'lower' | 'lowest';
  alpha?: number;
}

/**
 * Camera snapshot for state management
 */
export interface CameraSnapshot {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
}

/**
 * Camera state for synchronization
 */
export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
  fov?: number;
}

/**
 * Selection query for atoms/residues/chains
 */
export interface SelectionQuery {
  type: 'atom' | 'residue' | 'chain';
  atomIds?: string[];
  residueIds?: string[];
  chainIds?: string[];
}

/**
 * Structure metadata
 */
export interface StructureMetadata {
  title?: string;
  resolution?: number;
  chains: string[];
  atomCount: number;
  residueCount: number;
  experimentMethod?: string;
  depositionDate?: string;
}

/**
 * Mol* service events
 */
export interface MolstarEvents {
  'structure-loaded': (metadata: StructureMetadata) => void;
  'representation-changed': (type: MolstarRepresentationType) => void;
  'color-scheme-changed': (scheme: MolstarColorScheme) => void;
  'selection-changed': (query: SelectionQuery) => void;
  'camera-changed': (snapshot: CameraSnapshot) => void;
  'error': (error: Error) => void;
}

/**
 * Export options for images
 */
export interface ExportImageOptions {
  format: 'png' | 'jpg';
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  frameRate: number;
  atomCount: number;
  triangleCount: number;
  memoryUsage?: number;
}

/**
 * Trajectory frame for MD simulation playback
 */
export interface TrajectoryFrame {
  index: number;
  coordinates: Float32Array;
  timestamp?: number;
}

/**
 * Trajectory playback options
 */
export interface TrajectoryOptions {
  frames: TrajectoryFrame[];
  fps?: number;
  loop?: boolean;
  startFrame?: number;
}

/**
 * LOD-specific types for progressive loading integration
 */

/**
 * LOD Level enumeration
 */
export enum LODLevel {
  PREVIEW = 1,
  INTERACTIVE = 2,
  FULL = 3,
}

/**
 * LOD stage result from progressive loading
 */
export interface LODStageResult {
  level: LODLevel;
  duration: number;
  atomsRendered: number;
  fps: number;
  success: boolean;
}

/**
 * Progressive loading progress callback
 */
export interface LODProgressCallback {
  (progress: number, level: LODLevel, message: string): void;
}

/**
 * LOD configuration for MolStar integration
 */
export interface LODConfig {
  memoryBudgetMB?: number;
  enableCaching?: boolean;
  autoProgressToFull?: boolean;
  targetFPS?: number;
  onProgress?: LODProgressCallback;
}
