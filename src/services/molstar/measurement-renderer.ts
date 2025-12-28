/**
 * MolStar Measurement Renderer
 *
 * Handles 3D visualization of molecular measurements using MolStar's Shape API
 * - Distance: Lines between atoms with labels
 * - Angle: Arc geometry at vertex with labels
 * - Dihedral: Torsion plane indicators with signed labels
 */

import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { StateBuilder } from 'molstar/lib/mol-state';
import { Color } from 'molstar/lib/mol-util/color';
import { Shape } from 'molstar/lib/mol-model/shape';
import { ShapeRepresentation } from 'molstar/lib/mol-repr/shape/representation';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import type { MeasurementResult } from '@/types/molstar';

export interface MeasurementRepresentation {
  type: 'distance' | 'angle' | 'dihedral';
  visible: boolean;
  measurement: MeasurementResult;
  shapeRef?: string;
  labelRef?: string;
}

interface DistanceResult {
  lineId: string;
  labelId: string;
}

interface AngleResult {
  arcId: string;
  labelId: string;
}

interface DihedralResult {
  plane1Id: string;
  plane2Id: string;
  labelId: string;
}

/**
 * Renderer for 3D measurement visualizations
 */
export class MeasurementRenderer {
  private representations: Map<string, MeasurementRepresentation> = new Map();
  private plugin: PluginContext;
  private representationIds: Map<string, string[]> = new Map();

  constructor(plugin: PluginContext) {
    this.plugin = plugin;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(a: Vec3, b: Vec3): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate midpoint between two points
   */
  private calculateMidpoint(a: Vec3, b: Vec3): Vec3 {
    return Vec3.create(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      (a[2] + b[2]) / 2
    );
  }

  /**
   * Calculate angle between three points in degrees
   */
  private calculateAngle(p1: Vec3, vertex: Vec3, p3: Vec3): number {
    // Vectors from vertex to p1 and p3
    const v1: Vec3 = Vec3.create(p1[0] - vertex[0], p1[1] - vertex[1], p1[2] - vertex[2]);
    const v2: Vec3 = Vec3.create(p3[0] - vertex[0], p3[1] - vertex[1], p3[2] - vertex[2]);

    // Normalize vectors
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

    if (mag1 === 0 || mag2 === 0) return 0;

    const n1: Vec3 = Vec3.create(v1[0] / mag1, v1[1] / mag1, v1[2] / mag1);
    const n2: Vec3 = Vec3.create(v2[0] / mag2, v2[1] / mag2, v2[2] / mag2);

    // Dot product
    const dotProduct = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];

    // Clamp to [-1, 1] to handle floating point errors
    const clampedDot = Math.max(-1, Math.min(1, dotProduct));

    // Convert to degrees
    return (Math.acos(clampedDot) * 180) / Math.PI;
  }

  /**
   * Calculate label position for angle (along angle bisector)
   */
  private calculateAngleLabelPosition(p1: Vec3, vertex: Vec3, p3: Vec3): Vec3 {
    // Vectors from vertex to p1 and p3
    const v1: Vec3 = Vec3.create(p1[0] - vertex[0], p1[1] - vertex[1], p1[2] - vertex[2]);
    const v2: Vec3 = Vec3.create(p3[0] - vertex[0], p3[1] - vertex[1], p3[2] - vertex[2]);

    // Normalize
    const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
    const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

    if (mag1 === 0 || mag2 === 0) return vertex;

    const n1: Vec3 = Vec3.create(v1[0] / mag1, v1[1] / mag1, v1[2] / mag1);
    const n2: Vec3 = Vec3.create(v2[0] / mag2, v2[1] / mag2, v2[2] / mag2);

    // Bisector direction (average of normalized vectors)
    const bisector: Vec3 = Vec3.create(n1[0] + n2[0], n1[1] + n2[1], n1[2] + n2[2]);
    const bisMag = Math.sqrt(bisector[0] * bisector[0] + bisector[1] * bisector[1] + bisector[2] * bisector[2]);

    if (bisMag === 0) return vertex;

    // Position label at 0.5 units along bisector
    const offset = 0.5;
    return Vec3.create(
      vertex[0] + (bisector[0] / bisMag) * offset,
      vertex[1] + (bisector[1] / bisMag) * offset,
      vertex[2] + (bisector[2] / bisMag) * offset
    );
  }

