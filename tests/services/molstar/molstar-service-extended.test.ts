/**
 * @jest-environment jsdom
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PluginContext } from 'molstar/lib/mol-plugin/context';

/**
 * RED PHASE: These tests will FAIL until implementation is complete
 *
 * Purpose: Test extended MolstarService APIs for measurement visualization
 * - visualizeMeasurement: Create 3D representations
 * - hideMeasurement: Toggle visibility off
 * - showMeasurement: Toggle visibility on
 * - removeMeasurementVisualization: Cleanup
 */

// Mock measurement types
interface Measurement {
  id: string;
  type: 'distance' | 'angle' | 'dihedral';
  atoms: string[];
  value: number;
  positions?: number[][];
}

interface MeasurementRepresentation {
  measurementId: string;
  representationIds: string[];
  visible: boolean;
}

// Mock MolStar plugin
const createMockPlugin = (): PluginContext => {
  const representations = new Map<string, any>();

  return {
    state: {
      data: {
        build: vi.fn(() => ({
          toRoot: vi.fn(() => ({
            apply: vi.fn(),
          })),
        })),
      },
    },
    canvas3d: {
      add: vi.fn((id: string, config: any) => {
        representations.set(id, { ...config, visible: true });
        return { id };
      }),
      remove: vi.fn((id: string) => {
        representations.delete(id);
      }),
      update: vi.fn((id: string, updates: any) => {
        const rep = representations.get(id);
        if (rep) {
          Object.assign(rep, updates);
        }
      }),
      setVisibility: vi.fn((id: string, visible: boolean) => {
        const rep = representations.get(id);
        if (rep) {
          rep.visible = visible;
        }
      }),
    },
    representations,
  } as any;
};

// Import the service we'll be testing (will fail until extended)
let MolstarService: any;

try {
  MolstarService = require('../../../src/services/molstar-service').default;
} catch (error) {
  // Create a placeholder that will make tests fail
  MolstarService = class {
    constructor() {
      throw new Error('MolstarService extended methods not implemented yet');
    }
  };
}

