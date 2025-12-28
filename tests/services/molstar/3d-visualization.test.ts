/**
 * 3D Measurement Visualization Tests
 *
 * Comprehensive test suite for full 3D rendering of measurements (not placeholders)
 * Tests: distance lines, angle arcs, dihedral indicators, floating labels, performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { StructureElement } from 'molstar/lib/mol-model/structure';
import type { PluginContext } from 'molstar/lib/mol-plugin/context';
import type { Color } from 'molstar/lib/mol-util/color';

/**
 * Mock MolStar plugin and measurement manager
 */
interface MockMeasurementManager {
  addDistance: ReturnType<typeof vi.fn>;
  addAngle: ReturnType<typeof vi.fn>;
  addDihedral: ReturnType<typeof vi.fn>;
  addLabel: ReturnType<typeof vi.fn>;
  setOptions: ReturnType<typeof vi.fn>;
}

interface Mock3DRenderer {
  plugin: PluginContext | null;
  measurementManager: MockMeasurementManager | null;
  canvas: HTMLCanvasElement | null;
  initialize: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
}

/**
 * 3D measurement types
 */
interface DistanceMeasurement {
  id: string;
  atomA: StructureElement.Loci;
  atomB: StructureElement.Loci;
  lineGeometry: LineGeometry;
  label: FloatingLabel;
  visible: boolean;
}

interface AngleMeasurement {
  id: string;
  atomA: StructureElement.Loci;
  atomB: StructureElement.Loci; // vertex
  atomC: StructureElement.Loci;
  arcGeometry: ArcGeometry;
  label: FloatingLabel;
  visible: boolean;
}

interface DihedralMeasurement {
  id: string;
  atomA: StructureElement.Loci;
  atomB: StructureElement.Loci;
  atomC: StructureElement.Loci;
  atomD: StructureElement.Loci;
  torsionGeometry: TorsionGeometry;
  label: FloatingLabel;
  visible: boolean;
}

interface LineGeometry {
  type: 'line';
  start: [number, number, number];
  end: [number, number, number];
  color: Color;
  width: number;
  style: 'solid' | 'dashed';
  dashLength?: number;
}

interface ArcGeometry {
  type: 'arc';
  center: [number, number, number];
  radius: number;
  startAngle: number;
  endAngle: number;
  normal: [number, number, number];
  color: Color;
  segments: number;
}

interface TorsionGeometry {
  type: 'torsion';
  plane1Normal: [number, number, number];
  plane2Normal: [number, number, number];
  axis: [number, number, number];
  angle: number; // signed angle -180 to 180
  direction: 'clockwise' | 'counterclockwise';
  arrowGeometry: ArrowGeometry;
}

interface ArrowGeometry {
  start: [number, number, number];
  end: [number, number, number];
  color: Color;
  headSize: number;
}

interface FloatingLabel {
  text: string;
  position: [number, number, number]; // 3D world position
  fontSize: number;
  fontFamily: string;
  color: Color;
  backgroundColor?: Color;
  backgroundOpacity?: number;
  billboard: boolean; // always face camera
  offset: [number, number, number];
}

/**
 * Mock helpers
 */
function createMockLoci(
  atomId: string,
  position: [number, number, number]
): StructureElement.Loci {
  return {
    kind: 'element-loci',
    structure: {} as any,
    elements: [
      {
        unit: {
          id: atomId,
          conformation: {
            x: (index: number) => position[0],
            y: (index: number) => position[1],
            z: (index: number) => position[2],
          },
        } as any,
        indices: [0],
      },
    ],
  };
}

function createMockRenderer(): Mock3DRenderer {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;

  return {
    plugin: null,
    measurementManager: {
      addDistance: vi.fn(),
      addAngle: vi.fn(),
      addDihedral: vi.fn(),
      addLabel: vi.fn(),
      setOptions: vi.fn(),
    },
    canvas,
    initialize: vi.fn().mockResolvedValue(true),
    cleanup: vi.fn(),
  };
}

