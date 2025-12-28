/**
 * Measurement Renderer Utilities
 *
 * Pure geometry calculation functions for molecular measurements that can be
 * tested independently of MolStar or any visualization library.
 *
 * Measurement Types:
 * - Distance: line between two atoms with label in Angstroms
 * - Angle: arc at vertex with label in degrees
 * - Dihedral: two planes with label in degrees (-180 to +180)
 */

/**
 * 3D vector type
 */
export type Vec3 = [number, number, number];

/**
 * Line representation
 */
export interface LineGeometry {
  id: string;
  type: 'line';
  start: Vec3;
  end: Vec3;
  color: number;
  visible: boolean;
}

/**
 * Label representation
 */
export interface LabelGeometry {
  id: string;
  type: 'label';
  position: Vec3;
  text: string;
  visible: boolean;
}

/**
 * Arc representation
 */
export interface ArcGeometry {
  id: string;
  type: 'arc';
  center: Vec3;
  point1: Vec3;
  point2: Vec3;
  point3: Vec3;
  visible: boolean;
}

/**
 * Plane representation
 */
export interface PlaneGeometry {
  id: string;
  type: 'plane';
  points: Vec3[];
  visible: boolean;
}

/**
 * Distance measurement result
 */
export interface DistanceMeasurement {
  lineId: string;
  labelId: string;
  distance: number;
  line: LineGeometry;
  label: LabelGeometry;
}

/**
 * Angle measurement result
 */
export interface AngleMeasurement {
  arcId: string;
  labelId: string;
  angle: number;
  arc: ArcGeometry;
  label: LabelGeometry;
}

/**
 * Dihedral measurement result
 */
export interface DihedralMeasurement {
  plane1Id: string;
  plane2Id: string;
  labelId: string;
  angle: number;
  plane1: PlaneGeometry;
  plane2: PlaneGeometry;
  label: LabelGeometry;
}

/**
 * Default color for measurement lines
 */
export const DEFAULT_MEASUREMENT_COLOR = 0x00ff00;

/**
 * Calculate Euclidean distance between two 3D points
 */
export function calculateDistance(a: Vec3, b: Vec3): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate midpoint between two 3D points
 */
export function calculateMidpoint(a: Vec3, b: Vec3): Vec3 {
  return [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  ];
}

/**
 * Calculate angle between three points (angle at point b)
 * Returns angle in degrees
 */
export function calculateAngle(a: Vec3, b: Vec3, c: Vec3): number {
  // Vectors from b to a and b to c
  const ba: Vec3 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const bc: Vec3 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];

  // Dot product
  const dot = ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2];

  // Magnitudes
  const magBA = Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2]);
  const magBC = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1] + bc[2] * bc[2]);

  if (magBA === 0 || magBC === 0) {
    return 0;
  }

  // Angle in radians
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  const angleRad = Math.acos(cosAngle);

  // Convert to degrees
  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate dihedral angle between four points
 * Returns angle in degrees (-180 to +180)
 */
export function calculateDihedral(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  // Vectors
  const ab: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const bc: Vec3 = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  const cd: Vec3 = [d[0] - c[0], d[1] - c[1], d[2] - c[2]];

  // Cross products to get normal vectors
  const n1 = cross(ab, bc);
  const n2 = cross(bc, cd);

  // Normalize BC for sign calculation
  const bcNorm = normalize(bc);

  // Calculate angle
  const m1 = cross(n1, bcNorm);

  const x = dot(n1, n2);
  const y = dot(m1, n2);

  const angleRad = Math.atan2(y, x);
  return (angleRad * 180) / Math.PI;
}

/**
 * Calculate angle bisector position for label placement
 */
