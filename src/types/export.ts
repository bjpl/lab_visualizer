/**
 * Export Types
 * Types for exporting visualizations, 3D models, and annotated documents
 */

/**
 * Export format types
 */
export type ExportImageFormat = 'png' | 'jpg' | 'webp';
export type Export3DFormat = 'gltf' | 'obj' | 'stl';
export type ExportDocumentFormat = 'pdf' | 'json';

/**
 * Image export resolution presets
 */
export enum ImageResolution {
  SD = 'sd',           // 1280x720
  HD = 'hd',           // 1920x1080
  FULL_HD = 'fullhd',  // 2560x1440
  ULTRA_HD = 'uhd',    // 3840x2160
  CUSTOM = 'custom'
}

/**
 * Resolution dimensions
 */
export interface ResolutionDimensions {
  width: number;
  height: number;
  label: string;
}

/**
 * Resolution mapping
 */
export const RESOLUTION_MAP: Record<ImageResolution, ResolutionDimensions> = {
  [ImageResolution.SD]: { width: 1280, height: 720, label: '720p (SD)' },
  [ImageResolution.HD]: { width: 1920, height: 1080, label: '1080p (HD)' },
  [ImageResolution.FULL_HD]: { width: 2560, height: 1440, label: '1440p (Full HD)' },
  [ImageResolution.ULTRA_HD]: { width: 3840, height: 2160, label: '2160p (4K)' },
  [ImageResolution.CUSTOM]: { width: 0, height: 0, label: 'Custom' }
};

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number; // 0-1
  fontSize: number;
  color: string;
}

/**
 * Image export options
 */
export interface ImageExportOptions {
  format: ExportImageFormat;
  resolution: ImageResolution;
  customWidth?: number;
  customHeight?: number;
  quality: number; // 0-100, for JPEG/WebP
  transparent: boolean; // For PNG
  includeAnnotations: boolean;
  watermark?: WatermarkConfig;
  captureViewportOnly: boolean;
  backgroundColor?: string;
}

/**
 * 3D model export options
 */
export interface Model3DExportOptions {
  format: Export3DFormat;
  includeTextures: boolean;
  includeColors: boolean;
  includeNormals: boolean;
  optimizeGeometry: boolean;
  scale: number;
  binary: boolean; // For glTF - binary vs JSON
  embedTextures: boolean; // For glTF
}

/**
 * PDF annotation style
 */
export interface PDFAnnotationStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth: number;
}

/**
 * PDF export options
 */
export interface PDFExportOptions {
  title: string;
  author?: string;
  includeMetadata: boolean;
  includeAnnotations: boolean;
  annotationStyle?: PDFAnnotationStyle;
  includeStructureImage: boolean;
  imageResolution: ImageResolution;
  pageSize: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Session state export options
 */
export interface SessionExportOptions {
  includeCamera: boolean;
  includeAnnotations: boolean;
  includeSelection: boolean;
  includeVisualizationSettings: boolean;
  includeMetadata: boolean;
  format: 'json';
  prettyPrint: boolean;
}

/**
 * Annotation data for export
 */
export interface ExportAnnotation {
  id: string;
  userId: string;
  userName: string;
  content: string;
  position: { x: number; y: number; z: number };
  target?: {
    type: 'atom' | 'residue' | 'chain';
    id: string | number;
    label: string;
  };
  color: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

/**
 * Camera state for export
 */
export interface ExportCameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
  fov?: number;
}

/**
 * Visualization settings for export
 */
export interface ExportVisualizationSettings {
  representation: string;
  colorScheme: string;
  showWater: boolean;
  showLigands: boolean;
  showHydrogens: boolean;
  backgroundGradient: boolean;
  ambientOcclusion: boolean;
  shadows: boolean;
}

/**
 * Session state data
 */
export interface SessionStateData {
  version: string;
  timestamp: number;
  structureId: string;
  camera?: ExportCameraState;
  annotations?: ExportAnnotation[];
  selection?: {
    type: 'atom' | 'residue' | 'chain';
    ids: string[];
  };
  visualizationSettings?: ExportVisualizationSettings;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Export result types
 */
export interface ImageExportResult {
  type: 'image';
  format: ExportImageFormat;
  blob: Blob;
  filename: string;
  dimensions: { width: number; height: number };
  size: number; // bytes
}

export interface Model3DExportResult {
  type: '3d-model';
  format: Export3DFormat;
  blob: Blob;
  filename: string;
  size: number; // bytes
  additionalFiles?: { filename: string; blob: Blob }[]; // For textures, materials, etc.
}

export interface PDFExportResult {
  type: 'pdf';
  blob: Blob;
  filename: string;
  size: number; // bytes
  pageCount: number;
}

export interface SessionExportResult {
  type: 'session';
  blob: Blob;
  filename: string;
  size: number; // bytes
  data: SessionStateData;
}

export type ExportResult =
  | ImageExportResult
  | Model3DExportResult
  | PDFExportResult
  | SessionExportResult;

/**
 * Export progress information
 */
export interface ExportProgress {
  stage: 'preparing' | 'capturing' | 'processing' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  error?: Error;
}

/**
 * Export service configuration
 */
export interface ExportServiceConfig {
  maxImageWidth: number;
  maxImageHeight: number;
  defaultQuality: number;
  supportedImageFormats: ExportImageFormat[];
  supported3DFormats: Export3DFormat[];
  enableWatermark: boolean;
  defaultWatermarkText: string;
}

/**
 * Default export options
 */
export const DEFAULT_IMAGE_EXPORT_OPTIONS: ImageExportOptions = {
  format: 'png',
  resolution: ImageResolution.HD,
  quality: 95,
  transparent: false,
  includeAnnotations: true,
  captureViewportOnly: false,
  watermark: {
    enabled: false,
    text: 'LAB Visualizer',
    position: 'bottom-right',
    opacity: 0.5,
    fontSize: 14,
    color: '#ffffff'
  }
};

export const DEFAULT_MODEL_EXPORT_OPTIONS: Model3DExportOptions = {
  format: 'gltf',
  includeTextures: true,
  includeColors: true,
  includeNormals: true,
  optimizeGeometry: true,
  scale: 1.0,
  binary: true,
  embedTextures: true
};

export const DEFAULT_PDF_EXPORT_OPTIONS: PDFExportOptions = {
  title: 'LAB Visualization Export',
  includeMetadata: true,
  includeAnnotations: true,
  includeStructureImage: true,
  imageResolution: ImageResolution.HD,
  pageSize: 'letter',
  orientation: 'portrait',
  margins: {
    top: 72,
    right: 72,
    bottom: 72,
    left: 72
  },
  annotationStyle: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
    borderColor: '#cccccc',
    borderWidth: 1
  }
};

export const DEFAULT_SESSION_EXPORT_OPTIONS: SessionExportOptions = {
  includeCamera: true,
  includeAnnotations: true,
  includeSelection: true,
  includeVisualizationSettings: true,
  includeMetadata: true,
  format: 'json',
  prettyPrint: true
};
