/**
 * Hydrogen Bond Detection Utilities
 *
 * Pure calculation functions for detecting hydrogen bonds in molecular structures.
 * These utilities operate on simple data structures and can be used independently
 * of MolStar or any visualization library.
 *
 * Scientific Criteria:
 * - Distance: 2.5-3.5 Å between donor and acceptor heavy atoms
 * - Angle: D-H...A angle > 120° for optimal bonding geometry
 * - Strength classification based on distance and angle
 */

/**
 * Atom representation for H-bond detection
 */
export interface SimpleAtom {
  residueId: string;
  atomName: string;
  element: string;
  position: [number, number, number];
}

/**
 * Structure representation for H-bond detection
 */
export interface SimpleStructure {
  atoms: SimpleAtom[];
}

/**
 * Hydrogen bond data structure
 */
export interface HydrogenBond {
  id: string;
  donorAtom: {
    residueId: string;
    atomName: string;
    element: string;
    position: [number, number, number];
  };
  hydrogenAtom: {
    atomName: string;
    position: [number, number, number];
    inferred?: boolean;
  };
  acceptorAtom: {
    residueId: string;
    atomName: string;
    element: string;
    position: [number, number, number];
  };
  distance: number;
  angle: number;
  strength: 'strong' | 'moderate' | 'weak';
  type: 'backbone-backbone' | 'backbone-sidechain' | 'sidechain-sidechain' | 'base-pair' | 'water-mediated';
}

/**
 * Detection options
 */
export interface DetectionOptions {
  minDistance?: number;
  maxDistance?: number;
  minAngle?: number;
  searchRadius?: number;
  inferHydrogens?: boolean;
  includeWaterMediated?: boolean;
}

/**
 * Inferred hydrogen position
 */
export interface InferredHydrogen {
  position: [number, number, number];
  parentAtom: SimpleAtom;
}

// Backbone atom names
const BACKBONE_ATOMS = new Set(['N', 'CA', 'C', 'O', 'H', 'HA']);

// Donor elements (can donate H for bonding)
const DONOR_ELEMENTS = new Set(['N', 'O', 'S']);

// Acceptor elements (have lone pairs for bonding)
const ACCEPTOR_ELEMENTS = new Set(['N', 'O', 'S', 'F']);

// Nucleic acid residue names (exact match required)
const NUCLEIC_ACID_RESIDUES = new Set([
  // DNA residues
  'DA', 'DT', 'DG', 'DC', 'DU',
  // RNA residues
  'A', 'U', 'G', 'C',
  // Alternative names
  'ADE', 'THY', 'GUA', 'CYT', 'URA',
]);

/**
 * Calculate Euclidean distance between two 3D points
 */
export function calculateDistance(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate D-H...A angle in degrees
 *
 * @param donor Donor heavy atom position
 * @param hydrogen Hydrogen atom position
 * @param acceptor Acceptor atom position
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
  donor: [number, number, number],
  hydrogen: [number, number, number],
  acceptor: [number, number, number]
): number {
  // Vector from H to donor (D-H)
  const v1 = [
    donor[0] - hydrogen[0],
    donor[1] - hydrogen[1],
    donor[2] - hydrogen[2],
  ];

  // Vector from H to acceptor (H...A)
  const v2 = [
    acceptor[0] - hydrogen[0],
    acceptor[1] - hydrogen[1],
    acceptor[2] - hydrogen[2],
  ];

  // Calculate angle using dot product
  const dotProduct = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
  const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = dotProduct / (mag1 * mag2);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRad = Math.acos(clampedCos);

  return (angleRad * 180) / Math.PI;
}

/**
 * Classify H-bond strength based on geometric criteria
 *
 * Strong: distance < 2.8 Å AND angle > 170°
 * Moderate: distance 2.8-3.2 Å OR angle 140-170°
 * Weak: distance > 3.2 Å OR angle < 140°
 */
export function calculateBondStrength(
  distance: number,
  angle: number
): 'strong' | 'moderate' | 'weak' {
  if (distance < 2.8 && angle > 170) {
    return 'strong';
  } else if (distance <= 3.2 && angle >= 140) {
    return 'moderate';
  } else {
    return 'weak';
  }
}

/**
 * Check if an atom is a backbone atom
 */
function isBackboneAtom(atomName: string): boolean {
  return BACKBONE_ATOMS.has(atomName);
}

/**
 * Check if a residue is a nucleic acid
 *
 * Format: 'DA:1' (residueName:number) or 'chainId:residueName:number'
 * Single-letter chain IDs like 'A:1' are NOT nucleic acids
 * (they're protein residues on chain A)
 */
