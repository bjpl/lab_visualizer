/**
 * Selection Store Tests
 *
 * Tests for the Zustand selection store that manages
 * multi-selection state for molecular measurements.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Import actual implementation
import {
  useSelectionStore,
  useExtendedSelections,
  type AtomSelection,
  type ResidueSelection,
  type Selection,
  type MeasurementType,
} from '@/stores/selection-store';

// Reset store between tests
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  // Reset store state
  useSelectionStore.setState({
    selectedAtoms: new Set<string>(),
    selections: [],
    measurementType: null,
    maxSelections: 0,
    autoTriggerMeasurement: false,
  });
});

describe('SelectionStore (Zustand)', () => {

  describe('state management', () => {
    it('should initialize with empty selection set', () => {
      const { result } = renderHook(() => useExtendedSelections());

      expect(result.current.selections).toEqual([]);
      expect(result.current.measurementType).toBeNull();
      expect(result.current.maxSelections).toBe(0);
      expect(result.current.autoTriggerMeasurement).toBe(false);
    });

    it('should add selection to set', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atomSelection);
      });

      expect(result.current.selections).toHaveLength(1);
      expect(result.current.selections[0]).toEqual(atomSelection);
    });

    it('should remove selection from set', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atom1: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      const atom2: AtomSelection = {
        atomId: 'atom-2',
        chainId: 'A',
        residueNumber: 43,
        residueName: 'GLY',
        atomName: 'CA',
        position: { x: 2.0, y: 3.0, z: 4.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom1);
        result.current.addSelection(atom2);
      });

      expect(result.current.selections).toHaveLength(2);

      act(() => {
        result.current.removeSelection(0);
      });

      expect(result.current.selections).toHaveLength(1);
      expect(result.current.selections[0]).toEqual(atom2);
    });

    it('should clear all selections', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atom1: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      const atom2: AtomSelection = {
        atomId: 'atom-2',
        chainId: 'A',
        residueNumber: 43,
        residueName: 'GLY',
        atomName: 'CA',
        position: { x: 2.0, y: 3.0, z: 4.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom1);
        result.current.addSelection(atom2);
      });

      expect(result.current.selections).toHaveLength(2);

      act(() => {
        result.current.clearSelections();
      });

      expect(result.current.selections).toEqual([]);
    });

    it('should track selection order by timestamp', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atom1: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: 1000,
      };

      const atom2: AtomSelection = {
        atomId: 'atom-2',
        chainId: 'A',
        residueNumber: 43,
        residueName: 'GLY',
        atomName: 'CA',
        position: { x: 2.0, y: 3.0, z: 4.0 },
        timestamp: 2000,
      };

      const atom3: AtomSelection = {
        atomId: 'atom-3',
        chainId: 'A',
        residueNumber: 44,
        residueName: 'VAL',
        atomName: 'CA',
        position: { x: 3.0, y: 4.0, z: 5.0 },
        timestamp: 1500,
      };

      act(() => {
        result.current.addSelection(atom1);
        result.current.addSelection(atom2);
        result.current.addSelection(atom3);
      });

      const ordered = result.current.getSelectionOrder();

      // Should be sorted by timestamp
      expect(ordered[0].timestamp).toBe(1000);
      expect(ordered[1].timestamp).toBe(1500);
      expect(ordered[2].timestamp).toBe(2000);
    });
  });

  describe('selection limits', () => {
    it('should limit selections for distance measurement (max 2)', () => {
      const { result } = renderHook(() => useExtendedSelections());

      act(() => {
        result.current.setMeasurementType('distance');
      });

      expect(result.current.maxSelections).toBe(2);

      const atoms = [1, 2, 3].map((i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: 40 + i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      // Should only keep the last 2 selections
      expect(result.current.selections).toHaveLength(2);
      expect(result.current.selections[0]).toEqual(atoms[1]);
      expect(result.current.selections[1]).toEqual(atoms[2]);
    });

    it('should limit selections for angle measurement (max 3)', () => {
      const { result } = renderHook(() => useExtendedSelections());

      act(() => {
        result.current.setMeasurementType('angle');
      });

      expect(result.current.maxSelections).toBe(3);

      const atoms = [1, 2, 3, 4].map((i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: 40 + i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      // Should only keep the last 3 selections
      expect(result.current.selections).toHaveLength(3);
    });

    it('should limit selections for dihedral measurement (max 4)', () => {
      const { result } = renderHook(() => useExtendedSelections());

      act(() => {
        result.current.setMeasurementType('dihedral');
      });

      expect(result.current.maxSelections).toBe(4);

      const atoms = [1, 2, 3, 4, 5].map((i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: 40 + i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      // Should only keep the last 4 selections
      expect(result.current.selections).toHaveLength(4);
    });

    it('should auto-trigger measurement when limit reached', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const onMeasurementTrigger = vi.fn();

      // Add event listener for measurement trigger
      window.addEventListener('measurement-trigger', onMeasurementTrigger);

      act(() => {
        result.current.setMeasurementType('distance');
      });

      const atoms = [1, 2].map((i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: 40 + i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      // Should trigger measurement event when limit reached
      expect(result.current.autoTriggerMeasurement).toBe(true);
      expect(onMeasurementTrigger).toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('measurement-trigger', onMeasurementTrigger);
    });

    it('should reset selections after measurement triggered', () => {
      const { result } = renderHook(() => useExtendedSelections());

      act(() => {
        result.current.setMeasurementType('distance');
      });

      const atoms = [1, 2].map((i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: 40 + i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      // Simulate measurement completion
      act(() => {
        // This should trigger auto-clear after measurement
        window.dispatchEvent(new CustomEvent('measurement-complete'));
      });

      // Selections should be cleared after measurement
      expect(result.current.selections).toEqual([]);
    });
  });

  describe('selection types', () => {
    it('should store atom selections with full metadata', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'atom-123',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.234, y: 2.345, z: 3.456 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atomSelection);
      });

      const stored = result.current.selections[0] as AtomSelection;

      expect(stored.atomId).toBe('atom-123');
      expect(stored.chainId).toBe('A');
      expect(stored.residueNumber).toBe(42);
      expect(stored.residueName).toBe('ALA');
      expect(stored.atomName).toBe('CA');
      expect(stored.position.x).toBeCloseTo(1.234);
      expect(stored.position.y).toBeCloseTo(2.345);
      expect(stored.position.z).toBeCloseTo(3.456);
    });

    it('should store residue selections', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const residueSelection: ResidueSelection = {
        chainId: 'B',
        residueNumber: 100,
        residueName: 'GLY',
        atomCount: 4,
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(residueSelection);
      });

      const stored = result.current.selections[0] as ResidueSelection;

      expect(stored.chainId).toBe('B');
      expect(stored.residueNumber).toBe(100);
      expect(stored.residueName).toBe('GLY');
      expect(stored.atomCount).toBe(4);
    });

    it('should support mixed selection types', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: 1000,
      };

      const residueSelection: ResidueSelection = {
        chainId: 'B',
        residueNumber: 100,
        residueName: 'GLY',
        atomCount: 4,
        timestamp: 2000,
      };

      act(() => {
        result.current.addSelection(atomSelection);
        result.current.addSelection(residueSelection);
      });

      expect(result.current.selections).toHaveLength(2);
      expect('atomId' in result.current.selections[0]).toBe(true);
      expect('atomCount' in result.current.selections[1]).toBe(true);
    });

    it('should prevent duplicate atom selections', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atomSelection);
        result.current.addSelection({ ...atomSelection, timestamp: Date.now() });
      });

      // Should only have one selection
      expect(result.current.selections).toHaveLength(1);
    });

    it('should validate selection data integrity', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const invalidSelection = {
        // Missing required fields
        atomId: 'atom-1',
        chainId: 'A',
        // No residueNumber, residueName, etc.
      } as any;

      expect(() => {
        act(() => {
          result.current.addSelection(invalidSelection);
        });
      }).toThrow();
    });
  });

  describe('persistence and serialization', () => {
    it('should serialize selections to JSON', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atomSelection);
      });

      const serialized = JSON.stringify(result.current.selections);
      const deserialized = JSON.parse(serialized);

      expect(deserialized[0]).toEqual(atomSelection);
    });

    it('should persist state to localStorage on changes', () => {
      const { result } = renderHook(() => useExtendedSelections());

      const atomSelection: AtomSelection = {
        atomId: 'persist-test-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: 1000,
      };

      act(() => {
        result.current.setMeasurementType('distance');
        result.current.addSelection(atomSelection);
      });

      // Check that state was persisted to localStorage
      const storedValue = localStorage.getItem('selection-store');
      expect(storedValue).toBeTruthy();

      const parsed = JSON.parse(storedValue!);
      expect(parsed.state.measurementType).toBe('distance');
      expect(parsed.state.selections).toHaveLength(1);
      expect(parsed.state.selections[0].atomId).toBe('persist-test-1');
    });
  });
});
