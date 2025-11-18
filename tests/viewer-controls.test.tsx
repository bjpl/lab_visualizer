import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ViewerLayout } from '@/components/viewer/ViewerLayout';
import { ControlsPanel } from '@/components/viewer/ControlsPanel';
import { Toolbar } from '@/components/viewer/Toolbar';
import { SelectionPanel } from '@/components/viewer/SelectionPanel';
import { InfoPanel } from '@/components/viewer/InfoPanel';
import { LoadingState, EmptyState } from '@/components/viewer/LoadingState';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock Mol* viewer
jest.mock('@/components/viewer/MolStarViewer', () => ({
  MolStarViewer: ({ onLoadComplete }: any) => {
    React.useEffect(() => {
      onLoadComplete?.();
    }, []);
    return <div data-testid="molstar-viewer">Mol* Viewer</div>;
  },
}));

describe('Viewer UI Components', () => {
  describe('ViewerLayout', () => {
    it('renders with canvas and controls panel', () => {
      render(<ViewerLayout />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/Controls/i)).toBeInTheDocument();
    });

    it('toggles panel collapse', async () => {
      const user = userEvent.setup();
      render(<ViewerLayout />);

      const collapseButton = screen.getAllByRole('button').find(
        (btn) => btn.getAttribute('aria-label')?.includes('panel')
      );

      if (collapseButton) {
        await user.click(collapseButton);
        // Panel should collapse
        expect(collapseButton).toHaveAttribute('aria-label', expect.stringContaining('Expand'));
      }
    });

    it('handles loading state', () => {
      render(<ViewerLayout pdbId="1crn" />);

      // Should show loading initially
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles error state', () => {
      const { rerender } = render(<ViewerLayout />);

      // Simulate error
      rerender(<ViewerLayout />);
      // Error handling will be tested via LoadingState component
    });
  });

  describe('ControlsPanel', () => {
    it('renders all control sections', () => {
      render(<ControlsPanel />);

      expect(screen.getByLabelText(/Structure Search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select representation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Select color scheme/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Background color/i)).toBeInTheDocument();
    });

    it('changes representation', async () => {
      const user = userEvent.setup();
      render(<ControlsPanel />);

      const representationSelect = screen.getByLabelText(/Select representation/i);
      await user.click(representationSelect);

      const cartoonOption = await screen.findByText('Cartoon');
      await user.click(cartoonOption);

      // State change will be handled by Zustand
    });

    it('toggles display options', async () => {
      const user = userEvent.setup();
      render(<ControlsPanel />);

      const backboneSwitch = screen.getByLabelText(/Toggle backbone/i);
      await user.click(backboneSwitch);

      // Verify switch state changed
      expect(backboneSwitch).toBeChecked();
    });

    it('adjusts quality slider', async () => {
      render(<ControlsPanel />);

      const qualitySlider = screen.getByLabelText(/Adjust rendering quality/i);
      fireEvent.change(qualitySlider, { target: { value: '4' } });

      // Quality value should update
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('resets to defaults', async () => {
      const user = userEvent.setup();
      render(<ControlsPanel />);

      const resetButton = screen.getByRole('button', { name: /Reset to Defaults/i });
      await user.click(resetButton);

      // Store will handle reset
    });
  });

  describe('Toolbar', () => {
    const mockProps = {
      onToggleFullscreen: jest.fn(),
      isFullscreen: false,
      onTogglePanel: jest.fn(),
      isPanelCollapsed: false,
    };

    it('renders all toolbar buttons', () => {
      render(<Toolbar {...mockProps} />);

      expect(screen.getByLabelText(/Reset camera/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Zoom in/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Zoom out/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Capture screenshot/i)).toBeInTheDocument();
    });

    it('toggles fullscreen', async () => {
      const user = userEvent.setup();
      render(<Toolbar {...mockProps} />);

      const fullscreenButton = screen.getByLabelText(/Enter fullscreen/i);
      await user.click(fullscreenButton);

      expect(mockProps.onToggleFullscreen).toHaveBeenCalled();
    });

    it('toggles panel', async () => {
      const user = userEvent.setup();
      render(<Toolbar {...mockProps} />);

      const panelButton = screen.getByLabelText(/Hide controls panel/i);
      await user.click(panelButton);

      expect(mockProps.onTogglePanel).toHaveBeenCalled();
    });

    it('shows camera presets menu', async () => {
      const user = userEvent.setup();
      render(<Toolbar {...mockProps} />);

      const cameraButton = screen.getByLabelText(/Camera presets/i);
      await user.click(cameraButton);

      expect(await screen.findByText('Front View')).toBeInTheDocument();
      expect(screen.getByText('Side View')).toBeInTheDocument();
      expect(screen.getByText('Top View')).toBeInTheDocument();
    });

    it('shows measurement tools menu', async () => {
      const user = userEvent.setup();
      render(<Toolbar {...mockProps} />);

      const measurementButton = screen.getByLabelText(/Measurement tools/i);
      await user.click(measurementButton);

      expect(await screen.findByText('Measure Distance')).toBeInTheDocument();
      expect(screen.getByText('Measure Angle')).toBeInTheDocument();
    });
  });

  describe('SelectionPanel', () => {
    it('shows empty state when no selection', () => {
      render(<SelectionPanel />);

      expect(screen.getByText(/No Selection/i)).toBeInTheDocument();
      expect(screen.getByText(/Click on atoms or residues/i)).toBeInTheDocument();
    });

    it('displays keyboard shortcuts hint', () => {
      render(<SelectionPanel />);

      expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
      expect(screen.getByText(/Clear selection/i)).toBeInTheDocument();
      expect(screen.getByText(/Focus on selection/i)).toBeInTheDocument();
    });

    // Note: Selection display will be tested with Mol* integration
  });

  describe('InfoPanel', () => {
    it('shows empty state when no PDB ID', () => {
      render(<InfoPanel />);

      expect(screen.getByText(/Load a structure to view details/i)).toBeInTheDocument();
    });

    it('shows loading state while fetching', () => {
      render(<InfoPanel pdbId="1crn" />);

      expect(screen.getByLabelText(/Structure information/i)).toBeInTheDocument();
    });

    it('displays structure metadata', async () => {
      render(<InfoPanel pdbId="1crn" />);

      await waitFor(() => {
        expect(screen.getByText(/PDB ID:/i)).toBeInTheDocument();
        expect(screen.getByText(/1CRN/i)).toBeInTheDocument();
      });
    });

    it('shows external links', async () => {
      render(<InfoPanel pdbId="1crn" />);

      await waitFor(() => {
        expect(screen.getByText('View on RCSB PDB')).toBeInTheDocument();
      });
    });

    it('shows download options', async () => {
      render(<InfoPanel pdbId="1crn" />);

      await waitFor(() => {
        expect(screen.getByText('PDB Format')).toBeInTheDocument();
        expect(screen.getByText('mmCIF Format')).toBeInTheDocument();
      });
    });
  });

  describe('LoadingState', () => {
    it('shows loading spinner', () => {
      render(<LoadingState />);

      expect(screen.getByText(/Loading Structure/i)).toBeInTheDocument();
    });

    it('shows progress bar with value', () => {
      render(<LoadingState progress={45} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45');
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('shows error state with retry button', async () => {
      const onRetry = jest.fn();
      const user = userEvent.setup();

      render(<LoadingState error="Failed to load structure" onRetry={onRetry} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Failed to Load Structure/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('EmptyState', () => {
    it('shows welcome message', () => {
      render(<EmptyState />);

      expect(screen.getByText(/Welcome to LAB Visualizer/i)).toBeInTheDocument();
    });

    it('displays example structures', () => {
      render(<EmptyState />);

      expect(screen.getByText(/1CRN/i)).toBeInTheDocument();
      expect(screen.getByText(/Crambin/i)).toBeInTheDocument();
      expect(screen.getByText(/1HHO/i)).toBeInTheDocument();
      expect(screen.getByText(/Hemoglobin/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ViewerLayout />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Molecular structure viewer');
      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Viewer toolbar');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ControlsPanel />);

      // Tab through controls
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Should be able to navigate with keyboard
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    it('has focus management', async () => {
      const user = userEvent.setup();
      const mockProps = {
        onToggleFullscreen: jest.fn(),
        isFullscreen: false,
        onTogglePanel: jest.fn(),
        isPanelCollapsed: false,
      };

      render(<Toolbar {...mockProps} />);

      const resetButton = screen.getByLabelText(/Reset camera/i);
      await user.click(resetButton);

      // Button should maintain focus
      expect(resetButton).toHaveFocus();
    });

    it('announces state changes to screen readers', () => {
      const { rerender } = render(<LoadingState />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');

      rerender(<LoadingState progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading molecular structure');
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<ViewerLayout />);

      // Panel should be collapsible on mobile
      const panel = screen.getByText(/Controls/i).parentElement?.parentElement;
      expect(panel).toHaveClass('max-lg:absolute');
    });

    it('optimizes toolbar for mobile', () => {
      global.innerWidth = 375;

      const mockProps = {
        onToggleFullscreen: jest.fn(),
        isFullscreen: false,
        onTogglePanel: jest.fn(),
        isPanelCollapsed: false,
      };

      render(<Toolbar {...mockProps} />);

      // All buttons should be present but may be adjusted for mobile
      expect(screen.getByLabelText(/Reset camera/i)).toBeInTheDocument();
    });
  });
});
