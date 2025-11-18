/**
 * JobDetails Component - Display detailed job information
 *
 * Features:
 * - Real-time status updates via Supabase
 * - Live progress visualization
 * - Energy/temperature graphs
 * - Result summary
 * - Error handling with retry
 * - Download and view actions
 */

'use client';

import { useEffect, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { MDJob, MDResult } from '@/types/md-types';
import { JobStatus } from '@/types/md-types';

export interface JobDetailsProps {
  job: MDJob;
  result?: MDResult | null;
  onRetry?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  onViewIn3D?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
}

export function JobDetails({ job, result, onRetry, onDownload, onViewIn3D, onCancel }: JobDetailsProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['status']);

  const isTerminalState = [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED].includes(job.status);
  const canRetry = job.status === JobStatus.FAILED;
  const canCancel = [JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING].includes(job.status);

  const formatDuration = (start?: Date, end?: Date) => {
    if (!start) return '—';
    const endTime = end || new Date();
    const duration = endTime.getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">Job Details</h2>
        <div className="text-sm text-muted-foreground truncate">{job.id}</div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Status card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Status</h3>
              <StatusBadge status={job.status} />
            </div>

            {/* Progress bar for running jobs */}
            {(job.status === JobStatus.RUNNING || job.status === JobStatus.QUEUED) && (
              <div>
                <Progress value={job.progress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{job.progress}% complete</span>
                  {job.estimatedTimeRemaining && (
                    <span>{formatTimeRemaining(job.estimatedTimeRemaining)} remaining</span>
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {job.status === JobStatus.FAILED && job.errorMessage && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <div className="text-sm font-medium text-destructive mb-1">Error</div>
                <div className="text-sm text-muted-foreground">{job.errorMessage}</div>
              </div>
            )}

            {/* Timing information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Created</div>
                <div>{new Date(job.createdAt).toLocaleString()}</div>
              </div>
              {job.startedAt && (
                <div>
                  <div className="text-muted-foreground">Started</div>
                  <div>{new Date(job.startedAt).toLocaleString()}</div>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <div className="text-muted-foreground">Completed</div>
                  <div>{new Date(job.completedAt).toLocaleString()}</div>
                </div>
              )}
              {job.startedAt && (
                <div>
                  <div className="text-muted-foreground">Duration</div>
                  <div>{formatDuration(job.startedAt, job.completedAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Parameters accordion */}
          <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
            <AccordionItem value="parameters">
              <AccordionTrigger>Simulation Parameters</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <ParamRow label="Structure" value={job.structureId} />
                  <Separator />
                  <ParamRow label="Ensemble" value={job.config.ensemble} />
                  <ParamRow label="Integrator" value={job.config.integrator} />
                  <ParamRow label="Temperature" value={`${job.config.temperature} K`} />
                  <ParamRow label="Timestep" value={`${job.config.timestep} fs`} />
                  <ParamRow label="Total Time" value={`${job.config.totalTime} ps`} />
                  <ParamRow label="Output Frequency" value={`${job.config.outputFrequency} fps/ps`} />
                  <ParamRow label="Atom Count" value={job.config.atomCount.toLocaleString()} />
                  <ParamRow label="Priority" value={job.config.priority} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Results section (only for completed jobs) */}
            {job.status === JobStatus.COMPLETED && result && (
              <AccordionItem value="results">
                <AccordionTrigger>Results Summary</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <ParamRow label="Frames" value={result.frameCount.toLocaleString()} />
                    <ParamRow label="Final Energy" value={`${result.finalEnergy.toFixed(2)} kJ/mol`} />
                    <ParamRow label="Avg Temperature" value={`${result.averageTemperature.toFixed(1)} K`} />
                    {result.averagePressure && (
                      <ParamRow label="Avg Pressure" value={`${result.averagePressure.toFixed(1)} bar`} />
                    )}
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="text-muted-foreground text-xs">Output Files</div>
                      <button className="w-full text-left px-3 py-2 text-xs border rounded hover:bg-muted/50 transition-colors">
                        📊 Energy Plot
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs border rounded hover:bg-muted/50 transition-colors">
                        📈 Statistics
                      </button>
                      <button className="w-full text-left px-3 py-2 text-xs border rounded hover:bg-muted/50 transition-colors">
                        📝 Log File
                      </button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Live metrics (for running jobs) */}
            {job.status === JobStatus.RUNNING && (
              <AccordionItem value="metrics">
                <AccordionTrigger>Live Metrics</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground text-center">
                      Real-time data will appear here during simulation
                    </div>
                    {/* Placeholder for real-time charts */}
                    <div className="h-32 border rounded flex items-center justify-center text-muted-foreground text-sm">
                      Energy vs Time Chart
                    </div>
                    <div className="h-32 border rounded flex items-center justify-center text-muted-foreground text-sm">
                      Temperature vs Time Chart
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="p-4 border-t space-y-2">
        {job.status === JobStatus.COMPLETED && (
          <>
            <button
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              onClick={() => onViewIn3D?.(job.id)}
            >
              View Trajectory in 3D
            </button>
            <button
              className="w-full px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors"
              onClick={() => onDownload?.(job.id)}
            >
              Download Results
            </button>
          </>
        )}

        {canRetry && (
          <button
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={() => onRetry?.(job.id)}
          >
            Retry Simulation
          </button>
        )}

        {canCancel && (
          <button
            className="w-full px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors"
            onClick={() => onCancel?.(job.id)}
          >
            Cancel Job
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    [JobStatus.PENDING]: 'bg-gray-500',
    [JobStatus.QUEUED]: 'bg-blue-500',
    [JobStatus.RUNNING]: 'bg-green-500',
    [JobStatus.COMPLETED]: 'bg-emerald-600',
    [JobStatus.FAILED]: 'bg-red-500',
    [JobStatus.CANCELLED]: 'bg-orange-500',
  };

  return (
    <span className={`px-3 py-1 text-xs font-medium text-white rounded-full ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}

function ParamRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
