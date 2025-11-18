/**
 * Job Queue UI Tests
 *
 * Test coverage:
 * - JobList component rendering and interactions
 * - JobDetails component with different job states
 * - JobSubmissionForm validation and submission
 * - QueueStatus component updates
 * - JobActions component functionality
 * - Real-time subscription hooks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobList } from '@/components/jobs/JobList';
import { JobDetails } from '@/components/jobs/JobDetails';
import { JobSubmissionForm } from '@/components/jobs/JobSubmissionForm';
import { QueueStatus } from '@/components/jobs/QueueStatus';
import { JobActions } from '@/components/jobs/JobActions';
import { MDJob, JobStatus, MDTier } from '@/types/md-types';

// Mock data
const mockJob: MDJob = {
  id: 'job-123',
  userId: 'user-1',
  status: JobStatus.RUNNING,
  config: {
    tier: MDTier.SERVERLESS,
    atomCount: 1000,
    maxAtoms: 5000,
    timestep: 2.0,
    totalTime: 100,
    temperature: 300,
    ensemble: 'NVT',
    integrator: 'langevin',
    outputFrequency: 5,
    priority: 'normal',
    notifyOnComplete: true,
    userId: 'user-1',
  },
  structureId: '1ABC',
  structureData: 'PDB_DATA',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  startedAt: new Date('2024-01-01T10:01:00Z'),
  progress: 45,
  estimatedTimeRemaining: 120,
};

const mockCompletedJob: MDJob = {
  ...mockJob,
  status: JobStatus.COMPLETED,
  progress: 100,
  completedAt: new Date('2024-01-01T10:10:00Z'),
  resultUrl: 'https://example.com/result',
  estimatedTimeRemaining: undefined,
};

const mockFailedJob: MDJob = {
  ...mockJob,
  status: JobStatus.FAILED,
  progress: 30,
  errorMessage: 'Simulation diverged',
  completedAt: new Date('2024-01-01T10:05:00Z'),
};

describe('JobList', () => {
  it('renders empty state when no jobs', () => {
    render(<JobList jobs={[]} />);
    expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
  });

  it('renders list of jobs', () => {
    const jobs = [mockJob, mockCompletedJob, mockFailedJob];
    render(<JobList jobs={jobs} />);

    expect(screen.getByText('1ABC')).toBeInTheDocument();
    expect(screen.getByText(/job-123/i)).toBeInTheDocument();
  });

  it('filters jobs by status', async () => {
    const jobs = [mockJob, mockCompletedJob, mockFailedJob];
    render(<JobList jobs={jobs} />);

    // Click running filter
    const runningFilter = screen.getByText(/running \(1\)/i);
    fireEvent.click(runningFilter);

    await waitFor(() => {
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  it('searches jobs by structure ID', () => {
    const jobs = [
      mockJob,
      { ...mockCompletedJob, structureId: '2XYZ' },
    ];
    render(<JobList jobs={jobs} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: '1ABC' } });

    expect(screen.getByText('1ABC')).toBeInTheDocument();
    expect(screen.queryByText('2XYZ')).not.toBeInTheDocument();
  });

  it('calls onJobSelect when job clicked', () => {
    const onJobSelect = vi.fn();
    render(<JobList jobs={[mockJob]} onJobSelect={onJobSelect} />);

    const jobItem = screen.getByText('1ABC').closest('div');
    fireEvent.click(jobItem!);

    expect(onJobSelect).toHaveBeenCalledWith('job-123');
  });

  it('paginates jobs correctly', () => {
    const jobs = Array.from({ length: 25 }, (_, i) => ({
      ...mockJob,
      id: `job-${i}`,
      structureId: `Structure${i}`,
    }));

    render(<JobList jobs={jobs} />);

    // Should show first 20 jobs
    expect(screen.getByText('Structure0')).toBeInTheDocument();
    expect(screen.getByText('Structure19')).toBeInTheDocument();
    expect(screen.queryByText('Structure20')).not.toBeInTheDocument();

    // Go to next page
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    expect(screen.getByText('Structure20')).toBeInTheDocument();
  });
});

describe('JobDetails', () => {
  it('renders job details correctly', () => {
    render(<JobDetails job={mockJob} />);

    expect(screen.getByText(/job-123/i)).toBeInTheDocument();
    expect(screen.getByText(/running/i)).toBeInTheDocument();
    expect(screen.getByText(/45% complete/i)).toBeInTheDocument();
    expect(screen.getByText(/1ABC/i)).toBeInTheDocument();
  });

  it('shows progress bar for running jobs', () => {
    render(<JobDetails job={mockJob} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
  });

  it('shows error message for failed jobs', () => {
    render(<JobDetails job={mockFailedJob} />);

    expect(screen.getByText(/simulation diverged/i)).toBeInTheDocument();
  });

  it('shows retry button for failed jobs', () => {
    const onRetry = vi.fn();
    render(<JobDetails job={mockFailedJob} onRetry={onRetry} />);

    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledWith('job-123');
  });

  it('shows download button for completed jobs', () => {
    const onDownload = vi.fn();
    render(<JobDetails job={mockCompletedJob} onDownload={onDownload} />);

    const downloadButton = screen.getByText(/download/i);
    expect(downloadButton).toBeInTheDocument();
  });

  it('displays simulation parameters', () => {
    render(<JobDetails job={mockJob} />);

    // Open parameters accordion
    const parametersButton = screen.getByText(/simulation parameters/i);
    fireEvent.click(parametersButton);

    expect(screen.getByText(/300 K/i)).toBeInTheDocument();
    expect(screen.getByText(/2 fs/i)).toBeInTheDocument();
    expect(screen.getByText(/NVT/i)).toBeInTheDocument();
  });
});

describe('JobSubmissionForm', () => {
  it('renders form with default values', () => {
    render(<JobSubmissionForm onSubmit={vi.fn()} />);

    expect(screen.getByText(/submit simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/minimize/i)).toBeInTheDocument();
  });

  it('applies preset when simulation type changes', () => {
    render(<JobSubmissionForm onSubmit={vi.fn()} atomCount={1000} />);

    const equilibrateButton = screen.getByRole('button', { name: /equilibrate/i });
    fireEvent.click(equilibrateButton);

    // Check if preset values are applied
    expect(screen.getByText(/100 ps/i)).toBeInTheDocument();
  });

  it('validates atom count for serverless tier', () => {
    render(<JobSubmissionForm onSubmit={vi.fn()} atomCount={10000} />);

    expect(screen.getByText(/structure too large/i)).toBeInTheDocument();
  });

  it('shows quota warning when limit reached', () => {
    render(
      <JobSubmissionForm
        onSubmit={vi.fn()}
        atomCount={1000}
        userQuota={{ used: 5, limit: 5 }}
      />
    );

    expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
  });

  it('calculates cost estimation', () => {
    render(<JobSubmissionForm onSubmit={vi.fn()} atomCount={1000} />);

    expect(screen.getByText(/estimated cost/i)).toBeInTheDocument();
  });

  it('shows confirmation dialog on submit', async () => {
    const onSubmit = vi.fn();
    render(<JobSubmissionForm onSubmit={onSubmit} atomCount={1000} structureId="1ABC" />);

    const submitButton = screen.getByRole('button', { name: /submit simulation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/confirm submission/i)).toBeInTheDocument();
    });
  });

  it('submits form with correct data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <JobSubmissionForm
        onSubmit={onSubmit}
        atomCount={1000}
        structureId="1ABC"
        structureData="PDB_DATA"
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit simulation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/confirm submission/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^confirm$/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          structureId: '1ABC',
          structureData: 'PDB_DATA',
          config: expect.objectContaining({
            atomCount: 1000,
            tier: MDTier.SERVERLESS,
          }),
        })
      );
    });
  });
});

describe('QueueStatus', () => {
  const mockStats = {
    pending: 5,
    queued: 10,
    running: 3,
    completed: 100,
    failed: 5,
    averageWaitTime: 120,
    averageProcessingTime: 300,
    completionRate24h: 95,
  };

  it('renders queue statistics', () => {
    render(<QueueStatus stats={mockStats} />);

    expect(screen.getByText('5')).toBeInTheDocument(); // pending
    expect(screen.getByText('10')).toBeInTheDocument(); // queued
    expect(screen.getByText('3')).toBeInTheDocument(); // running
  });

  it('shows user position when provided', () => {
    render(<QueueStatus stats={mockStats} userPosition={7} />);

    expect(screen.getByText(/#7/i)).toBeInTheDocument();
  });

  it('displays estimated wait time', () => {
    render(<QueueStatus stats={mockStats} estimatedWaitTime={180} />);

    expect(screen.getByText(/3m/i)).toBeInTheDocument();
  });

  it('shows success rate', () => {
    render(<QueueStatus stats={mockStats} />);

    expect(screen.getByText(/95\.2%/i)).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const onRefresh = vi.fn();
    render(<QueueStatus stats={mockStats} onRefresh={onRefresh} />);

    const refreshButton = screen.getByTitle(/refresh/i);
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });
});

describe('JobActions', () => {
  it('shows cancel button for running jobs', () => {
    const onCancel = vi.fn();
    render(<JobActions job={mockJob} onCancel={onCancel} />);

    const cancelButton = screen.getByText(/cancel job/i);
    expect(cancelButton).toBeInTheDocument();
  });

  it('shows retry button for failed jobs', () => {
    const onRetry = vi.fn();
    render(<JobActions job={mockFailedJob} onRetry={onRetry} />);

    const retryButton = screen.getByText(/retry/i);
    expect(retryButton).toBeInTheDocument();
  });

  it('shows delete button for completed jobs', () => {
    const onDelete = vi.fn();
    render(<JobActions job={mockCompletedJob} onDelete={onDelete} />);

    const deleteButton = screen.getByText(/delete job/i);
    expect(deleteButton).toBeInTheDocument();
  });

  it('requires confirmation before delete', async () => {
    const onDelete = vi.fn();
    render(<JobActions job={mockCompletedJob} onDelete={onDelete} />);

    const deleteButton = screen.getByText(/delete job/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/delete this job permanently/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmButton);

    expect(onDelete).toHaveBeenCalledWith('job-123');
  });

  it('shows clone button for completed jobs', () => {
    const onClone = vi.fn();
    render(<JobActions job={mockCompletedJob} onClone={onClone} />);

    const cloneButton = screen.getByText(/clone job/i);
    expect(cloneButton).toBeInTheDocument();
  });

  it('shows share button for completed jobs', () => {
    const onShare = vi.fn().mockResolvedValue('https://example.com/share/job-123');
    render(<JobActions job={mockCompletedJob} onShare={onShare} />);

    const shareButton = screen.getByText(/share job/i);
    expect(shareButton).toBeInTheDocument();
  });

  it('generates shareable link', async () => {
    const onShare = vi.fn().mockResolvedValue('https://example.com/share/job-123');
    render(<JobActions job={mockCompletedJob} onShare={onShare} />);

    const shareButton = screen.getByText(/share job/i);
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/https:\/\/example\.com/i)).toBeInTheDocument();
    });
  });
});
