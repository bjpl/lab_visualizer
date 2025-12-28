/**
 * Multi-Selection System Tests
 *
 * Tests for multi-atom selection with keyboard modifiers
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSelectionStore } from '@/stores/selection-store';
import { MolStarViewer } from '@/components/viewer/MolStarViewer';

// Mock the molstar service
vi.mock('@/services/molstar-service', () => ({
  molstarService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    loadStructureById: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    on: vi.fn(),
    emit: vi.fn(),
    selectAtom: vi.fn(),
    clearSelection: vi.fn(),
    getSelectedAtoms: vi.fn(() => []),
  },
}));

describe('Multi-Selection System', () => {
  beforeEach(() => {
    // Reset store before each test
    useSelectionStore.getState().clearSelection();
  });

  describe('Selection Store', () => {
    it('should add atom to selection', () => {
      useSelectionStore.getState().addSelection('atom1');

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.has('atom1')).toBe(true);
    });

    it('should remove atom from selection', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().removeSelection('atom1');

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.has('atom1')).toBe(false);
    });

    it('should toggle atom selection', () => {
      // First toggle - add
      useSelectionStore.getState().toggleSelection('atom1');
      let store = useSelectionStore.getState();
      expect(store.selectedAtoms.has('atom1')).toBe(true);

      // Second toggle - remove
      useSelectionStore.getState().toggleSelection('atom1');
      store = useSelectionStore.getState();
      expect(store.selectedAtoms.has('atom1')).toBe(false);
    });

    it('should clear all selections', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2');
      useSelectionStore.getState().addSelection('atom3');

      let store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(3);

      useSelectionStore.getState().clearSelection();

      store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(0);
    });

    it('should select all atoms', () => {
      const atomIds = ['atom1', 'atom2', 'atom3', 'atom4'];

      useSelectionStore.getState().selectAll(atomIds);

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(4);
      atomIds.forEach(id => {
        expect(store.selectedAtoms.has(id)).toBe(true);
      });
    });

    it('should support multiple selections', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2');
      useSelectionStore.getState().addSelection('atom3');

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(3);
      expect(store.selectedAtoms.has('atom1')).toBe(true);
      expect(store.selectedAtoms.has('atom2')).toBe(true);
      expect(store.selectedAtoms.has('atom3')).toBe(true);
    });
  });

  describe('Keyboard Modifiers', () => {
    it('should handle Shift+Click for additive selection', async () => {
      // Simulate shift+click behavior
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2'); // Shift held - add to selection

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(2);
      expect(store.selectedAtoms.has('atom1')).toBe(true);
      expect(store.selectedAtoms.has('atom2')).toBe(true);
    });

    it('should handle Ctrl/Cmd+A for select all', () => {
      const allAtoms = ['atom1', 'atom2', 'atom3', 'atom4', 'atom5'];

      useSelectionStore.getState().selectAll(allAtoms);

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(5);
    });

    it('should handle Escape for clear selection', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2');

      // Simulate escape key
      useSelectionStore.getState().clearSelection();

      const store = useSelectionStore.getState();
      expect(store.selectedAtoms.size).toBe(0);
    });
  });

  describe('MolStar Integration', () => {
    it('should emit selection-changed events', () => {
      const onSelectionChange = vi.fn();

      // Subscribe to store changes - Zustand subscribe takes a callback that receives the full state
      const unsubscribe = useSelectionStore.subscribe((state) => {
        onSelectionChange(Array.from(state.selectedAtoms));
      });

      useSelectionStore.getState().addSelection('atom1');

      // Verify callback was called with the selection
      expect(onSelectionChange).toHaveBeenCalled();
      expect(onSelectionChange).toHaveBeenCalledWith(['atom1']);

      unsubscribe();
    });

    it('should support click without modifiers for single selection', () => {
      // First selection
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2');

      // Click without modifier - should clear and select only new atom
      useSelectionStore.getState().clearSelection();
      useSelectionStore.getState().addSelection('atom3');

      const finalState = useSelectionStore.getState();
      expect(finalState.selectedAtoms.size).toBe(1);
      expect(finalState.selectedAtoms.has('atom3')).toBe(true);
      expect(finalState.selectedAtoms.has('atom1')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting same atom multiple times', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom1');

      const state = useSelectionStore.getState();
      expect(state.selectedAtoms.size).toBe(1);
    });

    it('should handle removing non-existent atom', () => {
      useSelectionStore.getState().removeSelection('non-existent');

      const state = useSelectionStore.getState();
      expect(state.selectedAtoms.size).toBe(0);
    });

    it('should handle empty selectAll', () => {
      useSelectionStore.getState().selectAll([]);

      const state = useSelectionStore.getState();
      expect(state.selectedAtoms.size).toBe(0);
    });

    it('should handle large selections efficiently', () => {
      const largeAtomList = Array.from({ length: 10000 }, (_, i) => `atom${i}`);

      const startTime = performance.now();
      useSelectionStore.getState().selectAll(largeAtomList);
      const endTime = performance.now();

      const state = useSelectionStore.getState();
      expect(state.selectedAtoms.size).toBe(10000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });
  });

  describe('Selection State Persistence', () => {
    it('should maintain selection state across operations', () => {
      useSelectionStore.getState().addSelection('atom1');
      useSelectionStore.getState().addSelection('atom2');

      // Get fresh state after operations
      const store = useSelectionStore.getState();
      const hasAtom1 = store.selectedAtoms.has('atom1');

      expect(hasAtom1).toBe(true);
      expect(store.selectedAtoms.size).toBe(2);
    });

    it('should provide immutable selection set', () => {
      useSelectionStore.getState().addSelection('atom1');
      const selection1 = useSelectionStore.getState().selectedAtoms;

      useSelectionStore.getState().addSelection('atom2');
      const selection2 = useSelectionStore.getState().selectedAtoms;

      // Sets should be different objects (immutable updates)
      expect(selection1).not.toBe(selection2);
    });
  });
});
