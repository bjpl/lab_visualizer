'use client';

import { Loader2, AlertTriangle, Beaker } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  progress?: number;
  error?: string;
  onRetry?: () => void;
}

export function LoadingState({ progress, error, onRetry }: LoadingStateProps) {
  if (error) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 p-8"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">Failed to Load Structure</h3>
          <p className="mb-4 max-w-md text-sm text-muted-foreground">
            {error}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (progress !== undefined) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-6 p-8"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading molecular structure"
      >
        <div className="flex h-16 w-16 items-center justify-center">
          <Beaker className="h-12 w-12 animate-pulse text-primary" />
        </div>
        <div className="w-full max-w-xs space-y-2">
          <p className="text-center text-sm font-medium">
            Loading Structure...
          </p>
          <Progress value={progress} className="h-2" />
          <p className="text-center text-xs text-muted-foreground">
            {progress.toFixed(0)}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-sm font-medium">Loading Structure...</p>
        <p className="text-xs text-muted-foreground">
          Preparing the viewer
        </p>
      </div>
    </div>
  );
}

// Skeleton loader for initial page load
export function ViewerSkeleton() {
  return (
    <div className="flex h-screen" aria-hidden="true">
      {/* Canvas skeleton */}
      <div className="flex-1 animate-pulse bg-muted" />

      {/* Controls skeleton */}
      <div className="w-[30%] border-l bg-background p-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>

          {/* Control groups */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}

          {/* Toggles */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state for when no structure is loaded
export function EmptyState() {
  const exampleStructures = [
    { id: '1crn', name: 'Crambin', description: 'Small protein' },
    { id: '1hho', name: 'Hemoglobin', description: 'Oxygen transport' },
    { id: '2hbs', name: 'Sickle Cell Hemoglobin', description: 'Disease variant' },
    { id: '1ubq', name: 'Ubiquitin', description: 'Protein tagging' },
  ];

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center"
      role="status"
      aria-label="No structure loaded"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Beaker className="h-10 w-10 text-muted-foreground" />
      </div>

      <div>
        <h3 className="mb-2 text-xl font-semibold">Welcome to LAB Visualizer</h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          Enter a PDB ID or select an example structure to get started
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <p className="text-sm font-medium text-left">Example Structures:</p>
        <div className="grid gap-2">
          {exampleStructures.map((structure) => (
            <Button
              key={structure.id}
              variant="outline"
              className="justify-start text-left h-auto py-3"
              onClick={() => {
                // Load example structure
                console.log('Load:', structure.id);
              }}
            >
              <div className="flex-1">
                <p className="font-mono font-medium">{structure.id.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">
                  {structure.name} - {structure.description}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
