/**
 * Jobs Page - Simulation job queue management
 *
 * Features:
 * - Job list with filtering
 * - Job details panel
 * - Job submission form
 * - Queue status widget
 * - Real-time updates
 * - Responsive layout
 */

'use client';

import React, { useState, useEffect } from 'react';
import { JobList } from '@/components/jobs/JobList';
import { JobDetails } from '@/components/jobs/JobDetails';
import { JobSubmissionForm } from '@/components/jobs/JobSubmissionForm';
import { QueueStatus } from '@/components/jobs/QueueStatus';
import { JobActions } from '@/components/jobs/JobActions';
import { useJobQueue } from '@/hooks/useJobQueue';
import { useJobSubscription } from '@/hooks/useJobSubscription';
import { useStore } from '@/stores';
import { useAuth } from '@/hooks/use-auth';
import { MDJob, MDResult } from '@/types/md-types';

export default function JobsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [queueStats, setQueueStats] = useState<any>(null);

  const { user } = useAuth();
  const { submitJob, cancelJob, removeJob, retryJob, getQueueStats } = useJobQueue();
  const jobs = useStore((state) => Array.from(state.jobs.values()));
  const results = useStore((state) => state.results);

  // Get user ID from auth, fallback to demo mode if not authenticated
  const userId = user?.id || 'demo-user';

  // Convert simulation jobs to MD jobs (temporary adapter)
  const mdJobs: MDJob[] = jobs.map((job) => ({
    id: job.id,
    userId: userId,
    status: job.status as any,
    config: job.parameters as any,
    structureId: job.name,
    structureData: '',
    createdAt: new Date(job.createdAt),
    startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
    progress: job.progress,
    estimatedTimeRemaining: job.estimatedTime,
    errorMessage: job.error,
  }));

  const selectedJob = mdJobs.find((job) => job.id === selectedJobId);
  const selectedResult = selectedJobId ? results.get(selectedJobId) : null;

  // Subscribe to real-time updates for all user jobs
  useJobSubscription({
    userId: userId,
    onUpdate: (update) => {
      // Updates are handled by the subscription
      console.log('[Jobs] Job update:', update);
    },
    onComplete: (jobId) => {
      console.log('[Jobs] Job completed:', jobId);
      // TODO: Show toast notification
    },
    onFailed: (jobId, error) => {
      console.error('[Jobs] Job failed:', jobId, error);
      // TODO: Show error toast
    },
  });

  // Load queue statistics
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getQueueStats();
      if (stats) {
        const total = stats.completed + stats.failed;
        setQueueStats({
          ...stats,
          completionRate24h: total > 0 ? (stats.completed / total * 100) : 0,
        });
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [getQueueStats]);

  const handleJobSubmit = async (data: any) => {
    const job = await submitJob(data);
    if (job) {
      setShowSubmitForm(false);
      setSelectedJobId(job.id);
    }
  };

  const handleJobCancel = async (jobId: string) => {
    await cancelJob(jobId);
  };

  const handleJobDelete = async (jobId: string) => {
    await removeJob(jobId);
    if (selectedJobId === jobId) {
      setSelectedJobId(null);
    }
  };

  const handleJobRetry = async (jobId: string) => {
    const newJob = await retryJob(jobId);
    if (newJob) {
      setSelectedJobId(newJob.id);
    }
  };

  const handleJobClone = async (jobId: string) => {
    const newJob = await retryJob(jobId);
    if (newJob) {
      setSelectedJobId(newJob.id);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Simulation Jobs</h1>
            <p className="text-sm text-muted-foreground">
              Manage your molecular dynamics simulations
            </p>
          </div>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => setShowSubmitForm(!showSubmitForm)}
          >
            {showSubmitForm ? 'Cancel' : '+ New Simulation'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto p-4">
          {/* Desktop layout: 3 columns */}
          <div className="hidden lg:grid lg:grid-cols-[1fr,400px,300px] lg:gap-4 h-full">
            {/* Job list */}
            <div className="border rounded-lg overflow-hidden">
              <JobList
                jobs={mdJobs}
                onJobSelect={setSelectedJobId}
                selectedJobId={selectedJobId}
              />
            </div>

            {/* Job details or submit form */}
            <div className="border rounded-lg overflow-hidden">
              {showSubmitForm ? (
                <JobSubmissionForm
                  onSubmit={handleJobSubmit}
                  userQuota={{ used: 2, limit: 5 }}
                />
              ) : selectedJob ? (
                <JobDetails
                  job={selectedJob}
                  result={selectedResult as MDResult | undefined}
                  onCancel={handleJobCancel}
                  onRetry={handleJobRetry}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Select a job to view details
                    </p>
                    <button
                      className="text-sm text-primary hover:underline"
                      onClick={() => setShowSubmitForm(true)}
                    >
                      or submit a new simulation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Queue status and actions */}
            <div className="space-y-4">
              <QueueStatus
                stats={queueStats}
                onRefresh={async () => {
                  const stats = await getQueueStats();
                  if (stats) setQueueStats(stats);
                }}
              />

              {selectedJob && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Actions</h3>
                  <JobActions
                    job={selectedJob}
                    onCancel={handleJobCancel}
                    onDelete={handleJobDelete}
                    onRetry={handleJobRetry}
                    onClone={handleJobClone}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tablet layout: 2 columns */}
          <div className="hidden md:grid lg:hidden md:grid-cols-[1fr,400px] md:gap-4 h-full">
            <div className="border rounded-lg overflow-hidden">
              <JobList
                jobs={mdJobs}
                onJobSelect={setSelectedJobId}
                selectedJobId={selectedJobId}
              />
            </div>
            <div className="space-y-4 overflow-auto">
              <QueueStatus stats={queueStats} />
              {showSubmitForm ? (
                <div className="border rounded-lg overflow-hidden">
                  <JobSubmissionForm
                    onSubmit={handleJobSubmit}
                    userQuota={{ used: 2, limit: 5 }}
                  />
                </div>
              ) : selectedJob ? (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <JobDetails
                      job={selectedJob}
                      result={selectedResult as MDResult | undefined}
                      onCancel={handleJobCancel}
                      onRetry={handleJobRetry}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <JobActions
                      job={selectedJob}
                      onCancel={handleJobCancel}
                      onDelete={handleJobDelete}
                      onRetry={handleJobRetry}
                      onClone={handleJobClone}
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Mobile layout: Single column with tabs */}
          <div className="md:hidden h-full flex flex-col">
            {showSubmitForm ? (
              <div className="border rounded-lg overflow-hidden flex-1">
                <JobSubmissionForm
                  onSubmit={handleJobSubmit}
                  userQuota={{ used: 2, limit: 5 }}
                />
              </div>
            ) : selectedJob ? (
              <div className="space-y-4 flex-1 overflow-auto">
                <button
                  className="w-full px-4 py-2 border rounded-md hover:bg-muted/50"
                  onClick={() => setSelectedJobId(null)}
                >
                  ← Back to list
                </button>
                <div className="border rounded-lg overflow-hidden">
                  <JobDetails
                    job={selectedJob}
                    result={selectedResult as MDResult | undefined}
                    onCancel={handleJobCancel}
                    onRetry={handleJobRetry}
                  />
                </div>
                <div className="border rounded-lg p-4">
                  <JobActions
                    job={selectedJob}
                    onCancel={handleJobCancel}
                    onDelete={handleJobDelete}
                    onRetry={handleJobRetry}
                    onClone={handleJobClone}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <QueueStatus stats={queueStats} />
                </div>
                <div className="border rounded-lg overflow-hidden flex-1">
                  <JobList
                    jobs={mdJobs}
                    onJobSelect={setSelectedJobId}
                    selectedJobId={selectedJobId}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
