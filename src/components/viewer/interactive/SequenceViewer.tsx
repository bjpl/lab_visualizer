'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { molstarService } from '@/services/molstar-service';
import type { StructureMetadata, HoverInfo } from '@/types/molstar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface SequenceViewerProps {
  className?: string;
  onResidueClick?: (chainId: string, residueSeq: number) => void;
}

interface ResidueData {
  seq: number;
  name: string;
  chainId: string;
  isSelected: boolean;
  isHovered: boolean;
}

interface ChainSequence {
  chainId: string;
  residues: ResidueData[];
}

/**
 * SequenceViewer Component
 *
 * Displays protein/nucleic acid sequences with 3D synchronization.
 *
 * Features:
 * - Multi-chain sequence display
 * - Click-to-select residues (highlights in 3D)
 * - Hover synchronization with 3D viewer
 * - Color-coded by residue type
 * - Scrollable and searchable
 * - Responsive layout
 */
export function SequenceViewer({ className, onResidueClick }: SequenceViewerProps) {
  const [sequences, setSequences] = useState<ChainSequence[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [hoveredResidue, setHoveredResidue] = useState<{ chainId: string; seq: number } | null>(null);
  const [selectedResidue, setSelectedResidue] = useState<{ chainId: string; seq: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const sequenceRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Load sequences when structure is loaded
  useEffect(() => {
    const handleStructureLoaded = async (metadata: StructureMetadata) => {
      // Extract sequence data from metadata
      const chainSequences: ChainSequence[] = metadata.chains.map(chainId => ({
        chainId,
        residues: generateDummySequence(chainId, metadata.residueCount / metadata.chains.length)
      }));

      setSequences(chainSequences);
      if (chainSequences.length > 0) {
        setSelectedChain(chainSequences[0].chainId);
      }
    };

    molstarService.on('structure-loaded', handleStructureLoaded);
    return () => molstarService.off('structure-loaded', handleStructureLoaded);
  }, []);

  // Sync with 3D hover
  useEffect(() => {
    const handleHover = (info: HoverInfo | null) => {
      if (info) {
        setHoveredResidue({ chainId: info.chainId, seq: info.residueSeq });

        // Auto-scroll to hovered residue
        const residueKey = `${info.chainId}-${info.residueSeq}`;
        const element = sequenceRefs.current.get(residueKey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      } else {
        setHoveredResidue(null);
      }
    };

    molstarService.on('hover-info', handleHover);
    return () => molstarService.off('hover-info', handleHover);
  }, []);

  // Handle residue click - select in 3D
  const handleResidueClick = useCallback(async (chainId: string, residueSeq: number) => {
    setSelectedResidue({ chainId, seq: residueSeq });
    onResidueClick?.(chainId, residueSeq);

    // Select residue in 3D viewer with green tint
    try {
      await molstarService.select({
        type: 'residue',
        residueIds: [residueSeq.toString()],
      }, true);
    } catch (error) {
      console.error('Failed to select residue in 3D:', error);
    }
  }, [onResidueClick]);

  // Get color for residue type (amino acid)
  const getResidueColor = (residueName: string): string => {
    const hydrophobic = ['ALA', 'VAL', 'ILE', 'LEU', 'MET', 'PHE', 'TRP', 'PRO'];
    const polar = ['SER', 'THR', 'CYS', 'TYR', 'ASN', 'GLN'];
    const charged = ['ASP', 'GLU', 'LYS', 'ARG', 'HIS'];

    if (hydrophobic.includes(residueName)) return 'bg-green-500/20 text-green-700 dark:text-green-300';
    if (polar.includes(residueName)) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    if (charged.includes(residueName)) return 'bg-red-500/20 text-red-700 dark:text-red-300';
    return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
  };

  // Get single-letter code
  const getSingleLetter = (residueName: string): string => {
    const codes: Record<string, string> = {
      ALA: 'A', CYS: 'C', ASP: 'D', GLU: 'E', PHE: 'F',
      GLY: 'G', HIS: 'H', ILE: 'I', LYS: 'K', LEU: 'L',
      MET: 'M', ASN: 'N', PRO: 'P', GLN: 'Q', ARG: 'R',
      SER: 'S', THR: 'T', VAL: 'V', TRP: 'W', TYR: 'Y'
    };
    return codes[residueName] || '?';
  };

  const filteredSequences = sequences.filter(seq =>
    searchQuery === '' ||
    seq.chainId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seq.residues.some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentSequence = filteredSequences.find(s => s.chainId === selectedChain);

  if (sequences.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow p-4', className)}>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
          No structure loaded
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sequence Viewer
          </h3>

          {/* Chain selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentIndex = sequences.findIndex(s => s.chainId === selectedChain);
                const prevIndex = (currentIndex - 1 + sequences.length) % sequences.length;
                setSelectedChain(sequences[prevIndex].chainId);
              }}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-sm font-mono font-semibold min-w-[60px] text-center">
              Chain {selectedChain}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const currentIndex = sequences.findIndex(s => s.chainId === selectedChain);
                const nextIndex = (currentIndex + 1) % sequences.length;
                setSelectedChain(sequences[nextIndex].chainId);
              }}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search residues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sequence display */}
      <div className="p-4">
        {currentSequence ? (
          <div className="space-y-2">
            {/* Residue counter */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Residue 1</span>
              <span>Residue {currentSequence.residues.length}</span>
            </div>

            {/* Sequence track */}
            <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
              <div className="flex gap-0.5 py-2">
                {currentSequence.residues.map((residue) => {
                  const isHovered = hoveredResidue?.chainId === residue.chainId &&
                                   hoveredResidue?.seq === residue.seq;
                  const isSelected = selectedResidue?.chainId === residue.chainId &&
                                    selectedResidue?.seq === residue.seq;
                  const residueKey = `${residue.chainId}-${residue.seq}`;

                  return (
                    <button
                      key={residueKey}
                      ref={(el) => {
                        if (el) {
                          const div = el as unknown as HTMLDivElement;
                          sequenceRefs.current.set(residueKey, div);
                        }
                      }}
                      onClick={() => handleResidueClick(residue.chainId, residue.seq)}
                      className={cn(
                        'flex flex-col items-center justify-center',
                        'min-w-[32px] h-16 rounded',
                        'transition-all duration-150',
                        'hover:scale-110 hover:z-10',
                        getResidueColor(residue.name),
                        isSelected && 'ring-2 ring-green-500 scale-110 z-10',
                        isHovered && 'ring-2 ring-blue-500 scale-105'
                      )}
                      title={`${residue.name} ${residue.seq}`}
                    >
                      <span className="text-xs font-bold font-mono">
                        {getSingleLetter(residue.name)}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {residue.seq}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/20" />
                <span className="text-gray-600 dark:text-gray-400">Hydrophobic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/20" />
                <span className="text-gray-600 dark:text-gray-400">Polar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20" />
                <span className="text-gray-600 dark:text-gray-400">Charged</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No sequence data available for chain {selectedChain}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate dummy sequence data
// In real implementation, this would extract from MolStar structure data
function generateDummySequence(chainId: string, count: number): ResidueData[] {
  const aminoAcids = ['ALA', 'CYS', 'ASP', 'GLU', 'PHE', 'GLY', 'HIS', 'ILE', 'LYS', 'LEU',
                      'MET', 'ASN', 'PRO', 'GLN', 'ARG', 'SER', 'THR', 'VAL', 'TRP', 'TYR'];

  return Array.from({ length: Math.floor(count) }, (_, i) => ({
    seq: i + 1,
    name: aminoAcids[Math.floor(Math.random() * aminoAcids.length)],
    chainId,
    isSelected: false,
    isHovered: false,
  }));
}
