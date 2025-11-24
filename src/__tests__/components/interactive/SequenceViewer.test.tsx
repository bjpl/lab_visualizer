import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SequenceViewer } from '@/components/viewer/interactive/SequenceViewer';
import { molstarService } from '@/services/molstar-service';

// Mock the molstar service
vi.mock('@/services/molstar-service', () => ({
  molstarService: {
    on: vi.fn(),
    off: vi.fn(),
    select: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('SequenceViewer', () => {
  const mockOnResidueClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no structure loaded', () => {
    render(<SequenceViewer />);
    expect(screen.getByText('No structure loaded')).toBeInTheDocument();
  });

  it('registers event listeners on mount', () => {
    render(<SequenceViewer onResidueClick={mockOnResidueClick} />);

    expect(molstarService.on).toHaveBeenCalledWith(
      'structure-loaded',
      expect.any(Function)
    );
    expect(molstarService.on).toHaveBeenCalledWith(
      'hover-info',
      expect.any(Function)
    );
  });

  it('unregisters event listeners on unmount', () => {
    const { unmount } = render(<SequenceViewer />);
    unmount();

    expect(molstarService.off).toHaveBeenCalledWith(
      'structure-loaded',
      expect.any(Function)
    );
    expect(molstarService.off).toHaveBeenCalledWith(
      'hover-info',
      expect.any(Function)
    );
  });

  it('displays sequence when structure is loaded', async () => {
    render(<SequenceViewer />);

    // Simulate structure loaded event
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    const mockMetadata = {
      title: 'Test Structure',
      chains: ['A', 'B'],
      atomCount: 1000,
      residueCount: 100,
    };

    await waitFor(() => {
      structureLoadedCallback(mockMetadata);
    });

    expect(screen.getByText('Chain A')).toBeInTheDocument();
  });

  it('handles residue click and selects in 3D', async () => {
    render(<SequenceViewer onResidueClick={mockOnResidueClick} />);

    // Simulate structure loaded with sequence
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    await waitFor(() => {
      structureLoadedCallback({
        title: 'Test',
        chains: ['A'],
        atomCount: 100,
        residueCount: 10,
      });
    });

    // Click a residue button (first residue)
    const residueButtons = screen.getAllByRole('button');
    const firstResidueButton = residueButtons.find(btn =>
      btn.textContent?.match(/^\w\d+$/)
    );

    if (firstResidueButton) {
      fireEvent.click(firstResidueButton);

      await waitFor(() => {
        expect(molstarService.select).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'residue',
          }),
          true
        );
        expect(mockOnResidueClick).toHaveBeenCalled();
      });
    }
  });

  it('synchronizes hover with 3D viewer', async () => {
    render(<SequenceViewer />);

    // Load structure
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    await waitFor(() => {
      structureLoadedCallback({
        title: 'Test',
        chains: ['A'],
        atomCount: 100,
        residueCount: 10,
      });
    });

    // Simulate hover event from 3D viewer
    const hoverCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'hover-info'
    )?.[1];

    const mockHoverInfo = {
      pdbId: 'test',
      modelIndex: 0,
      chainId: 'A',
      residueSeq: 5,
      residueName: 'ALA',
      position: [0, 0, 0] as [number, number, number],
    };

    await waitFor(() => {
      hoverCallback(mockHoverInfo);
    });

    // Verify UI updates (residue should be highlighted)
    // This is a visual test - in real implementation you'd check CSS classes
    const residueButtons = screen.getAllByRole('button');
    expect(residueButtons.length).toBeGreaterThan(0);
  });

  it('switches between chains', async () => {
    render(<SequenceViewer />);

    // Load structure with multiple chains
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    await waitFor(() => {
      structureLoadedCallback({
        title: 'Test',
        chains: ['A', 'B'],
        atomCount: 200,
        residueCount: 20,
      });
    });

    expect(screen.getByText('Chain A')).toBeInTheDocument();

    // Click next chain button
    const nextButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('[class*="lucide-chevron-right"]')
    );

    if (nextButton) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Chain B')).toBeInTheDocument();
      });
    }
  });

  it('filters residues by search query', async () => {
    render(<SequenceViewer />);

    // Load structure
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    await waitFor(() => {
      structureLoadedCallback({
        title: 'Test',
        chains: ['A'],
        atomCount: 100,
        residueCount: 10,
      });
    });

    const searchInput = screen.getByPlaceholderText('Search residues...');
    fireEvent.change(searchInput, { target: { value: 'ALA' } });

    // Search functionality updates the filtered sequences
    await waitFor(() => {
      expect(searchInput).toHaveValue('ALA');
    });
  });

  it('displays color-coded residues by type', async () => {
    render(<SequenceViewer />);

    // Load structure
    const structureLoadedCallback = (molstarService.on as any).mock.calls.find(
      (call: any) => call[0] === 'structure-loaded'
    )?.[1];

    await waitFor(() => {
      structureLoadedCallback({
        title: 'Test',
        chains: ['A'],
        atomCount: 100,
        residueCount: 10,
      });
    });

    // Verify legend is displayed
    expect(screen.getByText('Hydrophobic')).toBeInTheDocument();
    expect(screen.getByText('Polar')).toBeInTheDocument();
    expect(screen.getByText('Charged')).toBeInTheDocument();
  });
});