describe('MolstarService Extended APIs', () => {
  let service: any;
  let mockPlugin: PluginContext;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    service = new MolstarService();
    // Mock the internal plugin property
    (service as any).plugin = mockPlugin;
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (service?.destroy) {
      service.destroy();
    }
  });

  describe('visualizeMeasurement', () => {
    it('should create 3D representation for distance measurement', async () => {
      const measurement: Measurement = {
        id: 'dist-001',
        type: 'distance',
        atoms: ['CA-42', 'CA-45'],
        value: 5.2,
        positions: [
          [0, 0, 0],
          [3, 4, 0],
        ],
      };

      const result = await service.visualizeMeasurement(measurement);

      expect(result).toBeDefined();
      expect(result.measurementId).toBe('dist-001');
      expect(result.representationIds).toBeDefined();
      expect(result.representationIds.length).toBeGreaterThan(0);
      expect(mockPlugin.canvas3d?.add).toHaveBeenCalled();
    });

    it('should create 3D representation for angle measurement', async () => {
      const measurement: Measurement = {
        id: 'angle-001',
        type: 'angle',
        atoms: ['CA-42', 'CA-43', 'CA-44'],
        value: 109.5,
        positions: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      };

      const result = await service.visualizeMeasurement(measurement);

      expect(result).toBeDefined();
      expect(result.measurementId).toBe('angle-001');
      expect(result.representationIds).toBeDefined();
      expect(result.representationIds.length).toBeGreaterThan(0);
    });

    it('should create 3D representation for dihedral measurement', async () => {
      const measurement: Measurement = {
        id: 'dihedral-001',
        type: 'dihedral',
        atoms: ['CA-42', 'CA-43', 'CA-44', 'CA-45'],
        value: -120.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [1, 1, 1],
        ],
      };

      const result = await service.visualizeMeasurement(measurement);

      expect(result).toBeDefined();
      expect(result.measurementId).toBe('dihedral-001');
      expect(result.representationIds).toBeDefined();
      expect(result.representationIds.length).toBeGreaterThan(0);
    });

    it('should return representation ID for management', async () => {
      const measurement: Measurement = {
        id: 'dist-002',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.8,
        positions: [
          [0, 0, 0],
          [1, 1, 1],
        ],
      };

      const result = await service.visualizeMeasurement(measurement);

      expect(result.representationIds).toBeInstanceOf(Array);
      expect(result.representationIds.every((id: string) => typeof id === 'string')).toBe(true);
      expect(result.visible).toBe(true);
    });

    it('should throw error for missing positions', async () => {
      const measurement: Measurement = {
        id: 'dist-003',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.8,
        // positions missing
      };

      await expect(service.visualizeMeasurement(measurement)).rejects.toThrow(/position/i);
    });

    it('should throw error for incorrect number of positions', async () => {
      const measurement: Measurement = {
        id: 'angle-002',
        type: 'angle',
        atoms: ['CA-1', 'CA-2', 'CA-3'],
        value: 90.0,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
          // Missing third position
        ],
      };

      await expect(service.visualizeMeasurement(measurement)).rejects.toThrow(/position/i);
    });

    it('should store measurement representation for later access', async () => {
      const measurement: Measurement = {
        id: 'dist-004',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 4.5,
        positions: [
          [0, 0, 0],
          [1, 2, 3],
        ],
      };

      await service.visualizeMeasurement(measurement);

      const stored = service.getMeasurementRepresentation('dist-004');
      expect(stored).toBeDefined();
      expect(stored.measurementId).toBe('dist-004');
    });

    it('should handle multiple measurements without conflict', async () => {
      const measurements: Measurement[] = [
        {
          id: 'dist-005',
          type: 'distance',
          atoms: ['CA-1', 'CA-2'],
          value: 3.5,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        },
        {
          id: 'angle-003',
          type: 'angle',
          atoms: ['CA-2', 'CA-3', 'CA-4'],
          value: 120.0,
          positions: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
          ],
        },
      ];

      const results = await Promise.all(measurements.map((m) => service.visualizeMeasurement(m)));

      expect(results).toHaveLength(2);
      expect(results[0].measurementId).toBe('dist-005');
      expect(results[1].measurementId).toBe('angle-003');
    });
  });

  describe('hideMeasurement', () => {
    beforeEach(async () => {
      // Create a measurement to hide
      const measurement: Measurement = {
        id: 'dist-hide-001',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };
      await service.visualizeMeasurement(measurement);
    });

    it('should hide specific measurement by ID', () => {
      service.hideMeasurement('dist-hide-001');

      const rep = service.getMeasurementRepresentation('dist-hide-001');
      expect(rep.visible).toBe(false);
      expect(mockPlugin.canvas3d?.setVisibility).toHaveBeenCalled();
    });

    it('should preserve measurement data when hidden', () => {
      const beforeHide = service.getMeasurementRepresentation('dist-hide-001');
      const repIdsBefore = [...beforeHide.representationIds];

      service.hideMeasurement('dist-hide-001');

      const afterHide = service.getMeasurementRepresentation('dist-hide-001');
      expect(afterHide.representationIds).toEqual(repIdsBefore);
      expect(afterHide.measurementId).toBe('dist-hide-001');
    });

    it('should hide all representation components', () => {
      service.hideMeasurement('dist-hide-001');

      const rep = service.getMeasurementRepresentation('dist-hide-001');
      rep.representationIds.forEach((id: string) => {
        const component = mockPlugin.representations.get(id);
        expect(component?.visible).toBe(false);
      });
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        service.hideMeasurement('non-existent-id');
      }).toThrow(/not found|does not exist/i);
    });

    it('should be idempotent (hiding twice should not error)', () => {
      service.hideMeasurement('dist-hide-001');
      expect(() => {
        service.hideMeasurement('dist-hide-001');
      }).not.toThrow();
    });
  });

  describe('showMeasurement', () => {
    beforeEach(async () => {
      const measurement: Measurement = {
        id: 'dist-show-001',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };
      await service.visualizeMeasurement(measurement);
      service.hideMeasurement('dist-show-001');
    });

    it('should show previously hidden measurement', () => {
      service.showMeasurement('dist-show-001');

      const rep = service.getMeasurementRepresentation('dist-show-001');
      expect(rep.visible).toBe(true);
      expect(mockPlugin.canvas3d?.setVisibility).toHaveBeenCalled();
    });

    it('should restore all representation components', () => {
      service.showMeasurement('dist-show-001');

      const rep = service.getMeasurementRepresentation('dist-show-001');
      rep.representationIds.forEach((id: string) => {
        const component = mockPlugin.representations.get(id);
        expect(component?.visible).toBe(true);
      });
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        service.showMeasurement('non-existent-id');
      }).toThrow(/not found|does not exist/i);
    });

    it('should be idempotent (showing twice should not error)', () => {
      service.showMeasurement('dist-show-001');
      expect(() => {
        service.showMeasurement('dist-show-001');
      }).not.toThrow();
    });

    it('should toggle visibility correctly', () => {
      // Start visible
      service.showMeasurement('dist-show-001');
      let rep = service.getMeasurementRepresentation('dist-show-001');
      expect(rep.visible).toBe(true);

      // Hide
      service.hideMeasurement('dist-show-001');
      rep = service.getMeasurementRepresentation('dist-show-001');
      expect(rep.visible).toBe(false);

      // Show again
      service.showMeasurement('dist-show-001');
      rep = service.getMeasurementRepresentation('dist-show-001');
      expect(rep.visible).toBe(true);
    });
  });

  describe('removeMeasurementVisualization', () => {
    beforeEach(async () => {
      const measurements: Measurement[] = [
        {
          id: 'dist-remove-001',
          type: 'distance',
          atoms: ['CA-1', 'CA-2'],
          value: 3.5,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        },
        {
          id: 'angle-remove-001',
          type: 'angle',
          atoms: ['CA-1', 'CA-2', 'CA-3'],
          value: 109.5,
          positions: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
          ],
        },
      ];

      await Promise.all(measurements.map((m) => service.visualizeMeasurement(m)));
    });

    it('should remove 3D representation completely', () => {
      const beforeRemove = service.getMeasurementRepresentation('dist-remove-001');
      const repIds = [...beforeRemove.representationIds];

      service.removeMeasurementVisualization('dist-remove-001');

      expect(() => {
        service.getMeasurementRepresentation('dist-remove-001');
      }).toThrow(/not found/i);

      expect(mockPlugin.canvas3d?.remove).toHaveBeenCalledTimes(repIds.length);
    });

    it('should clean up all associated resources', () => {
      const rep = service.getMeasurementRepresentation('dist-remove-001');
      const repIds = [...rep.representationIds];

      service.removeMeasurementVisualization('dist-remove-001');

      repIds.forEach((id) => {
        expect(mockPlugin.representations.get(id)).toBeUndefined();
      });
    });

    it('should not affect other measurements', () => {
      service.removeMeasurementVisualization('dist-remove-001');

      const angle = service.getMeasurementRepresentation('angle-remove-001');
      expect(angle).toBeDefined();
      expect(angle.measurementId).toBe('angle-remove-001');
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        service.removeMeasurementVisualization('non-existent-id');
      }).toThrow(/not found|does not exist/i);
    });

    it('should free memory when removing measurements', () => {
      const initialCount = mockPlugin.representations.size;

      service.removeMeasurementVisualization('dist-remove-001');

      expect(mockPlugin.representations.size).toBeLessThan(initialCount);
    });
  });

  describe('getMeasurementRepresentation', () => {
    beforeEach(async () => {
      const measurement: Measurement = {
        id: 'dist-get-001',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };
      await service.visualizeMeasurement(measurement);
    });

    it('should return measurement representation by ID', () => {
      const rep = service.getMeasurementRepresentation('dist-get-001');

      expect(rep).toBeDefined();
      expect(rep.measurementId).toBe('dist-get-001');
      expect(rep.representationIds).toBeDefined();
      expect(rep.visible).toBeDefined();
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        service.getMeasurementRepresentation('non-existent-id');
      }).toThrow(/not found|does not exist/i);
    });
  });

  describe('listMeasurementVisualizations', () => {
    beforeEach(async () => {
      const measurements: Measurement[] = [
        {
          id: 'dist-list-001',
          type: 'distance',
          atoms: ['CA-1', 'CA-2'],
          value: 3.5,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        },
        {
          id: 'angle-list-001',
          type: 'angle',
          atoms: ['CA-1', 'CA-2', 'CA-3'],
          value: 109.5,
          positions: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
          ],
        },
      ];

      await Promise.all(measurements.map((m) => service.visualizeMeasurement(m)));
    });

    it('should return all measurement representations', () => {
      const list = service.listMeasurementVisualizations();

      expect(list).toBeDefined();
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.some((r: any) => r.measurementId === 'dist-list-001')).toBe(true);
      expect(list.some((r: any) => r.measurementId === 'angle-list-001')).toBe(true);
    });

    it('should return empty array when no measurements exist', () => {
      service.removeMeasurementVisualization('dist-list-001');
      service.removeMeasurementVisualization('angle-list-001');

      const list = service.listMeasurementVisualizations();
      expect(list).toEqual([]);
    });
  });

  describe('batch operations', () => {
    beforeEach(async () => {
      const measurements: Measurement[] = Array.from({ length: 5 }, (_, i) => ({
        id: `batch-${i}`,
        type: 'distance' as const,
        atoms: [`CA-${i}`, `CA-${i + 1}`],
        value: 3.5 + i * 0.1,
        positions: [
          [i, 0, 0],
          [i + 1, 0, 0],
        ],
      }));

      await Promise.all(measurements.map((m) => service.visualizeMeasurement(m)));
    });

    it('should hide multiple measurements efficiently', () => {
      const ids = ['batch-0', 'batch-1', 'batch-2'];

      service.hideMeasurements(ids);

      ids.forEach((id) => {
        const rep = service.getMeasurementRepresentation(id);
        expect(rep.visible).toBe(false);
      });
    });

    it('should show multiple measurements efficiently', () => {
      const ids = ['batch-0', 'batch-1', 'batch-2'];

      service.hideMeasurements(ids);
      service.showMeasurements(ids);

      ids.forEach((id) => {
        const rep = service.getMeasurementRepresentation(id);
        expect(rep.visible).toBe(true);
      });
    });

    it('should remove multiple measurements efficiently', () => {
      const ids = ['batch-3', 'batch-4'];

      service.removeMeasurementVisualizations(ids);

      ids.forEach((id) => {
        expect(() => {
          service.getMeasurementRepresentation(id);
        }).toThrow(/not found/i);
      });
    });
  });

  describe('error recovery', () => {
    it('should handle plugin errors gracefully', async () => {
      mockPlugin.canvas3d!.add = vi.fn(() => {
        throw new Error('Plugin error');
      });

      const measurement: Measurement = {
        id: 'error-001',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      await expect(service.visualizeMeasurement(measurement)).rejects.toThrow(/plugin error/i);
    });

    it('should rollback on partial failure', async () => {
      let callCount = 0;
      mockPlugin.canvas3d!.add = vi.fn(() => {
        callCount++;
        if (callCount > 1) {
          throw new Error('Partial failure');
        }
        return { id: `rep-${callCount}` };
      });

      const measurement: Measurement = {
        id: 'rollback-001',
        type: 'distance',
        atoms: ['CA-1', 'CA-2'],
        value: 3.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      await expect(service.visualizeMeasurement(measurement)).rejects.toThrow();

      // Should not have partial representation
      expect(() => {
        service.getMeasurementRepresentation('rollback-001');
      }).toThrow(/not found/i);
    });
  });
});
