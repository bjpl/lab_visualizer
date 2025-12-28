/**
 * Multi-Selection Hook Tests
 *
 * Tests for the multi-selection hook that integrates with
 * MolStar viewer for atom/residue selection.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Import actual implementation
import {
  useMultiSelection,
  type AtomSelection,
  type SelectionEvent,
  type UseMultiSelectionOptions,
  type UseMultiSelectionReturn,
} from '@/hooks/viewer/use-multi-selection';

describe('useMultiSelection', () => {
  // Clear any MolStar mocks after each test
  afterEach(() => {
    delete (globalThis as any).molstar;
  });

  describe('basic selection management', () => {
    it('should initialize with empty selections', () => {
      const { result } = renderHook(() => useMultiSelection());

      expect(result.current.selections).toEqual([]);
      expect(result.current.selectionCount).toBe(0);
    });

    it('should track multiple selected atoms', () => {
      const { result } = renderHook(() => useMultiSelection());

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
      expect(result.current.selectionCount).toBe(2);
    });

    it('should provide addSelection callback', () => {
      const { result } = renderHook(() => useMultiSelection());

      expect(typeof result.current.addSelection).toBe('function');

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      expect(result.current.selections).toContainEqual(atom);
    });

    it('should provide removeSelection callback', () => {
      const { result } = renderHook(() => useMultiSelection());

      expect(typeof result.current.removeSelection).toBe('function');

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      expect(result.current.selections).toHaveLength(1);

      act(() => {
        result.current.removeSelection('atom-1');
      });

      expect(result.current.selections).toHaveLength(0);
    });

    it('should provide clearSelections callback', () => {
      const { result } = renderHook(() => useMultiSelection());

      expect(typeof result.current.clearSelections).toBe('function');

      const atoms: AtomSelection[] = [1, 2, 3].map((i) => ({
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

      expect(result.current.selections).toHaveLength(3);

      act(() => {
        result.current.clearSelections();
      });

      expect(result.current.selections).toEqual([]);
    });

    it('should provide toggleSelection callback', () => {
      const { result } = renderHook(() => useMultiSelection());

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      // Toggle on (add)
      act(() => {
        result.current.toggleSelection(atom);
      });

      expect(result.current.selections).toHaveLength(1);

      // Toggle off (remove)
      act(() => {
        result.current.toggleSelection(atom);
      });

      expect(result.current.selections).toHaveLength(0);
    });

    it('should provide isSelected check function', () => {
      const { result } = renderHook(() => useMultiSelection());

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      expect(result.current.isSelected('atom-1')).toBe(false);

      act(() => {
        result.current.addSelection(atom);
      });

      expect(result.current.isSelected('atom-1')).toBe(true);
    });
  });

  describe('selection events', () => {
    it('should emit selectionChanged event on add', () => {
      const onSelectionChanged = vi.fn();
      const { result } = renderHook(() =>
        useMultiSelection({ onSelectionChanged })
      );

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      expect(onSelectionChanged).toHaveBeenCalledWith({
        type: 'add',
        selection: atom,
      });
    });

    it('should emit selectionChanged event on remove', () => {
      const onSelectionChanged = vi.fn();
      const { result } = renderHook(() =>
        useMultiSelection({ onSelectionChanged })
      );

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
        onSelectionChanged.mockClear();
        result.current.removeSelection('atom-1');
      });

      expect(onSelectionChanged).toHaveBeenCalledWith({
        type: 'remove',
        selection: atom,
      });
    });

    it('should emit selectionChanged event on clear', () => {
      const onSelectionChanged = vi.fn();
      const { result } = renderHook(() =>
        useMultiSelection({ onSelectionChanged })
      );

      const atoms: AtomSelection[] = [1, 2].map((i) => ({
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
        onSelectionChanged.mockClear();
        result.current.clearSelections();
      });

      expect(onSelectionChanged).toHaveBeenCalledWith({
        type: 'clear',
        selections: atoms,
      });
    });

    it('should not emit events for no-op operations', () => {
      const onSelectionChanged = vi.fn();
      const { result } = renderHook(() =>
        useMultiSelection({ onSelectionChanged })
      );

      // Try to remove non-existent selection
      act(() => {
        result.current.removeSelection('non-existent');
      });

      expect(onSelectionChanged).not.toHaveBeenCalled();

      // Try to clear when already empty
      act(() => {
        result.current.clearSelections();
      });

      expect(onSelectionChanged).not.toHaveBeenCalled();
    });
  });

  describe('MolStar integration', () => {
    it('should integrate with MolStar highlighting on add', () => {
      // Set up mock BEFORE rendering the hook
      const mockMolStarHighlight = vi.fn();
      (globalThis as any).molstar = {
        highlight: mockMolStarHighlight,
      };

      const { result } = renderHook(() =>
        useMultiSelection({ enableHighlighting: true })
      );

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      expect(mockMolStarHighlight).toHaveBeenCalledWith({
        atomId: 'atom-1',
        color: expect.any(String),
      });
    });

    it('should remove MolStar highlighting on remove', () => {
      // Set up mock BEFORE rendering the hook
      const mockMolStarClearHighlight = vi.fn();
      (globalThis as any).molstar = {
        highlight: vi.fn(),
        clearHighlight: mockMolStarClearHighlight,
      };

      const { result } = renderHook(() =>
        useMultiSelection({ enableHighlighting: true })
      );

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      act(() => {
        result.current.removeSelection('atom-1');
      });

      expect(mockMolStarClearHighlight).toHaveBeenCalledWith('atom-1');
    });

    it('should use custom highlight color when provided', () => {
      // Set up mock BEFORE rendering the hook
      const mockMolStarHighlight = vi.fn();
      (globalThis as any).molstar = {
        highlight: mockMolStarHighlight,
      };

      const { result } = renderHook(() =>
        useMultiSelection({
          enableHighlighting: true,
          highlightColor: '#FF0000',
        })
      );

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      expect(mockMolStarHighlight).toHaveBeenCalledWith({
        atomId: 'atom-1',
        color: '#FF0000',
      });
    });

    it('should batch highlight updates for multiple selections', () => {
      // Set up mock BEFORE rendering the hook
      const mockMolStarBatchHighlight = vi.fn();
      (globalThis as any).molstar = {
        batchHighlight: mockMolStarBatchHighlight,
      };

      const { result } = renderHook(() =>
        useMultiSelection({ enableHighlighting: true })
      );

      const atoms: AtomSelection[] = [1, 2, 3].map((i) => ({
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

      expect(mockMolStarBatchHighlight).toHaveBeenCalledWith(
        expect.arrayContaining([
          { atomId: 'atom-1', color: expect.any(String) },
          { atomId: 'atom-2', color: expect.any(String) },
          { atomId: 'atom-3', color: expect.any(String) },
        ])
      );
    });
  });

  describe('selection limits', () => {
    it('should respect maxSelections option', () => {
      const { result } = renderHook(() =>
        useMultiSelection({ maxSelections: 2 })
      );

      const atoms: AtomSelection[] = [1, 2, 3].map((i) => ({
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

      expect(result.current.selections).toHaveLength(2);
      // Should keep the most recent selections
      expect(result.current.selections[0].atomId).toBe('atom-2');
      expect(result.current.selections[1].atomId).toBe('atom-3');
    });

    it('should handle unlimited selections by default', () => {
      const { result } = renderHook(() => useMultiSelection());

      const atoms: AtomSelection[] = Array.from({ length: 100 }, (_, i) => ({
        atomId: `atom-${i}`,
        chainId: 'A',
        residueNumber: i,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: i, y: i, z: i },
        timestamp: Date.now() + i,
      }));

      act(() => {
        atoms.forEach((atom) => result.current.addSelection(atom));
      });

      expect(result.current.selections).toHaveLength(100);
    });
  });

  describe('duplicate prevention', () => {
    it('should prevent duplicate atom selections', () => {
      const { result } = renderHook(() => useMultiSelection());

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
        result.current.addSelection({ ...atom, timestamp: Date.now() });
      });

      expect(result.current.selections).toHaveLength(1);
    });

    it('should update timestamp on re-selection', () => {
      const { result } = renderHook(() => useMultiSelection());

      const timestamp1 = 1000;
      const timestamp2 = 2000;

      const atom1: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: timestamp1,
      };

      const atom2: AtomSelection = {
        ...atom1,
        timestamp: timestamp2,
      };

      act(() => {
        result.current.addSelection(atom1);
        result.current.addSelection(atom2);
      });

      expect(result.current.selections).toHaveLength(1);
      expect(result.current.selections[0].timestamp).toBe(timestamp2);
    });
  });

  describe('performance and optimization', () => {
    it('should handle rapid selection changes efficiently', () => {
      const { result } = renderHook(() => useMultiSelection());

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addSelection({
            atomId: `atom-${i}`,
            chainId: 'A',
            residueNumber: i,
            residueName: 'ALA',
            atomName: 'CA',
            position: { x: i, y: i, z: i },
            timestamp: Date.now() + i,
          });
        }
      });

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    it('should use memoization for selection lookups', () => {
      const { result, rerender } = renderHook(() => useMultiSelection());

      const atom: AtomSelection = {
        atomId: 'atom-1',
        chainId: 'A',
        residueNumber: 42,
        residueName: 'ALA',
        atomName: 'CA',
        position: { x: 1.0, y: 2.0, z: 3.0 },
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addSelection(atom);
      });

      const isSelected1 = result.current.isSelected;
      rerender();
      const isSelected2 = result.current.isSelected;

      // Function reference should be stable
      expect(isSelected1).toBe(isSelected2);
    });

    it('should batch state updates to minimize re-renders', () => {
      let renderCount = 0;
      const { result } = renderHook(() => {
        renderCount++;
        return useMultiSelection();
      });

      const initialRenderCount = renderCount;

      act(() => {
        // Multiple operations in single act should batch
        result.current.addSelection({
          atomId: 'atom-1',
          chainId: 'A',
          residueNumber: 42,
          residueName: 'ALA',
          atomName: 'CA',
          position: { x: 1.0, y: 2.0, z: 3.0 },
          timestamp: Date.now(),
        });
        result.current.addSelection({
          atomId: 'atom-2',
          chainId: 'A',
          residueNumber: 43,
          residueName: 'GLY',
          atomName: 'CA',
          position: { x: 2.0, y: 3.0, z: 4.0 },
          timestamp: Date.now(),
        });
      });

      // Should only cause one additional render
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useMultiSelection());

      const mockCleanup = vi.fn();
      (global as any).molstar = {
        clearAllHighlights: mockCleanup,
      };

      unmount();

      // Should not throw
      expect(() => unmount()).not.toThrow();

      delete (global as any).molstar;
    });

    it('should remove all highlights on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useMultiSelection({ enableHighlighting: true })
      );

      const mockClearAll = vi.fn();
      (global as any).molstar = {
        highlight: vi.fn(),
        clearAllHighlights: mockClearAll,
      };

      const atoms: AtomSelection[] = [1, 2, 3].map((i) => ({
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

      unmount();

      expect(mockClearAll).toHaveBeenCalled();

      delete (global as any).molstar;
    });
  });
});
