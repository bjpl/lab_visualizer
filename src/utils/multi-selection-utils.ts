/**
 * Multi-Selection Utility Functions
 *
 * Pure TypeScript utilities for managing multi-selection state.
 * No React, Zustand, or UI framework dependencies.
 */

/**
 * Represents a single selectable item
 */
export interface SelectionItem {
  id: string;
  metadata?: Record<string, unknown>;
}

/**
 * The complete multi-selection state
 */
export interface MultiSelectionState {
  selectedItems: Set<string>;
}

/**
 * Configuration options for creating a multi-selection store
 */
export interface MultiSelectionStoreConfig {
  initialSelection?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

/**
 * Multi-selection store with all operations
 */
export interface MultiSelectionStore {
  state: MultiSelectionState;
  addSelection: (id: string) => MultiSelectionState;
  removeSelection: (id: string) => MultiSelectionState;
  toggleSelection: (id: string) => MultiSelectionState;
  clearSelection: () => MultiSelectionState;
  selectAll: (ids: string[]) => MultiSelectionState;
  getSelectionCount: () => number;
  hasSelection: (id: string) => boolean;
  getSelectedIds: () => string[];
}

/**
 * Add an item to the selection
 *
 * @param state - Current multi-selection state
 * @param id - ID of the item to add
 * @returns New state with the item added
 */
export function addSelection(
  state: MultiSelectionState,
  id: string
): MultiSelectionState {
  const newSelectedItems = new Set(state.selectedItems);
  newSelectedItems.add(id);

  return {
    selectedItems: newSelectedItems,
  };
}

/**
 * Remove an item from the selection
 *
 * @param state - Current multi-selection state
 * @param id - ID of the item to remove
 * @returns New state with the item removed
 */
export function removeSelection(
  state: MultiSelectionState,
  id: string
): MultiSelectionState {
  const newSelectedItems = new Set(state.selectedItems);
  newSelectedItems.delete(id);

  return {
    selectedItems: newSelectedItems,
  };
}

/**
 * Toggle an item in the selection (add if not present, remove if present)
 *
 * @param state - Current multi-selection state
 * @param id - ID of the item to toggle
 * @returns New state with the item toggled
 */
export function toggleSelection(
  state: MultiSelectionState,
  id: string
): MultiSelectionState {
  if (state.selectedItems.has(id)) {
    return removeSelection(state, id);
  }
  return addSelection(state, id);
}

/**
 * Clear all selections
 *
 * @param state - Current multi-selection state
 * @returns New state with all selections cleared
 */
export function clearSelection(
  state: MultiSelectionState
): MultiSelectionState {
  return {
    selectedItems: new Set(),
  };
}

/**
 * Select all items from a list
 *
 * @param state - Current multi-selection state
 * @param ids - Array of IDs to select
 * @returns New state with all items selected
 */
export function selectAll(
  state: MultiSelectionState,
  ids: string[]
): MultiSelectionState {
  return {
    selectedItems: new Set(ids),
  };
}

/**
 * Get the count of selected items
 *
 * @param state - Current multi-selection state
 * @returns Number of selected items
 */
export function getSelectionCount(state: MultiSelectionState): number {
  return state.selectedItems.size;
}

/**
 * Check if an item is selected
 *
 * @param state - Current multi-selection state
 * @param id - ID of the item to check
 * @returns True if the item is selected, false otherwise
 */
export function hasSelection(state: MultiSelectionState, id: string): boolean {
  return state.selectedItems.has(id);
}

/**
 * Get all selected item IDs as an array
 *
 * @param state - Current multi-selection state
 * @returns Array of selected item IDs
 */
export function getSelectedIds(state: MultiSelectionState): string[] {
  return Array.from(state.selectedItems);
}

/**
 * Create an initial multi-selection state
 *
 * @param initialSelection - Optional array of initially selected IDs
 * @returns Initial multi-selection state
 */
export function createInitialState(
  initialSelection: string[] = []
): MultiSelectionState {
  return {
    selectedItems: new Set(initialSelection),
  };
}

/**
 * Factory function to create a multi-selection store
 *
 * Creates a stateful multi-selection manager with all operations.
 * This is a simple implementation that can be wrapped by any state management
 * library (Zustand, Redux, etc.) or used standalone.
 *
 * @param config - Configuration options
 * @returns Multi-selection store with operations
 */
export function createMultiSelectionStore(
  config: MultiSelectionStoreConfig = {}
): MultiSelectionStore {
  let state: MultiSelectionState = createInitialState(config.initialSelection);

  const notifyChange = () => {
    if (config.onSelectionChange) {
      config.onSelectionChange(getSelectedIds(state));
    }
  };

  return {
    get state() {
      return state;
    },

    addSelection(id: string): MultiSelectionState {
      state = addSelection(state, id);
      notifyChange();
      return state;
    },

    removeSelection(id: string): MultiSelectionState {
      state = removeSelection(state, id);
      notifyChange();
      return state;
    },

    toggleSelection(id: string): MultiSelectionState {
      state = toggleSelection(state, id);
      notifyChange();
      return state;
    },

    clearSelection(): MultiSelectionState {
      state = clearSelection(state);
      notifyChange();
      return state;
    },

    selectAll(ids: string[]): MultiSelectionState {
      state = selectAll(state, ids);
      notifyChange();
      return state;
    },

    getSelectionCount(): number {
      return getSelectionCount(state);
    },

    hasSelection(id: string): boolean {
      return hasSelection(state, id);
    },

    getSelectedIds(): string[] {
      return getSelectedIds(state);
    },
  };
}

/**
 * Helper function to merge selections from multiple states
 *
 * @param states - Array of multi-selection states to merge
 * @returns New state with all selections merged
 */
export function mergeSelections(
  ...states: MultiSelectionState[]
): MultiSelectionState {
  const mergedIds = new Set<string>();

  for (const state of states) {
    state.selectedItems.forEach((id) => mergedIds.add(id));
  }

  return {
    selectedItems: mergedIds,
  };
}

/**
 * Helper function to intersect selections from multiple states
 *
 * @param states - Array of multi-selection states to intersect
 * @returns New state with only items selected in all states
 */
export function intersectSelections(
  ...states: MultiSelectionState[]
): MultiSelectionState {
  if (states.length === 0) {
    return createInitialState();
  }

  const [first, ...rest] = states;
  const intersectedIds = new Set(first.selectedItems);

  for (const state of rest) {
    for (const id of intersectedIds) {
      if (!state.selectedItems.has(id)) {
        intersectedIds.delete(id);
      }
    }
  }

  return {
    selectedItems: intersectedIds,
  };
}

/**
 * Helper function to get the difference between two selections
 * (items in first but not in second)
 *
 * @param state1 - First multi-selection state
 * @param state2 - Second multi-selection state
 * @returns New state with items in state1 but not in state2
 */
export function diffSelections(
  state1: MultiSelectionState,
  state2: MultiSelectionState
): MultiSelectionState {
  const diffIds = new Set(state1.selectedItems);

  state2.selectedItems.forEach((id) => {
    diffIds.delete(id);
  });

  return {
    selectedItems: diffIds,
  };
}

/**
 * Helper function to check if two selection states are equal
 *
 * @param state1 - First multi-selection state
 * @param state2 - Second multi-selection state
 * @returns True if states have the same selections, false otherwise
 */
export function areSelectionsEqual(
  state1: MultiSelectionState,
  state2: MultiSelectionState
): boolean {
  if (state1.selectedItems.size !== state2.selectedItems.size) {
    return false;
  }

  for (const id of state1.selectedItems) {
    if (!state2.selectedItems.has(id)) {
      return false;
    }
  }

  return true;
}