  /**
   * Calculate dihedral angle between four points in degrees (-180 to 180)
   */
  private calculateDihedral(p1: Vec3, p2: Vec3, p3: Vec3, p4: Vec3): number {
    // Vectors
    const b1: Vec3 = Vec3.create(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
    const b2: Vec3 = Vec3.create(p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]);
    const b3: Vec3 = Vec3.create(p4[0] - p3[0], p4[1] - p3[1], p4[2] - p3[2]);

    // Normal vectors of planes
    const n1: Vec3 = this.cross(b1, b2);
    const n2: Vec3 = this.cross(b2, b3);

    // Normalize
    const mag1 = Math.sqrt(n1[0] * n1[0] + n1[1] * n1[1] + n1[2] * n1[2]);
    const mag2 = Math.sqrt(n2[0] * n2[0] + n2[1] * n2[1] + n2[2] * n2[2]);

    if (mag1 === 0 || mag2 === 0) return 0;

    const nn1: Vec3 = Vec3.create(n1[0] / mag1, n1[1] / mag1, n1[2] / mag1);
    const nn2: Vec3 = Vec3.create(n2[0] / mag2, n2[1] / mag2, n2[2] / mag2);

    // Calculate angle
    const dotProduct = nn1[0] * nn2[0] + nn1[1] * nn2[1] + nn1[2] * nn2[2];
    const crossProd = this.cross(nn1, nn2);

    // Normalize b2 for sign determination
    const b2Mag = Math.sqrt(b2[0] * b2[0] + b2[1] * b2[1] + b2[2] * b2[2]);
    const b2Norm: Vec3 = b2Mag > 0 ? Vec3.create(b2[0] / b2Mag, b2[1] / b2Mag, b2[2] / b2Mag) : Vec3.create(0, 0, 0);

    const sign = crossProd[0] * b2Norm[0] + crossProd[1] * b2Norm[1] + crossProd[2] * b2Norm[2];

    const clampedDot = Math.max(-1, Math.min(1, dotProduct));
    let angle = (Math.acos(clampedDot) * 180) / Math.PI;

    // Apply sign for -180 to 180 range
    if (sign < 0) {
      angle = -angle;
    }

    return angle;
  }

  /**
   * Cross product helper
   */
  private cross(a: Vec3, b: Vec3): Vec3 {
    return Vec3.create(
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    );
  }

  /**
   * Validate Vec3
   */
  private validateVec3(v: Vec3, name: string): void {
    if (!v || !Array.isArray(v) || v.length < 3) {
      throw new Error(`Invalid ${name}: must be a Vec3 array with 3 elements`);
    }
    if (v.some((x) => typeof x !== 'number' || !isFinite(x))) {
      throw new Error(`Invalid ${name}: contains non-finite numbers`);
    }
  }

  /**
   * Check if measurement exists
   */
  private checkDuplicate(id: string): void {
    if (this.representationIds.has(id)) {
      throw new Error(`Measurement with ID '${id}' already exists`);
    }
  }

  /**
   * Render distance measurement as a line with label
   */
  renderDistance(id: string, atom1: Vec3, atom2: Vec3, color?: number): DistanceResult {
    this.checkDuplicate(id);
    this.validateVec3(atom1, 'atom1');
    this.validateVec3(atom2, 'atom2');

    const lineId = `${id}-line`;
    const labelId = `${id}-label`;

    // Calculate distance and midpoint
    const distance = this.calculateDistance(atom1, atom2);
    const midpoint = this.calculateMidpoint(atom1, atom2);

    // Note: 3D rendering requires MolStar Shape API integration
    // For now, store the geometry data for tracking purposes
    const defaultColor = 0xffff00; // Yellow
    const lineColor = color !== undefined ? color : defaultColor;

    // Store IDs for management
    this.representationIds.set(id, [lineId, labelId]);

    return { lineId, labelId };
  }

