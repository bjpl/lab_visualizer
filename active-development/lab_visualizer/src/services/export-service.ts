/**
 * Export Service
 * Handles exporting visualizations, 3D models, PDFs, and session state
 */

import type {
  ExportImageFormat,
  ImageExportOptions,
  Model3DExportOptions,
  PDFExportOptions,
  SessionExportOptions,
  ImageExportResult,
  Model3DExportResult,
  PDFExportResult,
  SessionExportResult,
  ExportProgress,
  SessionStateData,
  ExportAnnotation,
  ExportCameraState,
  ExportVisualizationSettings} from '../types/export';
import {
  Export3DFormat,
  ExportResult,
  RESOLUTION_MAP,
  ImageResolution,
  DEFAULT_IMAGE_EXPORT_OPTIONS,
  DEFAULT_MODEL_EXPORT_OPTIONS,
  DEFAULT_PDF_EXPORT_OPTIONS,
  DEFAULT_SESSION_EXPORT_OPTIONS
} from '../types/export';

/**
 * MolStar viewer interface for export
 */
export interface ExportableViewer {
  // Canvas capture
  getCanvas(): HTMLCanvasElement | null;
  getViewportDimensions(): { width: number; height: number };

  // Camera state
  getCameraState(): ExportCameraState;

  // Annotations
  getAnnotations(): ExportAnnotation[];

  // Selection
  getSelection(): { type: 'atom' | 'residue' | 'chain'; ids: string[] } | null;

  // Visualization settings
  getVisualizationSettings(): ExportVisualizationSettings;

  // Structure data
  getStructureId(): string;
  getStructureData(format: string): Promise<string>;

  // 3D data extraction
  getGeometryData(): {
    vertices: Float32Array;
    normals: Float32Array;
    colors: Float32Array;
    indices: Uint32Array;
  };
}

/**
 * Export Service for all export operations
 */
