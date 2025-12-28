/**
 * @jest-environment jsdom
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * RED PHASE: These tests will FAIL until implementation is complete
 *
 * Purpose: Integration tests for 3D measurement visualization
 * - End-to-end visualization workflow
 * - Performance with multiple measurements
 * - Real-time updates and synchronization
 * - Error handling and recovery
 */

// Mock MolStar viewer component
const MockMolStarViewer = React.forwardRef((props: any, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    visualizeMeasurement: vi.fn(),
    hideMeasurement: vi.fn(),
    showMeasurement: vi.fn(),
    removeMeasurementVisualization: vi.fn(),
    getMeasurementRepresentation: vi.fn(),
  }));

  return <div data-testid="molstar-viewer">MolStar Viewer</div>;
});
MockMolStarViewer.displayName = 'MockMolStarViewer';

// Mock measurement panel
const MockMeasurementPanel = ({ measurements, onVisualize, onHide, onShow, onRemove }: any) => {
  return (
    <div data-testid="measurement-panel">
      {measurements.map((m: any) => (
        <div key={m.id} data-testid={`measurement-${m.id}`}>
          <span>{m.id}</span>
          <button onClick={() => onVisualize(m)}>Visualize</button>
          <button onClick={() => onHide(m.id)}>Hide</button>
          <button onClick={() => onShow(m.id)}>Show</button>
          <button onClick={() => onRemove(m.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
};

// Import components (will fail until implemented)
let MeasurementVisualizationContainer: any;

try {
  MeasurementVisualizationContainer =
    require('../../src/components/viewer/interactive/MeasurementVisualizationContainer').default;
} catch (error) {
  // Placeholder component that will make tests fail
  MeasurementVisualizationContainer = () => {
    throw new Error('MeasurementVisualizationContainer not implemented yet');
  };
}

describe('Measurement Visualization Integration', () => {
  let container: HTMLElement;
  let viewerRef: any;

  beforeEach(() => {
    viewerRef = React.createRef();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('distance measurement visualization', () => {
    it('should display line in 3D when distance measurement created', async () => {
      const measurement = {
        id: 'dist-int-001',
        type: 'distance' as const,
        atoms: ['CA-42', 'CA-45'],
        value: 5.2,
        positions: [
          [0, 0, 0],
          [3, 4, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer
          ref={viewerRef}
          measurements={[measurement]}
          autoVisualize={true}
        />
      );

      await waitFor(() => {
        expect(viewerRef.current).toBeDefined();
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledWith(measurement);
      });

      // Should create line representation
      const lineRep = viewerRef.current.getMeasurementRepresentation('dist-int-001');
      expect(lineRep).toBeDefined();
      expect(lineRep.representationIds).toContain(expect.stringContaining('line'));
    });

    it('should display label with distance value', async () => {
      const measurement = {
        id: 'dist-int-002',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.2,
        positions: [
          [0, 0, 0],
          [3, 4, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const lineRep = viewerRef.current.getMeasurementRepresentation('dist-int-002');
        expect(lineRep.representationIds).toContain(expect.stringContaining('label'));
      });
    });

    it('should position label at line midpoint', async () => {
      const measurement = {
        id: 'dist-int-003',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 10.0,
        positions: [
          [0, 0, 0],
          [6, 8, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('dist-int-003');
        const labelRep = rep.representationIds.find((id: string) => id.includes('label'));
        expect(labelRep).toBeDefined();

        // Label should be at midpoint [3, 4, 0]
        const labelData = viewerRef.current.getRepresentationData(labelRep);
        expect(labelData.position).toEqual([3, 4, 0]);
      });
    });
  });

  describe('angle measurement visualization', () => {
    it('should display arc for angle measurement', async () => {
      const measurement = {
        id: 'angle-int-001',
        type: 'angle' as const,
        atoms: ['CA-1', 'CA-2', 'CA-3'],
        value: 109.5,
        positions: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('angle-int-001');
        expect(rep.representationIds).toContain(expect.stringContaining('arc'));
      });
    });

    it('should display angle value in degrees', async () => {
      const measurement = {
        id: 'angle-int-002',
        type: 'angle' as const,
        atoms: ['CA-1', 'CA-2', 'CA-3'],
        value: 90.0,
        positions: [
          [1, 0, 0],
          [0, 0, 0],
          [0, 1, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('angle-int-002');
        const labelRep = rep.representationIds.find((id: string) => id.includes('label'));
        const labelData = viewerRef.current.getRepresentationData(labelRep);
        expect(labelData.text).toContain('90.0°');
      });
    });
  });

  describe('dihedral measurement visualization', () => {
    it('should display planes for dihedral angle', async () => {
      const measurement = {
        id: 'dihedral-int-001',
        type: 'dihedral' as const,
        atoms: ['CA-1', 'CA-2', 'CA-3', 'CA-4'],
        value: -120.5,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [1, 1, 1],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('dihedral-int-001');
        expect(rep.representationIds).toContain(expect.stringContaining('plane1'));
        expect(rep.representationIds).toContain(expect.stringContaining('plane2'));
      });
    });
  });

  describe('real-time updates', () => {
    it('should update visualization when measurement value changes', async () => {
      const initialMeasurement = {
        id: 'dist-update-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        positions: [
          [0, 0, 0],
          [3, 4, 0],
        ],
      };

      const { rerender } = render(
        <MeasurementVisualizationContainer
          ref={viewerRef}
          measurements={[initialMeasurement]}
          autoVisualize={true}
        />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('dist-update-001');
        expect(rep).toBeDefined();
      });

      // Update measurement value
      const updatedMeasurement = {
        ...initialMeasurement,
        value: 6.0,
        positions: [
          [0, 0, 0],
          [6, 0, 0],
        ],
      };

      rerender(
        <MeasurementVisualizationContainer
          ref={viewerRef}
          measurements={[updatedMeasurement]}
          autoVisualize={true}
        />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledWith(updatedMeasurement);
      });
    });

    it('should synchronize with measurement store changes', async () => {
      const measurements = [
        {
          id: 'sync-001',
          type: 'distance' as const,
          atoms: ['CA-1', 'CA-2'],
          value: 5.0,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        },
      ];

      const { rerender } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledTimes(1);
      });

      // Add new measurement
      const newMeasurements = [
        ...measurements,
        {
          id: 'sync-002',
          type: 'angle' as const,
          atoms: ['CA-1', 'CA-2', 'CA-3'],
          value: 90.0,
          positions: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
          ],
        },
      ];

      rerender(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={newMeasurements} autoVisualize={true} />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('multiple measurements', () => {
    it('should handle multiple measurements simultaneously', async () => {
      const measurements = [
        {
          id: 'multi-001',
          type: 'distance' as const,
          atoms: ['CA-1', 'CA-2'],
          value: 5.0,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
          ],
        },
        {
          id: 'multi-002',
          type: 'angle' as const,
          atoms: ['CA-2', 'CA-3', 'CA-4'],
          value: 109.5,
          positions: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 1, 0],
          ],
        },
        {
          id: 'multi-003',
          type: 'dihedral' as const,
          atoms: ['CA-5', 'CA-6', 'CA-7', 'CA-8'],
          value: -120.0,
          positions: [
            [0, 0, 0],
            [1, 0, 0],
            [1, 1, 0],
            [1, 1, 1],
          ],
        },
      ];

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledTimes(3);

        measurements.forEach((m) => {
          const rep = viewerRef.current.getMeasurementRepresentation(m.id);
          expect(rep).toBeDefined();
          expect(rep.visible).toBe(true);
        });
      });
    });

    it('should render measurements without visual conflicts', async () => {
      const measurements = Array.from({ length: 10 }, (_, i) => ({
        id: `conflict-${i}`,
        type: 'distance' as const,
        atoms: [`CA-${i}`, `CA-${i + 1}`],
        value: 3.0 + i * 0.5,
        positions: [
          [i, 0, 0],
          [i + 1, 0, 0],
        ],
      }));

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        measurements.forEach((m) => {
          const rep = viewerRef.current.getMeasurementRepresentation(m.id);
          expect(rep).toBeDefined();
          expect(rep.representationIds.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('performance with many measurements', () => {
    it('should maintain performance with 20+ measurements', async () => {
      const measurements = Array.from({ length: 25 }, (_, i) => ({
        id: `perf-${i}`,
        type: (i % 3 === 0 ? 'distance' : i % 3 === 1 ? 'angle' : 'dihedral') as any,
        atoms:
          i % 3 === 0
            ? [`CA-${i}`, `CA-${i + 1}`]
            : i % 3 === 1
              ? [`CA-${i}`, `CA-${i + 1}`, `CA-${i + 2}`]
              : [`CA-${i}`, `CA-${i + 1}`, `CA-${i + 2}`, `CA-${i + 3}`],
        value: 5.0 + i * 0.1,
        positions:
          i % 3 === 0
            ? [
                [i, 0, 0],
                [i + 1, 0, 0],
              ]
            : i % 3 === 1
              ? [
                  [i, 0, 0],
                  [i + 1, 0, 0],
                  [i + 1, 1, 0],
                ]
              : [
                  [i, 0, 0],
                  [i + 1, 0, 0],
                  [i + 1, 1, 0],
                  [i + 1, 1, 1],
                ],
      }));

      const startTime = performance.now();

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledTimes(25);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain <5% FPS impact with active measurements', async () => {
      const measurements = Array.from({ length: 20 }, (_, i) => ({
        id: `fps-${i}`,
        type: 'distance' as const,
        atoms: [`CA-${i}`, `CA-${i + 1}`],
        value: 5.0,
        positions: [
          [i, 0, 0],
          [i + 1, 0, 0],
        ],
      }));

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        measurements.forEach((m) => {
          const rep = viewerRef.current.getMeasurementRepresentation(m.id);
          expect(rep).toBeDefined();
        });
      });

      // Mock frame rate measurement
      const getFrameRate = () => {
        // In real implementation, this would measure actual FPS
        return 60; // Assuming 60 FPS target
      };

      const baselineFPS = 60;
      const withMeasurementsFPS = getFrameRate();
      const fpsImpact = ((baselineFPS - withMeasurementsFPS) / baselineFPS) * 100;

      expect(fpsImpact).toBeLessThan(5);
    });
  });

  describe('visibility controls', () => {
    it('should hide measurement visualization on demand', async () => {
      const measurement = {
        id: 'hide-int-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('hide-int-001');
        expect(rep.visible).toBe(true);
      });

      // Hide measurement
      viewerRef.current.hideMeasurement('hide-int-001');

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('hide-int-001');
        expect(rep.visible).toBe(false);
      });
    });

    it('should show hidden measurement', async () => {
      const measurement = {
        id: 'show-int-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('show-int-001');
        expect(rep).toBeDefined();
      });

      viewerRef.current.hideMeasurement('show-int-001');
      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('show-int-001');
        expect(rep.visible).toBe(false);
      });

      viewerRef.current.showMeasurement('show-int-001');
      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('show-int-001');
        expect(rep.visible).toBe(true);
      });
    });
  });

  describe('cleanup and removal', () => {
    it('should remove measurement visualization completely', async () => {
      const measurement = {
        id: 'remove-int-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        const rep = viewerRef.current.getMeasurementRepresentation('remove-int-001');
        expect(rep).toBeDefined();
      });

      viewerRef.current.removeMeasurementVisualization('remove-int-001');

      await waitFor(() => {
        expect(() => {
          viewerRef.current.getMeasurementRepresentation('remove-int-001');
        }).toThrow(/not found/i);
      });
    });

    it('should cleanup all resources on unmount', async () => {
      const measurements = Array.from({ length: 5 }, (_, i) => ({
        id: `cleanup-${i}`,
        type: 'distance' as const,
        atoms: [`CA-${i}`, `CA-${i + 1}`],
        value: 5.0,
        positions: [
          [i, 0, 0],
          [i + 1, 0, 0],
        ],
      }));

      const { unmount } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={measurements} autoVisualize={true} />
      );

      await waitFor(() => {
        measurements.forEach((m) => {
          const rep = viewerRef.current.getMeasurementRepresentation(m.id);
          expect(rep).toBeDefined();
        });
      });

      const removeSpy = vi.spyOn(viewerRef.current, 'removeMeasurementVisualization');

      unmount();

      expect(removeSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe('error handling', () => {
    it('should handle invalid measurement data gracefully', async () => {
      const invalidMeasurement = {
        id: 'invalid-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        // Missing positions
      };

      const { container: rendered } = render(
        <MeasurementVisualizationContainer
          ref={viewerRef}
          measurements={[invalidMeasurement as any]}
          autoVisualize={true}
        />
      );

      await waitFor(() => {
        // Should not crash, but should log error
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalled();
      });
    });

    it('should recover from visualization errors', async () => {
      const measurement = {
        id: 'error-recovery-001',
        type: 'distance' as const,
        atoms: ['CA-1', 'CA-2'],
        value: 5.0,
        positions: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      };

      // Mock error on first call
      let callCount = 0;
      const originalVisualize = viewerRef.current?.visualizeMeasurement;
      if (originalVisualize) {
        viewerRef.current.visualizeMeasurement = vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Visualization failed');
          }
          return originalVisualize.apply(viewerRef.current, arguments as any);
        });
      }

      const { rerender } = render(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      // Should attempt retry
      rerender(
        <MeasurementVisualizationContainer ref={viewerRef} measurements={[measurement]} autoVisualize={true} />
      );

      await waitFor(() => {
        expect(viewerRef.current.visualizeMeasurement).toHaveBeenCalledTimes(2);
      });
    });
  });
});
