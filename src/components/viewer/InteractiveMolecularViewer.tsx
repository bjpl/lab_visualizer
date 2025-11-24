'use client';

import React, { useState } from 'react';
import { MolStarViewer } from './MolStarViewer';
import {
  HoverTooltip,
  MeasurementsPanel,
  HydrogenBondsToggle,
  SequenceViewer
} from './interactive';
import { Button } from '@/components/ui/button';
import { Ruler, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveMolecularViewerProps {
  pdbId?: string;
  className?: string;
  showSequenceViewer?: boolean;
  showControls?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * InteractiveMolecularViewer Component
 *
 * Complete molecular visualization solution with all interactive features:
 * - 3D structure visualization (MolStar)
 * - Hover tooltips with atom information
 * - Distance/angle measurements
 * - Hydrogen bond visualization
 * - Sequence viewer with 3D synchronization
 * - Selection highlighting (green tint)
 *
 * @example
 * ```tsx
 * <InteractiveMolecularViewer
 *   pdbId="1CRN"
 *   showSequenceViewer={true}
 *   showControls={true}
 * />
 * ```
 */
export function InteractiveMolecularViewer({
  pdbId,
  className,
  showSequenceViewer = true,
  showControls = true,
  onLoadComplete,
  onError,
}: InteractiveMolecularViewerProps) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [selectedResidue, setSelectedResidue] = useState<{
    chainId: string;
    seq: number;
  } | null>(null);

  const handleResidueClick = (chainId: string, residueSeq: number) => {
    setSelectedResidue({ chainId, seq: residueSeq });
    console.log(`[InteractiveMolecularViewer] Selected residue ${chainId}:${residueSeq}`);
  };

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Main 3D Viewer Section */}
      <div className="relative flex-1 min-h-0">
        {/* 3D Viewer */}
        <MolStarViewer
          pdbId={pdbId}
          onLoadComplete={onLoadComplete}
          onError={onError}
          className="w-full h-full"
        />

        {/* Hover Tooltip (always visible when hovering) */}
        <HoverTooltip position="bottom-right" showAtomInfo={true} />

        {/* Control Panel (left side) */}
        {showControls && (
          <div className="absolute top-4 left-4 space-y-2 z-20">
            {/* Hydrogen Bonds Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
              <HydrogenBondsToggle
                onToggle={(visible) => {
                  console.log(`[InteractiveMolecularViewer] Hydrogen bonds: ${visible}`);
                }}
              />
            </div>

            {/* Measurements Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
              <Button
                variant={showMeasurements ? 'default' : 'outline'}
                onClick={() => setShowMeasurements(!showMeasurements)}
                className="w-full justify-start"
              >
                <Ruler className="w-4 h-4 mr-2" />
                {showMeasurements ? 'Hide' : 'Show'} Measurements
              </Button>
            </div>

            {/* Selection Info */}
            {selectedResidue && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Selected
                </div>
                <div className="text-sm font-mono text-blue-700 dark:text-blue-300">
                  {selectedResidue.chainId}:{selectedResidue.seq}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResidue(null)}
                  className="mt-2 h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Measurements Panel (right side) */}
        {showMeasurements && (
          <MeasurementsPanel
            className="absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-hidden z-20"
            onClose={() => setShowMeasurements(false)}
          />
        )}

        {/* Structure Info Badge (bottom left) */}
        {pdbId && (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
            <div className="text-xs text-gray-400">PDB ID</div>
            <div className="text-sm font-mono font-bold text-white">{pdbId}</div>
          </div>
        )}
      </div>

      {/* Sequence Viewer Section (bottom) */}
      {showSequenceViewer && (
        <div className="h-64 border-t border-gray-200 dark:border-gray-700">
          <SequenceViewer
            onResidueClick={handleResidueClick}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
}

// Export for convenience
export default InteractiveMolecularViewer;