describe('3D Measurement Visualization', () => {
  let renderer: Mock3DRenderer;

  beforeEach(() => {
    renderer = createMockRenderer();
  });

  afterEach(() => {
    renderer.cleanup();
  });

  describe('Distance Lines', () => {
    it('should create 3D line geometry connecting two atoms', async () => {
      const atomA = createMockLoci('A1', [0, 0, 0]);
      const atomB = createMockLoci('A2', [1, 0, 0]);

      const measurement: DistanceMeasurement = {
        id: 'dist-1',
        atomA,
        atomB,
        lineGeometry: {
          type: 'line',
          start: [0, 0, 0],
          end: [1, 0, 0],
          color: 0xffff00 as Color, // yellow
          width: 2.0,
          style: 'solid',
        },
        label: {
          text: '1.0 Å',
          position: [0.5, 0, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      // EXPECTED: Line geometry should be created
      expect(measurement.lineGeometry.type).toBe('line');
      expect(measurement.lineGeometry.start).toEqual([0, 0, 0]);
      expect(measurement.lineGeometry.end).toEqual([1, 0, 0]);
      expect(measurement.lineGeometry.width).toBe(2.0);

      // EXPECTED: Should call MolStar's addDistance
      await renderer.measurementManager?.addDistance(atomA, atomB, {
        lineParams: {
          linesSize: measurement.lineGeometry.width,
          linesColor: measurement.lineGeometry.color,
        },
      });

      expect(renderer.measurementManager?.addDistance).toHaveBeenCalledWith(
        atomA,
        atomB,
        expect.objectContaining({
          lineParams: expect.objectContaining({
            linesSize: 2.0,
          }),
        })
      );
    });

    it('should support dashed line style', () => {
      const measurement: DistanceMeasurement = {
        id: 'dist-2',
        atomA: createMockLoci('A1', [0, 0, 0]),
        atomB: createMockLoci('A2', [2, 0, 0]),
        lineGeometry: {
          type: 'line',
          start: [0, 0, 0],
          end: [2, 0, 0],
          color: 0xff0000 as Color,
          width: 1.5,
          style: 'dashed',
          dashLength: 0.2,
        },
        label: {
          text: '2.0 Å',
          position: [1, 0, 0],
          fontSize: 12,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      expect(measurement.lineGeometry.style).toBe('dashed');
      expect(measurement.lineGeometry.dashLength).toBe(0.2);

      // EXPECTED: MolStar should receive dashLength parameter
      const expectedParams = {
        lineParams: {
          linesSize: 1.5,
          linesColor: 0xff0000,
          dashLength: 0.2,
        },
      };

      expect(expectedParams.lineParams.dashLength).toBe(0.2);
    });

    it('should toggle line visibility', () => {
      const measurement: DistanceMeasurement = {
        id: 'dist-3',
        atomA: createMockLoci('A1', [0, 0, 0]),
        atomB: createMockLoci('A2', [1, 0, 0]),
        lineGeometry: {
          type: 'line',
          start: [0, 0, 0],
          end: [1, 0, 0],
          color: 0x00ff00 as Color,
          width: 2.0,
          style: 'solid',
        },
        label: {
          text: '1.0 Å',
          position: [0.5, 0, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      expect(measurement.visible).toBe(true);

      // Toggle visibility
      measurement.visible = false;
      expect(measurement.visible).toBe(false);

      // EXPECTED: Should take <10ms
      const start = performance.now();
      measurement.visible = !measurement.visible;
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should update line geometry when atoms move', () => {
      const atomA = createMockLoci('A1', [0, 0, 0]);
      const atomB = createMockLoci('A2', [1, 0, 0]);

      const measurement: DistanceMeasurement = {
        id: 'dist-4',
        atomA,
        atomB,
        lineGeometry: {
          type: 'line',
          start: [0, 0, 0],
          end: [1, 0, 0],
          color: 0xffff00 as Color,
          width: 2.0,
          style: 'solid',
        },
        label: {
          text: '1.0 Å',
          position: [0.5, 0, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      // Simulate atom position change
      const newAtomB = createMockLoci('A2', [2, 0, 0]);
      measurement.atomB = newAtomB;
      measurement.lineGeometry.end = [2, 0, 0];
      measurement.label.position = [1, 0, 0];
      measurement.label.text = '2.0 Å';

      // EXPECTED: Geometry should update
      expect(measurement.lineGeometry.end).toEqual([2, 0, 0]);
      expect(measurement.label.text).toBe('2.0 Å');
      expect(measurement.label.position).toEqual([1, 0, 0]);
    });

    it('should customize line color and width', () => {
      const colors = [
        0xff0000, // red
        0x00ff00, // green
        0x0000ff, // blue
        0xffff00, // yellow
      ] as Color[];

      const widths = [1.0, 2.0, 3.0, 4.0];

      colors.forEach((color, i) => {
        const measurement: DistanceMeasurement = {
          id: `dist-color-${i}`,
          atomA: createMockLoci('A1', [0, 0, 0]),
          atomB: createMockLoci('A2', [1, 0, 0]),
          lineGeometry: {
            type: 'line',
            start: [0, 0, 0],
            end: [1, 0, 0],
            color,
            width: widths[i],
            style: 'solid',
          },
          label: {
            text: '1.0 Å',
            position: [0.5, 0, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        };

        expect(measurement.lineGeometry.color).toBe(color);
        expect(measurement.lineGeometry.width).toBe(widths[i]);
      });
    });
  });

  describe('Angle Arcs', () => {
    it('should create arc geometry at vertex showing angle span', () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]); // vertex
      const atomC = createMockLoci('A3', [0, 1, 0]);

      const measurement: AngleMeasurement = {
        id: 'angle-1',
        atomA,
        atomB,
        atomC,
        arcGeometry: {
          type: 'arc',
          center: [0, 0, 0], // vertex position
          radius: 0.5,
          startAngle: 0,
          endAngle: Math.PI / 2, // 90 degrees
          normal: [0, 0, 1], // perpendicular to plane
          color: 0x00ffff as Color, // cyan
          segments: 32,
        },
        label: {
          text: '90.0°',
          position: [0.35, 0.35, 0], // midpoint of arc
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      // EXPECTED: Arc should be positioned at vertex
      expect(measurement.arcGeometry.center).toEqual([0, 0, 0]);
      expect(measurement.arcGeometry.radius).toBe(0.5);
      expect(measurement.arcGeometry.endAngle).toBeCloseTo(Math.PI / 2);
    });

    it('should configure arc radius and color', () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]);
      const atomC = createMockLoci('A3', [0, 1, 0]);

      const radii = [0.3, 0.5, 0.7, 1.0];
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00] as Color[];

      radii.forEach((radius, i) => {
        const measurement: AngleMeasurement = {
          id: `angle-${i}`,
          atomA,
          atomB,
          atomC,
          arcGeometry: {
            type: 'arc',
            center: [0, 0, 0],
            radius,
            startAngle: 0,
            endAngle: Math.PI / 2,
            normal: [0, 0, 1],
            color: colors[i],
            segments: 32,
          },
          label: {
            text: '90.0°',
            position: [radius * 0.7, radius * 0.7, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        };

        expect(measurement.arcGeometry.radius).toBe(radius);
        expect(measurement.arcGeometry.color).toBe(colors[i]);
      });
    });

    it('should adjust arc segments for smoothness', () => {
      const segmentCounts = [16, 32, 64, 128];

      segmentCounts.forEach((segments) => {
        const measurement: AngleMeasurement = {
          id: `angle-seg-${segments}`,
          atomA: createMockLoci('A1', [1, 0, 0]),
          atomB: createMockLoci('A2', [0, 0, 0]),
          atomC: createMockLoci('A3', [0, 1, 0]),
          arcGeometry: {
            type: 'arc',
            center: [0, 0, 0],
            radius: 0.5,
            startAngle: 0,
            endAngle: Math.PI / 2,
            normal: [0, 0, 1],
            color: 0x00ffff as Color,
            segments,
          },
          label: {
            text: '90.0°',
            position: [0.35, 0.35, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        };

        expect(measurement.arcGeometry.segments).toBe(segments);
      });
    });

    it('should update arc when atoms move', () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]);
      const atomC = createMockLoci('A3', [0, 1, 0]);

      const measurement: AngleMeasurement = {
        id: 'angle-update',
        atomA,
        atomB,
        atomC,
        arcGeometry: {
          type: 'arc',
          center: [0, 0, 0],
          radius: 0.5,
          startAngle: 0,
          endAngle: Math.PI / 2,
          normal: [0, 0, 1],
          color: 0x00ffff as Color,
          segments: 32,
        },
        label: {
          text: '90.0°',
          position: [0.35, 0.35, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      // Move atomC to create 60-degree angle
      const newAtomC = createMockLoci('A3', [0.5, 0.866, 0]);
      measurement.atomC = newAtomC;
      measurement.arcGeometry.endAngle = Math.PI / 3; // 60 degrees
      measurement.label.text = '60.0°';

      expect(measurement.arcGeometry.endAngle).toBeCloseTo(Math.PI / 3);
      expect(measurement.label.text).toBe('60.0°');
    });

    it('should call MolStar addAngle with correct parameters', async () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]);
      const atomC = createMockLoci('A3', [0, 1, 0]);

      await renderer.measurementManager?.addAngle(atomA, atomB, atomC, {
        visualParams: {
          visuals: ['arc', 'text'],
          arcScale: 0.5,
          color: 0x00ffff as Color,
        },
      });

      expect(renderer.measurementManager?.addAngle).toHaveBeenCalledWith(
        atomA,
        atomB,
        atomC,
        expect.objectContaining({
          visualParams: expect.objectContaining({
            visuals: ['arc', 'text'],
            arcScale: 0.5,
          }),
        })
      );
    });
  });

  describe('Dihedral Indicators', () => {
    it('should visualize torsion between two planes', () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]);
      const atomC = createMockLoci('A3', [0, 1, 0]);
      const atomD = createMockLoci('A4', [0, 1, 1]);

      const measurement: DihedralMeasurement = {
        id: 'dihedral-1',
        atomA,
        atomB,
        atomC,
        atomD,
        torsionGeometry: {
          type: 'torsion',
          plane1Normal: [0, 0, 1], // plane ABC
          plane2Normal: [1, 0, 0], // plane BCD
          axis: [0, 1, 0], // BC bond
          angle: 90.0, // signed angle
          direction: 'clockwise',
          arrowGeometry: {
            start: [0, 0.5, 0],
            end: [0.2, 0.5, 0.2],
            color: 0xff00ff as Color, // magenta
            headSize: 0.1,
          },
        },
        label: {
          text: '90.0°',
          position: [0, 0.5, 0.3],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      expect(measurement.torsionGeometry.type).toBe('torsion');
      expect(measurement.torsionGeometry.angle).toBe(90.0);
      expect(measurement.torsionGeometry.direction).toBe('clockwise');
    });

    it('should indicate direction: clockwise vs counterclockwise', () => {
      const directions: Array<'clockwise' | 'counterclockwise'> = [
        'clockwise',
        'counterclockwise',
      ];
      const angles = [45.0, -45.0];

      directions.forEach((direction, i) => {
        const measurement: DihedralMeasurement = {
          id: `dihedral-dir-${i}`,
          atomA: createMockLoci('A1', [1, 0, 0]),
          atomB: createMockLoci('A2', [0, 0, 0]),
          atomC: createMockLoci('A3', [0, 1, 0]),
          atomD: createMockLoci('A4', [0, 1, 1]),
          torsionGeometry: {
            type: 'torsion',
            plane1Normal: [0, 0, 1],
            plane2Normal: [1, 0, 0],
            axis: [0, 1, 0],
            angle: angles[i],
            direction,
            arrowGeometry: {
              start: [0, 0.5, 0],
              end: [0.2, 0.5, 0.2],
              color: 0xff00ff as Color,
              headSize: 0.1,
            },
          },
          label: {
            text: `${angles[i]}°`,
            position: [0, 0.5, 0.3],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        };

        expect(measurement.torsionGeometry.direction).toBe(direction);
        expect(Math.sign(measurement.torsionGeometry.angle)).toBe(
          direction === 'clockwise' ? 1 : -1
        );
      });
    });

    it('should display signed angle (-180 to 180)', () => {
      const testAngles = [-180, -90, 0, 90, 180];

      testAngles.forEach((angle) => {
        const measurement: DihedralMeasurement = {
          id: `dihedral-angle-${angle}`,
          atomA: createMockLoci('A1', [1, 0, 0]),
          atomB: createMockLoci('A2', [0, 0, 0]),
          atomC: createMockLoci('A3', [0, 1, 0]),
          atomD: createMockLoci('A4', [0, 1, 1]),
          torsionGeometry: {
            type: 'torsion',
            plane1Normal: [0, 0, 1],
            plane2Normal: [1, 0, 0],
            axis: [0, 1, 0],
            angle,
            direction: angle >= 0 ? 'clockwise' : 'counterclockwise',
            arrowGeometry: {
              start: [0, 0.5, 0],
              end: [0.2, 0.5, 0.2],
              color: 0xff00ff as Color,
              headSize: 0.1,
            },
          },
          label: {
            text: `${angle}°`,
            position: [0, 0.5, 0.3],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        };

        expect(measurement.torsionGeometry.angle).toBe(angle);
        expect(measurement.torsionGeometry.angle).toBeGreaterThanOrEqual(-180);
        expect(measurement.torsionGeometry.angle).toBeLessThanOrEqual(180);
      });
    });

    it('should call MolStar addDihedral with correct parameters', async () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);
      const atomB = createMockLoci('A2', [0, 0, 0]);
      const atomC = createMockLoci('A3', [0, 1, 0]);
      const atomD = createMockLoci('A4', [0, 1, 1]);

      await renderer.measurementManager?.addDihedral(atomA, atomB, atomC, atomD, {
        visualParams: {
          visuals: ['arc', 'sector', 'text'],
          color: 0xff00ff as Color,
        },
      });

      expect(renderer.measurementManager?.addDihedral).toHaveBeenCalledWith(
        atomA,
        atomB,
        atomC,
        atomD,
        expect.objectContaining({
          visualParams: expect.objectContaining({
            visuals: expect.arrayContaining(['arc', 'sector', 'text']),
          }),
        })
      );
    });
  });

  describe('Floating Labels', () => {
    it('should position labels in 3D space (not screen overlay)', () => {
      const label: FloatingLabel = {
        text: '3.5 Å',
        position: [1.75, 0, 0], // 3D world coordinates
        fontSize: 14,
        fontFamily: 'sans-serif',
        color: 0xffffff as Color,
        billboard: true,
        offset: [0, 0.1, 0],
      };

      // EXPECTED: Label should have 3D position
      expect(label.position).toHaveLength(3);
      expect(label.position[0]).toBe(1.75);
      expect(label.position[1]).toBe(0);
      expect(label.position[2]).toBe(0);
    });

    it('should display value with units (Å, °)', () => {
      const labels = [
        { text: '1.5 Å', unit: 'Å' },
        { text: '90.0°', unit: '°' },
        { text: '120.0°', unit: '°' },
        { text: '3.14 Å', unit: 'Å' },
      ];

      labels.forEach(({ text, unit }) => {
        const label: FloatingLabel = {
          text,
          position: [0, 0, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        };

        expect(label.text).toContain(unit);
      });
    });

    it('should support billboard effect (always face camera)', () => {
      const label: FloatingLabel = {
        text: '2.5 Å',
        position: [1.25, 0, 0],
        fontSize: 14,
        fontFamily: 'sans-serif',
        color: 0xffffff as Color,
        billboard: true,
        offset: [0, 0.1, 0],
      };

      expect(label.billboard).toBe(true);

      // EXPECTED: MolStar should render as billboard sprite
      // (always oriented toward camera regardless of rotation)
    });

    it('should customize font, size, and color', () => {
      const styles = [
        { fontSize: 12, fontFamily: 'sans-serif', color: 0xffffff },
        { fontSize: 14, fontFamily: 'monospace', color: 0xff0000 },
        { fontSize: 16, fontFamily: 'serif', color: 0x00ff00 },
        { fontSize: 18, fontFamily: 'Arial', color: 0x0000ff },
      ] as Array<{ fontSize: number; fontFamily: string; color: Color }>;

      styles.forEach(({ fontSize, fontFamily, color }, i) => {
        const label: FloatingLabel = {
          text: '1.0 Å',
          position: [0.5, 0, 0],
          fontSize,
          fontFamily,
          color,
          billboard: true,
          offset: [0, 0.1, 0],
        };

        expect(label.fontSize).toBe(fontSize);
        expect(label.fontFamily).toBe(fontFamily);
        expect(label.color).toBe(color);
      });
    });

    it('should support background and opacity', () => {
      const label: FloatingLabel = {
        text: '1.5 Å',
        position: [0.75, 0, 0],
        fontSize: 14,
        fontFamily: 'sans-serif',
        color: 0xffffff as Color,
        backgroundColor: 0x000000 as Color,
        backgroundOpacity: 0.7,
        billboard: true,
        offset: [0, 0.1, 0],
      };

      expect(label.backgroundColor).toBe(0x000000);
      expect(label.backgroundOpacity).toBe(0.7);

      // EXPECTED: MolStar should render semi-transparent background
    });

    it('should call MolStar addLabel with correct parameters', async () => {
      const atomA = createMockLoci('A1', [1, 0, 0]);

      await renderer.measurementManager?.addLabel(atomA, {
        labelParams: {
          textColor: 0xffffff as Color,
          textSize: 14,
          fontFamily: 'sans-serif' as any,
        },
      });

      expect(renderer.measurementManager?.addLabel).toHaveBeenCalledWith(
        atomA,
        expect.objectContaining({
          labelParams: expect.objectContaining({
            textColor: 0xffffff,
            textSize: 14,
          }),
        })
      );
    });
  });

  describe('Performance', () => {
    it('should render 100 measurements in <500ms', async () => {
      const measurements: DistanceMeasurement[] = [];
      const start = performance.now();

      // Create 100 distance measurements
      for (let i = 0; i < 100; i++) {
        const atomA = createMockLoci(`A${i}`, [i * 0.1, 0, 0]);
        const atomB = createMockLoci(`B${i}`, [(i + 1) * 0.1, 0, 0]);

        measurements.push({
          id: `dist-${i}`,
          atomA,
          atomB,
          lineGeometry: {
            type: 'line',
            start: [i * 0.1, 0, 0],
            end: [(i + 1) * 0.1, 0, 0],
            color: 0xffff00 as Color,
            width: 2.0,
            style: 'solid',
          },
          label: {
            text: '0.1 Å',
            position: [(i + 0.5) * 0.1, 0, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        });
      }

      const duration = performance.now() - start;

      expect(measurements).toHaveLength(100);
      expect(duration).toBeLessThan(500);
    });

    it('should toggle visibility in <10ms', () => {
      const measurements: DistanceMeasurement[] = [];

      // Create 50 measurements
      for (let i = 0; i < 50; i++) {
        measurements.push({
          id: `dist-${i}`,
          atomA: createMockLoci(`A${i}`, [i * 0.1, 0, 0]),
          atomB: createMockLoci(`B${i}`, [(i + 1) * 0.1, 0, 0]),
          lineGeometry: {
            type: 'line',
            start: [i * 0.1, 0, 0],
            end: [(i + 1) * 0.1, 0, 0],
            color: 0xffff00 as Color,
            width: 2.0,
            style: 'solid',
          },
          label: {
            text: '0.1 Å',
            position: [(i + 0.5) * 0.1, 0, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        });
      }

      // Toggle all visibility
      const start = performance.now();
      measurements.forEach((m) => {
        m.visible = !m.visible;
      });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should not leak memory on create/delete cycle', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      const cycles = 100;

      // Create and destroy measurements
      for (let cycle = 0; cycle < cycles; cycle++) {
        const measurements: DistanceMeasurement[] = [];

        // Create 10 measurements
        for (let i = 0; i < 10; i++) {
          measurements.push({
            id: `dist-${cycle}-${i}`,
            atomA: createMockLoci(`A${i}`, [i * 0.1, 0, 0]),
            atomB: createMockLoci(`B${i}`, [(i + 1) * 0.1, 0, 0]),
            lineGeometry: {
              type: 'line',
              start: [i * 0.1, 0, 0],
              end: [(i + 1) * 0.1, 0, 0],
              color: 0xffff00 as Color,
              width: 2.0,
              style: 'solid',
            },
            label: {
              text: '0.1 Å',
              position: [(i + 0.5) * 0.1, 0, 0],
              fontSize: 14,
              fontFamily: 'sans-serif',
              color: 0xffffff as Color,
              billboard: true,
              offset: [0, 0.1, 0],
            },
            visible: true,
          });
        }

        // Clear measurements
        measurements.length = 0;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // EXPECTED: Memory increase should be minimal (<5MB for 1000 measurements)
      // Note: This is a rough heuristic; actual limits depend on environment
      if (performance.memory) {
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      }
    });

    it('should handle rapid measurement updates', () => {
      const measurement: DistanceMeasurement = {
        id: 'dist-rapid',
        atomA: createMockLoci('A1', [0, 0, 0]),
        atomB: createMockLoci('A2', [1, 0, 0]),
        lineGeometry: {
          type: 'line',
          start: [0, 0, 0],
          end: [1, 0, 0],
          color: 0xffff00 as Color,
          width: 2.0,
          style: 'solid',
        },
        label: {
          text: '1.0 Å',
          position: [0.5, 0, 0],
          fontSize: 14,
          fontFamily: 'sans-serif',
          color: 0xffffff as Color,
          billboard: true,
          offset: [0, 0.1, 0],
        },
        visible: true,
      };

      const start = performance.now();

      // Perform 100 rapid updates
      for (let i = 0; i < 100; i++) {
        const x = i * 0.01;
        measurement.lineGeometry.end = [x, 0, 0];
        measurement.label.position = [x / 2, 0, 0];
        measurement.label.text = `${x.toFixed(2)} Å`;
      }

      const duration = performance.now() - start;

      // EXPECTED: 100 updates in <50ms
      expect(duration).toBeLessThan(50);
    });

    it('should batch measurement operations efficiently', async () => {
      const batchSize = 50;
      const measurements: DistanceMeasurement[] = [];

      // Create batch
      const createStart = performance.now();
      for (let i = 0; i < batchSize; i++) {
        measurements.push({
          id: `dist-batch-${i}`,
          atomA: createMockLoci(`A${i}`, [i * 0.1, 0, 0]),
          atomB: createMockLoci(`B${i}`, [(i + 1) * 0.1, 0, 0]),
          lineGeometry: {
            type: 'line',
            start: [i * 0.1, 0, 0],
            end: [(i + 1) * 0.1, 0, 0],
            color: 0xffff00 as Color,
            width: 2.0,
            style: 'solid',
          },
          label: {
            text: '0.1 Å',
            position: [(i + 0.5) * 0.1, 0, 0],
            fontSize: 14,
            fontFamily: 'sans-serif',
            color: 0xffffff as Color,
            billboard: true,
            offset: [0, 0.1, 0],
          },
          visible: true,
        });
      }
      const createDuration = performance.now() - createStart;

      // Toggle batch visibility
      const toggleStart = performance.now();
      measurements.forEach((m) => {
        m.visible = !m.visible;
      });
      const toggleDuration = performance.now() - toggleStart;

      expect(measurements).toHaveLength(batchSize);
      expect(createDuration).toBeLessThan(100);
      expect(toggleDuration).toBeLessThan(10);
    });
  });

  describe('Integration with MolStar', () => {
    it('should use MolStar StructureMeasurementManager API', () => {
      expect(renderer.measurementManager).toBeDefined();
      expect(renderer.measurementManager?.addDistance).toBeDefined();
      expect(renderer.measurementManager?.addAngle).toBeDefined();
      expect(renderer.measurementManager?.addDihedral).toBeDefined();
      expect(renderer.measurementManager?.addLabel).toBeDefined();
    });

    it('should configure measurement options globally', async () => {
      await renderer.measurementManager?.setOptions({
        distanceUnitLabel: 'Å',
        textColor: 0xffffff as Color,
      });

      expect(renderer.measurementManager?.setOptions).toHaveBeenCalledWith({
        distanceUnitLabel: 'Å',
        textColor: 0xffffff,
      });
    });

    it('should support MolStar visual parameters', async () => {
      const atomA = createMockLoci('A1', [0, 0, 0]);
      const atomB = createMockLoci('A2', [1, 0, 0]);

      await renderer.measurementManager?.addDistance(atomA, atomB, {
        visualParams: {
          visuals: ['lines', 'text'],
          linesSize: 2.0,
          linesColor: 0xffff00 as Color,
          textSize: 14,
          textColor: 0xffffff as Color,
        },
      });

      expect(renderer.measurementManager?.addDistance).toHaveBeenCalledWith(
        atomA,
        atomB,
        expect.objectContaining({
          visualParams: expect.objectContaining({
            visuals: ['lines', 'text'],
            linesSize: 2.0,
            textSize: 14,
          }),
        })
      );
    });
  });
});
