/**
 * Selection Manager Utilities
 *
 * Pure utility functions for managing multi-selection state without MolStar dependencies.
 * These functions handle selection logic, limits, validation, and state persistence.
 *
 * Pattern: Pure functions with no side effects, testable without external dependencies.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Atom selection data structure
 */
export interface SelectionAtom {
  id: string;
  atomName: string;
  residueName: string;
  chainId: string;
  residueSeq: number;
  position: [number, number, number];
  element: string;
}

/**
 * Selection manager configuration
 */
export interface SelectionConfig {
  maxSelections?: number;
}

/**
 * Selection state for persistence
 */
export interface SelectionState {
  atoms: SelectionAtom[];
  count: number;
  maxSelections: number;
}

/**
 * Selection operation result
 */
export interface SelectionResult {
  success: boolean;
  duplicate?: boolean;
  limited?: boolean;
  error?: string;
  warning?: string;
}

/**
 * Selection change event data
 */
export interface SelectionChangeEvent {
  added: SelectionAtom[];
  removed: SelectionAtom[];
  count: number;
}

/**
 * Internal selection manager state
 */
interface InternalState {
  atoms: Map<string, SelectionAtom>;
  maxSelections: number;
  batchMode: boolean;
  batchChanges: {
    added: SelectionAtom[];
    removed: SelectionAtom[];
  };
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate atom object has required properties
 */
export function isValidAtom(atom: any): atom is SelectionAtom {
  return (
    atom != null &&
    typeof atom === 'object' &&
    typeof atom.id === 'string' &&
    atom.id.length > 0 &&
    typeof atom.atomName === 'string' &&
    typeof atom.residueName === 'string' &&
    typeof atom.chainId === 'string' &&
    typeof atom.residueSeq === 'number' &&
    Array.isArray(atom.position) &&
    atom.position.length === 3 &&
    typeof atom.element === 'string'
  );
}

/**
 * Validate selection state object
 */
export function isValidState(state: any): state is SelectionState {
  return (
    state != null &&
    typeof state === 'object' &&
    Array.isArray(state.atoms) &&
    typeof state.count === 'number' &&
    state.count >= 0 &&
    typeof state.maxSelections === 'number' &&
    state.maxSelections > 0 &&
    state.atoms.every(isValidAtom)
  );
}

// ============================================================================
// Core Selection Functions
// ============================================================================

/**
 * Select a single atom
 */
export function selectAtom(
  state: InternalState,
  atom: SelectionAtom,
  options: { replaceMode?: boolean } = {}
): SelectionResult {
  // Validate atom
  if (!isValidAtom(atom)) {
    return { success: false, error: 'Invalid atom object' };
  }

  // Replace mode: clear existing selections first
  if (options.replaceMode) {
    const cleared = clearSelection(state);
    if (!cleared.success) {
      return cleared;
    }
  }

  // Check if already selected
  if (state.atoms.has(atom.id)) {
    return { success: true, duplicate: true };
  }

  // Check selection limit
  if (state.atoms.size >= state.maxSelections) {
    return {
      success: false,
      error: `Selection limit of ${state.maxSelections} reached`,
    };
  }

  // Add to selection
  state.atoms.set(atom.id, atom);

  // Track changes for batch mode
  if (state.batchMode) {
    state.batchChanges.added.push(atom);
  }

  return { success: true };
}

/**
 * Select multiple atoms
 */
export function selectAtoms(
  state: InternalState,
  atoms: SelectionAtom[],
  options: { replaceMode?: boolean } = {}
): SelectionResult {
  // Replace mode: clear existing selections first
  if (options.replaceMode) {
    const cleared = clearSelection(state);
    if (!cleared.success) {
      return cleared;
    }
  }

  let addedCount = 0;
  let limitReached = false;

  for (const atom of atoms) {
    if (!isValidAtom(atom)) {
      continue;
    }

    if (state.atoms.has(atom.id)) {
      continue; // Skip duplicates
    }

    if (state.atoms.size >= state.maxSelections) {
      limitReached = true;
      break;
    }

    state.atoms.set(atom.id, atom);
    addedCount++;

    if (state.batchMode) {
      state.batchChanges.added.push(atom);
    }
  }

  const result: SelectionResult = { success: true };

  if (limitReached) {
    result.limited = true;
    result.warning = `Selection limited to ${state.maxSelections} atoms. ${
      atoms.length - addedCount
    } atoms were not selected.`;
  }

  return result;
}

/**
 * Deselect an atom by ID
 */
export function deselectAtom(state: InternalState, atomId: string): SelectionResult {
  const atom = state.atoms.get(atomId);

  if (!atom) {
    return { success: true }; // Already not selected, no error
  }

  state.atoms.delete(atomId);

  if (state.batchMode) {
    state.batchChanges.removed.push(atom);
  }

  return { success: true };
}

/**
 * Deselect multiple atoms by ID
 */
export function deselectAtoms(state: InternalState, atomIds: string[]): SelectionResult {
  for (const atomId of atomIds) {
    deselectAtom(state, atomId);
  }

  return { success: true };
}

/**
 * Toggle atom selection
 */
export function toggleAtom(state: InternalState, atom: SelectionAtom): SelectionResult {
  if (!isValidAtom(atom)) {
    return { success: false, error: 'Invalid atom object' };
  }

  if (state.atoms.has(atom.id)) {
    return deselectAtom(state, atom.id);
  } else {
    return selectAtom(state, atom);
  }
}

/**
 * Clear all selections
 */
export function clearSelection(state: InternalState): SelectionResult {
  const removed = Array.from(state.atoms.values());

  state.atoms.clear();

  if (state.batchMode) {
    state.batchChanges.removed.push(...removed);
  }

  return { success: true };
}

/**
 * Select all atoms (respecting limit)
 */
export function selectAll(state: InternalState, atoms: SelectionAtom[]): SelectionResult {
  return selectAtoms(state, atoms, { replaceMode: true });
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Check if an atom is selected
 */
export function isSelected(state: InternalState, atomId: string): boolean {
  return state.atoms.has(atomId);
}

/**
 * Get all selected atoms
 */
export function getSelectedAtoms(state: InternalState): SelectionAtom[] {
  return Array.from(state.atoms.values());
}

/**
 * Get all selected atom IDs
 */
export function getSelectedIds(state: InternalState): string[] {
  return Array.from(state.atoms.keys());
}

/**
 * Get selection count
 */
export function getSelectionCount(state: InternalState): number {
  return state.atoms.size;
}

/**
 * Check if has any selections
 */
export function hasSelections(state: InternalState): boolean {
  return state.atoms.size > 0;
}

/**
 * Get maximum selections allowed
 */
export function getMaxSelections(state: InternalState): number {
  return state.maxSelections;
}

// ============================================================================
// Limit Functions
// ============================================================================

/**
 * Check if selection limit is reached
 */
export function isLimitReached(state: InternalState): boolean {
  return state.atoms.size >= state.maxSelections;
}

/**
 * Get remaining selection slots
 */
export function getRemainingSlots(state: InternalState): number {
  return Math.max(0, state.maxSelections - state.atoms.size);
}

// ============================================================================
// State Management Functions
// ============================================================================

/**
 * Export selection state for persistence
 */
export function exportState(state: InternalState): SelectionState {
  return {
    atoms: Array.from(state.atoms.values()),
    count: state.atoms.size,
    maxSelections: state.maxSelections,
  };
}

/**
 * Restore selection from persisted state
 */
export function restoreState(state: InternalState, savedState: SelectionState): SelectionResult {
  if (!isValidState(savedState)) {
    throw new Error('Invalid selection state format');
  }

  // Clear current state
  state.atoms.clear();

  // Restore max selections
  state.maxSelections = savedState.maxSelections;

  // Restore atoms
  for (const atom of savedState.atoms) {
    state.atoms.set(atom.id, atom);
  }

  return { success: true };
}

// ============================================================================
// Batch Operation Functions
// ============================================================================

/**
 * Begin batch mode (suppress individual events)
 */
export function beginBatch(state: InternalState): void {
  state.batchMode = true;
  state.batchChanges = { added: [], removed: [] };
}

/**
 * End batch mode and get accumulated changes
 */
export function endBatch(state: InternalState): SelectionChangeEvent {
  state.batchMode = false;

  const changes: SelectionChangeEvent = {
    added: state.batchChanges.added,
    removed: state.batchChanges.removed,
    count: state.atoms.size,
  };

  // Reset batch changes
  state.batchChanges = { added: [], removed: [] };

  return changes;
}

/**
 * Check if in batch mode
 */
export function isBatchMode(state: InternalState): boolean {
  return state.batchMode;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new selection manager state
 */
export function createSelectionManager(config: SelectionConfig = {}): InternalState {
  return {
    atoms: new Map<string, SelectionAtom>(),
    maxSelections: config.maxSelections ?? 100,
    batchMode: false,
    batchChanges: { added: [], removed: [] },
  };
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Types
  // Validation
  isValidAtom,
  isValidState,
  // Core Selection
  selectAtom,
  selectAtoms,
  deselectAtom,
  deselectAtoms,
  toggleAtom,
  clearSelection,
  selectAll,
  // Queries
  isSelected,
  getSelectedAtoms,
  getSelectedIds,
  getSelectionCount,
  hasSelections,
  getMaxSelections,
  // Limits
  isLimitReached,
  getRemainingSlots,
  // State Management
  exportState,
  restoreState,
  // Batch Operations
  beginBatch,
  endBatch,
  isBatchMode,
  // Factory
  createSelectionManager,
};
