/**
 * Hydrogen Bonds Panel Tests - RED Phase (TDD)
 *
 * Tests for the UI panel that displays and controls hydrogen bond visualization:
 * - List of detected H-bonds
 * - Individual and bulk visibility controls
 * - Bond details (distance, angle, strength)
 * - Integration with residue selection
 * - Loading and error states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HydrogenBond } from '../../../services/interactions/hydrogen-bond-detector.test';

// Mock component - actual implementation will be in GREEN phase
const HydrogenBondsPanel = vi.fn(() => null);

interface HydrogenBondsPanelProps {
  selectedResidue?: string;
  bonds?: HydrogenBond[];
  isLoading?: boolean;
  error?: string;
  onToggleBond?: (bondId: string, visible: boolean) => void;
  onToggleAll?: (visible: boolean) => void;
  onSelectBond?: (bondId: string) => void;
  onFilterByStrength?: (strength: 'strong' | 'moderate' | 'weak' | 'all') => void;
}

describe('HydrogenBondsPanel', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockBonds: HydrogenBond[];
  let mockProps: HydrogenBondsPanelProps;

  beforeEach(() => {
    user = userEvent.setup();

    mockBonds = [
      {
        id: 'hbond-1',
        donorAtom: {
          residueId: 'A:5',
          atomName: 'N',
          element: 'N',
          position: [0, 0, 0]
        },
        hydrogenAtom: {
          atomName: 'H',
          position: [0.5, 0, 0]
        },
        acceptorAtom: {
          residueId: 'A:1',
          atomName: 'O',
          element: 'O',
          position: [3, 0, 0]
        },
        distance: 2.9,
        angle: 165,
        strength: 'strong',
        type: 'backbone-backbone'
      },
      {
        id: 'hbond-2',
        donorAtom: {
          residueId: 'A:10',
          atomName: 'OG',
          element: 'O',
          position: [10, 5, 2]
        },
        hydrogenAtom: {
          atomName: 'HG',
          position: [10.5, 5, 2]
        },
        acceptorAtom: {
          residueId: 'A:15',
          atomName: 'OD1',
          element: 'O',
          position: [13, 5.5, 2]
        },
        distance: 3.2,
        angle: 145,
        strength: 'moderate',
        type: 'sidechain-sidechain'
      },
      {
        id: 'hbond-3',
        donorAtom: {
          residueId: 'A:20',
          atomName: 'N',
          element: 'N',
          position: [20, 0, 0]
        },
        hydrogenAtom: {
          atomName: 'H',
          position: [20.5, 0, 0]
        },
        acceptorAtom: {
          residueId: 'A:16',
          atomName: 'O',
          element: 'O',
          position: [23, 0.5, 0]
        },
        distance: 3.4,
        angle: 125,
        strength: 'weak',
        type: 'backbone-backbone'
      }
    ];

    mockProps = {
      selectedResidue: 'A:5',
      bonds: mockBonds,
      isLoading: false,
      onToggleBond: vi.fn(),
      onToggleAll: vi.fn(),
      onSelectBond: vi.fn(),
      onFilterByStrength: vi.fn(),
    };
  });

  describe('basic rendering', () => {
    it('should display detected H-bonds count', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/3 hydrogen bonds/i)).toBeInTheDocument();
    });

    it('should show panel header with title', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/hydrogen bonds/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /hydrogen bonds/i })).toBeInTheDocument();
    });

    it('should display selected residue information', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/selected residue: a:5/i)).toBeInTheDocument();
    });

    it('should render without crashing when no bonds', () => {
      render(<HydrogenBondsPanel {...mockProps} bonds={[]} />);

      expect(screen.getByText(/no hydrogen bonds/i)).toBeInTheDocument();
    });
  });

  describe('bonds list', () => {
    it('should list H-bonds with donor/acceptor info', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      // Check first bond
      expect(screen.getByText(/a:5 n/i)).toBeInTheDocument();
      expect(screen.getByText(/a:1 o/i)).toBeInTheDocument();

      // Check second bond
      expect(screen.getByText(/a:10 og/i)).toBeInTheDocument();
      expect(screen.getByText(/a:15 od1/i)).toBeInTheDocument();
    });

    it('should show distance and angle for each H-bond', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      // Distance
      expect(screen.getByText(/2\.9.*å/i)).toBeInTheDocument();
      expect(screen.getByText(/3\.2.*å/i)).toBeInTheDocument();
      expect(screen.getByText(/3\.4.*å/i)).toBeInTheDocument();

      // Angle
      expect(screen.getByText(/165.*°/i)).toBeInTheDocument();
      expect(screen.getByText(/145.*°/i)).toBeInTheDocument();
      expect(screen.getByText(/125.*°/i)).toBeInTheDocument();
    });

    it('should display bond strength indicator', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/strong/i)).toBeInTheDocument();
      expect(screen.getByText(/moderate/i)).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });

    it('should display bond type', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getAllByText(/backbone-backbone/i)).toHaveLength(2);
      expect(screen.getByText(/sidechain-sidechain/i)).toBeInTheDocument();
    });

    it('should show visual strength indicator (color/icon)', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const bondItems = screen.getAllByRole('listitem');

      // Strong bond should have green/solid indicator
      const strongBond = bondItems[0];
      expect(within(strongBond).getByTestId('strength-indicator-strong')).toBeInTheDocument();

      // Moderate bond should have yellow/medium indicator
      const moderateBond = bondItems[1];
      expect(within(moderateBond).getByTestId('strength-indicator-moderate')).toBeInTheDocument();

      // Weak bond should have orange/dashed indicator
      const weakBond = bondItems[2];
      expect(within(weakBond).getByTestId('strength-indicator-weak')).toBeInTheDocument();
    });
  });

  describe('individual bond controls', () => {
    it('should toggle individual H-bond visibility', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const toggleButtons = screen.getAllByRole('checkbox', { name: /toggle visibility/i });
      const firstToggle = toggleButtons[0];

      await user.click(firstToggle);

      expect(mockProps.onToggleBond).toHaveBeenCalledWith('hbond-1', false);
    });

    it('should show eye icon for visibility toggle', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const visibilityIcons = screen.getAllByTestId(/visibility-icon/i);
      expect(visibilityIcons).toHaveLength(3);
    });

    it('should highlight bond on row hover', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const bondRows = screen.getAllByRole('listitem');
      const firstRow = bondRows[0];

      await user.hover(firstRow);

      expect(firstRow).toHaveClass('bond-row-hovered');
    });

    it('should select bond on row click', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const bondRows = screen.getAllByRole('listitem');
      const firstRow = bondRows[0];

      await user.click(firstRow);

      expect(mockProps.onSelectBond).toHaveBeenCalledWith('hbond-1');
    });
  });

  describe('bulk operations', () => {
    it('should toggle all H-bonds visibility', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const toggleAllButton = screen.getByRole('button', { name: /toggle all/i });

      await user.click(toggleAllButton);

      expect(mockProps.onToggleAll).toHaveBeenCalledWith(false);
    });

    it('should show "Show All" when bonds are hidden', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const toggleAllButton = screen.getByRole('button', { name: /show all|hide all/i });
      expect(toggleAllButton).toBeInTheDocument();
    });

    it('should filter bonds by strength', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const strengthFilter = screen.getByRole('combobox', { name: /filter by strength/i });

      await user.selectOptions(strengthFilter, 'strong');

      expect(mockProps.onFilterByStrength).toHaveBeenCalledWith('strong');
    });

    it('should display filtered bond count', async () => {
      const filteredProps = {
        ...mockProps,
        bonds: mockBonds.filter(b => b.strength === 'strong')
      };

      render(<HydrogenBondsPanel {...filteredProps} />);

      expect(screen.getByText(/1 hydrogen bond/i)).toBeInTheDocument();
      expect(screen.getByText(/filtered/i)).toBeInTheDocument();
    });
  });

  describe('state updates', () => {
    it('should update when selected residue changes', () => {
      const { rerender } = render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/a:5/i)).toBeInTheDocument();

      rerender(<HydrogenBondsPanel {...mockProps} selectedResidue="A:10" />);

      expect(screen.getByText(/a:10/i)).toBeInTheDocument();
    });

    it('should update bond list when bonds change', () => {
      const { rerender } = render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/3 hydrogen bonds/i)).toBeInTheDocument();

      const newBonds = mockBonds.slice(0, 1);
      rerender(<HydrogenBondsPanel {...mockProps} bonds={newBonds} />);

      expect(screen.getByText(/1 hydrogen bond/i)).toBeInTheDocument();
    });

    it('should clear selection when residue deselected', () => {
      const { rerender } = render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByText(/a:5/i)).toBeInTheDocument();

      rerender(<HydrogenBondsPanel {...mockProps} selectedResidue={undefined} />);

      expect(screen.queryByText(/selected residue/i)).not.toBeInTheDocument();
      expect(screen.getByText(/select a residue/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should handle loading state during detection', () => {
      render(<HydrogenBondsPanel {...mockProps} isLoading={true} />);

      expect(screen.getByText(/detecting/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show spinner during loading', () => {
      render(<HydrogenBondsPanel {...mockProps} isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable controls during loading', () => {
      render(<HydrogenBondsPanel {...mockProps} isLoading={true} />);

      const toggleAllButton = screen.getByRole('button', { name: /toggle all/i });
      expect(toggleAllButton).toBeDisabled();
    });

    it('should transition from loading to loaded state', async () => {
      const { rerender } = render(<HydrogenBondsPanel {...mockProps} isLoading={true} />);

      expect(screen.getByText(/detecting/i)).toBeInTheDocument();

      rerender(<HydrogenBondsPanel {...mockProps} isLoading={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/detecting/i)).not.toBeInTheDocument();
        expect(screen.getByText(/3 hydrogen bonds/i)).toBeInTheDocument();
      });
    });
  });

  describe('empty and error states', () => {
    it('should handle no H-bonds found state', () => {
      render(<HydrogenBondsPanel {...mockProps} bonds={[]} />);

      expect(screen.getByText(/no hydrogen bonds detected/i)).toBeInTheDocument();
      expect(screen.getByText(/try selecting a different residue/i)).toBeInTheDocument();
    });

    it('should show helpful message when no residue selected', () => {
      render(<HydrogenBondsPanel {...mockProps} selectedResidue={undefined} bonds={[]} />);

      expect(screen.getByText(/select a residue/i)).toBeInTheDocument();
    });

    it('should display error message on detection failure', () => {
      const errorProps = {
        ...mockProps,
        error: 'Failed to detect hydrogen bonds'
      };

      render(<HydrogenBondsPanel {...errorProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to detect/i)).toBeInTheDocument();
    });

    it('should provide retry option on error', async () => {
      const onRetry = vi.fn();
      const errorProps = {
        ...mockProps,
        error: 'Network error',
        onRetry
      };

      render(<HydrogenBondsPanel {...errorProps} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByRole('region', { name: /hydrogen bonds/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /hydrogen bond list/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const bondRows = screen.getAllByRole('listitem');
      const firstRow = bondRows[0];

      firstRow.focus();
      expect(firstRow).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockProps.onSelectBond).toHaveBeenCalledWith('hbond-1');
    });

    it('should announce bond count to screen readers', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const announcement = screen.getByRole('status', { name: /bond count/i });
      expect(announcement).toHaveTextContent(/3 hydrogen bonds/i);
    });

    it('should provide meaningful button labels', () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      expect(screen.getByRole('button', { name: /toggle all hydrogen bonds/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter bonds by strength/i })).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should render large bond lists efficiently', () => {
      const manyBonds = Array.from({ length: 100 }, (_, i) => ({
        ...mockBonds[0],
        id: `hbond-${i}`,
        distance: 2.5 + (i * 0.01)
      }));

      const startTime = performance.now();
      render(<HydrogenBondsPanel {...mockProps} bonds={manyBonds} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // <100ms for 100 bonds
    });

    it('should virtualize long bond lists', () => {
      const manyBonds = Array.from({ length: 1000 }, (_, i) => ({
        ...mockBonds[0],
        id: `hbond-${i}`
      }));

      render(<HydrogenBondsPanel {...mockProps} bonds={manyBonds} />);

      // Should only render visible items (not all 1000)
      const renderedItems = screen.getAllByRole('listitem');
      expect(renderedItems.length).toBeLessThan(50); // Only visible items
    });
  });

  describe('sorting and filtering', () => {
    it('should sort bonds by distance', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const sortButton = screen.getByRole('button', { name: /sort by distance/i });
      await user.click(sortButton);

      const bondItems = screen.getAllByRole('listitem');
      const distances = bondItems.map(item =>
        parseFloat(within(item).getByText(/\d+\.\d+ å/i).textContent || '0')
      );

      expect(distances).toEqual([2.9, 3.2, 3.4]);
    });

    it('should sort bonds by strength', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const sortButton = screen.getByRole('button', { name: /sort by strength/i });
      await user.click(sortButton);

      const bondItems = screen.getAllByRole('listitem');
      const strengths = bondItems.map(item =>
        within(item).getByText(/strong|moderate|weak/i).textContent
      );

      expect(strengths).toEqual(['strong', 'moderate', 'weak']);
    });

    it('should filter by bond type', async () => {
      render(<HydrogenBondsPanel {...mockProps} />);

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i });
      await user.selectOptions(typeFilter, 'backbone-backbone');

      const bondItems = screen.getAllByRole('listitem');
      expect(bondItems).toHaveLength(2); // Only backbone-backbone bonds
    });
  });
});
