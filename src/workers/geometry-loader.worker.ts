/**
 * Geometry Loader Web Worker
 * Handles geometry preparation in background thread
 * Prevents main thread blocking during LOD transitions
 */

import { LODLevel, RenderFeatures } from '../lib/lod-manager';

interface GeometryData {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  colors: Float32Array;
}

interface LoadGeometryMessage {
  type: 'load';
  atoms: any[];
  level: LODLevel;
  features: RenderFeatures;
  id: string;
}

interface SimplifyGeometryMessage {
  type: 'simplify';
  geometry: GeometryData;
  targetRatio: number;
  id: string;
}

interface PrepareInstancesMessage {
  type: 'prepare-instances';
  atoms: any[];
  instanceType: 'sphere' | 'cylinder';
  id: string;
}

type WorkerMessage =
  | LoadGeometryMessage
  | SimplifyGeometryMessage
  | PrepareInstancesMessage;

/**
 * Main worker message handler
 */
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;

  try {
    switch (type) {
      case 'load':
        handleLoadGeometry(event.data as LoadGeometryMessage);
        break;
      case 'simplify':
        handleSimplifyGeometry(event.data as SimplifyGeometryMessage);
        break;
      case 'prepare-instances':
        handlePrepareInstances(event.data as PrepareInstancesMessage);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Load and prepare geometry for atoms
 */
function handleLoadGeometry(message: LoadGeometryMessage): void {
  const { atoms, level, features, id } = message;

  // Generate geometry based on LOD level
  const geometry = generateGeometry(atoms, level, features);

  // Calculate bounding box
  const bounds = calculateBounds(geometry.vertices);

  self.postMessage(
    {
      id,
      type: 'geometry-loaded',
      geometry: {
        vertices: geometry.vertices,
        normals: geometry.normals,
        indices: geometry.indices,
        colors: geometry.colors,
      },
      bounds,
      atomCount: atoms.length,
    },
    // Transfer arrays for zero-copy
    [
      geometry.vertices.buffer,
      geometry.normals.buffer,
      geometry.indices.buffer,
      geometry.colors.buffer,
    ]
  );
}

/**
 * Generate geometry based on LOD level
 */
function generateGeometry(
  atoms: any[],
  level: LODLevel,
  features: RenderFeatures
): GeometryData {
  // Determine sphere quality based on LOD
  const sphereSegments = getSphereSegments(level);

  const verticesPerAtom = (sphereSegments + 1) * (sphereSegments + 1);
  const indicesPerAtom = sphereSegments * sphereSegments * 6;

  const totalVertices = atoms.length * verticesPerAtom;
  const totalIndices = atoms.length * indicesPerAtom;

  const vertices = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const indices = new Uint32Array(totalIndices);
  const colors = new Float32Array(totalVertices * 3);

  let vertexOffset = 0;
  let indexOffset = 0;

  // Generate geometry for each atom
  atoms.forEach((atom, atomIndex) => {
    const position = [atom.x || 0, atom.y || 0, atom.z || 0];
    const radius = atom.radius || 1.5;
    const color = atom.color || [0.5, 0.5, 0.5];

    // Generate sphere geometry
    const sphere = generateSphere(position, radius, sphereSegments);

    // Copy vertices
    vertices.set(sphere.vertices, vertexOffset * 3);
    normals.set(sphere.normals, vertexOffset * 3);

    // Copy colors
    for (let i = 0; i < sphere.vertices.length / 3; i++) {
      colors[vertexOffset * 3 + i * 3] = color[0];
      colors[vertexOffset * 3 + i * 3 + 1] = color[1];
      colors[vertexOffset * 3 + i * 3 + 2] = color[2];
    }

    // Copy indices with offset
    for (let i = 0; i < sphere.indices.length; i++) {
      indices[indexOffset + i] = sphere.indices[i] + vertexOffset;
    }

    vertexOffset += sphere.vertices.length / 3;
    indexOffset += sphere.indices.length;
  });

  return { vertices, normals, indices, colors };
}

/**
 * Get sphere segment count based on LOD level
 */
function getSphereSegments(level: LODLevel): number {
  switch (level) {
    case LODLevel.PREVIEW:
      return 6; // Low poly
    case LODLevel.INTERACTIVE:
      return 12; // Medium poly
    case LODLevel.FULL:
      return 24; // High poly
    default:
      return 12;
  }
}

/**
 * Generate sphere geometry
 */
function generateSphere(
  center: number[],
  radius: number,
  segments: number
): { vertices: Float32Array; normals: Float32Array; indices: Uint32Array } {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Generate vertices
  for (let lat = 0; lat <= segments; lat++) {
    const theta = (lat * Math.PI) / segments;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= segments; lon++) {
      const phi = (lon * 2 * Math.PI) / segments;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      // Position
      vertices.push(center[0] + radius * x, center[1] + radius * y, center[2] + radius * z);

      // Normal
      normals.push(x, y, z);
    }
  }

  // Generate indices
  for (let lat = 0; lat < segments; lat++) {
    for (let lon = 0; lon < segments; lon++) {
      const first = lat * (segments + 1) + lon;
      const second = first + segments + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

/**
 * Simplify geometry by reducing polygon count
 */
function handleSimplifyGeometry(message: SimplifyGeometryMessage): void {
  const { geometry, targetRatio, id } = message;

  // Simple decimation algorithm
  // In production, use more sophisticated algorithms like QEM
  const targetIndices = Math.floor(geometry.indices.length * targetRatio);
  const stride = Math.ceil(geometry.indices.length / targetIndices);

  const newIndices = new Uint32Array(
    Math.floor(geometry.indices.length / stride)
  );

  for (let i = 0; i < newIndices.length; i++) {
    newIndices[i] = geometry.indices[i * stride];
  }

  self.postMessage(
    {
      id,
      type: 'geometry-simplified',
      geometry: {
        vertices: geometry.vertices,
        normals: geometry.normals,
        indices: newIndices,
        colors: geometry.colors,
      },
      reductionRatio: newIndices.length / geometry.indices.length,
    },
    [newIndices.buffer]
  );
}

/**
 * Prepare instance data for instanced rendering
 */
function handlePrepareInstances(message: PrepareInstancesMessage): void {
  const { atoms, instanceType, id } = message;

  // Create instance matrix data
  const instanceMatrices = new Float32Array(atoms.length * 16);
  const instanceColors = new Float32Array(atoms.length * 3);

  atoms.forEach((atom, index) => {
    const position = [atom.x || 0, atom.y || 0, atom.z || 0];
    const scale = atom.radius || 1.5;
    const color = atom.color || [0.5, 0.5, 0.5];

    // Create transformation matrix (translation + scale)
    const matrixOffset = index * 16;
    instanceMatrices[matrixOffset + 0] = scale;
    instanceMatrices[matrixOffset + 1] = 0;
    instanceMatrices[matrixOffset + 2] = 0;
    instanceMatrices[matrixOffset + 3] = 0;
    instanceMatrices[matrixOffset + 4] = 0;
    instanceMatrices[matrixOffset + 5] = scale;
    instanceMatrices[matrixOffset + 6] = 0;
    instanceMatrices[matrixOffset + 7] = 0;
    instanceMatrices[matrixOffset + 8] = 0;
    instanceMatrices[matrixOffset + 9] = 0;
    instanceMatrices[matrixOffset + 10] = scale;
    instanceMatrices[matrixOffset + 11] = 0;
    instanceMatrices[matrixOffset + 12] = position[0];
    instanceMatrices[matrixOffset + 13] = position[1];
    instanceMatrices[matrixOffset + 14] = position[2];
    instanceMatrices[matrixOffset + 15] = 1;

    // Colors
    instanceColors[index * 3] = color[0];
    instanceColors[index * 3 + 1] = color[1];
    instanceColors[index * 3 + 2] = color[2];
  });

  self.postMessage(
    {
      id,
      type: 'instances-prepared',
      instanceMatrices,
      instanceColors,
      instanceCount: atoms.length,
    },
    [instanceMatrices.buffer, instanceColors.buffer]
  );
}

/**
 * Calculate bounding box for geometry
 */
function calculateBounds(vertices: Float32Array): {
  min: number[];
  max: number[];
  center: number[];
  radius: number;
} {
  if (vertices.length === 0) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      center: [0, 0, 0],
      radius: 0,
    };
  }

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];

  const radius = Math.sqrt(
    Math.pow(maxX - minX, 2) +
      Math.pow(maxY - minY, 2) +
      Math.pow(maxZ - minZ, 2)
  ) / 2;

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center,
    radius,
  };
}

// Export for TypeScript (not used at runtime)
export {};