function isNucleicAcid(residueId: string): boolean {
  // Extract the first part before colon
  const firstPart = residueId.split(':')[0].toUpperCase();

  // Single letters (A, B, C, etc.) are chain IDs, not nucleic acids
  // Nucleic acid residue names are at least 2 characters (DA, DT, etc.)
  // Exception: Check for explicit single-letter nucleic acids only if no colon
  if (firstPart.length === 1) {
    // 'A:1' is chain A, residue 1 - NOT a nucleic acid
    // But 'A' alone could be Adenine (rare format)
    if (residueId.includes(':')) {
      return false; // 'A:1' format = protein chain A
    }
    // Single letter without colon - check against nucleic acids
    return NUCLEIC_ACID_RESIDUES.has(firstPart);
  }

  // For 2+ character names, check against known nucleic acid residues
  return NUCLEIC_ACID_RESIDUES.has(firstPart);
}

/**
 * Check if a residue is water
 */
function isWater(residueId: string): boolean {
  return residueId.startsWith('HOH') || residueId.startsWith('WAT');
}

/**
 * Classify H-bond type based on participating atoms
 */
export function classifyBondType(
  bond: Partial<HydrogenBond>
): 'backbone-backbone' | 'backbone-sidechain' | 'sidechain-sidechain' | 'base-pair' | 'water-mediated' {
  const donorAtom = bond.donorAtom;
  const acceptorAtom = bond.acceptorAtom;

  if (!donorAtom || !acceptorAtom) {
    return 'backbone-backbone';
  }

  // Check for water-mediated
  if (isWater(donorAtom.residueId) || isWater(acceptorAtom.residueId)) {
    return 'water-mediated';
  }

  // Check for nucleic acid base pairs
  if (isNucleicAcid(donorAtom.residueId) && isNucleicAcid(acceptorAtom.residueId)) {
    return 'base-pair';
  }

  const donorIsBackbone = isBackboneAtom(donorAtom.atomName);
  const acceptorIsBackbone = isBackboneAtom(acceptorAtom.atomName);

  if (donorIsBackbone && acceptorIsBackbone) {
    return 'backbone-backbone';
  } else if (donorIsBackbone || acceptorIsBackbone) {
    return 'backbone-sidechain';
  } else {
    return 'sidechain-sidechain';
  }
}

/**
 * Check if an atom can be a hydrogen bond donor
 */
function isDonorAtom(atom: SimpleAtom): boolean {
  if (!DONOR_ELEMENTS.has(atom.element)) {
    return false;
  }
  // Backbone N and sidechain N/O/S with hydrogens
  return ['N', 'O', 'S'].includes(atom.element) &&
         !['O'].includes(atom.atomName); // Backbone O is acceptor only
}

/**
 * Check if an atom can be a hydrogen bond acceptor
 */
function isAcceptorAtom(atom: SimpleAtom): boolean {
  return ACCEPTOR_ELEMENTS.has(atom.element);
}

/**
 * Find hydrogen atoms bonded to a donor
 */
function findBondedHydrogen(
  donor: SimpleAtom,
  atoms: SimpleAtom[]
): SimpleAtom | null {
  const bondLength = 1.2; // Typical X-H bond length

  for (const atom of atoms) {
    if (atom.element === 'H' && atom.residueId === donor.residueId) {
      const distance = calculateDistance(donor.position, atom.position);
      if (distance <= bondLength) {
        return atom;
      }
    }
  }

  return null;
}

/**
 * Infer hydrogen positions for structures without explicit hydrogens
 */
export function inferHydrogenPositions(
  structure: SimpleStructure
): InferredHydrogen[] {
  const inferred: InferredHydrogen[] = [];
  const N_H_BOND_LENGTH = 1.01; // Typical N-H bond length in Å

  // Find nitrogen atoms that could have hydrogens
  const nitrogenAtoms = structure.atoms.filter(
    atom => atom.element === 'N' && atom.atomName === 'N'
  );

  for (const nitrogen of nitrogenAtoms) {
    // Find CA atom in same residue for direction
    const caAtom = structure.atoms.find(
      atom => atom.residueId === nitrogen.residueId && atom.atomName === 'CA'
    );

    if (caAtom) {
      // Calculate direction from CA to N
      const dx = nitrogen.position[0] - caAtom.position[0];
      const dy = nitrogen.position[1] - caAtom.position[1];
      const dz = nitrogen.position[2] - caAtom.position[2];

      const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (mag > 0) {
        // Place H opposite to CA direction
        const hPosition: [number, number, number] = [
          nitrogen.position[0] + (dx / mag) * N_H_BOND_LENGTH,
          nitrogen.position[1] + (dy / mag) * N_H_BOND_LENGTH,
          nitrogen.position[2] + (dz / mag) * N_H_BOND_LENGTH,
        ];

        inferred.push({
          position: hPosition,
          parentAtom: nitrogen,
        });
      }
    }
  }

  return inferred;
}

/**
 * Detect hydrogen bonds in a molecular structure
 */