export class ExportService {
  private static instance: ExportService;
  private progressCallbacks: Map<string, (progress: ExportProgress) => void> = new Map();

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export viewer as image
   */
  async exportImage(
    viewer: ExportableViewer,
    options: Partial<ImageExportOptions> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ImageExportResult> {
    const opts = { ...DEFAULT_IMAGE_EXPORT_OPTIONS, ...options };
    const exportId = this.generateExportId();

    if (onProgress) {
      this.progressCallbacks.set(exportId, onProgress);
    }

    try {
      this.reportProgress(exportId, 'preparing', 10, 'Preparing export...');

      // Get canvas
      const canvas = viewer.getCanvas();
      if (!canvas) {
        throw new Error('Canvas not available for export');
      }

      this.reportProgress(exportId, 'capturing', 30, 'Capturing viewport...');

      // Determine dimensions
      const dimensions = this.getExportDimensions(opts);

      // Create export canvas with proper dimensions
      const exportCanvas = await this.createExportCanvas(
        canvas,
        dimensions.width,
        dimensions.height,
        opts
      );

      this.reportProgress(exportId, 'processing', 60, 'Processing image...');

      // Apply watermark if enabled
      if (opts.watermark?.enabled) {
        await this.applyWatermark(exportCanvas, opts.watermark);
      }

      this.reportProgress(exportId, 'encoding', 80, 'Encoding image...');

      // Convert to blob
      const blob = await this.canvasToBlob(exportCanvas, opts);

      this.reportProgress(exportId, 'complete', 100, 'Export complete');

      const filename = this.generateFilename('image', opts.format);

      return {
        type: 'image',
        format: opts.format,
        blob,
        filename,
        dimensions,
        size: blob.size
      };
    } catch (error) {
      this.reportProgress(exportId, 'error', 0, 'Export failed', error as Error);
      throw error;
    } finally {
      this.progressCallbacks.delete(exportId);
    }
  }

  /**
   * Export 3D model
   */
  async export3DModel(
    viewer: ExportableViewer,
    options: Partial<Model3DExportOptions> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Model3DExportResult> {
    const opts = { ...DEFAULT_MODEL_EXPORT_OPTIONS, ...options };
    const exportId = this.generateExportId();

    if (onProgress) {
      this.progressCallbacks.set(exportId, onProgress);
    }

    try {
      this.reportProgress(exportId, 'preparing', 10, 'Preparing model export...');

      // Get geometry data from viewer
      const geometryData = viewer.getGeometryData();

      this.reportProgress(exportId, 'processing', 40, 'Converting geometry...');

      // Convert based on format
      let blob: Blob;
      const additionalFiles: { filename: string; blob: Blob }[] = [];

      switch (opts.format) {
        case 'gltf':
          const gltfData = await this.convertToGLTF(geometryData, opts);
          blob = gltfData.blob;
          if (gltfData.additionalFiles) {
            additionalFiles.push(...gltfData.additionalFiles);
          }
          break;

        case 'obj':
          const objData = await this.convertToOBJ(geometryData, opts);
          blob = objData.blob;
          if (objData.additionalFiles) {
            additionalFiles.push(...objData.additionalFiles);
          }
          break;

        case 'stl':
          blob = await this.convertToSTL(geometryData, opts);
          break;

        default:
          throw new Error(`Unsupported 3D format: ${opts.format}`);
      }

      this.reportProgress(exportId, 'complete', 100, 'Export complete');

      const filename = this.generateFilename('model', opts.format);

      return {
        type: '3d-model',
        format: opts.format,
        blob,
        filename,
        size: blob.size,
        additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined
      };
    } catch (error) {
      this.reportProgress(exportId, 'error', 0, 'Export failed', error as Error);
      throw error;
    } finally {
      this.progressCallbacks.delete(exportId);
    }
  }

  /**
   * Export annotated PDF
   */
  async exportPDF(
    viewer: ExportableViewer,
    options: Partial<PDFExportOptions> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<PDFExportResult> {
    const opts = { ...DEFAULT_PDF_EXPORT_OPTIONS, ...options };
    const exportId = this.generateExportId();

    if (onProgress) {
      this.progressCallbacks.set(exportId, onProgress);
    }

    try {
      this.reportProgress(exportId, 'preparing', 10, 'Preparing PDF...');

      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');

      // Create PDF with specified page size and orientation
      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'pt',
        format: opts.pageSize
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const { top, right, bottom, left } = opts.margins;

      let yPosition = top;

      // Title
      pdf.setFontSize(18);
      pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'bold');
      pdf.text(opts.title, left, yPosition);
      yPosition += 30;

      // Author
      if (opts.author) {
        pdf.setFontSize(12);
        pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'normal');
        pdf.text(`Author: ${opts.author}`, left, yPosition);
        yPosition += 20;
      }

      this.reportProgress(exportId, 'capturing', 30, 'Capturing structure image...');

      // Structure image
      if (opts.includeStructureImage) {
        const imageResult = await this.exportImage(viewer, {
          format: 'png',
          resolution: opts.imageResolution,
          includeAnnotations: false,
          transparent: false
        });

        const imgData = await this.blobToBase64(imageResult.blob);

        // Calculate image dimensions to fit page
        const maxWidth = pageWidth - left - right;
        const maxHeight = (pageHeight - yPosition - bottom) / 2;

        let imgWidth = imageResult.dimensions.width;
        let imgHeight = imageResult.dimensions.height;
        const aspectRatio = imgWidth / imgHeight;

        if (imgWidth > maxWidth) {
          imgWidth = maxWidth;
          imgHeight = imgWidth / aspectRatio;
        }
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }

        pdf.addImage(imgData, 'PNG', left, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
      }

      this.reportProgress(exportId, 'processing', 60, 'Adding annotations...');

      // Annotations
      if (opts.includeAnnotations) {
        const annotations = viewer.getAnnotations();

        if (annotations.length > 0) {
          // Add new page if needed
          if (yPosition + 100 > pageHeight - bottom) {
            pdf.addPage();
            yPosition = top;
          }

          pdf.setFontSize(14);
          pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'bold');
          pdf.text('Annotations', left, yPosition);
          yPosition += 25;

          pdf.setFontSize(opts.annotationStyle?.fontSize || 10);
          pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'normal');

          for (const annotation of annotations) {
            // Check if we need a new page
            if (yPosition + 60 > pageHeight - bottom) {
              pdf.addPage();
              yPosition = top;
            }

            // Annotation header
            pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'bold');
            pdf.text(`${annotation.userName} - ${new Date(annotation.createdAt).toLocaleString()}`, left, yPosition);
            yPosition += 15;

            // Target info
            if (annotation.target) {
              pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'italic');
              pdf.text(`Target: ${annotation.target.type} ${annotation.target.label}`, left + 20, yPosition);
              yPosition += 15;
            }

            // Content
            pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'normal');
            const lines = pdf.splitTextToSize(annotation.content, pageWidth - left - right - 40);
            pdf.text(lines, left + 20, yPosition);
            yPosition += (lines.length * 15) + 20;
          }
        }
      }

      this.reportProgress(exportId, 'processing', 80, 'Adding metadata...');

      // Metadata
      if (opts.includeMetadata) {
        const visualSettings = viewer.getVisualizationSettings();
        const structureId = viewer.getStructureId();

        // Add new page for metadata
        pdf.addPage();
        yPosition = top;

        pdf.setFontSize(14);
        pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'bold');
        pdf.text('Metadata', left, yPosition);
        yPosition += 25;

        pdf.setFontSize(opts.annotationStyle?.fontSize || 10);
        pdf.setFont(opts.annotationStyle?.fontFamily || 'Helvetica', 'normal');

        pdf.text(`Structure ID: ${structureId}`, left, yPosition);
        yPosition += 15;
        pdf.text(`Representation: ${visualSettings.representation}`, left, yPosition);
        yPosition += 15;
        pdf.text(`Color Scheme: ${visualSettings.colorScheme}`, left, yPosition);
        yPosition += 15;
        pdf.text(`Generated: ${new Date().toLocaleString()}`, left, yPosition);
      }

      this.reportProgress(exportId, 'encoding', 90, 'Generating PDF...');

      // Generate PDF blob
      const pdfBlob = pdf.output('blob');

      this.reportProgress(exportId, 'complete', 100, 'Export complete');

      const filename = this.generateFilename('document', 'pdf');

      return {
        type: 'pdf',
        blob: pdfBlob,
        filename,
        size: pdfBlob.size,
        pageCount: pdf.internal.pages.length - 1 // jsPDF includes a blank first page
      };
    } catch (error) {
      this.reportProgress(exportId, 'error', 0, 'Export failed', error as Error);
      throw error;
    } finally {
      this.progressCallbacks.delete(exportId);
    }
  }

  /**
   * Export session state
   */
  async exportSession(
    viewer: ExportableViewer,
    options: Partial<SessionExportOptions> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<SessionExportResult> {
    const opts = { ...DEFAULT_SESSION_EXPORT_OPTIONS, ...options };
    const exportId = this.generateExportId();

    if (onProgress) {
      this.progressCallbacks.set(exportId, onProgress);
    }

    try {
      this.reportProgress(exportId, 'preparing', 20, 'Collecting session data...');

      const sessionData: SessionStateData = {
        version: '1.0.0',
        timestamp: Date.now(),
        structureId: viewer.getStructureId()
      };

      if (opts.includeCamera) {
        sessionData.camera = viewer.getCameraState();
      }

      if (opts.includeAnnotations) {
        sessionData.annotations = viewer.getAnnotations();
      }

      if (opts.includeSelection) {
        const selection = viewer.getSelection();
        if (selection) {
          sessionData.selection = selection;
        }
      }

      if (opts.includeVisualizationSettings) {
        sessionData.visualizationSettings = viewer.getVisualizationSettings();
      }

      this.reportProgress(exportId, 'encoding', 70, 'Encoding session...');

      // Convert to JSON
      const jsonString = opts.prettyPrint
        ? JSON.stringify(sessionData, null, 2)
        : JSON.stringify(sessionData);

      const blob = new Blob([jsonString], { type: 'application/json' });

      this.reportProgress(exportId, 'complete', 100, 'Export complete');

      const filename = this.generateFilename('session', 'json');

      return {
        type: 'session',
        blob,
        filename,
        size: blob.size,
        data: sessionData
      };
    } catch (error) {
      this.reportProgress(exportId, 'error', 0, 'Export failed', error as Error);
      throw error;
    } finally {
      this.progressCallbacks.delete(exportId);
    }
  }

  // Private helper methods

  private generateExportId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private reportProgress(
    exportId: string,
    stage: ExportProgress['stage'],
    progress: number,
    message?: string,
    error?: Error
  ): void {
    const callback = this.progressCallbacks.get(exportId);
    if (callback) {
      callback({ stage, progress, message, error });
    }
  }

  private getExportDimensions(options: ImageExportOptions): { width: number; height: number } {
    if (options.resolution === ImageResolution.CUSTOM) {
      return {
        width: options.customWidth || 1920,
        height: options.customHeight || 1080
      };
    }

    const resolution = RESOLUTION_MAP[options.resolution];
    return { width: resolution.width, height: resolution.height };
  }

  private async createExportCanvas(
    sourceCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    options: ImageExportOptions
  ): Promise<HTMLCanvasElement> {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Set background if not transparent
    if (!options.transparent && options.backgroundColor) {
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Draw source canvas scaled to target dimensions
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    return exportCanvas;
  }

  private async applyWatermark(
    canvas: HTMLCanvasElement,
    watermark: NonNullable<ImageExportOptions['watermark']>
  ): Promise<void> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Set watermark style
    ctx.font = `${watermark.fontSize}px Arial`;
    ctx.fillStyle = watermark.color;
    ctx.globalAlpha = watermark.opacity;

    // Measure text
    const metrics = ctx.measureText(watermark.text);
    const textWidth = metrics.width;
    const textHeight = watermark.fontSize;

    // Calculate position
    let x = 0;
    let y = 0;
    const padding = 20;

    switch (watermark.position) {
      case 'top-left':
        x = padding;
        y = textHeight + padding;
        break;
      case 'top-right':
        x = canvas.width - textWidth - padding;
        y = textHeight + padding;
        break;
      case 'bottom-left':
        x = padding;
        y = canvas.height - padding;
        break;
      case 'bottom-right':
        x = canvas.width - textWidth - padding;
        y = canvas.height - padding;
        break;
      case 'center':
        x = (canvas.width - textWidth) / 2;
        y = (canvas.height + textHeight) / 2;
        break;
    }

    ctx.fillText(watermark.text, x, y);
    ctx.restore();
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    options: ImageExportOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = this.getMimeType(options.format);
      const quality = options.quality / 100;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  private getMimeType(format: ExportImageFormat): string {
    const mimeTypes: Record<ExportImageFormat, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp'
    };
    return mimeTypes[format];
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private generateFilename(type: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `lab-visualizer-${type}-${timestamp}.${extension}`;
  }

  // 3D format conversion methods

  private async convertToGLTF(
    geometry: ReturnType<ExportableViewer['getGeometryData']>,
    options: Model3DExportOptions
  ): Promise<{ blob: Blob; additionalFiles?: { filename: string; blob: Blob }[] }> {
    // Simplified glTF generation (basic structure)
    const gltf: any = {
      asset: {
        version: '2.0',
        generator: 'LAB Visualizer Export Service'
      },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [
        {
          primitives: [
            {
              attributes: {
                POSITION: 0,
                NORMAL: options.includeNormals ? 1 : undefined,
                COLOR_0: options.includeColors ? 2 : undefined
              },
              indices: 3
            }
          ]
        }
      ],
      accessors: [],
      bufferViews: [],
      buffers: []
    };

    // Add accessors for vertex data
    // This is a simplified version - full implementation would be more complex

    const jsonString = JSON.stringify(gltf, null, options.binary ? undefined : 2);
    const blob = new Blob([jsonString], { type: 'model/gltf+json' });

    return { blob };
  }

  private async convertToOBJ(
    geometry: ReturnType<ExportableViewer['getGeometryData']>,
    options: Model3DExportOptions
  ): Promise<{ blob: Blob; additionalFiles?: { filename: string; blob: Blob }[] }> {
    let objContent = '# Generated by LAB Visualizer\n';
    objContent += '# Vertices\n';

    // Add vertices
    for (let i = 0; i < geometry.vertices.length; i += 3) {
      const x = geometry.vertices[i] * options.scale;
      const y = geometry.vertices[i + 1] * options.scale;
      const z = geometry.vertices[i + 2] * options.scale;
      objContent += `v ${x} ${y} ${z}\n`;
    }

    // Add normals if included
    if (options.includeNormals) {
      objContent += '# Normals\n';
      for (let i = 0; i < geometry.normals.length; i += 3) {
        objContent += `vn ${geometry.normals[i]} ${geometry.normals[i + 1]} ${geometry.normals[i + 2]}\n`;
      }
    }

    // Add faces
    objContent += '# Faces\n';
    for (let i = 0; i < geometry.indices.length; i += 3) {
      const v1 = geometry.indices[i] + 1;
      const v2 = geometry.indices[i + 1] + 1;
      const v3 = geometry.indices[i + 2] + 1;

      if (options.includeNormals) {
        objContent += `f ${v1}//${v1} ${v2}//${v2} ${v3}//${v3}\n`;
      } else {
        objContent += `f ${v1} ${v2} ${v3}\n`;
      }
    }

    const blob = new Blob([objContent], { type: 'model/obj' });
    return { blob };
  }

  private async convertToSTL(
    geometry: ReturnType<ExportableViewer['getGeometryData']>,
    options: Model3DExportOptions
  ): Promise<Blob> {
    let stlContent = 'solid LABVisualizer\n';

    // Add triangles
    for (let i = 0; i < geometry.indices.length; i += 3) {
      const i1 = geometry.indices[i] * 3;
      const i2 = geometry.indices[i + 1] * 3;
      const i3 = geometry.indices[i + 2] * 3;

      const v1 = [
        geometry.vertices[i1] * options.scale,
        geometry.vertices[i1 + 1] * options.scale,
        geometry.vertices[i1 + 2] * options.scale
      ];
      const v2 = [
        geometry.vertices[i2] * options.scale,
        geometry.vertices[i2 + 1] * options.scale,
        geometry.vertices[i2 + 2] * options.scale
      ];
      const v3 = [
        geometry.vertices[i3] * options.scale,
        geometry.vertices[i3 + 1] * options.scale,
        geometry.vertices[i3 + 2] * options.scale
      ];

      // Calculate normal (simplified)
      const normal = [0, 0, 1];

      stlContent += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
      stlContent += `    outer loop\n`;
      stlContent += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
      stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      stlContent += `    endloop\n`;
      stlContent += `  endfacet\n`;
    }

    stlContent += 'endsolid LABVisualizer\n';

    return new Blob([stlContent], { type: 'model/stl' });
  }
}

// Singleton export
export const exportService = ExportService.getInstance();
