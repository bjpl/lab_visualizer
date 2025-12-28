'use client';

/**
 * Multi-Selection Hook for Molecular Viewer
 *
 * Provides comprehensive multi-atom selection management with:
 * - Selection tracking with full atom metadata
 * - Selection limits for measurement modes
 * - MolStar highlighting integration
 * - Selection event callbacks
 *
 * @example
 * ```tsx
 * const {
 *   selections,
 *   addSelection,
 *   clearSelections,
 *   isSelected,
 * } = useMultiSelection({ maxSelections: 2 });
 * ```
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Atom selection with full metadata
 */
export interface AtomSelection {
  atomId: string;
  chainId: string;
  residueNumber: number;
  residueName: string;
  atomName: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
}

/**
 * Selection event types
 */
export interface SelectionEvent {
  type: 'add' | 'remove' | 'clear';
  selection?: AtomSelection;
  selections?: AtomSelection[];
}

/**
 * Hook options
 */
export interface UseMultiSelectionOptions {
  /** Maximum number of selections allowed (0 = unlimited) */
  maxSelections?: number;
  /** Callback when selection changes */
  onSelectionChanged?: (event: SelectionEvent) => void;
  /** Enable MolStar highlighting integration */
  enableHighlighting?: boolean;
  /** Custom highlight color */
  highlightColor?: string;
}

/**
 * Hook return value
 */
export interface UseMultiSelectionReturn {
  /** Current selections array */
  selections: AtomSelection[];
  /** Add a selection */
  addSelection: (selection: AtomSelection) => void;
  /** Remove a selection by atomId */
  removeSelection: (atomId: string) => void;
  /** Clear all selections */
  clearSelections: () => void;
  /** Toggle selection (add if not present, remove if present) */
  toggleSelection: (selection: AtomSelection) => void;
  /** Check if an atom is selected */
  isSelected: (atomId: string) => boolean;
  /** Number of current selections */
  selectionCount: number;
}

/**
 * Default highlight color (green)
 */
const DEFAULT_HIGHLIGHT_COLOR = '#00ff00';

/**
 * Multi-selection hook for molecular viewer
 */
export function useMultiSelection(
  options: UseMultiSelectionOptions = {}
): UseMultiSelectionReturn {
  const {
    maxSelections = 0, // 0 = unlimited
    onSelectionChanged,
    enableHighlighting = false,
    highlightColor = DEFAULT_HIGHLIGHT_COLOR,
  } = options;

  // Store selections in state
  const [selections, setSelections] = useState<AtomSelection[]>([]);

  // Track previous selections for cleanup
  const prevSelectionsRef = useRef<AtomSelection[]>([]);

  // Memoized set of selected atom IDs for fast lookup
  const selectedAtomIds = useMemo(() => {
    return new Set(selections.map((s) => s.atomId));
  }, [selections]);

  /**
   * Check if atom is selected
   */
  const isSelected = useCallback(
    (atomId: string): boolean => {
      return selectedAtomIds.has(atomId);
    },
    [selectedAtomIds]
  );

  /**
   * Add a selection
   */
  const addSelection = useCallback(
    (selection: AtomSelection) => {
      setSelections((prev) => {
        // Check for duplicate
        const existingIndex = prev.findIndex((s) => s.atomId === selection.atomId);

        if (existingIndex !== -1) {
          // Update timestamp on re-selection
          const updated = [...prev];
          updated[existingIndex] = { ...selection };
          return updated;
        }

        let newSelections = [...prev, selection];

        // Enforce max selections (FIFO - remove oldest)
        if (maxSelections > 0 && newSelections.length > maxSelections) {
          newSelections = newSelections.slice(-maxSelections);
        }

        // Emit event
        onSelectionChanged?.({
          type: 'add',
          selection,
        });

        return newSelections;
      });
    },
    [maxSelections, onSelectionChanged]
  );

  /**
   * Remove a selection by atomId
   */
  const removeSelection = useCallback(
    (atomId: string) => {
      setSelections((prev) => {
        const selection = prev.find((s) => s.atomId === atomId);
        if (!selection) {
          return prev; // No-op if not found
        }

        const newSelections = prev.filter((s) => s.atomId !== atomId);

        // Emit event
        onSelectionChanged?.({
          type: 'remove',
          selection,
        });

        return newSelections;
      });
    },
    [onSelectionChanged]
  );

  /**
   * Clear all selections
   */
  const clearSelections = useCallback(() => {
    setSelections((prev) => {
      if (prev.length === 0) {
        return prev; // No-op if already empty
      }

      // Emit event
      onSelectionChanged?.({
        type: 'clear',
        selections: prev,
      });

      return [];
    });
  }, [onSelectionChanged]);

  /**
   * Toggle selection
   */
  const toggleSelection = useCallback(
    (selection: AtomSelection) => {
      if (isSelected(selection.atomId)) {
        removeSelection(selection.atomId);
      } else {
        addSelection(selection);
      }
    },
    [isSelected, addSelection, removeSelection]
  );

  /**
   * Handle MolStar highlighting integration
   */
  useEffect(() => {
    if (!enableHighlighting) return;

    const molstar = (globalThis as any).molstar;
    if (!molstar) return;

    // Get newly added selections
    const prevIds = new Set(prevSelectionsRef.current.map((s) => s.atomId));
    const newSelections = selections.filter((s) => !prevIds.has(s.atomId));

    // Get removed selections
    const currentIds = new Set(selections.map((s) => s.atomId));
    const removedSelections = prevSelectionsRef.current.filter(
      (s) => !currentIds.has(s.atomId)
    );

    // Apply highlights for new selections
    if (newSelections.length > 0) {
      if (molstar.batchHighlight && newSelections.length > 1) {
        molstar.batchHighlight(
          newSelections.map((s) => ({
            atomId: s.atomId,
            color: highlightColor,
          }))
        );
      } else {
        newSelections.forEach((s) => {
          molstar.highlight?.({
            atomId: s.atomId,
            color: highlightColor,
          });
        });
      }
    }

    // Remove highlights for removed selections
    removedSelections.forEach((s) => {
      molstar.clearHighlight?.(s.atomId);
    });

    // Update ref
    prevSelectionsRef.current = selections;
  }, [selections, enableHighlighting, highlightColor]);

  /**
   * Cleanup highlights on unmount
   */
  useEffect(() => {
    return () => {
      if (!enableHighlighting) return;

      const molstar = (globalThis as any).molstar;
      if (molstar?.clearAllHighlights) {
        molstar.clearAllHighlights();
      }
    };
  }, [enableHighlighting]);

  return {
    selections,
    addSelection,
    removeSelection,
    clearSelections,
    toggleSelection,
    isSelected,
    selectionCount: selections.length,
  };
}

export default useMultiSelection;
