/**
 * Hydrogen Bond Renderer Utilities
 *
 * Pure utility functions for hydrogen bond visualization rendering.
 * These handle visual encoding, styling, and bond data processing
 * without MolStar dependencies.
 *
 * Visual Conventions:
 * - Dashed yellow lines (scientific standard)
 * - Strength-based line thickness
 * - Interactive tooltips with bond details
 */

import type { HydrogenBond } from '@/utils/hydrogen-bond-utils';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * RGB color tuple (0-1 range for WebGL compatibility)
 */
export type RGBColor = [number, number, number];

/**
 * Dash pattern configuration
 */
export interface DashPattern {
  dashLength: number;
  gapLength: number;
}

/**
 * Render options for hydrogen bond visualization
 */
export interface HBondRenderOptions {
  color?: RGBColor;
  dashPattern?: DashPattern;
  lineWidth?: number;
  opacity?: number;
  strengthEncoding?: boolean;
}

/**
 * Tooltip data for displaying bond information
 */
export interface HBondTooltipData {
  bond: HydrogenBond;
  position: [number, number, number];
  visible: boolean;
}

/**
 * Formatted tooltip content
 */
export interface TooltipContent {
  title: string;
  donor: string;
  acceptor: string;
  distance: string;
  angle: string;
  strength: string;
  type: string;
}

/**
 * Bond representation state
 */
export interface BondRepresentation {
  id: string;
  bondId: string;
  visible: boolean;
  highlighted: boolean;
  color: RGBColor;
  lineWidth: number;
  opacity: number;
  dashPattern: DashPattern;
}

/**
 * Renderer state
 */
