/**
 * @vitest-environment jsdom
 *
 * Measurement Renderer Tests (GREEN Phase - TDD)
 *
 * Purpose: Test 3D visualization rendering for molecular measurements
 * - Distance measurements: lines + labels
 * - Angle measurements: arcs + labels
 * - Dihedral measurements: planes + labels
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createMeasurementRenderer,
  MeasurementRendererState,
  calculateDistance,
  calculateAngle,
  calculateDihedral,
  calculateMidpoint,
  formatDistance,
  formatAngle,
  type Vec3,
} from '@/utils/measurement-renderer-utils';

// Helper to create Vec3
const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

describe('MeasurementRenderer', () => {
  let renderer: MeasurementRendererState;

  beforeEach(() => {
    renderer = createMeasurementRenderer();
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (renderer?.clear) {
      renderer.clear();
    }
  });

  describe('renderDistance', () => {
    it('should create a 3D line between two atom positions', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(3, 4, 0);
      const measurementId = 'dist-001';

      const result = renderer.renderDistance(measurementId, atom1, atom2);

      expect(result).toBeDefined();
      expect(result.lineId).toBe(`${measurementId}-line`);
      expect(renderer.get(result.lineId)).toMatchObject({
        type: 'line',
        start: atom1,
        end: atom2,
        visible: true,
      });
    });

    it('should create a floating label with distance value in Angstroms', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(3, 4, 0);
      const measurementId = 'dist-002';

      const result = renderer.renderDistance(measurementId, atom1, atom2);

      expect(result.labelId).toBe(`${measurementId}-label`);
      const label = renderer.get(result.labelId);
      expect(label).toBeDefined();
      expect(label!.type).toBe('label');
      expect((label as any).text).toContain('5.0');
      expect((label as any).text).toContain('Å');
    });

    it('should position label at midpoint of the line', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(6, 8, 10);
      const measurementId = 'dist-003';

      const result = renderer.renderDistance(measurementId, atom1, atom2);

      const label = renderer.get(result.labelId) as any;
      expect(label.position).toEqual([3, 4, 5]); // Midpoint
    });

    it('should handle measurement deletion and cleanup', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 1, 1);
      const measurementId = 'dist-004';

      const result = renderer.renderDistance(measurementId, atom1, atom2);
      expect(renderer.get(result.lineId)).toBeDefined();
      expect(renderer.get(result.labelId)).toBeDefined();

      renderer.remove(measurementId);

      expect(renderer.get(result.lineId)).toBeUndefined();
      expect(renderer.get(result.labelId)).toBeUndefined();
    });

    it('should use default color when not specified', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const measurementId = 'dist-005';

      const result = renderer.renderDistance(measurementId, atom1, atom2);

      const line = renderer.get(result.lineId) as any;
      expect(line.color).toBeDefined();
      expect(typeof line.color).toBe('number');
    });

    it('should accept custom color parameter', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const measurementId = 'dist-006';
      const customColor = 0xff0000; // Red

      const result = renderer.renderDistance(measurementId, atom1, atom2, customColor);

      const line = renderer.get(result.lineId) as any;
      expect(line.color).toBe(customColor);
    });

    it('should throw error for invalid atom positions', () => {
      const measurementId = 'dist-007';

      expect(() => {
        renderer.renderDistance(measurementId, null as any, vec3(1, 0, 0));
      }).toThrow();

      expect(() => {
        renderer.renderDistance(measurementId, vec3(0, 0, 0), null as any);
      }).toThrow();
    });
  });

  describe('renderAngle', () => {
    it('should create an arc representation for angles', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0); // Vertex
      const atom3 = vec3(0, 1, 0);
      const measurementId = 'angle-001';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      expect(result).toBeDefined();
      expect(result.arcId).toBe(`${measurementId}-arc`);
      const arc = renderer.get(result.arcId) as any;
      expect(arc.type).toBe('arc');
      expect(arc.center).toEqual(atom2); // Vertex is center
    });

    it('should display angle value in degrees', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0); // Vertex
      const atom3 = vec3(0, 1, 0);
      const measurementId = 'angle-002';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      const label = renderer.get(result.labelId) as any;
      expect(label).toBeDefined();
      expect(label.text).toContain('90.0');
      expect(label.text).toContain('°');
    });

    it('should connect three atom positions correctly', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0);
      const atom3 = vec3(0, 1, 0);
      const measurementId = 'angle-003';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      const arc = renderer.get(result.arcId) as any;
      expect(arc.point1).toEqual(atom1);
      expect(arc.point2).toEqual(atom2);
      expect(arc.point3).toEqual(atom3);
    });

    it('should position label near the arc', () => {
      const atom1 = vec3(2, 0, 0);
      const atom2 = vec3(0, 0, 0);
      const atom3 = vec3(0, 2, 0);
      const measurementId = 'angle-004';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      const label = renderer.get(result.labelId) as any;
      expect(label.position).toBeDefined();
      // Label should be positioned along the angle bisector
      expect(label.position[0]).toBeGreaterThan(0);
      expect(label.position[1]).toBeGreaterThan(0);
    });

    it('should handle acute angles correctly', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0);
      const atom3 = vec3(0.5, 0.866, 0); // 60-degree angle
      const measurementId = 'angle-005';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      const label = renderer.get(result.labelId) as any;
      const angle = parseFloat(label.text);
      expect(angle).toBeCloseTo(60.0, 1);
    });

    it('should handle obtuse angles correctly', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0);
      const atom3 = vec3(-0.5, 0.866, 0); // 120-degree angle
      const measurementId = 'angle-006';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      const label = renderer.get(result.labelId) as any;
      const angle = parseFloat(label.text);
      expect(angle).toBeCloseTo(120.0, 1);
    });
  });

  describe('renderDihedral', () => {
    it('should create plane indicators for dihedral angles', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(1, 1, 0);
      const atom4 = vec3(1, 1, 1);
      const measurementId = 'dihedral-001';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      expect(result).toBeDefined();
      expect(result.plane1Id).toBe(`${measurementId}-plane1`);
      expect(result.plane2Id).toBe(`${measurementId}-plane2`);

      const plane1 = renderer.get(result.plane1Id) as any;
      const plane2 = renderer.get(result.plane2Id) as any;

      expect(plane1.type).toBe('plane');
      expect(plane2.type).toBe('plane');
    });

    it('should display dihedral value in degrees', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(1, 1, 0);
      const atom4 = vec3(1, 1, 1);
      const measurementId = 'dihedral-002';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      const label = renderer.get(result.labelId) as any;
      expect(label).toBeDefined();
      expect(label.text).toMatch(/[-+]?\d+\.?\d*°/); // Should contain number with degree symbol
    });

    it('should handle four atom positions', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(1, 1, 0);
      const atom4 = vec3(1, 1, 1);
      const measurementId = 'dihedral-003';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      const plane1 = renderer.get(result.plane1Id) as any;
      const plane2 = renderer.get(result.plane2Id) as any;

      // First plane should contain atoms 1, 2, 3
      expect(plane1.points).toHaveLength(3);
      expect(plane1.points).toContainEqual(atom1);
      expect(plane1.points).toContainEqual(atom2);
      expect(plane1.points).toContainEqual(atom3);

      // Second plane should contain atoms 2, 3, 4
      expect(plane2.points).toHaveLength(3);
      expect(plane2.points).toContainEqual(atom2);
      expect(plane2.points).toContainEqual(atom3);
      expect(plane2.points).toContainEqual(atom4);
    });

    it('should position label at the central axis', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(2, 0, 0);
      const atom4 = vec3(3, 0, 0);
      const measurementId = 'dihedral-004';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      const label = renderer.get(result.labelId) as any;
      // Label should be positioned near atoms 2 and 3 (the central bond)
      expect(label.position[0]).toBeGreaterThanOrEqual(atom2[0]);
      expect(label.position[0]).toBeLessThanOrEqual(atom3[0]);
    });

    it('should calculate dihedral angle range from -180 to +180', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(1, 1, 0);
      const atom4 = vec3(0, 1, 0);
      const measurementId = 'dihedral-005';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      const label = renderer.get(result.labelId) as any;
      const angle = parseFloat(label.text);
      expect(angle).toBeGreaterThanOrEqual(-180);
      expect(angle).toBeLessThanOrEqual(180);
    });
  });

  describe('visibility', () => {
    it('should toggle measurement visibility on/off', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 1, 1);
      const measurementId = 'dist-vis-001';

      const result = renderer.renderDistance(measurementId, atom1, atom2);

      // Initially visible
      let line = renderer.get(result.lineId) as any;
      let label = renderer.get(result.labelId) as any;
      expect(line.visible).toBe(true);
      expect(label.visible).toBe(true);

      // Hide
      renderer.setVisibility(measurementId, false);
      line = renderer.get(result.lineId) as any;
      label = renderer.get(result.labelId) as any;
      expect(line.visible).toBe(false);
      expect(label.visible).toBe(false);

      // Show again
      renderer.setVisibility(measurementId, true);
      line = renderer.get(result.lineId) as any;
      label = renderer.get(result.labelId) as any;
      expect(line.visible).toBe(true);
      expect(label.visible).toBe(true);
    });

    it('should update all representations when visibility changes', () => {
      const atom1 = vec3(1, 0, 0);
      const atom2 = vec3(0, 0, 0);
      const atom3 = vec3(0, 1, 0);
      const measurementId = 'angle-vis-001';

      const result = renderer.renderAngle(measurementId, atom1, atom2, atom3);

      renderer.setVisibility(measurementId, false);

      const arc = renderer.get(result.arcId) as any;
      const label = renderer.get(result.labelId) as any;

      expect(arc.visible).toBe(false);
      expect(label.visible).toBe(false);
    });

    it('should handle visibility toggle for dihedral measurements', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const atom3 = vec3(1, 1, 0);
      const atom4 = vec3(1, 1, 1);
      const measurementId = 'dihedral-vis-001';

      const result = renderer.renderDihedral(measurementId, atom1, atom2, atom3, atom4);

      renderer.setVisibility(measurementId, false);

      const plane1 = renderer.get(result.plane1Id) as any;
      const plane2 = renderer.get(result.plane2Id) as any;
      const label = renderer.get(result.labelId) as any;

      expect(plane1.visible).toBe(false);
      expect(plane2.visible).toBe(false);
      expect(label.visible).toBe(false);
    });

    it('should throw error for non-existent measurement', () => {
      expect(() => {
        renderer.setVisibility('non-existent-id', false);
      }).toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error for duplicate measurement IDs', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);
      const measurementId = 'duplicate-001';

      renderer.renderDistance(measurementId, atom1, atom2);

      expect(() => {
        renderer.renderDistance(measurementId, atom1, atom2);
      }).toThrow(/already exists|duplicate/i);
    });

    it('should validate measurement type before rendering', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);

      expect(() => {
        renderer.render('invalid-001', 'invalid-type', [atom1, atom2]);
      }).toThrow(/invalid.*type/i);
    });
  });

  describe('cleanup', () => {
    it('should remove all measurements when clear is called', () => {
      const atom1 = vec3(0, 0, 0);
      const atom2 = vec3(1, 0, 0);

      renderer.renderDistance('dist-1', atom1, atom2);
      renderer.renderDistance('dist-2', atom1, atom2);
      renderer.renderAngle('angle-1', atom1, atom2, vec3(0, 1, 0));

      renderer.clear();

      expect(renderer.get('dist-1-line')).toBeUndefined();
      expect(renderer.get('dist-2-line')).toBeUndefined();
      expect(renderer.get('angle-1-arc')).toBeUndefined();
    });
  });

  describe('performance', () => {
    it('should handle batch rendering efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 20; i++) {
        const atom1 = vec3(i, 0, 0);
        const atom2 = vec3(i + 1, 0, 0);
        renderer.renderDistance(`dist-${i}`, atom1, atom2);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 20 measurements in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
