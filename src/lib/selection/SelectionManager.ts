/**
 * SelectionManager - Class wrapper for selection utilities
 *
 * Provides a class-based API with event system for managing multi-selection state.
 * Uses pure utility functions internally for testability.
 */

import {
  createSelectionManager,
  selectAtom as utilSelectAtom,
  selectAtoms as utilSelectAtoms,
  deselectAtom as utilDeselectAtom,
  deselectAtoms as utilDeselectAtoms,
  toggleAtom as utilToggleAtom,
  clearSelection as utilClearSelection,
  selectAll as utilSelectAll,
  isSelected as utilIsSelected,
  getSelectedAtoms as utilGetSelectedAtoms,
  getSelectedIds as utilGetSelectedIds,
  getSelectionCount as utilGetSelectionCount,
  hasSelections as utilHasSelections,
  getMaxSelections as utilGetMaxSelections,
  isLimitReached as utilIsLimitReached,
  getRemainingSlots as utilGetRemainingSlots,
  exportState as utilExportState,
  restoreState as utilRestoreState,
  beginBatch as utilBeginBatch,
  endBatch as utilEndBatch,
  isBatchMode as utilIsBatchMode,
  isValidAtom,
  isValidState,
  type SelectionAtom,
  type SelectionConfig,
  type SelectionState,
  type SelectionResult,
  type SelectionChangeEvent,
} from '@/utils/selection-manager-utils';

// Re-export types
export type { SelectionAtom, SelectionConfig, SelectionState, SelectionResult, SelectionChangeEvent };

type EventType = 'selectionChange' | 'selectionCleared' | 'limitReached';
type EventCallback = (data?: any) => void;

/**
 * SelectionManager class with event system
 */
export class SelectionManager {
  private state: ReturnType<typeof createSelectionManager>;
  private eventListeners: Map<EventType, Set<EventCallback>>;

  constructor(config: SelectionConfig = {}) {
    this.state = createSelectionManager(config);
    this.eventListeners = new Map([
      ['selectionChange', new Set()],
      ['selectionCleared', new Set()],
      ['limitReached', new Set()],
    ]);
  }

  // ============================================================================
  // Core Selection Methods
  // ============================================================================

  /**
   * Select a single atom
   */
  selectAtom(atom: SelectionAtom, options: { replaceMode?: boolean } = {}): SelectionResult {
    if (!isValidAtom(atom)) {
      return { success: false, error: 'Invalid atom object' };
    }

    const previousCount = utilGetSelectionCount(this.state);
    const wasSelected = utilIsSelected(this.state, atom.id);

    const result = utilSelectAtom(this.state, atom, options);

    if (result.success && !result.duplicate && !utilIsBatchMode(this.state)) {
      const added = wasSelected ? [] : [atom];
      const removed = options.replaceMode && previousCount > 0 ? this.getPreviouslySelected(atom) : [];
      this.emit('selectionChange', {
        added,
        removed,
        count: utilGetSelectionCount(this.state),
      });
    }

    if (!result.success && result.error?.includes('limit')) {
      this.emit('limitReached', { limit: utilGetMaxSelections(this.state) });
    }

    return result;
  }

  /**
   * Select multiple atoms
   */
  selectAtoms(atoms: SelectionAtom[], options: { replaceMode?: boolean } = {}): SelectionResult {
    const previousAtoms = utilGetSelectedAtoms(this.state);
    const result = utilSelectAtoms(this.state, atoms, options);

    if (result.success && !utilIsBatchMode(this.state)) {
      const currentAtoms = utilGetSelectedAtoms(this.state);
      const previousIds = new Set(previousAtoms.map(a => a.id));
      const currentIds = new Set(currentAtoms.map(a => a.id));

      const added = currentAtoms.filter(a => !previousIds.has(a.id));
      const removed = options.replaceMode ? previousAtoms.filter(a => !currentIds.has(a.id)) : [];

      if (added.length > 0 || removed.length > 0) {
        this.emit('selectionChange', {
          added,
          removed,
          count: utilGetSelectionCount(this.state),
        });
      }
    }

    return result;
  }

  /**
   * Deselect an atom by ID
   */
  deselectAtom(atomId: string): SelectionResult {
    const atom = this.getAtomById(atomId);
    const result = utilDeselectAtom(this.state, atomId);

    if (result.success && atom && !utilIsBatchMode(this.state)) {
      this.emit('selectionChange', {
        added: [],
        removed: [atom],
        count: utilGetSelectionCount(this.state),
      });
    }

    return result;
  }

