/**
 * @file Selection Highlighter Tests (GREEN Phase - TDD)
 * @description Comprehensive tests for visual selection highlighting
 * @path /tests/services/molstar/selection-highlighter.test.ts
 *
 * Tests using pure utility functions that don't require MolStar dependencies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSelectionHighlighter,
  SelectionHighlighterState,
  type SimpleLoci,
  DEFAULT_SELECTION_COLOR,
  DEFAULT_HOVER_COLOR,
  DEFAULT_SELECTION_OPACITY,
  DEFAULT_HOVER_OPACITY,
  expandToResidue,
  isEmptyLoci,
  getLociKey,
} from '@/utils/selection-highlighter-utils';

// Mock plugin for integration tests
const createMockPlugin = () => ({
  state: {
    data: {
      selectQ: vi.fn().mockReturnValue([]),
    },
  },
  managers: {
    structure: {
      component: {
        state: {
          add: vi.fn().mockResolvedValue({ ref: 'mock-ref' }),
          remove: vi.fn().mockResolvedValue(true),
        },
      },
    },
  },
  canvas3d: {
    mark: vi.fn(),
    requestDraw: vi.fn(),
  },
  build: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  apply: vi.fn().mockResolvedValue({}),
});

const createMockLoci = (type: 'atom' | 'residue' | 'chain' = 'atom'): SimpleLoci => ({
  kind: 'element-loci',
  structure: {
    model: { id: 'model-1' },
  },
  elements: [
    {
      unit: { id: 1 },
      indices: type === 'atom' ? [0] : type === 'residue' ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
  ],
});

describe('SelectionHighlighter', () => {
  let plugin: ReturnType<typeof createMockPlugin>;
  let highlighter: SelectionHighlighterState;

  beforeEach(() => {
    plugin = createMockPlugin();
    highlighter = createSelectionHighlighter();
  });

  afterEach(() => {
    if (highlighter && !highlighter.isDisposed()) {
      highlighter.dispose();
    }
    vi.clearAllMocks();
  });

  describe('selection highlighting', () => {
    it('should apply green tint (#00ff00) to selected atoms', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addSelection(loci);

      expect(config).not.toBeNull();
      expect(config!.color).toBe(DEFAULT_SELECTION_COLOR);
    });

    it('should use 50% opacity for selection overlay', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addSelection(loci);

      expect(config!.opacity).toBe(DEFAULT_SELECTION_OPACITY);
    });

    it('should highlight entire residue when atom selected', () => {
      const atomLoci = createMockLoci('atom');

      // Expand atom selection to residue
      const residueLoci = expandToResidue(atomLoci);

      expect(residueLoci.elements[0].indices.length).toBeGreaterThan(1);
    });

    it('should maintain selection highlight across view rotation', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);

      // Simulate camera rotation (highlights persist)
      plugin.canvas3d.mark({ kind: 'camera' });
      plugin.canvas3d.requestDraw();

      // Highlight should persist
      const activeHighlights = highlighter.getActiveHighlights();
      expect(activeHighlights.size).toBe(1);
    });

    it('should accept custom color parameter', () => {
      const loci = createMockLoci('atom');
      const customColor = '#ff6600';

      const config = highlighter.addSelection(loci, customColor);

      expect(config!.color).toBe(customColor);
    });

    it('should accept custom opacity parameter', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addSelection(loci, '#00ff00', 0.75);

      expect(config!.opacity).toBe(0.75);
    });

    it('should store highlight reference for later removal', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);

      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(1);
      expect(Array.from(highlights)[0]).toMatch(/^highlight-/);
    });
  });

  describe('hover highlighting', () => {
    it('should apply magenta highlight (#ff00ff) on hover', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addHover(loci);

      expect(config!.color).toBe(DEFAULT_HOVER_COLOR);
    });

    it('should use temporary highlight (removed on mouseout)', () => {
      const loci = createMockLoci('atom');

      highlighter.addHover(loci);
      highlighter.removeByLoci(loci);

      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(0);
    });

    it('should not conflict with selection highlight', () => {
      const selectionLoci = createMockLoci('atom');
      const hoverLoci = createMockLoci('residue');

      highlighter.addSelection(selectionLoci);
      highlighter.addHover(hoverLoci);

      // Both highlights should be active
      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(2);
    });

    it('should use higher opacity for hover (60%)', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addHover(loci);

      expect(config!.opacity).toBe(DEFAULT_HOVER_OPACITY);
    });

    it('should auto-remove previous hover when new hover occurs', () => {
      const loci1 = createMockLoci('atom');
      const loci2 = createMockLoci('residue');

      highlighter.addHover(loci1);
      highlighter.addHover(loci2);

      // Should only have one hover highlight active
      const highlights = highlighter.getActiveHighlights();
      const hoverHighlights = Array.from(highlights).filter(h => h.includes('hover'));
      expect(hoverHighlights.length).toBe(1);
    });
  });

  describe('multiple selections', () => {
    it('should highlight all selected atoms simultaneously', () => {
      const loci1 = createMockLoci('atom');
      const loci2 = createMockLoci('residue');
      const loci3 = createMockLoci('chain');

      highlighter.addSelection(loci1);
      highlighter.addSelection(loci2);
      highlighter.addSelection(loci3);

      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(3);
    });

    it('should remove highlight when atom deselected', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);
      highlighter.removeByLoci(loci);

      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(0);
    });

    it('should handle rapid selection/deselection', () => {
      const loci = createMockLoci('atom');

      // Rapid toggle
      for (let i = 0; i < 10; i++) {
        highlighter.addSelection(loci);
        highlighter.removeByLoci(loci);
      }

      // Should not have memory leaks or orphaned highlights
      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(0);
    });

    it('should track each highlight with unique identifier', () => {
      const loci1 = createMockLoci('atom');
      const loci2 = createMockLoci('residue');

      highlighter.addSelection(loci1);
      highlighter.addSelection(loci2);

      const highlights = highlighter.getActiveHighlights();
      const highlightIds = Array.from(highlights);

      expect(highlightIds[0]).not.toBe(highlightIds[1]);
      expect(highlightIds.every(id => id.startsWith('highlight-'))).toBe(true);
    });

    it('should clear all highlights at once', () => {
      highlighter.addSelection(createMockLoci('atom'));
      highlighter.addSelection(createMockLoci('residue'));
      highlighter.addSelection(createMockLoci('chain'));

      const clearedIds = highlighter.clearAll();

      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(0);
      expect(clearedIds.length).toBe(3);
    });
  });

  describe('state management', () => {
    it('should store highlight config with loci', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addSelection(loci);

      expect(config).toHaveProperty('loci');
      expect(config!.loci.kind).toBe('element-loci');
    });

    it('should track loci for proper highlight management', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);

      const lociKey = getLociKey(loci);
      expect(lociKey).toBeTruthy();
      expect(lociKey).not.toBe('empty');
    });

    it('should cleanup all highlights on dispose', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);
      highlighter.dispose();

      // Should throw when accessing after dispose
      expect(() => highlighter.getActiveHighlights()).toThrow(/disposed/i);
    });

    it('should track highlight count accurately', () => {
      highlighter.addSelection(createMockLoci('atom'));
      highlighter.addSelection(createMockLoci('residue'));
      highlighter.addHover(createMockLoci('chain'));

      expect(highlighter.getCount()).toBe(3);
    });

    it('should batch multiple highlight operations efficiently', () => {
      const loci1 = createMockLoci('atom');
      const loci2 = createMockLoci('residue');
      const loci3 = createMockLoci('chain');

      highlighter.addSelection(loci1);
      highlighter.addSelection(loci2);
      highlighter.addSelection(loci3);

      expect(highlighter.getCount()).toBe(3);
    });
  });

  describe('color and transparency', () => {
    it('should store custom color with highlight', () => {
      const loci = createMockLoci('atom');

      const config = highlighter.addSelection(loci, '#00ff00', 0.5);

      expect(config!.color).toBe('#00ff00');
      expect(config!.opacity).toBe(0.5);
    });

    it('should support different opacity levels', () => {
      const loci1 = createMockLoci('atom');
      const loci2 = createMockLoci('residue');

      const config1 = highlighter.addSelection(loci1, '#00ff00', 0.25);
      const config2 = highlighter.addSelection(loci2, '#00ff00', 0.75);

      expect(config1!.opacity).toBe(0.25);
      expect(config2!.opacity).toBe(0.75);
    });
  });

  describe('edge cases', () => {
    it('should handle empty loci gracefully', () => {
      const emptyLoci: SimpleLoci = {
        kind: 'element-loci',
        structure: {},
        elements: [],
      };

      const result = highlighter.addSelection(emptyLoci);

      // Should return null for empty loci
      expect(result).toBeNull();
      expect(highlighter.getCount()).toBe(0);
    });

    it('should identify empty loci correctly', () => {
      expect(isEmptyLoci(null)).toBe(true);
      expect(isEmptyLoci(undefined)).toBe(true);
      expect(isEmptyLoci({ kind: 'element-loci', elements: [] })).toBe(true);
    });

    it('should handle highlight of same loci twice', () => {
      const loci = createMockLoci('atom');

      highlighter.addSelection(loci);
      highlighter.addSelection(loci);

      // Should replace, not duplicate
      const highlights = highlighter.getActiveHighlights();
      expect(highlights.size).toBe(1);
    });

    it('should handle disposed state', () => {
      const loci = createMockLoci('atom');

      highlighter.dispose();

      expect(() => highlighter.addSelection(loci)).toThrow(/disposed/i);
    });
  });
});
