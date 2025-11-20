'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { molstarService } from '@/services/molstar-service';

interface MolStarViewerProps {
  pdbId?: string;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
  className?: string;
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

  useEffect(() => {
    // Initialize Mol* viewer
    const initViewer = async () => {
      if (!containerRef.current) return;

      try {
        onLoadStart?.();
        setIsLoading(true);

        // Initialize Mol* viewer using the molstarService
        await molstarService.initialize(containerRef.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          viewportShowExpand: true,
          viewportShowSelectionMode: true,
          viewportShowAnimation: false,
        });

        setIsReady(true);
        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('Failed to initialize Mol* viewer:', error);
        setIsLoading(false);
        onError?.('Failed to initialize 3D viewer');
      }
    };

    initViewer();

    return () => {
      // Cleanup Mol* viewer
      molstarService.dispose();
    };
  }, [onLoadStart, onLoadComplete, onError]);

  useEffect(() => {
    if (!pdbId || !isReady) return;

    const loadStructure = async () => {
      try {
        onLoadStart?.();
        setIsLoading(true);

        // Load PDB structure using molstarService
        await molstarService.loadStructureById(pdbId);

        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('Failed to load structure:', error);
        setIsLoading(false);
        onError?.(`Failed to load structure: ${pdbId}`);
      }
    };

    loadStructure();
  }, [pdbId, isReady, onLoadStart, onLoadComplete, onError]);

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full bg-black', className)}
      role="img"
      aria-label={pdbId ? `3D structure of ${pdbId}` : '3D molecular viewer'}
    >
      {/* Mol* will render into this container */}
      {!isReady && (
        <div className="flex h-full items-center justify-center text-white">
          {isLoading ? 'Initializing viewer...' : 'Ready'}
        </div>
      )}
      {isReady && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading structure...</div>
        </div>
      )}
    </div>
  );
}
