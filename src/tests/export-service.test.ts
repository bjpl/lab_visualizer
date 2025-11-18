/**
 * Export Service Tests
 * Comprehensive tests for export functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExportService,
  ExportableViewer
} from '../services/export-service';
import {
  ImageExportOptions,
  Model3DExportOptions,
  PDFExportOptions,
  SessionExportOptions,
  ImageResolution,
  DEFAULT_IMAGE_EXPORT_OPTIONS,
  DEFAULT_MODEL_EXPORT_OPTIONS,
  DEFAULT_PDF_EXPORT_OPTIONS,
  DEFAULT_SESSION_EXPORT_OPTIONS
} from '../types/export';

// Mock viewer implementation
class MockViewer implements ExportableViewer {
  getCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 1920, 1080);
    }
    return canvas;
  }

  getViewportDimensions() {
    return { width: 1920, height: 1080 };
  }

  getCameraState() {
    return {
      position: [0, 0, 10] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      zoom: 1.0,
      rotation: [0, 0, 0] as [number, number, number],
      fov: 45
    };
  }

  getAnnotations() {
    return [
      {
        id: 'ann1',
        userId: 'user1',
        userName: 'Test User',
        content: 'Test annotation',
        position: { x: 0, y: 0, z: 0 },
        color: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false
      }
    ];
  }

  getSelection() {
    return {
      type: 'residue' as const,
      ids: ['1', '2', '3']
    };
  }

  getVisualizationSettings() {
    return {
      representation: 'cartoon',
      colorScheme: 'rainbow',
      showWater: false,
      showLigands: true,
      showHydrogens: false,
      backgroundGradient: true,
      ambientOcclusion: true,
      shadows: true
    };
  }

  getStructureId() {
    return '1CRN';
  }

  async getStructureData(format: string) {
    return `Mock ${format} structure data`;
  }

  getGeometryData() {
    return {
      vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      colors: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
      indices: new Uint32Array([0, 1, 2])
    };
  }
}

describe('ExportService', () => {
  let exportService: ExportService;
  let mockViewer: MockViewer;

  beforeEach(() => {
    exportService = ExportService.getInstance();
    mockViewer = new MockViewer();
  });

  describe('Image Export', () => {
    it('should export image with default options', async () => {
      const result = await exportService.exportImage(mockViewer);

      expect(result).toBeDefined();
      expect(result.type).toBe('image');
      expect(result.format).toBe('png');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.png');
      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should export image with custom resolution', async () => {
      const options: Partial<ImageExportOptions> = {
        resolution: ImageResolution.ULTRA_HD
      };

      const result = await exportService.exportImage(mockViewer, options);

      expect(result.dimensions).toEqual({ width: 3840, height: 2160 });
    });

    it('should export image with custom dimensions', async () => {
      const options: Partial<ImageExportOptions> = {
        resolution: ImageResolution.CUSTOM,
        customWidth: 2560,
        customHeight: 1440
      };

      const result = await exportService.exportImage(mockViewer, options);

      expect(result.dimensions).toEqual({ width: 2560, height: 1440 });
    });

    it('should export JPEG format', async () => {
      const options: Partial<ImageExportOptions> = {
        format: 'jpg',
        quality: 90
      };

      const result = await exportService.exportImage(mockViewer, options);

      expect(result.format).toBe('jpg');
      expect(result.filename).toContain('.jpg');
    });

    it('should export WebP format', async () => {
      const options: Partial<ImageExportOptions> = {
        format: 'webp',
        quality: 95
      };

      const result = await exportService.exportImage(mockViewer, options);

      expect(result.format).toBe('webp');
      expect(result.filename).toContain('.webp');
    });

    it('should report progress during export', async () => {
      const progressCallback = vi.fn();

      await exportService.exportImage(mockViewer, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      const calls = progressCallback.mock.calls;
      expect(calls.some((call: any) => call[0].stage === 'preparing')).toBe(true);
      expect(calls.some((call: any) => call[0].stage === 'complete')).toBe(true);
    });
  });

  describe('3D Model Export', () => {
    it('should export glTF model', async () => {
      const result = await exportService.export3DModel(mockViewer);

      expect(result).toBeDefined();
      expect(result.type).toBe('3d-model');
      expect(result.format).toBe('gltf');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    it('should export OBJ model', async () => {
      const options: Partial<Model3DExportOptions> = {
        format: 'obj'
      };

      const result = await exportService.export3DModel(mockViewer, options);

      expect(result.format).toBe('obj');
      expect(result.filename).toContain('.obj');
    });

    it('should export STL model', async () => {
      const options: Partial<Model3DExportOptions> = {
        format: 'stl'
      };

      const result = await exportService.export3DModel(mockViewer, options);

      expect(result.format).toBe('stl');
      expect(result.filename).toContain('.stl');
    });

    it('should apply scale to model', async () => {
      const options: Partial<Model3DExportOptions> = {
        format: 'obj',
        scale: 2.0
      };

      const result = await exportService.export3DModel(mockViewer, options);

      expect(result).toBeDefined();
      // Scale is applied in geometry conversion
    });
  });

  describe('PDF Export', () => {
    it('should export PDF with structure and annotations', async () => {
      const options: Partial<PDFExportOptions> = {
        title: 'Test Export',
        includeStructureImage: true,
        includeAnnotations: true
      };

      const result = await exportService.exportPDF(mockViewer, options);

      expect(result).toBeDefined();
      expect(result.type).toBe('pdf');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toContain('.pdf');
      expect(result.pageCount).toBeGreaterThan(0);
    });

    it('should export PDF with metadata', async () => {
      const options: Partial<PDFExportOptions> = {
        title: 'Test Export',
        author: 'Test Author',
        includeMetadata: true
      };

      const result = await exportService.exportPDF(mockViewer, options);

      expect(result).toBeDefined();
    });

    it('should handle different page sizes', async () => {
      const options: Partial<PDFExportOptions> = {
        pageSize: 'a4',
        orientation: 'landscape'
      };

      const result = await exportService.exportPDF(mockViewer, options);

      expect(result).toBeDefined();
    });
  });

  describe('Session Export', () => {
    it('should export complete session state', async () => {
      const result = await exportService.exportSession(mockViewer);

      expect(result).toBeDefined();
      expect(result.type).toBe('session');
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.data).toBeDefined();
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.structureId).toBe('1CRN');
    });

    it('should include camera state when requested', async () => {
      const options: Partial<SessionExportOptions> = {
        includeCamera: true
      };

      const result = await exportService.exportSession(mockViewer, options);

      expect(result.data.camera).toBeDefined();
      expect(result.data.camera?.position).toEqual([0, 0, 10]);
    });

    it('should include annotations when requested', async () => {
      const options: Partial<SessionExportOptions> = {
        includeAnnotations: true
      };

      const result = await exportService.exportSession(mockViewer, options);

      expect(result.data.annotations).toBeDefined();
      expect(result.data.annotations?.length).toBeGreaterThan(0);
    });

    it('should include selection when requested', async () => {
      const options: Partial<SessionExportOptions> = {
        includeSelection: true
      };

      const result = await exportService.exportSession(mockViewer, options);

      expect(result.data.selection).toBeDefined();
      expect(result.data.selection?.type).toBe('residue');
    });

    it('should pretty print JSON when requested', async () => {
      const options: Partial<SessionExportOptions> = {
        prettyPrint: true
      };

      const result = await exportService.exportSession(mockViewer, options);

      const text = await result.blob.text();
      expect(text).toContain('\n'); // Pretty printed JSON has newlines
    });

    it('should minify JSON when pretty print is disabled', async () => {
      const options: Partial<SessionExportOptions> = {
        prettyPrint: false
      };

      const result = await exportService.exportSession(mockViewer, options);

      const text = await result.blob.text();
      // Minified JSON should have fewer characters than pretty printed
      expect(text.split('\n').length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing canvas', async () => {
      const badViewer = {
        ...mockViewer,
        getCanvas: () => null
      } as ExportableViewer;

      await expect(exportService.exportImage(badViewer)).rejects.toThrow(
        'Canvas not available for export'
      );
    });

    it('should report errors in progress callback', async () => {
      const progressCallback = vi.fn();
      const badViewer = {
        ...mockViewer,
        getCanvas: () => null
      } as ExportableViewer;

      try {
        await exportService.exportImage(badViewer, {}, progressCallback);
      } catch (error) {
        // Expected
      }

      const errorCalls = progressCallback.mock.calls.filter(
        (call: any) => call[0].stage === 'error'
      );
      expect(errorCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ExportService.getInstance();
      const instance2 = ExportService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