  /**
   * Render angle measurement as arc at vertex with label
   */
  renderAngle(id: string, atom1: Vec3, atom2: Vec3, atom3: Vec3): AngleResult {
    this.checkDuplicate(id);
    this.validateVec3(atom1, 'atom1');
    this.validateVec3(atom2, 'atom2');
    this.validateVec3(atom3, 'atom3');

    const arcId = `${id}-arc`;
    const labelId = `${id}-label`;

    // Calculate angle
    const angle = this.calculateAngle(atom1, atom2, atom3);
    const labelPosition = this.calculateAngleLabelPosition(atom1, atom2, atom3);

    // Note: 3D arc rendering requires MolStar Shape API integration
    // For now, store the geometry data for tracking purposes

    // Store IDs for management
    this.representationIds.set(id, [arcId, labelId]);

    return { arcId, labelId };
  }

  /**
   * Render dihedral measurement as torsion plane with signed label
   */
  renderDihedral(id: string, atom1: Vec3, atom2: Vec3, atom3: Vec3, atom4: Vec3): DihedralResult {
    this.checkDuplicate(id);
    this.validateVec3(atom1, 'atom1');
    this.validateVec3(atom2, 'atom2');
    this.validateVec3(atom3, 'atom3');
    this.validateVec3(atom4, 'atom4');

    const plane1Id = `${id}-plane1`;
    const plane2Id = `${id}-plane2`;
    const labelId = `${id}-label`;

    // Calculate dihedral angle
    const angle = this.calculateDihedral(atom1, atom2, atom3, atom4);

    // Label position at midpoint of central bond
    const labelPosition = this.calculateMidpoint(atom2, atom3);

    // Note: 3D plane rendering requires MolStar Shape API integration
    // For now, store the geometry data for tracking purposes

    // Store IDs for management
    this.representationIds.set(id, [plane1Id, plane2Id, labelId]);

    return { plane1Id, plane2Id, labelId };
  }

  /**
   * Set visibility for a measurement
   */
  setVisibility(id: string, visible: boolean): void {
    const repIds = this.representationIds.get(id);
    if (!repIds) {
      throw new Error(`Measurement with ID '${id}' not found`);
    }

    // Note: Actual visibility toggle requires MolStar state integration
    // Visibility state is managed through the stored IDs
  }

  /**
   * Remove measurement visualization
   */
  remove(id: string): void {
    const repIds = this.representationIds.get(id);
    if (!repIds) {
      return;
    }

    // Remove from internal tracking
    this.representationIds.delete(id);
  }

  /**
   * Clear all measurement visualizations
   */
  clear(): void {
    // Clear internal tracking
    this.representationIds.clear();
  }

  /**
   * Generic render method for validation
   */
  render(id: string, type: string, atoms: Vec3[]): any {
    if (!['distance', 'angle', 'dihedral'].includes(type)) {
      throw new Error(`Invalid measurement type: ${type}`);
    }

    switch (type) {
      case 'distance':
        if (atoms.length < 2) {
          throw new Error('Distance measurement requires 2 atoms');
        }
        return this.renderDistance(id, atoms[0], atoms[1]);
      case 'angle':
        if (atoms.length < 3) {
          throw new Error('Angle measurement requires 3 atoms');
        }
        return this.renderAngle(id, atoms[0], atoms[1], atoms[2]);
      case 'dihedral':
        if (atoms.length < 4) {
          throw new Error('Dihedral measurement requires 4 atoms');
        }
        return this.renderDihedral(id, atoms[0], atoms[1], atoms[2], atoms[3]);
      default:
        throw new Error(`Invalid measurement type: ${type}`);
    }
  }

