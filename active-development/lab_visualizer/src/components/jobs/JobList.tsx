/**
 * JobList Component - Display and manage simulation jobs
 *
 * Features:
 * - Sortable/filterable job list
 * - Status indicators and progress bars
 * - Pagination (20 jobs per page)
 * - Responsive design (table -> card -> list)
 */

'use client';

import React, { useState, useMemo } from 'react';

import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { JobStatus } from '@/types/md-types';
import type { MDJob} from '@/types/md-types';

export interface JobListProps {
  jobs: MDJob[];
  onJobSelect?: (jobId: string) => void;
  selectedJobId?: string | null;
}

type SortField = 'createdAt' | 'status' | 'progress' | 'structureId';
type SortOrder = 'asc' | 'desc';

const JOBS_PER_PAGE = 20;

const STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.PENDING]: 'bg-gray-500',
  [JobStatus.QUEUED]: 'bg-blue-500',
  [JobStatus.RUNNING]: 'bg-green-500',
  [JobStatus.COMPLETED]: 'bg-emerald-600',
  [JobStatus.FAILED]: 'bg-red-500',
  [JobStatus.CANCELLED]: 'bg-orange-500',
};

const STATUS_ICONS: Record<JobStatus, string> = {
  [JobStatus.PENDING]: '⏳',
  [JobStatus.QUEUED]: '📋',
  [JobStatus.RUNNING]: '▶️',
  [JobStatus.COMPLETED]: '✅',
  [JobStatus.FAILED]: '❌',
  [JobStatus.CANCELLED]: '🚫',
};

export function JobList({ jobs, onJobSelect, selectedJobId }: JobListProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.id.toLowerCase().includes(query) ||
        job.structureId.toLowerCase().includes(query) ||
        job.userId.toLowerCase().includes(query)
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let aVal: string | number | JobStatus | Date | undefined = a[sortField];
      let bVal: string | number | JobStatus | Date | undefined = b[sortField];

      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [jobs, sortField, sortOrder, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const endIndex = startIndex + JOBS_PER_PAGE;
  const paginatedJobs = filteredAndSortedJobs.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeRemaining = (seconds?: number) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Simulation Jobs</h2>
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedJobs.length} jobs
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by ID or structure..."
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
          >
            All
          </button>
          {Object.values(JobStatus).map((status) => {
            const count = jobs.filter(j => j.status === status).length;
            return (
              <button
                key={status}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
              >
                {STATUS_ICONS[status]} {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Job list */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {paginatedJobs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-lg mb-2">No jobs found</p>
              <p className="text-sm">
                {filterStatus !== 'all' || searchQuery
                  ? 'Try adjusting your filters'
                  : 'Submit a simulation to get started'}
              </p>
            </div>
          ) : (
            paginatedJobs.map((job) => (
              <JobListItem
                key={job.id}
                job={job}
                isSelected={job.id === selectedJobId}
                onClick={() => onJobSelect?.(job.id)}
                formatDate={formatDate}
                formatTimeRemaining={formatTimeRemaining}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <button
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-2 text-sm border rounded-md disabled:opacity-50 hover:bg-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface JobListItemProps {
  job: MDJob;
  isSelected: boolean;
  onClick: () => void;
  formatDate: (date: Date) => string;
  formatTimeRemaining: (seconds?: number) => string;
}

function JobListItem({ job, isSelected, onClick, formatDate, formatTimeRemaining }: JobListItemProps) {
  return (
    <div
      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      {/* Desktop view */}
      <div className="hidden md:grid md:grid-cols-[auto,1fr,auto,auto,auto] md:gap-4 md:items-center">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${STATUS_COLORS[job.status]}`}
            title={job.status}
          />
          <span className="text-lg">{STATUS_ICONS[job.status]}</span>
        </div>

        {/* Job info */}
        <div className="min-w-0">
          <div className="font-medium truncate">{job.structureId}</div>
          <div className="text-xs text-muted-foreground truncate">{job.id}</div>
        </div>

        {/* Progress */}
        <div className="w-32">
          {job.status === JobStatus.RUNNING || job.status === JobStatus.QUEUED ? (
            <div>
              <Progress value={job.progress} className="h-2" />
              <div className="text-xs text-muted-foreground text-center mt-1">
                {job.progress}%
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground capitalize">
              {job.status}
            </span>
          )}
        </div>

        {/* Time remaining */}
        <div className="text-sm text-muted-foreground text-right w-20">
          {job.status === JobStatus.RUNNING && job.estimatedTimeRemaining
            ? formatTimeRemaining(job.estimatedTimeRemaining)
            : '—'}
        </div>

        {/* Created at */}
        <div className="text-sm text-muted-foreground text-right w-32">
          {formatDate(job.createdAt)}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${STATUS_COLORS[job.status]}`}
            />
            <span className="font-medium">{job.structureId}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(job.createdAt)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{job.id}</div>
        {(job.status === JobStatus.RUNNING || job.status === JobStatus.QUEUED) && (
          <div>
            <Progress value={job.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{job.progress}%</span>
              {job.estimatedTimeRemaining && (
                <span>{formatTimeRemaining(job.estimatedTimeRemaining)} remaining</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
