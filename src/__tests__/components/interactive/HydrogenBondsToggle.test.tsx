import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HydrogenBondsToggle } from '@/components/viewer/interactive/HydrogenBondsToggle';
import { molstarService } from '@/services/molstar-service';

// Mock the molstar service
vi.mock('@/services/molstar-service', () => ({
  molstarService: {
    visualizeHydrogenBonds: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('HydrogenBondsToggle', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default hidden state', () => {
    render(<HydrogenBondsToggle />);
    expect(screen.getByText('Show H-Bonds')).toBeInTheDocument();
  });

  it('renders with default visible state', () => {
    render(<HydrogenBondsToggle defaultVisible={true} />);
    expect(screen.getByText('Hide H-Bonds')).toBeInTheDocument();
    expect(screen.getByText('Hydrogen bonds shown in yellow')).toBeInTheDocument();
  });

  it('toggles hydrogen bonds on button click', async () => {
    render(<HydrogenBondsToggle onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(molstarService.visualizeHydrogenBonds).toHaveBeenCalledWith(true);
      expect(mockOnToggle).toHaveBeenCalledWith(true);
    });

    expect(screen.getByText('Hide H-Bonds')).toBeInTheDocument();
  });

  it('shows loading state during toggle', async () => {
    // Make the service method delay to catch loading state
    (molstarService.visualizeHydrogenBonds as any).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<HydrogenBondsToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading immediately
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Hide H-Bonds')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to visualize H-bonds';
    (molstarService.visualizeHydrogenBonds as any).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<HydrogenBondsToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // State should not change on error
    expect(screen.getByText('Show H-Bonds')).toBeInTheDocument();
  });

  it('toggles between visible and hidden states', async () => {
    render(<HydrogenBondsToggle onToggle={mockOnToggle} />);

    const button = screen.getByRole('button');

    // First toggle - show
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Hide H-Bonds')).toBeInTheDocument();
    });

    // Second toggle - hide
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Show H-Bonds')).toBeInTheDocument();
      expect(molstarService.visualizeHydrogenBonds).toHaveBeenCalledWith(false);
    });

    expect(mockOnToggle).toHaveBeenCalledTimes(2);
    expect(mockOnToggle).toHaveBeenNthCalledWith(1, true);
    expect(mockOnToggle).toHaveBeenNthCalledWith(2, false);
  });

  it('displays helper text when visible', async () => {
    render(<HydrogenBondsToggle defaultVisible={true} />);

    expect(screen.getByText('Hydrogen bonds shown in yellow')).toBeInTheDocument();
  });

  it('hides helper text when hidden', () => {
    render(<HydrogenBondsToggle defaultVisible={false} />);

    expect(screen.queryByText('Hydrogen bonds shown in yellow')).not.toBeInTheDocument();
  });
});