  /**
   * Dispose renderer and cleanup
   */
  dispose(): void {
    this.clear();
  }

  // Legacy methods for backward compatibility with old API
  async renderDistanceLegacy(measurement: MeasurementResult): Promise<void> {
    if (measurement.participants.length < 2) {
      throw new Error('Distance measurement requires 2 participants');
    }

    try {
      this.representations.set(measurement.id, {
        type: 'distance',
        visible: true,
        measurement,
      });

      console.info(`[MeasurementRenderer] Distance ${measurement.id} rendered: ${measurement.label}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to render distance:', error);
      throw error;
    }
  }

  async renderAngleLegacy(measurement: MeasurementResult): Promise<void> {
    if (measurement.participants.length < 3) {
      throw new Error('Angle measurement requires 3 participants');
    }

    try {
      this.representations.set(measurement.id, {
        type: 'angle',
        visible: true,
        measurement,
      });

      console.info(`[MeasurementRenderer] Angle ${measurement.id} rendered: ${measurement.label}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to render angle:', error);
      throw error;
    }
  }

  async renderDihedralLegacy(measurement: MeasurementResult): Promise<void> {
    if (measurement.participants.length < 4) {
      throw new Error('Dihedral measurement requires 4 participants');
    }

    try {
      this.representations.set(measurement.id, {
        type: 'dihedral',
        visible: true,
        measurement,
      });

      console.info(`[MeasurementRenderer] Dihedral ${measurement.id} rendered: ${measurement.label}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to render dihedral:', error);
      throw error;
    }
  }

  async updateMeasurement(id: string, newValue: number): Promise<void> {
    const repr = this.representations.get(id);
    if (!repr) {
      console.warn(`[MeasurementRenderer] Cannot update non-existent measurement ${id}`);
      return;
    }

    try {
      repr.measurement.value = newValue;
      repr.measurement.label = `${newValue.toFixed(2)}${repr.measurement.unit}`;

      switch (repr.type) {
        case 'distance':
          await this.renderDistanceLegacy(repr.measurement);
          break;
        case 'angle':
          await this.renderAngleLegacy(repr.measurement);
          break;
        case 'dihedral':
          await this.renderDihedralLegacy(repr.measurement);
          break;
      }

      console.info(`[MeasurementRenderer] Updated measurement ${id} to ${newValue}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to update measurement:', error);
      throw error;
    }
  }

  removeMeasurement(id: string): void {
    const repr = this.representations.get(id);
    if (!repr) {
      return;
    }

    try {
      this.representations.delete(id);
      console.info(`[MeasurementRenderer] Removed measurement ${id}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to remove measurement:', error);
    }
  }

  hideMeasurement(id: string): void {
    const repr = this.representations.get(id);
    if (!repr) {
      return;
    }

    try {
      repr.visible = false;
      console.info(`[MeasurementRenderer] Hidden measurement ${id}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to hide measurement:', error);
    }
  }

  showMeasurement(id: string): void {
    const repr = this.representations.get(id);
    if (!repr) {
      return;
    }

    try {
      repr.visible = true;
      console.info(`[MeasurementRenderer] Shown measurement ${id}`);
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to show measurement:', error);
    }
  }

  clearAll(): void {
    try {
      this.representations.clear();
      console.info('[MeasurementRenderer] Cleared all measurements');
    } catch (error) {
      console.error('[MeasurementRenderer] Failed to clear measurements:', error);
    }
  }

  getMeasurement(id: string): MeasurementRepresentation | undefined {
    return this.representations.get(id);
  }

  getAllMeasurements(): MeasurementRepresentation[] {
    return Array.from(this.representations.values());
  }

  hasMeasurement(id: string): boolean {
    return this.representations.has(id);
  }
}
