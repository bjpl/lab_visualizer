'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    // Initialize Mol* viewer
    const initViewer = async () => {
      if (!containerRef.current) return;

      try {
        onLoadStart?.();

        // TODO: Initialize Mol* viewer instance
        // This will be implemented in the integration phase
        // const viewer = await createPluginUI(containerRef.current, {
        //   ...DefaultPluginUISpec(),
        //   layout: {
        //     initial: {
        //       isExpanded: false,
        //       showControls: false
        //     }
        //   }
        // });

        setIsReady(true);
        onLoadComplete?.();
      } catch (error) {
        console.error('Failed to initialize Mol* viewer:', error);
        onError?.('Failed to initialize 3D viewer');
      }
    };

    initViewer();

    return () => {
      // Cleanup Mol* viewer
    };
  }, []);

  useEffect(() => {
    if (!pdbId || !isReady) return;

    const loadStructure = async () => {
      try {
        onLoadStart?.();

        // TODO: Load PDB structure
        // await viewer.loadStructureFromUrl(
        //   `https://files.rcsb.org/download/${pdbId}.cif`,
        //   'mmcif'
        // );

        onLoadComplete?.();
      } catch (error) {
        console.error('Failed to load structure:', error);
        onError?.(`Failed to load structure: ${pdbId}`);
      }
    };

    loadStructure();
  }, [pdbId, isReady]);

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
          Initializing viewer...
        </div>
      )}
    </div>
  );
}
