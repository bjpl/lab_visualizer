/**
 * SelectionManager Unit Tests (TDD - FAILING TESTS)
 *
 * Tests for the SelectionManager utility class that handles
 * multi-selection logic, limits, and state management.
 *
 * GOAP Action 2.2: Multi-Selection System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectionManager } from '@/lib/selection/SelectionManager';

interface AtomSelection {
  id: string;
  atomName: string;
  residueName: string;
  chainId: string;
  residueSeq: number;
  position: [number, number, number];
  element: string;
}

describe('SelectionManager', () => {
  let manager: SelectionManager;
  let mockAtoms: AtomSelection[];

  beforeEach(() => {
    manager = new SelectionManager({ maxSelections: 100 });

    mockAtoms = Array.from({ length: 10 }, (_, i) => ({
      id: `atom-${i}`,
      atomName: 'CA',
      residueName: 'ALA',
      chainId: 'A',
      residueSeq: i,
      position: [i, i, i] as [number, number, number],
      element: 'C',
    }));
  });

  describe('Initialization', () => {
    it('should initialize with empty selection', () => {
      expect(manager.getSelectedAtoms()).toEqual([]);
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should accept custom selection limit', () => {
      const customManager = new SelectionManager({ maxSelections: 50 });
      expect(customManager.getMaxSelections()).toBe(50);
    });

    it('should default to 100 selections if no limit provided', () => {
      const defaultManager = new SelectionManager();
      expect(defaultManager.getMaxSelections()).toBe(100);
    });
  });

  describe('Single Selection', () => {
    it('should add single atom to selection', () => {
      const atom = mockAtoms[0];
      const result = manager.selectAtom(atom);

      expect(result.success).toBe(true);
      expect(manager.getSelectionCount()).toBe(1);
      expect(manager.isSelected(atom.id)).toBe(true);
    });

    it('should replace selection when replaceMode is true', () => {
      manager.selectAtom(mockAtoms[0]);
      manager.selectAtom(mockAtoms[1], { replaceMode: true });

      expect(manager.getSelectionCount()).toBe(1);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(false);
      expect(manager.isSelected(mockAtoms[1].id)).toBe(true);
    });

    it('should add to selection when replaceMode is false', () => {
      manager.selectAtom(mockAtoms[0]);
      manager.selectAtom(mockAtoms[1], { replaceMode: false });

      expect(manager.getSelectionCount()).toBe(2);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);
      expect(manager.isSelected(mockAtoms[1].id)).toBe(true);
    });
  });

  describe('Multi-Selection', () => {
    it('should add multiple atoms to selection', () => {
      const atoms = mockAtoms.slice(0, 3);
      const result = manager.selectAtoms(atoms);

      expect(result.success).toBe(true);
      expect(manager.getSelectionCount()).toBe(3);
    });

    it('should prevent duplicate selections', () => {
      const atom = mockAtoms[0];
      manager.selectAtom(atom);
      manager.selectAtom(atom);

      expect(manager.getSelectionCount()).toBe(1);
    });

    it('should handle selecting already selected atoms gracefully', () => {
      manager.selectAtom(mockAtoms[0]);
      const result = manager.selectAtom(mockAtoms[0]);

      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(true);
    });
  });

  describe('Toggle Selection', () => {
    it('should toggle atom selection on/off', () => {
      const atom = mockAtoms[0];

      manager.toggleAtom(atom);
      expect(manager.isSelected(atom.id)).toBe(true);

      manager.toggleAtom(atom);
      expect(manager.isSelected(atom.id)).toBe(false);
    });

    it('should add atom if not selected when toggling', () => {
      manager.toggleAtom(mockAtoms[0]);

      expect(manager.getSelectionCount()).toBe(1);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);
    });

    it('should remove atom if already selected when toggling', () => {
      manager.selectAtom(mockAtoms[0]);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);

      manager.toggleAtom(mockAtoms[0]);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(false);
    });
  });

  describe('Deselection', () => {
    it('should deselect atom by ID', () => {
      manager.selectAtom(mockAtoms[0]);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);

      manager.deselectAtom(mockAtoms[0].id);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(false);
    });

    it('should deselect multiple atoms', () => {
      manager.selectAtoms(mockAtoms.slice(0, 3));
      expect(manager.getSelectionCount()).toBe(3);

      manager.deselectAtoms([mockAtoms[0].id, mockAtoms[1].id]);
      expect(manager.getSelectionCount()).toBe(1);
      expect(manager.isSelected(mockAtoms[2].id)).toBe(true);
    });

    it('should handle deselecting non-selected atoms gracefully', () => {
      expect(() => manager.deselectAtom('non-existent')).not.toThrow();
    });
  });

  describe('Clear Selection', () => {
    it('should clear all selections', () => {
      manager.selectAtoms(mockAtoms.slice(0, 5));
      expect(manager.getSelectionCount()).toBe(5);

      manager.clearSelection();
      expect(manager.getSelectionCount()).toBe(0);
      expect(manager.getSelectedAtoms()).toEqual([]);
    });

    it('should handle clearing empty selection', () => {
      expect(() => manager.clearSelection()).not.toThrow();
      expect(manager.getSelectionCount()).toBe(0);
    });
  });

  describe('Select All', () => {
    it('should select all provided atoms', () => {
      const result = manager.selectAll(mockAtoms);

      expect(result.success).toBe(true);
      expect(manager.getSelectionCount()).toBe(mockAtoms.length);
    });

    it('should respect selection limit when selecting all', () => {
      const manager50 = new SelectionManager({ maxSelections: 5 });
      const result = manager50.selectAll(mockAtoms);

      expect(result.success).toBe(true);
      expect(result.limited).toBe(true);
      expect(manager50.getSelectionCount()).toBe(5);
    });

    it('should return warning when selection is limited', () => {
      const manager50 = new SelectionManager({ maxSelections: 5 });
      const result = manager50.selectAll(mockAtoms);

      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('limited');
    });
  });

  describe('Selection Limit Enforcement', () => {
    it('should enforce maximum selection limit', () => {
      const manager10 = new SelectionManager({ maxSelections: 10 });

      for (let i = 0; i < 15; i++) {
        manager10.selectAtom({
          id: `atom-${i}`,
          atomName: 'CA',
          residueName: 'ALA',
          chainId: 'A',
          residueSeq: i,
          position: [0, 0, 0],
          element: 'C',
        });
      }

      expect(manager10.getSelectionCount()).toBe(10);
    });

    it('should return failure when limit exceeded', () => {
      const manager3 = new SelectionManager({ maxSelections: 3 });

      manager3.selectAtoms(mockAtoms.slice(0, 3));
      const result = manager3.selectAtom(mockAtoms[3]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('limit');
    });

    it('should not add atoms beyond limit', () => {
      const manager5 = new SelectionManager({ maxSelections: 5 });

      manager5.selectAtoms(mockAtoms.slice(0, 5));
      manager5.selectAtom(mockAtoms[5]);

      expect(manager5.getSelectionCount()).toBe(5);
      expect(manager5.isSelected(mockAtoms[5].id)).toBe(false);
    });

    it('should check if selection limit is reached', () => {
      const manager3 = new SelectionManager({ maxSelections: 3 });

      expect(manager3.isLimitReached()).toBe(false);

      manager3.selectAtoms(mockAtoms.slice(0, 3));
      expect(manager3.isLimitReached()).toBe(true);
    });

    it('should calculate remaining selection slots', () => {
      const manager10 = new SelectionManager({ maxSelections: 10 });

      expect(manager10.getRemainingSlots()).toBe(10);

      manager10.selectAtoms(mockAtoms.slice(0, 3));
      expect(manager10.getRemainingSlots()).toBe(7);
    });
  });

  describe('Selection Queries', () => {
    it('should check if atom is selected', () => {
      manager.selectAtom(mockAtoms[0]);

      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);
      expect(manager.isSelected(mockAtoms[1].id)).toBe(false);
    });

    it('should get all selected atoms', () => {
      const atoms = mockAtoms.slice(0, 3);
      manager.selectAtoms(atoms);

      const selected = manager.getSelectedAtoms();
      expect(selected).toHaveLength(3);
      expect(selected).toEqual(expect.arrayContaining(atoms));
    });

    it('should get selected atom IDs', () => {
      manager.selectAtoms(mockAtoms.slice(0, 3));

      const ids = manager.getSelectedIds();
      expect(ids).toEqual(['atom-0', 'atom-1', 'atom-2']);
    });

    it('should get selection count', () => {
      expect(manager.getSelectionCount()).toBe(0);

      manager.selectAtoms(mockAtoms.slice(0, 5));
      expect(manager.getSelectionCount()).toBe(5);
    });

    it('should check if has selections', () => {
      expect(manager.hasSelections()).toBe(false);

      manager.selectAtom(mockAtoms[0]);
      expect(manager.hasSelections()).toBe(true);
    });
  });

  describe('Event Handling', () => {
    it('should emit event on selection change', () => {
      const onChange = vi.fn();
      manager.on('selectionChange', onChange);

      manager.selectAtom(mockAtoms[0]);

      expect(onChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          added: [mockAtoms[0]],
          removed: [],
          count: 1,
        })
      );
    });

    it('should emit event on deselection', () => {
      const onChange = vi.fn();
      manager.selectAtom(mockAtoms[0]);

      manager.on('selectionChange', onChange);
      manager.deselectAtom(mockAtoms[0].id);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          added: [],
          removed: [mockAtoms[0]],
          count: 0,
        })
      );
    });

    it('should emit event on clear', () => {
      const onClear = vi.fn();
      manager.selectAtoms(mockAtoms.slice(0, 3));

      manager.on('selectionCleared', onClear);
      manager.clearSelection();

      expect(onClear).toHaveBeenCalled();
    });

    it('should emit warning event when limit reached', () => {
      const onWarning = vi.fn();
      const manager3 = new SelectionManager({ maxSelections: 3 });

      manager3.on('limitReached', onWarning);
      manager3.selectAtoms(mockAtoms.slice(0, 3));
      manager3.selectAtom(mockAtoms[3]); // Should trigger warning

      expect(onWarning).toHaveBeenCalled();
    });

    it('should allow removing event listeners', () => {
      const onChange = vi.fn();
      manager.on('selectionChange', onChange);

      manager.selectAtom(mockAtoms[0]);
      expect(onChange).toHaveBeenCalledTimes(1);

      manager.off('selectionChange', onChange);
      manager.selectAtom(mockAtoms[1]);

      expect(onChange).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  describe('Batch Operations', () => {
    it('should support batch selection without multiple events', () => {
      const onChange = vi.fn();
      manager.on('selectionChange', onChange);

      manager.beginBatch();
      manager.selectAtom(mockAtoms[0]);
      manager.selectAtom(mockAtoms[1]);
      manager.selectAtom(mockAtoms[2]);
      manager.endBatch();

      // Should only emit once at end of batch
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(manager.getSelectionCount()).toBe(3);
    });

    it('should support batch deselection', () => {
      manager.selectAtoms(mockAtoms.slice(0, 5));

      manager.beginBatch();
      manager.deselectAtom(mockAtoms[0].id);
      manager.deselectAtom(mockAtoms[1].id);
      manager.endBatch();

      expect(manager.getSelectionCount()).toBe(3);
    });
  });

  describe('Selection Persistence', () => {
    it('should export selection state', () => {
      manager.selectAtoms(mockAtoms.slice(0, 3));

      const state = manager.exportState();

      expect(state).toEqual({
        atoms: expect.arrayContaining(mockAtoms.slice(0, 3)),
        count: 3,
        maxSelections: 100,
      });
    });

    it('should restore selection from state', () => {
      const state = {
        atoms: mockAtoms.slice(0, 3),
        count: 3,
        maxSelections: 100,
      };

      manager.restoreState(state);

      expect(manager.getSelectionCount()).toBe(3);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);
    });

    it('should validate state before restoring', () => {
      const invalidState = {
        atoms: null,
        count: -1,
        maxSelections: 'invalid',
      };

      expect(() => manager.restoreState(invalidState as any)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle null atom gracefully', () => {
      expect(() => manager.selectAtom(null as any)).not.toThrow();
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should handle undefined atom gracefully', () => {
      expect(() => manager.selectAtom(undefined as any)).not.toThrow();
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should handle atom without ID', () => {
      const invalidAtom = {
        atomName: 'CA',
        residueName: 'ALA',
      } as any;

      expect(() => manager.selectAtom(invalidAtom)).not.toThrow();
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should handle empty array for selectAll', () => {
      const result = manager.selectAll([]);

      expect(result.success).toBe(true);
      expect(manager.getSelectionCount()).toBe(0);
    });

    it('should maintain state consistency on errors', () => {
      manager.selectAtom(mockAtoms[0]);

      try {
        manager.selectAtom(null as any);
      } catch (e) {
        // Ignore
      }

      expect(manager.getSelectionCount()).toBe(1);
      expect(manager.isSelected(mockAtoms[0].id)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large selections efficiently', () => {
      const largeAtomSet = Array.from({ length: 100 }, (_, i) => ({
        id: `atom-${i}`,
        atomName: 'CA',
        residueName: 'ALA',
        chainId: 'A',
        residueSeq: i,
        position: [i, i, i] as [number, number, number],
        element: 'C',
      }));

      const start = performance.now();
      manager.selectAll(largeAtomSet);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast
      expect(manager.getSelectionCount()).toBe(100);
    });

    it('should perform selection checks efficiently', () => {
      manager.selectAtoms(mockAtoms);

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        manager.isSelected(`atom-${i % 10}`);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });
});
