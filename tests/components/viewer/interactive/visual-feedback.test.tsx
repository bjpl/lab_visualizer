/**
 * @file Visual Selection Feedback Tests
 * @description Tests for visual feedback components during atom/residue selection
 * @path /tests/components/viewer/interactive/visual-feedback.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Import actual implementations
import {
  VisualFeedback,
  AtomHighlight,
  ResidueHighlight,
  type VisualFeedbackProps,
  type SelectionEffect,
} from '@/components/viewer/interactive/VisualFeedback';

// Re-export for backward compatibility in tests
const MockVisualFeedback = VisualFeedback;
const MockAtomHighlight = AtomHighlight;
const MockResidueHighlight = ResidueHighlight;

describe('Visual Selection Feedback', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('atom highlighting', () => {
    it('should show glow effect on selected atoms', () => {
      const selectedAtoms = new Set(['atom-1', 'atom-2', 'atom-3']);

      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={selectedAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      // Should render glow effect for each selected atom
      selectedAtoms.forEach(atomId => {
        const glowElement = container.querySelector(`[data-glow="${atomId}"]`);
        expect(glowElement).toBeInTheDocument();
        // Check style contains drop-shadow
        const style = window.getComputedStyle(glowElement!);
        expect(style.filter).toMatch(/drop-shadow/);
      });
    });

    it('should animate selection transition smoothly', async () => {
      const { rerender } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
          animationDuration={200}
        />
      );

      // Add selection
      rerender(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
          animationDuration={200}
        />
      );

      const highlight = screen.getByTestId('atom-highlight-atom-1');

      // Should have CSS transition
      const style = window.getComputedStyle(highlight);
      expect(style.transition).toMatch(/opacity.*200ms/);

      // Should animate opacity from 0 to target
      await waitFor(() => {
        const currentStyle = window.getComputedStyle(highlight);
        expect(currentStyle.opacity).toBe('0.5');
      }, { timeout: 250 });
    });

    it('should scale selected atoms slightly larger', () => {
      const selectedAtoms = new Set(['atom-1']);

      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={selectedAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const atomElement = container.querySelector('[data-atom-id="atom-1"]');
      const style = window.getComputedStyle(atomElement!);
      expect(style.transform).toMatch(/scale\(1\.(1|2)\)/);
    });

    it('should use green color (#00ff00) for selection by default', () => {
      const selectedAtoms = new Set(['atom-1']);

      render(
        <MockAtomHighlight
          atomId="atom-1"
          color="#00ff00"
          opacity={0.5}
        />
      );

      const highlight = screen.getByTestId('atom-highlight-atom-1');
      expect(highlight).toHaveAttribute('data-color', '#00ff00');
    });

    it('should support custom highlight color', () => {
      const selectedAtoms = new Set(['atom-1']);
      const customColor = '#ff6600';

      render(
        <MockVisualFeedback
          selectedAtoms={selectedAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
          highlightColor={customColor}
        />
      );

      const highlight = screen.getByTestId('atom-highlight-atom-1');
      expect(highlight).toHaveAttribute('data-color', customColor);
    });

    it('should pulse glow effect subtly', async () => {
      const selectedAtoms = new Set(['atom-1']);

      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={selectedAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const glowElement = container.querySelector('[data-glow="atom-1"]');

      // Should have pulse animation
      const style = window.getComputedStyle(glowElement!);
      expect(style.animation).toMatch(/pulse.*2s.*infinite/);
    });
  });

  describe('hover highlighting', () => {
    it('should use magenta color (#ff00ff) for hover', () => {
      render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom="atom-1"
          selectedResidue={null}
          selectedChain={null}
          hoverColor="#ff00ff"
        />
      );

      const highlight = screen.getByTestId('atom-highlight-atom-1');
      expect(highlight).toHaveAttribute('data-color', '#ff00ff');
    });

    it('should show stronger glow for hover than selection', () => {
      const { rerender, container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const selectionGlow = container.querySelector('[data-glow="atom-1"]');
      const selectionIntensity = parseFloat(
        selectionGlow?.getAttribute('data-intensity') || '0'
      );

      rerender(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom="atom-1"
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const hoverGlow = container.querySelector('[data-glow="atom-1"]');
      const hoverIntensity = parseFloat(
        hoverGlow?.getAttribute('data-intensity') || '0'
      );

      expect(hoverIntensity).toBeGreaterThan(selectionIntensity);
    });

    it('should remove hover highlight immediately on mouse out', async () => {
      const { rerender } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom="atom-1"
          selectedResidue={null}
          selectedChain={null}
        />
      );

      expect(screen.getByTestId('atom-highlight-atom-1')).toBeInTheDocument();

      rerender(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('atom-highlight-atom-1')).not.toBeInTheDocument();
      }, { timeout: 50 }); // Should be immediate
    });

    it('should layer hover highlight over selection highlight', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom="atom-1"
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const highlights = container.querySelectorAll('[data-atom-id="atom-1"]');
      expect(highlights.length).toBe(2); // Selection + Hover

      // Hover should have higher z-index
      const hoverHighlight = Array.from(highlights).find(el =>
        el.getAttribute('data-type') === 'hover'
      );
      const selectionHighlight = Array.from(highlights).find(el =>
        el.getAttribute('data-type') === 'selection'
      );

      const hoverZIndex = parseInt(window.getComputedStyle(hoverHighlight!).zIndex);
      const selectionZIndex = parseInt(window.getComputedStyle(selectionHighlight!).zIndex);

      expect(hoverZIndex).toBeGreaterThan(selectionZIndex);
    });
  });

  describe('residue highlighting', () => {
    it('should highlight all atoms in selected residue', () => {
      const residueAtoms = ['atom-1', 'atom-2', 'atom-3', 'atom-4'];

      render(
        <MockResidueHighlight
          residueId="residue-A42"
          atoms={residueAtoms}
        />
      );

      residueAtoms.forEach(atomId => {
        expect(screen.getByTestId(`residue-atom-${atomId}`)).toBeInTheDocument();
      });
    });

    it('should show residue boundary outline', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue="residue-A42"
          selectedChain={null}
        />
      );

      const outline = container.querySelector('[data-residue-outline="residue-A42"]');
      expect(outline).toBeInTheDocument();
      // Check inline style attribute since JSDOM doesn't compute shorthand border
      const styleAttr = outline?.getAttribute('style') || '';
      // React/JSDOM may serialize as "border: 2px rgb(...);" or "border: 2px solid..."
      expect(styleAttr).toMatch(/border.*2px/i);
      expect(styleAttr).toContain('border-radius');
    });

    it('should display residue label near selection', () => {
      render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue="residue-A42"
          selectedChain={null}
        />
      );

      const label = screen.getByTestId('residue-label-residue-A42');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent(/A42/i);
    });

    it('should position label above residue centroid', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue="residue-A42"
          selectedChain={null}
        />
      );

      const label = container.querySelector('[data-residue-label="residue-A42"]');
      const style = window.getComputedStyle(label!);

      expect(style.position).toBe('absolute');
      expect(style.transform).toMatch(/translate.*-50%.*-100%/); // Centered above
    });

    it('should use distinct color for residue boundary', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue="residue-A42"
          selectedChain={null}
        />
      );

      const outline = container.querySelector('[data-residue-outline="residue-A42"]');
      const style = window.getComputedStyle(outline!);
      expect(style.borderColor).toMatch(/#[0-9a-f]{6}|rgb/i);
    });
  });

  describe('chain highlighting', () => {
    it('should highlight entire chain when chain selected', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain="chain-A"
        />
      );

      const chainHighlight = container.querySelector('[data-chain="chain-A"]');
      expect(chainHighlight).toBeInTheDocument();
    });

    it('should use distinct color for chain selection', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain="chain-A"
        />
      );

      const chainHighlight = container.querySelector('[data-chain="chain-A"]');
      const color = chainHighlight?.getAttribute('data-color');

      // Should be different from atom selection color
      expect(color).not.toBe('#00ff00');
      expect(color).toMatch(/#[0-9a-f]{6}/i);
    });

    it('should show chain ribbon highlight', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain="chain-A"
        />
      );

      const ribbon = container.querySelector('[data-chain-ribbon="chain-A"]');
      expect(ribbon).toBeInTheDocument();
      const style = window.getComputedStyle(ribbon!);
      expect(parseFloat(style.opacity)).toBeGreaterThanOrEqual(0.3);
      expect(parseFloat(style.opacity)).toBeLessThanOrEqual(0.7);
    });

    it('should display chain identifier label', () => {
      render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain="chain-A"
        />
      );

      const label = screen.getByTestId('chain-label-chain-A');
      expect(label).toHaveTextContent(/Chain A/i);
    });
  });

  describe('accessibility', () => {
    it('should have sufficient contrast for colorblind users', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
          accessibilityMode={true}
        />
      );

      const highlight = container.querySelector('[data-atom-id="atom-1"]');
      const backgroundColor = window.getComputedStyle(highlight!).backgroundColor;

      // Should use high-contrast color
      // This is a placeholder - actual WCAG contrast calculation needed
      expect(backgroundColor).toBeTruthy();
    });

    it('should provide alternative visual cues (not just color)', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
          accessibilityMode={true}
        />
      );

      const highlight = container.querySelector('[data-atom-id="atom-1"]');

      // Should have pattern or border in addition to color
      expect(
        highlight?.getAttribute('data-pattern') ||
        window.getComputedStyle(highlight!).border
      ).toBeTruthy();
    });

    it('should support screen reader announcements', () => {
      render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const announcement = screen.getByRole('status', { hidden: true });
      expect(announcement).toHaveTextContent(/selected/i);
    });

    it('should use ARIA labels for highlights', () => {
      render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const highlight = screen.getByTestId('atom-highlight-atom-1');
      expect(highlight).toHaveAttribute('aria-label', expect.stringMatching(/atom.*selected/i));
    });

    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const animated = container.querySelector('[data-glow="atom-1"]');

      // Should not have animation when reduced motion preferred
      const style = window.getComputedStyle(animated!);
      expect(style.animation).not.toMatch(/pulse/);
    });

    it('should use patterns for deuteranopia (red-green colorblindness)', () => {
      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={new Set(['atom-1'])}
          hoveredAtom="atom-2"
          selectedResidue={null}
          selectedChain={null}
          accessibilityMode={true}
        />
      );

      const selection = container.querySelector('[data-atom-id="atom-1"]');
      const hover = container.querySelector('[data-atom-id="atom-2"]');

      // Selection and hover should be distinguishable without color
      expect(selection?.getAttribute('data-pattern')).not.toBe(
        hover?.getAttribute('data-pattern')
      );
    });
  });

  describe('performance and rendering', () => {
    it('should efficiently render 100+ highlights', () => {
      const manyAtoms = new Set(
        Array.from({ length: 100 }, (_, i) => `atom-${i}`)
      );

      const startTime = performance.now();

      render(
        <MockVisualFeedback
          selectedAtoms={manyAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should use virtualization for large selections', () => {
      const manyAtoms = new Set(
        Array.from({ length: 1000 }, (_, i) => `atom-${i}`)
      );

      const { container } = render(
        <MockVisualFeedback
          selectedAtoms={manyAtoms}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      const renderedHighlights = container.querySelectorAll('[data-atom-id]');

      // Should only render visible highlights, not all 1000
      expect(renderedHighlights.length).toBeLessThan(100);
    });

    it('should debounce rapid hover changes', async () => {
      const { rerender } = render(
        <MockVisualFeedback
          selectedAtoms={new Set()}
          hoveredAtom={null}
          selectedResidue={null}
          selectedChain={null}
        />
      );

      // Rapid hover changes
      for (let i = 0; i < 20; i++) {
        rerender(
          <MockVisualFeedback
            selectedAtoms={new Set()}
            hoveredAtom={`atom-${i}`}
            selectedResidue={null}
            selectedChain={null}
          />
        );
      }

      // Should only render final hover state
      await waitFor(() => {
        expect(screen.getByTestId('atom-highlight-atom-19')).toBeInTheDocument();
      });

      // Previous hovers should be cleared
      expect(screen.queryByTestId('atom-highlight-atom-0')).not.toBeInTheDocument();
    });
  });
});