export function detectHydrogenBonds(
  structure: SimpleStructure,
  options: DetectionOptions = {}
): HydrogenBond[] {
  const {
    minDistance = 2.5,
    maxDistance = 3.5,
    minAngle = 120,
    inferHydrogens = false,
    includeWaterMediated = false,
  } = options;

  const hbonds: HydrogenBond[] = [];
  const atoms = structure.atoms;

  // Find donors and acceptors
  const donors = atoms.filter(isDonorAtom);
  const acceptors = atoms.filter(isAcceptorAtom);

  // Infer hydrogens if requested
  let inferredHydrogens: InferredHydrogen[] = [];
  if (inferHydrogens) {
    inferredHydrogens = inferHydrogenPositions(structure);
  }

  // Check each donor-acceptor pair
  for (const donor of donors) {
    // Skip water if not including water-mediated
    if (!includeWaterMediated && isWater(donor.residueId)) {
      continue;
    }

    for (const acceptor of acceptors) {
      // Skip same residue (no intra-residue H-bonds for backbone)
      if (donor.residueId === acceptor.residueId &&
          isBackboneAtom(donor.atomName) && isBackboneAtom(acceptor.atomName)) {
        continue;
      }

      // Skip water if not including water-mediated
      if (!includeWaterMediated && isWater(acceptor.residueId)) {
        continue;
      }

      // Check distance criterion
      const distance = calculateDistance(donor.position, acceptor.position);

      if (distance >= minDistance && distance <= maxDistance) {
        // Find hydrogen (explicit or inferred)
        let hydrogen = findBondedHydrogen(donor, atoms);
        let hydrogenInferred = false;

        if (!hydrogen && inferHydrogens) {
          const inferredH = inferredHydrogens.find(
            h => h.parentAtom.residueId === donor.residueId &&
                 h.parentAtom.atomName === donor.atomName
          );
          if (inferredH) {
            hydrogen = {
              residueId: donor.residueId,
              atomName: 'H',
              element: 'H',
              position: inferredH.position,
            };
            hydrogenInferred = true;
          }
        }

        // Calculate angle (use 180° if no hydrogen)
        let angle: number;
        if (hydrogen) {
          angle = calculateAngle(donor.position, hydrogen.position, acceptor.position);
        } else {
          // Estimate angle based on D...A distance and typical geometry
          angle = 180; // Assume linear for missing H
        }

        // Check angle criterion
        if (angle >= minAngle) {
          const bondType = classifyBondType({
            donorAtom: donor,
            acceptorAtom: acceptor,
          });

          hbonds.push({
            id: `hbond-${hbonds.length + 1}`,
            donorAtom: {
              residueId: donor.residueId,
              atomName: donor.atomName,
              element: donor.element,
              position: donor.position,
            },
            hydrogenAtom: hydrogen ? {
              atomName: hydrogen.atomName,
              position: hydrogen.position,
              inferred: hydrogenInferred,
            } : {
              atomName: 'H',
              position: [0, 0, 0],
              inferred: true,
            },
            acceptorAtom: {
              residueId: acceptor.residueId,
              atomName: acceptor.atomName,
              element: acceptor.element,
              position: acceptor.position,
            },
            distance,
            angle,
            strength: calculateBondStrength(distance, angle),
            type: bondType,
          });
        }
      }
    }
  }

  return hbonds;
}

/**
 * Detect hydrogen bonds within a radius of a selected residue
 */
export function detectLocalizedHydrogenBonds(
  structure: SimpleStructure,
  selectedResidue: string,
  options: DetectionOptions = {}
): HydrogenBond[] {
  const { searchRadius = 5 } = options;

  // Find center of selected residue
  const residueAtoms = structure.atoms.filter(a => a.residueId === selectedResidue);
  if (residueAtoms.length === 0) {
    return [];
  }

  const centerX = residueAtoms.reduce((sum, a) => sum + a.position[0], 0) / residueAtoms.length;
  const centerY = residueAtoms.reduce((sum, a) => sum + a.position[1], 0) / residueAtoms.length;
  const centerZ = residueAtoms.reduce((sum, a) => sum + a.position[2], 0) / residueAtoms.length;
  const center: [number, number, number] = [centerX, centerY, centerZ];

  // Filter atoms within radius
  const nearbyAtoms = structure.atoms.filter(atom => {
    const distance = calculateDistance(atom.position, center);
    return distance <= searchRadius;
  });

  // Detect H-bonds in filtered structure
  const localStructure: SimpleStructure = { atoms: nearbyAtoms };
  return detectHydrogenBonds(localStructure, options);
}

/**
 * Create a hydrogen bond detector instance with methods
 */
export function createHydrogenBondDetector() {
  return {
    detectHydrogenBonds,
    detectLocalizedHydrogenBonds,
    inferHydrogenPositions,
    calculateBondStrength,
    classifyBondType,
  };
}