export interface HBondRendererState {
  representations: Map<string, BondRepresentation>;
  activeRepresentationIds: string[];
  defaultOptions: Required<HBondRenderOptions>;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default yellow color for hydrogen bonds (scientific convention)
 */
export const DEFAULT_HBOND_COLOR: RGBColor = [1, 1, 0];

/**
 * Highlight color (brighter yellow)
 */
export const HIGHLIGHT_COLOR: RGBColor = [1, 1, 0.5];

/**
 * Default dash pattern (4px dash, 2px gap)
 */
export const DEFAULT_DASH_PATTERN: DashPattern = {
  dashLength: 4,
  gapLength: 2,
};

/**
 * Default opacity
 */
export const DEFAULT_OPACITY = 0.8;

/**
 * Strength to line width mapping
 */
export const STRENGTH_LINE_WIDTHS: Record<'strong' | 'moderate' | 'weak', number> = {
  strong: 3.0,
  moderate: 2.0,
  weak: 1.0,
};

/**
 * Default line width when strength encoding is disabled
 */
export const DEFAULT_LINE_WIDTH = 2.0;

// ============================================================================
// Default Options
// ============================================================================

/**
 * Get default render options
 */
export function getDefaultRenderOptions(): Required<HBondRenderOptions> {
  return {
    color: DEFAULT_HBOND_COLOR,
    dashPattern: DEFAULT_DASH_PATTERN,
    lineWidth: DEFAULT_LINE_WIDTH,
    opacity: DEFAULT_OPACITY,
    strengthEncoding: false,
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate hydrogen bond data
 */
export function isValidBond(bond: any): bond is HydrogenBond {
  return (
    bond != null &&
    typeof bond === 'object' &&
    typeof bond.id === 'string' &&
    bond.donorAtom != null &&
    typeof bond.donorAtom.position === 'object' &&
    Array.isArray(bond.donorAtom.position) &&
    bond.donorAtom.position.length === 3 &&
    bond.acceptorAtom != null &&
    typeof bond.acceptorAtom.position === 'object' &&
    Array.isArray(bond.acceptorAtom.position) &&
    bond.acceptorAtom.position.length === 3 &&
    typeof bond.distance === 'number' &&
    typeof bond.angle === 'number' &&
    ['strong', 'moderate', 'weak'].includes(bond.strength)
  );
}

/**
 * Validate render options
 */
export function validateRenderOptions(options: HBondRenderOptions): Required<HBondRenderOptions> {
  const defaults = getDefaultRenderOptions();

  return {
    color: options.color ?? defaults.color,
    dashPattern: options.dashPattern ?? defaults.dashPattern,
    lineWidth: options.lineWidth ?? defaults.lineWidth,
    opacity: options.opacity ?? defaults.opacity,
    strengthEncoding: options.strengthEncoding ?? defaults.strengthEncoding,
  };
}

// ============================================================================
// Line Width Calculation
// ============================================================================

/**
 * Calculate line width based on bond strength
 */
export function getLineWidthForStrength(
  strength: 'strong' | 'moderate' | 'weak',
  strengthEncoding: boolean = true
): number {
  if (!strengthEncoding) {
    return DEFAULT_LINE_WIDTH;
  }
  return STRENGTH_LINE_WIDTHS[strength];
}

/**
 * Get all strength-based options for a bond
 */
export function getStrengthBasedOptions(
  bond: HydrogenBond,
  options: HBondRenderOptions
): Required<HBondRenderOptions> {
  const validated = validateRenderOptions(options);

  if (validated.strengthEncoding) {
    validated.lineWidth = getLineWidthForStrength(bond.strength, true);
  }

  return validated;
}

// ============================================================================
// Tooltip Formatting
// ============================================================================

/**
 * Format tooltip content from bond data
 */
export function formatTooltipContent(bond: HydrogenBond): TooltipContent {
  return {
    title: 'Hydrogen Bond',
    donor: `${bond.donorAtom.residueId} ${bond.donorAtom.atomName}`,
    acceptor: `${bond.acceptorAtom.residueId} ${bond.acceptorAtom.atomName}`,
    distance: `${bond.distance.toFixed(1)} Å`,
    angle: `${bond.angle.toFixed(0)}°`,
    strength: bond.strength,
    type: bond.type,
  };
}

/**
 * Get tooltip position (midpoint of bond)
 */
export function getTooltipPosition(bond: HydrogenBond): [number, number, number] {
  const donor = bond.donorAtom.position;
  const acceptor = bond.acceptorAtom.position;

  return [
    (donor[0] + acceptor[0]) / 2,
    (donor[1] + acceptor[1]) / 2,
    (donor[2] + acceptor[2]) / 2,
  ];
}

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Filter bonds by strength
 */
export function filterBondsByStrength(
  bonds: HydrogenBond[],
  strength: 'strong' | 'moderate' | 'weak' | 'all'
): HydrogenBond[] {
  if (strength === 'all') {
    return bonds;
  }
  return bonds.filter(bond => bond.strength === strength);
}

/**
 * Filter bonds by type
 */
export function filterBondsByType(
  bonds: HydrogenBond[],
  type: string | 'all'
): HydrogenBond[] {
  if (type === 'all') {
    return bonds;
  }
  return bonds.filter(bond => bond.type === type);
}

// ============================================================================
// Representation Management
// ============================================================================

/**
 * Create a bond representation
 */
export function createBondRepresentation(
  bond: HydrogenBond,
  options: HBondRenderOptions = {}
): BondRepresentation {
  const validated = getStrengthBasedOptions(bond, options);

  return {
    id: `rep-${bond.id}`,
    bondId: bond.id,
    visible: true,
    highlighted: false,
    color: validated.color,
    lineWidth: validated.lineWidth,
    opacity: validated.opacity,
    dashPattern: validated.dashPattern,
  };
}

/**
 * Update representation for highlight state
 */
export function updateRepresentationHighlight(
  rep: BondRepresentation,
  highlighted: boolean
): BondRepresentation {
  return {
    ...rep,
    highlighted,
    color: highlighted ? HIGHLIGHT_COLOR : DEFAULT_HBOND_COLOR,
    opacity: highlighted ? 1.0 : rep.opacity,
  };
}

/**
 * Update representation visibility
 */
export function updateRepresentationVisibility(
  rep: BondRepresentation,
  visible: boolean
): BondRepresentation {
  return {
    ...rep,
    visible,
  };
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Create initial renderer state
 */
export function createRendererState(options: HBondRenderOptions = {}): HBondRendererState {
  return {
    representations: new Map(),
    activeRepresentationIds: [],
    defaultOptions: validateRenderOptions(options),
  };
}

/**
 * Add bonds to renderer state
 */
export function addBondsToState(
  state: HBondRendererState,
  bonds: HydrogenBond[],
  options: HBondRenderOptions = {}
): HBondRendererState {
  const newRepresentations = new Map(state.representations);
  const newIds = [...state.activeRepresentationIds];

  for (const bond of bonds) {
    if (!isValidBond(bond)) {
      continue;
    }

    const mergedOptions = { ...state.defaultOptions, ...options };
    const rep = createBondRepresentation(bond, mergedOptions);

    newRepresentations.set(rep.id, rep);
    if (!newIds.includes(rep.id)) {
      newIds.push(rep.id);
    }
  }

  return {
    ...state,
    representations: newRepresentations,
    activeRepresentationIds: newIds,
  };
}

/**
 * Remove bonds from renderer state
 */
export function removeBondsFromState(
  state: HBondRendererState,
  bondIds: string[]
): HBondRendererState {
  const newRepresentations = new Map(state.representations);
  const repIdsToRemove = bondIds.map(id => `rep-${id}`);

  for (const repId of repIdsToRemove) {
    newRepresentations.delete(repId);
  }

  const newIds = state.activeRepresentationIds.filter(
    id => !repIdsToRemove.includes(id)
  );

  return {
    ...state,
    representations: newRepresentations,
    activeRepresentationIds: newIds,
  };
}

/**
 * Clear all bonds from state
 */
export function clearState(state: HBondRendererState): HBondRendererState {
  return {
    ...state,
    representations: new Map(),
    activeRepresentationIds: [],
  };
}

/**
 * Toggle visibility for all bonds
 */
export function toggleAllVisibility(
  state: HBondRendererState,
  visible: boolean
): HBondRendererState {
  const newRepresentations = new Map<string, BondRepresentation>();

  for (const [id, rep] of state.representations) {
    newRepresentations.set(id, updateRepresentationVisibility(rep, visible));
  }

  return {
    ...state,
    representations: newRepresentations,
  };
}

/**
 * Update render options for all bonds
 */
export function updateStateOptions(
  state: HBondRendererState,
  options: HBondRenderOptions
): HBondRendererState {
  const validated = validateRenderOptions(options);
  const newRepresentations = new Map<string, BondRepresentation>();

  for (const [id, rep] of state.representations) {
    newRepresentations.set(id, {
      ...rep,
      color: validated.color,
      lineWidth: validated.lineWidth,
      opacity: validated.opacity,
      dashPattern: validated.dashPattern,
    });
  }

  return {
    ...state,
    representations: newRepresentations,
    defaultOptions: validated,
  };
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  // Constants
  DEFAULT_HBOND_COLOR,
  HIGHLIGHT_COLOR,
  DEFAULT_DASH_PATTERN,
  DEFAULT_OPACITY,
  STRENGTH_LINE_WIDTHS,
  DEFAULT_LINE_WIDTH,

  // Functions
  getDefaultRenderOptions,
  isValidBond,
  validateRenderOptions,
  getLineWidthForStrength,
  getStrengthBasedOptions,
  formatTooltipContent,
  getTooltipPosition,
  filterBondsByStrength,
  filterBondsByType,
  createBondRepresentation,
  updateRepresentationHighlight,
  updateRepresentationVisibility,
  createRendererState,
  addBondsToState,
  removeBondsFromState,
  clearState,
  toggleAllVisibility,
  updateStateOptions,
};
