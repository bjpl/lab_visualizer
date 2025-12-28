/**
 * Selection Store - Zustand
 *
 * Manages multi-atom selection state with keyboard modifier support
 * and measurement mode tracking.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

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
 * Residue selection
 */
export interface ResidueSelection {
  chainId: string;
  residueNumber: number;
  residueName: string;
  atomCount: number;
  timestamp: number;
}

/**
 * Selection type (atom or residue)
 */
export type Selection = AtomSelection | ResidueSelection;

/**
 * Measurement type
 */
export type MeasurementType = 'distance' | 'angle' | 'dihedral' | null;

/**
 * Maximum selections by measurement type
 */
const MAX_SELECTIONS_BY_TYPE: Record<string, number> = {
  distance: 2,
  angle: 3,
  dihedral: 4,
};

/**
 * Type guard for AtomSelection
 */
export function isAtomSelection(selection: Selection): selection is AtomSelection {
  return 'atomId' in selection;
}

/**
 * Type guard for ResidueSelection
 */
export function isResidueSelection(selection: Selection): selection is ResidueSelection {
  return 'atomCount' in selection;
}

/**
 * Validate selection data integrity
 */
function validateSelection(selection: Selection): void {
  if (isAtomSelection(selection)) {
    if (
      !selection.atomId ||
      !selection.chainId ||
      typeof selection.residueNumber !== 'number' ||
      !selection.residueName ||
      !selection.atomName ||
      !selection.position ||
      typeof selection.position.x !== 'number' ||
      typeof selection.position.y !== 'number' ||
      typeof selection.position.z !== 'number'
    ) {
      throw new Error('Invalid AtomSelection: missing required fields');
    }
  } else {
    if (
      !selection.chainId ||
      typeof selection.residueNumber !== 'number' ||
      !selection.residueName ||
      typeof selection.atomCount !== 'number'
    ) {
      throw new Error('Invalid ResidueSelection: missing required fields');
    }
  }
}

/**
 * Simple selection store interface (backward compatible)
 */
export interface SimpleSelectionStore {
  selectedAtoms: Set<string>;
  addSelection: (atomId: string) => void;
  removeSelection: (atomId: string) => void;
  toggleSelection: (atomId: string) => void;
  clearSelection: () => void;
  selectAll: (atomIds: string[]) => void;
}

/**
 * Extended selection store interface with full Selection objects
 */
export interface ExtendedSelectionStore {
  // State
  selections: Selection[];
  measurementType: MeasurementType;
  maxSelections: number;
  autoTriggerMeasurement: boolean;

  // Actions
  addSelection: (selection: Selection) => void;
  removeSelection: (index: number) => void;
  clearSelections: () => void;
  setMeasurementType: (type: MeasurementType) => void;
  getSelectionOrder: () => Selection[];
}

/**
 * Combined store type
 */
export interface SelectionStore extends SimpleSelectionStore {
  // Extended state
  selections: Selection[];
  measurementType: MeasurementType;
  maxSelections: number;
  autoTriggerMeasurement: boolean;

  // Extended actions
  addFullSelection: (selection: Selection) => void;
  removeFullSelection: (index: number) => void;
  clearSelections: () => void;
  setMeasurementType: (type: MeasurementType) => void;
  getSelectionOrder: () => Selection[];
}

/**
 * Selection store with Zustand
 * Manages atom selection state for multi-selection system
 */
