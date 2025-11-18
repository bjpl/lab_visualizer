/**
 * JobActions Component - Job management actions
 *
 * Features:
 * - Cancel running job
 * - Delete completed job
 * - Retry failed job
 * - Clone job (run again with same params)
 * - Share job link (public jobs)
 */

'use client';

import React, { useState } from 'react';
import { MDJob, JobStatus } from '@/types/md-types';

export interface JobActionsProps {
  job: MDJob;
  onCancel?: (jobId: string) => Promise<void>;
  onDelete?: (jobId: string) => Promise<void>;
  onRetry?: (jobId: string) => Promise<void>;
  onClone?: (jobId: string) => Promise<void>;
  onShare?: (jobId: string) => Promise<string>;
}

export function JobActions({ job, onCancel, onDelete, onRetry, onClone, onShare }: JobActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sharedLink, setSharedLink] = useState<string | null>(null);

  const canCancel = [JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING].includes(job.status);
  const canDelete = [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(job.status);
  const canRetry = job.status === JobStatus.FAILED;
  const canClone = [JobStatus.COMPLETED, JobStatus.FAILED].includes(job.status);
  const canShare = job.status === JobStatus.COMPLETED;

  const handleAction = async (action: () => Promise<void> | Promise<string>) => {
    setIsProcessing(true);
    try {
      const result = await action();
      if (typeof result === 'string') {
        setSharedLink(result);
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    await handleAction(async () => {
      const link = await onShare(job.id);
      return link;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-2">
      {/* Primary actions */}
      {canRetry && onRetry && (
        <button
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          disabled={isProcessing}
          onClick={() => handleAction(() => onRetry(job.id))}
        >
          {isProcessing ? '⏳ Retrying...' : '🔄 Retry Simulation'}
        </button>
      )}

      {canClone && onClone && (
        <button
          className="w-full px-4 py-2 border rounded-md hover:bg-muted/50 disabled:opacity-50 transition-colors"
          disabled={isProcessing}
          onClick={() => handleAction(() => onClone(job.id))}
        >
          {isProcessing ? '⏳ Cloning...' : '📋 Clone Job'}
        </button>
      )}

      {/* Share action */}
      {canShare && onShare && (
        <div className="space-y-2">
          {!sharedLink ? (
            <button
              className="w-full px-4 py-2 border rounded-md hover:bg-muted/50 disabled:opacity-50 transition-colors"
              disabled={isProcessing}
              onClick={handleShare}
            >
              {isProcessing ? '⏳ Creating link...' : '🔗 Share Job'}
            </button>
          ) : (
            <div className="border rounded-lg p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Shareable Link</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sharedLink}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
                />
                <button
                  className="px-3 py-2 border rounded-md hover:bg-muted/50 transition-colors text-sm"
                  onClick={() => copyToClipboard(sharedLink)}
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danger zone */}
      <div className="pt-4 border-t space-y-2">
        {canCancel && onCancel && (
          <button
            className="w-full px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 disabled:opacity-50 transition-colors"
            disabled={isProcessing}
            onClick={() => handleAction(() => onCancel(job.id))}
          >
            {isProcessing ? '⏳ Cancelling...' : '🚫 Cancel Job'}
          </button>
        )}

        {canDelete && onDelete && (
          <>
            {!showDeleteConfirm ? (
              <button
                className="w-full px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                disabled={isProcessing}
                onClick={() => setShowDeleteConfirm(true)}
              >
                🗑️ Delete Job
              </button>
            ) : (
              <div className="space-y-2 border border-destructive rounded-lg p-3">
                <p className="text-sm text-destructive font-medium">
                  Delete this job permanently?
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-muted/50"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                    onClick={() => handleAction(() => onDelete(job.id))}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Job info footer */}
      <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Job ID</span>
          <button
            className="hover:text-foreground transition-colors"
            onClick={() => copyToClipboard(job.id)}
            title="Copy job ID"
          >
            {job.id.slice(0, 16)}... 📋
          </button>
        </div>
        <div className="flex justify-between">
          <span>Created</span>
          <span>{new Date(job.createdAt).toLocaleString()}</span>
        </div>
        {job.completedAt && (
          <div className="flex justify-between">
            <span>Duration</span>
            <span>{formatDuration(job.createdAt, job.completedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(start: Date, end: Date): string {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