export function calculateAngleBisector(a: Vec3, b: Vec3, c: Vec3, distance: number = 0.5): Vec3 {
  // Normalize vectors from b to a and b to c
  const ba = normalize([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
  const bc = normalize([c[0] - b[0], c[1] - b[1], c[2] - b[2]]);

  // Bisector is the sum of the normalized vectors
  const bisector: Vec3 = [
    ba[0] + bc[0],
    ba[1] + bc[1],
    ba[2] + bc[2],
  ];

  const normalizedBisector = normalize(bisector);

  return [
    b[0] + normalizedBisector[0] * distance,
    b[1] + normalizedBisector[1] * distance,
    b[2] + normalizedBisector[2] * distance,
  ];
}

/**
 * Cross product of two vectors
 */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Dot product of two vectors
 */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Normalize a vector
 */
function normalize(v: Vec3): Vec3 {
  const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (mag === 0) {
    return [0, 0, 0];
  }
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}

/**
 * Format distance value with units
 */
export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)} Å`;
}

/**
 * Format angle value with units
 */
export function formatAngle(angle: number): string {
  return `${angle.toFixed(1)}°`;
}

/**
 * Measurement Renderer State Manager
 *
 * Manages measurement state without MolStar dependencies
 */
export class MeasurementRendererState {
  private measurements: Map<string, DistanceMeasurement | AngleMeasurement | DihedralMeasurement> = new Map();
  private geometries: Map<string, LineGeometry | LabelGeometry | ArcGeometry | PlaneGeometry> = new Map();

  /**
   * Render a distance measurement
   */
  renderDistance(
    id: string,
    atom1: Vec3,
    atom2: Vec3,
    color: number = DEFAULT_MEASUREMENT_COLOR
  ): DistanceMeasurement {
    this.validateNotDuplicate(id);
    this.validatePosition(atom1, 'atom1');
    this.validatePosition(atom2, 'atom2');

    const distance = calculateDistance(atom1, atom2);
    const midpoint = calculateMidpoint(atom1, atom2);

    const lineId = `${id}-line`;
    const labelId = `${id}-label`;

    const line: LineGeometry = {
      id: lineId,
      type: 'line',
      start: atom1,
      end: atom2,
      color,
      visible: true,
    };

    const label: LabelGeometry = {
      id: labelId,
      type: 'label',
      position: midpoint,
      text: formatDistance(distance),
      visible: true,
    };

    this.geometries.set(lineId, line);
    this.geometries.set(labelId, label);

    const measurement: DistanceMeasurement = {
      lineId,
      labelId,
      distance,
      line,
      label,
    };

    this.measurements.set(id, measurement);

    return measurement;
  }

  /**
   * Render an angle measurement
   */
  renderAngle(
    id: string,
    atom1: Vec3,
    atom2: Vec3,
    atom3: Vec3,
    color: number = DEFAULT_MEASUREMENT_COLOR
  ): AngleMeasurement {
    this.validateNotDuplicate(id);
    this.validatePosition(atom1, 'atom1');
    this.validatePosition(atom2, 'atom2');
    this.validatePosition(atom3, 'atom3');

    const angle = calculateAngle(atom1, atom2, atom3);
    const labelPosition = calculateAngleBisector(atom1, atom2, atom3, 1.0);

    const arcId = `${id}-arc`;
    const labelId = `${id}-label`;

    const arc: ArcGeometry = {
      id: arcId,
      type: 'arc',
      center: atom2,
      point1: atom1,
      point2: atom2,
      point3: atom3,
      visible: true,
    };

    const label: LabelGeometry = {
      id: labelId,
      type: 'label',
      position: labelPosition,
      text: formatAngle(angle),
      visible: true,
    };

    this.geometries.set(arcId, arc);
    this.geometries.set(labelId, label);

    const measurement: AngleMeasurement = {
      arcId,
      labelId,
      angle,
      arc,
      label,
    };

    this.measurements.set(id, measurement);

    return measurement;
  }

  /**
   * Render a dihedral measurement
   */
  renderDihedral(
    id: string,
    atom1: Vec3,
    atom2: Vec3,
    atom3: Vec3,
    atom4: Vec3
  ): DihedralMeasurement {
    this.validateNotDuplicate(id);
    this.validatePosition(atom1, 'atom1');
    this.validatePosition(atom2, 'atom2');
    this.validatePosition(atom3, 'atom3');
    this.validatePosition(atom4, 'atom4');

    const angle = calculateDihedral(atom1, atom2, atom3, atom4);
    const labelPosition = calculateMidpoint(atom2, atom3);

    const plane1Id = `${id}-plane1`;
    const plane2Id = `${id}-plane2`;
    const labelId = `${id}-label`;

    const plane1: PlaneGeometry = {
      id: plane1Id,
      type: 'plane',
      points: [atom1, atom2, atom3],
      visible: true,
    };

    const plane2: PlaneGeometry = {
      id: plane2Id,
      type: 'plane',
      points: [atom2, atom3, atom4],
      visible: true,
    };

    const label: LabelGeometry = {
      id: labelId,
      type: 'label',
      position: labelPosition,
      text: formatAngle(angle),
      visible: true,
    };

    this.geometries.set(plane1Id, plane1);
    this.geometries.set(plane2Id, plane2);
    this.geometries.set(labelId, label);

    const measurement: DihedralMeasurement = {
      plane1Id,
      plane2Id,
      labelId,
      angle,
      plane1,
      plane2,
      label,
    };

    this.measurements.set(id, measurement);

    return measurement;
  }

  /**
   * Generic render method
   */
  render(id: string, type: string, positions: Vec3[]): void {
    const validTypes = ['distance', 'angle', 'dihedral'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid measurement type: ${type}`);
    }

    if (type === 'distance' && positions.length >= 2) {
      this.renderDistance(id, positions[0], positions[1]);
    } else if (type === 'angle' && positions.length >= 3) {
      this.renderAngle(id, positions[0], positions[1], positions[2]);
    } else if (type === 'dihedral' && positions.length >= 4) {
      this.renderDihedral(id, positions[0], positions[1], positions[2], positions[3]);
    }
  }

  /**
   * Set visibility of a measurement
   */
  setVisibility(id: string, visible: boolean): void {
    const measurement = this.measurements.get(id);
    if (!measurement) {
      throw new Error(`Measurement not found: ${id}`);
    }

    // Get all geometry IDs for this measurement
    const geometryIds = this.getGeometryIds(id, measurement);

    for (const geoId of geometryIds) {
      const geometry = this.geometries.get(geoId);
      if (geometry) {
        geometry.visible = visible;
      }
    }
  }

  /**
   * Remove a measurement
   */
  remove(id: string): void {
    const measurement = this.measurements.get(id);
    if (!measurement) {
      return;
    }

    const geometryIds = this.getGeometryIds(id, measurement);

    for (const geoId of geometryIds) {
      this.geometries.delete(geoId);
    }

    this.measurements.delete(id);
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
    this.geometries.clear();
  }

  /**
   * Get a geometry by ID
   */
  get(id: string): LineGeometry | LabelGeometry | ArcGeometry | PlaneGeometry | undefined {
    return this.geometries.get(id);
  }

  /**
   * Get geometry IDs for a measurement
   */
  private getGeometryIds(id: string, measurement: DistanceMeasurement | AngleMeasurement | DihedralMeasurement): string[] {
    if ('lineId' in measurement) {
      return [measurement.lineId, measurement.labelId];
    } else if ('arcId' in measurement) {
      return [measurement.arcId, measurement.labelId];
    } else if ('plane1Id' in measurement) {
      return [measurement.plane1Id, measurement.plane2Id, measurement.labelId];
    }
    return [];
  }

  /**
   * Validate position is not null
   */
  private validatePosition(pos: Vec3 | null, name: string): void {
    if (pos === null || pos === undefined) {
      throw new Error(`Invalid position for ${name}`);
    }
  }

  /**
   * Validate no duplicate measurement ID
   */
  private validateNotDuplicate(id: string): void {
    if (this.measurements.has(id)) {
      throw new Error(`Measurement already exists: ${id}`);
    }
  }
}

/**
 * Create a measurement renderer instance
 */
export function createMeasurementRenderer(): MeasurementRendererState {
  return new MeasurementRendererState();
}
