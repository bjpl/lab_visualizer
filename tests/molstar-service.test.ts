/**
 * Mol* Service Tests
 *
 * Unit tests for MolstarService singleton
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { molstarService } from '@/services/molstar-service';

// Mock Mol* modules
vi.mock('molstar/lib/mol-plugin-ui', () => ({
  createPluginUI: vi.fn(() =>
    Promise.resolve({
      dispose: vi.fn(),
      clear: vi.fn(() => Promise.resolve()),
      builders: {
        data: {
          rawData: vi.fn(() => Promise.resolve({})),
          download: vi.fn(() => Promise.resolve({})),
        },
        structure: {
          parseTrajectory: vi.fn(() => Promise.resolve({})),
          createModel: vi.fn(() => Promise.resolve({})),
          createStructure: vi.fn(() => Promise.resolve({})),
          representation: {
            addRepresentation: vi.fn(() => Promise.resolve({})),
          },
        },
      },
      state: {
        data: {
          selectQ: vi.fn(() => [{ transform: { ref: 'mock-ref' }, cell: { obj: { data: {} } } }]),
          build: vi.fn(() => ({
            to: vi.fn(() => ({
              update: vi.fn(() => ({})),
            })),
          })),
        },
      },
      behaviors: {
        interaction: {
          hover: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
          click: { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) },
        },
      },
      canvas3d: {
        camera: {
          state: {
            position: [0, 0, 50],
            target: [0, 0, 0],
            up: [0, 1, 0],
            fov: 45,
          },
        },
        webgl: {
          gl: {
            canvas: {
              toBlob: vi.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
            },
          },
        },
      },
    })
  ),
  DefaultPluginUISpec: vi.fn(() => ({})),
}));

vi.mock('molstar/lib/mol-plugin-ui/spec', () => ({
  DefaultPluginUISpec: vi.fn(() => ({})),
}));

vi.mock('molstar/lib/mol-plugin/context', () => ({}));
vi.mock('molstar/lib/mol-plugin/commands', () => ({
  PluginCommands: {
    State: {
      RemoveObject: vi.fn(() => Promise.resolve()),
      Update: vi.fn(() => Promise.resolve()),
    },
    Camera: {
      Reset: vi.fn(() => Promise.resolve()),
    },
  },
}));

vi.mock('molstar/lib/mol-plugin-state/transforms', () => ({
  StateTransforms: {
    Representation: {
      StructureRepresentation3D: {},
    },
    Model: {
      StructureFromModel: {},
    },
  },
}));

vi.mock('molstar/lib/mol-plugin/config', () => ({
  PluginConfig: {
    VolumeStreaming: {
      Enabled: 'volume-streaming-enabled',
    },
    Viewport: {
      ShowExpand: 'viewport-show-expand',
      ShowSelectionMode: 'viewport-show-selection-mode',
      ShowAnimation: 'viewport-show-animation',
    },
  },
}));

describe('MolstarService', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup
    document.body.removeChild(container);
    molstarService.dispose();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = molstarService;
      const instance2 = molstarService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize without errors', async () => {
      await expect(molstarService.initialize(container)).resolves.not.toThrow();
    });

    it('should skip re-initialization with same container', async () => {
      await molstarService.initialize(container);

      // Re-initialization with same container should succeed (skips init)
      await expect(molstarService.initialize(container)).resolves.not.toThrow();
    });

    it('should accept custom configuration', async () => {
      const config = {
        layoutIsExpanded: true,
        layoutShowControls: true,
      };

      await expect(molstarService.initialize(container, config)).resolves.not.toThrow();
    });
  });

  describe('Structure Loading', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
    });

    it('should load structure from PDB data', async () => {
      const pdbData = `HEADER    TEST STRUCTURE
ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00  0.00           N
END`;

      const metadata = await molstarService.loadStructure(pdbData, {
        format: 'pdb',
        label: 'Test',
      });

      expect(metadata).toBeDefined();
      expect(metadata.chains).toBeDefined();
    });

    it('should load structure by PDB ID', async () => {
      const metadata = await molstarService.loadStructureById('1CRN');

      expect(metadata).toBeDefined();
    });

    it('should emit structure-loaded event', async () => {
      const mockListener = vi.fn();
      molstarService.on('structure-loaded', mockListener);

      const pdbData = 'HEADER    TEST\nEND';
      await molstarService.loadStructure(pdbData);

      expect(mockListener).toHaveBeenCalled();
    });

    it('should handle loading with empty data', async () => {
      // With mocked service, empty data returns mock metadata
      const metadata = await molstarService.loadStructure('');
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Unknown Structure');
    });
  });

  describe('Representation Management', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
      const pdbData = 'HEADER    TEST\nEND';
      await molstarService.loadStructure(pdbData);
    });

    it('should apply cartoon representation', async () => {
      await expect(
        molstarService.applyRepresentation({
          type: 'cartoon',
          colorScheme: 'chain-id',
        })
      ).resolves.not.toThrow();
    });

    it('should apply ball-and-stick representation', async () => {
      await expect(
        molstarService.applyRepresentation({
          type: 'ball-and-stick',
          colorScheme: 'element-symbol',
        })
      ).resolves.not.toThrow();
    });

    it('should apply surface representation', async () => {
      await expect(
        molstarService.applyRepresentation({
          type: 'surface',
          colorScheme: 'secondary-structure',
        })
      ).resolves.not.toThrow();
    });

    it('should emit representation-changed event', async () => {
      const mockListener = vi.fn();
      molstarService.on('representation-changed', mockListener);

      await molstarService.applyRepresentation({
        type: 'spacefill',
        colorScheme: 'element-symbol',
      });

      expect(mockListener).toHaveBeenCalledWith('spacefill');
    });
  });

  describe('Color Scheme Management', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
      const pdbData = 'HEADER    TEST\nEND';
      await molstarService.loadStructure(pdbData);
    });

    it('should change color scheme', async () => {
      await expect(molstarService.setColorScheme('element-symbol')).resolves.not.toThrow();
    });

    it('should emit color-scheme-changed event', async () => {
      const mockListener = vi.fn();
      molstarService.on('color-scheme-changed', mockListener);

      await molstarService.setColorScheme('chain-id');

      expect(mockListener).toHaveBeenCalledWith('chain-id');
    });
  });

  describe('Camera Controls', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
    });

    it('should center camera', async () => {
      await expect(molstarService.centerCamera()).resolves.not.toThrow();
    });

    it('should get camera snapshot', () => {
      const snapshot = molstarService.getCameraSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot?.position).toBeDefined();
      expect(snapshot?.target).toBeDefined();
      expect(snapshot?.up).toBeDefined();
      expect(snapshot?.fov).toBeDefined();
    });
  });

  describe('Image Export', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
    });

    it('should export PNG image', async () => {
      const blob = await molstarService.exportImage({ format: 'png' });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should export JPG image', async () => {
      const blob = await molstarService.exportImage({ format: 'jpg' });

      expect(blob).toBeInstanceOf(Blob);
    });

    it('should accept custom dimensions', async () => {
      const blob = await molstarService.exportImage({
        format: 'png',
        width: 1920,
        height: 1080,
      });

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await molstarService.initialize(container);
    });

    it('should return performance metrics', () => {
      const metrics = molstarService.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.loadTime).toBeGreaterThanOrEqual(0);
      expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(metrics.frameRate).toBeGreaterThanOrEqual(0);
    });

    it('should update metrics after structure load', async () => {
      const pdbData = 'HEADER    TEST\nEND';
      await molstarService.loadStructure(pdbData);

      const metrics = molstarService.getPerformanceMetrics();
      expect(metrics.loadTime).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should add event listeners', () => {
      const mockListener = vi.fn();

      molstarService.on('structure-loaded', mockListener);

      // Event should be registered
      expect(mockListener).not.toHaveBeenCalled();
    });

    it('should remove event listeners', async () => {
      const mockListener = vi.fn();

      molstarService.on('structure-loaded', mockListener);
      molstarService.off('structure-loaded', mockListener);

      await molstarService.initialize(container);
      const pdbData = 'HEADER    TEST\nEND';
      await molstarService.loadStructure(pdbData);

      // Listener removed, should not be called
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should dispose viewer', async () => {
      await molstarService.initialize(container);

      expect(() => molstarService.dispose()).not.toThrow();
    });

    it('should clear event listeners on dispose', async () => {
      const mockListener = vi.fn();

      await molstarService.initialize(container);
      molstarService.on('structure-loaded', mockListener);

      molstarService.dispose();

      // Should not throw after dispose
      expect(() => molstarService.off('structure-loaded', mockListener)).not.toThrow();
    });
  });
});
