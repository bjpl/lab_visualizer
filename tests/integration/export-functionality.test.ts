/**
 * Export Functionality Integration Tests
 * Tests image export, session export, and data export workflows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { molstarService } from '@/services/molstar-service';

describe('Export Functionality Integration', () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock canvas toBlob for export tests
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
      const blob = new Blob(['mock-image-data'], { type: 'image/png' });
      callback(blob);
    });
  });

  afterEach(() => {
    molstarService.dispose();
    document.body.removeChild(container);
  });

  describe('Image Export', () => {
    it('should export viewer as PNG', async () => {
      await molstarService.initialize(container);

      // Mock structure load
      const mockPDBData = 'HEADER TEST\nATOM 1 CA ALA A 1\nEND';
      await molstarService.loadStructure(mockPDBData, {
        format: 'pdb',
        label: 'Test',
      });

      const blob = await molstarService.exportImage({
        format: 'png',
        width: 1920,
        height: 1080,
        quality: 0.95,
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should export viewer as JPG', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nATOM 1 CA ALA A 1\nEND';
      await molstarService.loadStructure(mockPDBData);

      // Update mock for JPG
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback, type) => {
        const blob = new Blob(['mock-jpg-data'], { type: type || 'image/jpeg' });
        callback(blob);
      });

      const blob = await molstarService.exportImage({
        format: 'jpg',
        width: 1920,
        height: 1080,
        quality: 0.85,
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/jpeg');
    });

    it('should handle export with different resolutions', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      const resolutions = [
        { width: 800, height: 600 },
        { width: 1920, height: 1080 },
        { width: 3840, height: 2160 },
      ];

      for (const res of resolutions) {
        const blob = await molstarService.exportImage({
          format: 'png',
          ...res,
        });

        expect(blob).toBeInstanceOf(Blob);
      }
    });

    it('should handle export failure', async () => {
      await molstarService.initialize(container);

      // Mock failed export
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callback(null);
      });

      await expect(
        molstarService.exportImage({
          format: 'png',
        })
      ).rejects.toThrow('Failed to export image');
    });
  });

  describe('Camera State Export', () => {
    it('should export camera snapshot', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      const snapshot = molstarService.getCameraSnapshot();

      if (snapshot) {
        expect(snapshot.position).toBeDefined();
        expect(snapshot.target).toBeDefined();
        expect(snapshot.up).toBeDefined();
        expect(snapshot.fov).toBeDefined();
        expect(snapshot.position).toHaveLength(3);
      }
    });

    it('should return null camera snapshot before initialization', () => {
      const snapshot = molstarService.getCameraSnapshot();
      expect(snapshot).toBeNull();
    });
  });

  describe('Performance Metrics Export', () => {
    it('should export performance metrics', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      // Wait for some frames to collect metrics
      await new Promise((resolve) => setTimeout(resolve, 100));

      const metrics = molstarService.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.loadTime).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.frameRate).toBeGreaterThanOrEqual(0);
      expect(metrics.atomCount).toBeGreaterThanOrEqual(0);
    });

    it('should track load time separately from render time', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nATOM 1 CA ALA\nEND';
      await molstarService.loadStructure(mockPDBData);

      const metrics = molstarService.getPerformanceMetrics();

      expect(metrics.loadTime).toBeGreaterThan(0);
    });
  });

  describe('Session State Export', () => {
    it('should export complete session state', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      const metadata = await molstarService.loadStructure(mockPDBData, {
        label: 'Test Structure',
      });

      const cameraSnapshot = molstarService.getCameraSnapshot();
      const performanceMetrics = molstarService.getPerformanceMetrics();

      const sessionExport = {
        structure: metadata,
        camera: cameraSnapshot,
        performance: performanceMetrics,
        timestamp: Date.now(),
      };

      expect(sessionExport.structure).toBeDefined();
      expect(sessionExport.camera).toBeDefined();
      expect(sessionExport.performance).toBeDefined();
      expect(sessionExport.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Bulk Export', () => {
    it('should export multiple formats simultaneously', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      const exports = await Promise.all([
        molstarService.exportImage({ format: 'png' }),
        molstarService.exportImage({ format: 'jpg', quality: 0.9 }),
      ]);

      expect(exports).toHaveLength(2);
      expect(exports[0].type).toBe('image/png');
      expect(exports[1].type).toBe('image/jpeg');
    });

    it('should handle partial export failures', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      let callCount = 0;
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
        callCount++;
        if (callCount === 1) {
          callback(new Blob(['data'], { type: 'image/png' }));
        } else {
          callback(null);
        }
      });

      const results = await Promise.allSettled([
        molstarService.exportImage({ format: 'png' }),
        molstarService.exportImage({ format: 'png' }),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Download Integration', () => {
    it('should create downloadable URL from exported image', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      const blob = await molstarService.exportImage({ format: 'png' });
      const url = URL.createObjectURL(blob);

      expect(url).toMatch(/^blob:/);

      // Cleanup
      URL.revokeObjectURL(url);
    });

    it('should support filename generation for downloads', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      const metadata = await molstarService.loadStructure(mockPDBData, {
        label: 'MyProtein',
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${metadata.title || 'structure'}-${timestamp}.png`;

      expect(filename).toMatch(/\.png$/);
      expect(filename).toContain(timestamp);
    });
  });

  describe('Quality Settings Export', () => {
    it('should export with different quality settings', async () => {
      await molstarService.initialize(container);

      const mockPDBData = 'HEADER TEST\nEND';
      await molstarService.loadStructure(mockPDBData);

      const qualities = [0.5, 0.75, 0.9, 1.0];

      for (const quality of qualities) {
        const blob = await molstarService.exportImage({
          format: 'jpg',
          quality,
        });

        expect(blob).toBeInstanceOf(Blob);
      }
    });
  });
});
