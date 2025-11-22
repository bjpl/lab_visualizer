'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface MolStarViewerProps {
  pdbId?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

// Lazy-load molstar service to avoid SSR issues
let molstarServicePromise: Promise<typeof import('@/services/molstar-service')> | null = null;

function getMolstarService() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MolStar can only run in browser'));
  }
  if (!molstarServicePromise) {
    molstarServicePromise = import('@/services/molstar-service');
  }
  return molstarServicePromise;
}

export function MolStarViewer({
  pdbId,
  onLoadStart,
  onLoadComplete,
  onError,
  className,
}: MolStarViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Track initialization state to prevent double-init in strict mode
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const initIdRef = useRef(0); // Track which initialization cycle we're in

  // Memoize error handler to avoid effect re-runs
  const handleError = useCallback((error: string) => {
    if (mountedRef.current) {
      setInitError(error);
      onError?.(error);
    }
  }, [onError]);

  // Initialize Mol* viewer
  useEffect(() => {
    // Reset mounted flag on mount and increment init ID
    mountedRef.current = true;
    initIdRef.current += 1;
    const currentInitId = initIdRef.current;

    const initViewer = async () => {
      if (!containerRef.current) {
        console.warn('[MolStarViewer] No container ref');
        return;
      }

      // Prevent double initialization
      if (initializingRef.current) {
        console.info('[MolStarViewer] Already initializing, skipping');
        return;
      }

      initializingRef.current = true;

      try {
        onLoadStart?.();
        setIsLoading(true);
        setInitError(null);

        // Dynamically import molstar service to avoid SSR issues
        const { molstarService } = await getMolstarService();

        // Check if still mounted and same init cycle after async import
        if (!mountedRef.current || currentInitId !== initIdRef.current) {
          console.info('[MolStarViewer] Stale init cycle, aborting');
          initializingRef.current = false;
          return;
        }

        // Initialize Mol* viewer using the molstarService
        await molstarService.initialize(containerRef.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          viewportShowExpand: true,
          viewportShowSelectionMode: true,
          viewportShowAnimation: false,
        });

        // Check if still mounted and same init cycle after initialization
        if (!mountedRef.current || currentInitId !== initIdRef.current) {
          console.info('[MolStarViewer] Stale init cycle after init, disposing');
          molstarService.dispose();
          initializingRef.current = false;
          return;
        }

        setIsReady(true);
        setIsLoading(false);
        onLoadComplete?.();
        console.info('[MolStarViewer] Initialization complete');
      } catch (error) {
        console.error('[MolStarViewer] Failed to initialize:', error);
        if (mountedRef.current && currentInitId === initIdRef.current) {
          setIsLoading(false);
          handleError('Failed to initialize 3D viewer');
        }
      } finally {
        initializingRef.current = false;
      }
    };

    // Small delay to let StrictMode settle
    const timeoutId = setTimeout(initViewer, 50);

    return () => {
      // Mark as unmounted first
      mountedRef.current = false;
      clearTimeout(timeoutId);

      // Only dispose if this was the active init cycle
      // Use sync check to avoid race with next mount
    };
  }, []); // Empty deps - only run once on mount

  // Load structure when pdbId changes and viewer is ready
  useEffect(() => {
    if (!pdbId || !isReady) return;

    let cancelled = false;

    const loadStructure = async () => {
      try {
        onLoadStart?.();
        setIsLoading(true);

        const { molstarService } = await getMolstarService();

        if (cancelled) return;

        // Load PDB structure using molstarService
        await molstarService.loadStructureById(pdbId);

        if (cancelled) return;

        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('[MolStarViewer] Failed to load structure:', error);
        if (!cancelled) {
          setIsLoading(false);
          handleError(`Failed to load structure: ${pdbId}`);
        }
      }
    };

    loadStructure();

    return () => {
      cancelled = true;
    };
  }, [pdbId, isReady, onLoadStart, onLoadComplete, handleError]);

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full bg-black', className)}
      role="img"
      aria-label={pdbId ? `3D structure of ${pdbId}` : '3D molecular viewer'}
    >
      {/* Mol* will render into this container */}
      {!isReady && !initError && (
        <div className="flex h-full items-center justify-center text-white">
          {isLoading ? 'Initializing viewer...' : 'Ready'}
        </div>
      )}
      {isReady && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading structure...</div>
        </div>
      )}
      {initError && (
        <div className="flex h-full items-center justify-center text-red-400">
          <div className="text-center">
            <div className="mb-2">{initError}</div>
            <button
              onClick={() => {
                setInitError(null);
                setIsReady(false);
                // Trigger re-initialization by remounting
                window.location.reload();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