export const useSelectionStore = create<SelectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Simple state (backward compatible)
        selectedAtoms: new Set<string>(),

        // Extended state
        selections: [],
        measurementType: null,
        maxSelections: 0,
        autoTriggerMeasurement: false,

        // Simple actions (backward compatible)
        addSelection: (atomId: string) =>
          set((state) => {
            const newSelection = new Set(state.selectedAtoms);
            newSelection.add(atomId);
            return { selectedAtoms: newSelection };
          }),

        removeSelection: (atomId: string) =>
          set((state) => {
            const newSelection = new Set(state.selectedAtoms);
            newSelection.delete(atomId);
            return { selectedAtoms: newSelection };
          }),

        toggleSelection: (atomId: string) =>
          set((state) => {
            const newSelection = new Set(state.selectedAtoms);
            if (newSelection.has(atomId)) {
              newSelection.delete(atomId);
            } else {
              newSelection.add(atomId);
            }
            return { selectedAtoms: newSelection };
          }),

        clearSelection: () =>
          set(() => ({
            selectedAtoms: new Set<string>(),
          })),

        selectAll: (atomIds: string[]) =>
          set(() => ({
            selectedAtoms: new Set(atomIds),
          })),

        // Extended actions
        addFullSelection: (selection: Selection) => {
          // Validate selection data
          validateSelection(selection);

          set((state) => {
            // Check for duplicate (by atomId for AtomSelection)
            if (isAtomSelection(selection)) {
              const exists = state.selections.some(
                (s) => isAtomSelection(s) && s.atomId === selection.atomId
              );
              if (exists) {
                return state; // No duplicate
              }
            }

            let newSelections = [...state.selections, selection];
            const maxSel = state.maxSelections;

            // Enforce max selections (FIFO)
            if (maxSel > 0 && newSelections.length > maxSel) {
              newSelections = newSelections.slice(-maxSel);
            }

            // Check if auto-trigger needed
            const shouldTrigger = maxSel > 0 && newSelections.length === maxSel;

            if (shouldTrigger) {
              // Dispatch measurement trigger event
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('measurement-trigger', {
                    detail: {
                      type: state.measurementType,
                      selections: newSelections,
                    },
                  })
                );
              }
            }

            return {
              selections: newSelections,
              autoTriggerMeasurement: shouldTrigger,
            };
          });
        },

        removeFullSelection: (index: number) =>
          set((state) => {
            const newSelections = [...state.selections];
            newSelections.splice(index, 1);
            return { selections: newSelections };
          }),

        clearSelections: () =>
          set(() => ({
            selections: [],
            autoTriggerMeasurement: false,
          })),

        setMeasurementType: (type: MeasurementType) =>
          set(() => ({
            measurementType: type,
            maxSelections: type ? MAX_SELECTIONS_BY_TYPE[type] || 0 : 0,
            selections: [], // Clear on mode change
            autoTriggerMeasurement: false,
          })),

        getSelectionOrder: () => {
          const { selections } = get();
          return [...selections].sort((a, b) => a.timestamp - b.timestamp);
        },
      }),
      {
        name: 'selection-store',
        partialize: (state) => ({
          selections: state.selections,
          measurementType: state.measurementType,
          maxSelections: state.maxSelections,
          autoTriggerMeasurement: state.autoTriggerMeasurement,
        }),
        // Custom serialization for Set
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            return {
              state: parsed.state,
              version: parsed.version,
            };
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    ),
    {
      name: 'Selection Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Listen for measurement-complete to clear selections
if (typeof window !== 'undefined') {
  window.addEventListener('measurement-complete', () => {
    useSelectionStore.getState().clearSelections();
  });
}

/**
 * Selector hook for selected atoms (simple Set)
 */
export const useSelectedAtoms = () =>
  useSelectionStore((state) => state.selectedAtoms);

/**
 * Selector hook for selection actions (simple)
 */
export const useSelectionActions = () =>
  useSelectionStore(
    useShallow((state) => ({
      addSelection: state.addSelection,
      removeSelection: state.removeSelection,
      toggleSelection: state.toggleSelection,
      clearSelection: state.clearSelection,
      selectAll: state.selectAll,
    }))
  );

/**
 * Selector hook for extended selections (full Selection objects)
 */
export const useExtendedSelections = () =>
  useSelectionStore(
    useShallow((state) => ({
      selections: state.selections,
      measurementType: state.measurementType,
      maxSelections: state.maxSelections,
      autoTriggerMeasurement: state.autoTriggerMeasurement,
      addSelection: state.addFullSelection,
      removeSelection: state.removeFullSelection,
      clearSelections: state.clearSelections,
      setMeasurementType: state.setMeasurementType,
      getSelectionOrder: state.getSelectionOrder,
    }))
  );