  /**
   * Deselect multiple atoms by ID
   */
  deselectAtoms(atomIds: string[]): SelectionResult {
    const removedAtoms = atomIds
      .map(id => this.getAtomById(id))
      .filter((a): a is SelectionAtom => a !== null);

    const result = utilDeselectAtoms(this.state, atomIds);

    if (result.success && removedAtoms.length > 0 && !utilIsBatchMode(this.state)) {
      this.emit('selectionChange', {
        added: [],
        removed: removedAtoms,
        count: utilGetSelectionCount(this.state),
      });
    }

    return result;
  }

  /**
   * Toggle atom selection
   */
  toggleAtom(atom: SelectionAtom): SelectionResult {
    if (!isValidAtom(atom)) {
      return { success: false, error: 'Invalid atom object' };
    }

    const wasSelected = utilIsSelected(this.state, atom.id);
    const result = utilToggleAtom(this.state, atom);

    if (result.success && !utilIsBatchMode(this.state)) {
      this.emit('selectionChange', {
        added: wasSelected ? [] : [atom],
        removed: wasSelected ? [atom] : [],
        count: utilGetSelectionCount(this.state),
      });
    }

    return result;
  }

  /**
   * Clear all selections
   */
  clearSelection(): SelectionResult {
    const removed = utilGetSelectedAtoms(this.state);
    const result = utilClearSelection(this.state);

    if (result.success) {
      if (!utilIsBatchMode(this.state)) {
        this.emit('selectionCleared', { count: removed.length });
      }
    }

    return result;
  }

  /**
   * Select all atoms (respecting limit)
   */
  selectAll(atoms: SelectionAtom[]): SelectionResult {
    const previousAtoms = utilGetSelectedAtoms(this.state);
    const result = utilSelectAll(this.state, atoms);

    if (result.success && !utilIsBatchMode(this.state)) {
      const currentAtoms = utilGetSelectedAtoms(this.state);
      const previousIds = new Set(previousAtoms.map(a => a.id));

      const added = currentAtoms.filter(a => !previousIds.has(a.id));

      if (added.length > 0 || previousAtoms.length > 0) {
        this.emit('selectionChange', {
          added,
          removed: previousAtoms,
          count: utilGetSelectionCount(this.state),
        });
      }
    }

    return result;
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  /**
   * Check if an atom is selected
   */
  isSelected(atomId: string): boolean {
    return utilIsSelected(this.state, atomId);
  }

  /**
   * Get all selected atoms
   */
  getSelectedAtoms(): SelectionAtom[] {
    return utilGetSelectedAtoms(this.state);
  }

  /**
   * Get all selected atom IDs
   */
  getSelectedIds(): string[] {
    return utilGetSelectedIds(this.state);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return utilGetSelectionCount(this.state);
  }

  /**
   * Check if has any selections
   */
  hasSelections(): boolean {
    return utilHasSelections(this.state);
  }

  /**
   * Get maximum selections allowed
   */
  getMaxSelections(): number {
    return utilGetMaxSelections(this.state);
  }

  // ============================================================================
  // Limit Methods
  // ============================================================================

  /**
   * Check if selection limit is reached
   */
  isLimitReached(): boolean {
    return utilIsLimitReached(this.state);
  }

  /**
   * Get remaining selection slots
   */
  getRemainingSlots(): number {
    return utilGetRemainingSlots(this.state);
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Export selection state for persistence
   */
  exportState(): SelectionState {
    return utilExportState(this.state);
  }

  /**
   * Restore selection from persisted state
   */
  restoreState(savedState: SelectionState): SelectionResult {
    if (!isValidState(savedState)) {
      throw new Error('Invalid selection state format');
    }
    return utilRestoreState(this.state, savedState);
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  /**
   * Begin batch mode (suppress individual events)
   */
  beginBatch(): void {
    utilBeginBatch(this.state);
  }

  /**
   * End batch mode and emit accumulated changes
   */
  endBatch(): SelectionChangeEvent {
    const changes = utilEndBatch(this.state);

    if (changes.added.length > 0 || changes.removed.length > 0) {
      this.emit('selectionChange', changes);
    }

    return changes;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Add event listener
   */
  on(event: EventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: EventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: EventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get atom by ID from current selection
   */
  private getAtomById(atomId: string): SelectionAtom | null {
    const atoms = utilGetSelectedAtoms(this.state);
    return atoms.find(a => a.id === atomId) ?? null;
  }

  /**
   * Get atoms that were previously selected (for replace mode)
   */
  private getPreviouslySelected(except: SelectionAtom): SelectionAtom[] {
    return utilGetSelectedAtoms(this.state).filter(a => a.id !== except.id);
  }
}

export default SelectionManager;
