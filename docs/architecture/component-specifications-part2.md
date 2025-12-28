# Interactive Features - Component Specifications (Part 2)

## 3. SequenceViewer Component

### Purpose
Display protein/DNA/RNA sequence synchronized with 3D structure, enabling bidirectional selection and highlighting between sequence and structure views.

### Component Interface

```typescript
/**
 * SequenceViewer Component
 *
 * Displays molecular sequence with synchronized 3D structure highlighting.
 * Supports protein, DNA, and RNA sequences with secondary structure annotations.
 */

export type SequenceType = 'protein' | 'dna' | 'rna';
export type SecondaryStructureType = 'helix' | 'sheet' | 'turn' | 'coil';

export interface SequenceResidue {
  /** Residue sequence number */
  sequenceNumber: number;
  /** Three-letter code (ALA, GLY, etc.) */
  name: string;
  /** One-letter code (A, G, etc.) */
  code: string;
  /** Chain identifier */
  chainId: string;
  /** Secondary structure assignment */
  secondaryStructure?: SecondaryStructureType;
  /** Conservation score (0-1, if available) */
  conservation?: number;
  /** Is this residue modified? */
  isModified?: boolean;
  /** Custom properties */
  properties?: Record<string, any>;
}

export interface SequenceChain {
  /** Chain identifier */
  chainId: string;
  /** Chain description */
  description?: string;
  /** Sequence type */
  type: SequenceType;
  /** Residues in order */
  residues: SequenceResidue[];
  /** Total length */
  length: number;
}

export interface SequenceSelection {
  /** Chain ID */
  chainId: string;
  /** Start residue index (0-based) */
  startIndex: number;
  /** End residue index (inclusive) */
  endIndex: number;
  /** Selection color */
  color?: string;
}

export interface SequenceViewerProps {
  /** Chains to display */
  chains: SequenceChain[];
  /** Currently selected residues */
  selectedResidues?: SequenceSelection[];
  /** Currently hovered residue */
  hoveredResidue?: { chainId: string; index: number } | null;
  /** Callback when residue is clicked */
  onResidueClick?: (residue: SequenceResidue) => void;
  /** Callback when residue is hovered */
  onResidueHover?: (residue: SequenceResidue | null) => void;
  /** Callback when selection changes */
  onSelectionChange?: (selection: SequenceSelection) => void;
  /** Show secondary structure annotations */
  showSecondaryStructure?: boolean;
  /** Show conservation scores */
  showConservation?: boolean;
  /** Residues per line */
  residuesPerLine?: number;
  /** Enable multi-select mode */
  multiSelect?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Enable virtual scrolling for large sequences */
  virtualScroll?: boolean;
  /** Callback for exporting sequence */
  onExport?: (format: 'fasta' | 'json') => void;
}
```

### Component Structure

```typescript
/**
 * SequenceViewer.tsx
 */
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function SequenceViewer({
  chains,
  selectedResidues = [],
  hoveredResidue,
  onResidueClick,
  onResidueHover,
  onSelectionChange,
  showSecondaryStructure = true,
  showConservation = false,
  residuesPerLine = 50,
  multiSelect = false,
  className,
  virtualScroll = true,
  onExport,
}: SequenceViewerProps) {
  const [expandedChains, setExpandedChains] = useState<Set<string>>(
    new Set(chains.map((c) => c.chainId))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter chains by search query
  const filteredChains = useMemo(() => {
    if (!searchQuery) return chains;

    return chains.filter((chain) =>
      chain.residues.some((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [chains, searchQuery]);

  const toggleChain = useCallback((chainId: string) => {
    setExpandedChains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chainId)) {
        newSet.delete(chainId);
      } else {
        newSet.add(chainId);
      }
      return newSet;
    });
  }, []);

  const handleExport = useCallback(
    (format: 'fasta' | 'json') => {
      if (format === 'fasta') {
        const fasta = chains
          .map((chain) => {
            const header = `>${chain.chainId} ${chain.description || ''}`;
            const sequence = chain.residues.map((r) => r.code).join('');
            return `${header}\n${sequence}`;
          })
          .join('\n\n');

        const blob = new Blob([fasta], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sequence-${Date.now()}.fasta`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(chains, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sequence-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      onExport?.(format);
    },
    [chains, onExport]
  );

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sequence Viewer</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{chains.length} chains</Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search residues..."
              className="w-full pl-8 pr-3 py-2 text-sm border rounded-md"
            />
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setFontSize((s) => Math.min(s + 1, 20))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setFontSize((s) => Math.max(s - 1, 8))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleExport('fasta')}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Legend */}
        {showSecondaryStructure && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-purple-500 rounded" />
              <span>Helix</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-yellow-500 rounded" />
              <span>Sheet</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-blue-500 rounded" />
              <span>Turn</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-gray-400 rounded" />
              <span>Coil</span>
            </div>
          </div>
        )}
      </div>

      {/* Sequence Display */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 space-y-6">
          {filteredChains.map((chain) => (
            <ChainSequence
              key={chain.chainId}
              chain={chain}
              isExpanded={expandedChains.has(chain.chainId)}
              onToggleExpand={() => toggleChain(chain.chainId)}
              selectedResidues={selectedResidues.filter(
                (s) => s.chainId === chain.chainId
              )}
              hoveredResidue={
                hoveredResidue?.chainId === chain.chainId
                  ? hoveredResidue.index
                  : null
              }
              onResidueClick={onResidueClick}
              onResidueHover={onResidueHover}
              showSecondaryStructure={showSecondaryStructure}
              showConservation={showConservation}
              residuesPerLine={residuesPerLine}
              fontSize={fontSize}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

interface ChainSequenceProps {
  chain: SequenceChain;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedResidues: SequenceSelection[];
  hoveredResidue: number | null;
  onResidueClick?: (residue: SequenceResidue) => void;
  onResidueHover?: (residue: SequenceResidue | null) => void;
  showSecondaryStructure: boolean;
  showConservation: boolean;
  residuesPerLine: number;
  fontSize: number;
}

function ChainSequence({
  chain,
  isExpanded,
  onToggleExpand,
  selectedResidues,
  hoveredResidue,
  onResidueClick,
  onResidueHover,
  showSecondaryStructure,
  showConservation,
  residuesPerLine,
  fontSize,
}: ChainSequenceProps) {
  // Split sequence into lines
  const lines = useMemo(() => {
    const result: SequenceResidue[][] = [];
    for (let i = 0; i < chain.residues.length; i += residuesPerLine) {
      result.push(chain.residues.slice(i, i + residuesPerLine));
    }
    return result;
  }, [chain.residues, residuesPerLine]);

  const getResidueStyle = useCallback(
    (residue: SequenceResidue, index: number): string => {
      const isSelected = selectedResidues.some(
        (s) => index >= s.startIndex && index <= s.endIndex
      );
      const isHovered = hoveredResidue === index;

      let bgColor = 'bg-transparent';

      // Secondary structure coloring
      if (showSecondaryStructure && residue.secondaryStructure) {
        switch (residue.secondaryStructure) {
          case 'helix':
            bgColor = 'bg-purple-100 dark:bg-purple-900/30';
            break;
          case 'sheet':
            bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
            break;
          case 'turn':
            bgColor = 'bg-blue-100 dark:bg-blue-900/30';
            break;
          case 'coil':
            bgColor = 'bg-gray-100 dark:bg-gray-800';
            break;
        }
      }

      if (isSelected) {
        bgColor = 'bg-primary/20 ring-2 ring-primary';
      }

      if (isHovered) {
        bgColor = 'bg-primary/40 ring-2 ring-primary';
      }

      return cn(
        'inline-flex items-center justify-center w-[1.2em] h-[1.2em] rounded cursor-pointer transition-colors font-mono',
        bgColor,
        isHovered && 'scale-110',
        residue.isModified && 'text-red-600 font-bold'
      );
    },
    [selectedResidues, hoveredResidue, showSecondaryStructure]
  );

  return (
    <div className="space-y-2">
      {/* Chain Header */}
      <Button
        variant="ghost"
        onClick={onToggleExpand}
        className="w-full justify-between p-2"
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline">Chain {chain.chainId}</Badge>
          <span className="text-sm text-muted-foreground">
            {chain.description || chain.type}
          </span>
          <Badge variant="secondary" className="ml-2">
            {chain.length} residues
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Sequence Lines */}
      {isExpanded && (
        <div className="space-y-3 pl-4">
          {lines.map((lineResidues, lineIndex) => {
            const startNum = lineIndex * residuesPerLine + 1;

            return (
              <div key={lineIndex} className="flex items-start gap-3 font-mono">
                {/* Line number */}
                <div
                  className="text-xs text-muted-foreground w-12 text-right pt-1"
                  style={{ fontSize: `${fontSize - 2}px` }}
                >
                  {startNum}
                </div>

                {/* Sequence */}
                <div className="flex-1">
                  {/* Secondary structure track */}
                  {showSecondaryStructure && (
                    <div className="flex mb-1" style={{ fontSize: `${fontSize - 4}px` }}>
                      {lineResidues.map((residue, i) => (
                        <div
                          key={i}
                          className="w-[1.2em] text-center text-xs"
                          style={{ fontSize: `${fontSize - 4}px` }}
                        >
                          {residue.secondaryStructure === 'helix'
                            ? 'H'
                            : residue.secondaryStructure === 'sheet'
                            ? 'E'
                            : residue.secondaryStructure === 'turn'
                            ? 'T'
                            : '-'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Residue codes */}
                  <div className="flex" style={{ fontSize: `${fontSize}px` }}>
                    {lineResidues.map((residue, i) => {
                      const globalIndex = lineIndex * residuesPerLine + i;
                      return (
                        <div
                          key={i}
                          className={getResidueStyle(residue, globalIndex)}
                          onClick={() => onResidueClick?.(residue)}
                          onMouseEnter={() => onResidueHover?.(residue)}
                          onMouseLeave={() => onResidueHover?.(null)}
                          title={`${residue.name} ${residue.sequenceNumber}`}
                        >
                          {residue.code}
                        </div>
                      );
                    })}
                  </div>

                  {/* Conservation track */}
                  {showConservation && (
                    <div className="flex mt-1">
                      {lineResidues.map((residue, i) => (
                        <div
                          key={i}
                          className="w-[1.2em] h-1 rounded"
                          style={{
                            backgroundColor: residue.conservation
                              ? `rgba(34, 197, 94, ${residue.conservation})`
                              : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* End line number */}
                <div
                  className="text-xs text-muted-foreground w-12 text-left pt-1"
                  style={{ fontSize: `${fontSize - 2}px` }}
                >
                  {Math.min(
                    startNum + residuesPerLine - 1,
                    chain.residues.length
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### State Management

```typescript
/**
 * useSequenceSync.ts
 * Hook for synchronizing sequence selection with 3D structure
 */

import { useEffect, useCallback, useRef } from 'react';
import { molstarService } from '@/services/molstar-service';

export interface UseSequenceSyncOptions {
  /** Enable synchronization */
  enabled?: boolean;
  /** Highlight color for selected residues */
  highlightColor?: string;
  /** Animation duration for camera movements */
  animationDuration?: number;
}

export function useSequenceSync(options: UseSequenceSyncOptions = {}) {
  const {
    enabled = true,
    highlightColor = '#3b82f6',
    animationDuration = 500,
  } = options;

  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync sequence selection to 3D structure
  const syncToStructure = useCallback(
    async (selection: SequenceSelection) => {
      if (!enabled) return;

      try {
        // Clear previous highlights
        await molstarService.clearSelection();

        // Build residue selection query
        const residueIds = [];
        for (let i = selection.startIndex; i <= selection.endIndex; i++) {
          residueIds.push(i + 1); // 1-based indexing
        }

        // Highlight in 3D
        await molstarService.selectResidues({
          chainId: selection.chainId,
          residueIds,
          color: highlightColor,
        });

        // Focus camera
        await molstarService.focusOnResidues({
          chainId: selection.chainId,
          residueIds,
          animationDuration,
        });
      } catch (error) {
        console.error('[useSequenceSync] Sync to structure failed:', error);
      }
    },
    [enabled, highlightColor, animationDuration]
  );

  // Sync 3D structure selection to sequence
  const syncFromStructure = useCallback(
    async (structureSelection: any): Promise<SequenceSelection | null> => {
      if (!enabled) return null;

      try {
        // Extract residue info from structure selection
        const residueInfo = await molstarService.getSelectionInfo(structureSelection);

        if (residueInfo && residueInfo.residues.length > 0) {
          const minIndex = Math.min(...residueInfo.residues.map((r: any) => r.sequenceNumber - 1));
          const maxIndex = Math.max(...residueInfo.residues.map((r: any) => r.sequenceNumber - 1));

          return {
            chainId: residueInfo.chainId,
            startIndex: minIndex,
            endIndex: maxIndex,
            color: highlightColor,
          };
        }

        return null;
      } catch (error) {
        console.error('[useSequenceSync] Sync from structure failed:', error);
        return null;
      }
    },
    [enabled, highlightColor]
  );

  // Debounced sync to avoid excessive updates
  const debouncedSyncToStructure = useCallback(
    (selection: SequenceSelection) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        syncToStructure(selection);
      }, 100);
    },
    [syncToStructure]
  );

  // Listen to MolStar selection events
  useEffect(() => {
    if (!enabled) return;

    const handleStructureSelection = async (event: any) => {
      const sequenceSelection = await syncFromStructure(event.selection);
      // Emit event for sequence viewer to update
      if (sequenceSelection) {
        window.dispatchEvent(
          new CustomEvent('structure-selection-changed', {
            detail: sequenceSelection,
          })
        );
      }
    };

    molstarService.on('selection-changed', handleStructureSelection);

    return () => {
      molstarService.off('selection-changed', handleStructureSelection);
    };
  }, [enabled, syncFromStructure]);

  return {
    syncToStructure: debouncedSyncToStructure,
    syncFromStructure,
  };
}
```

---

## 4. InteractionsPanel Component

### Purpose
Visualize and toggle non-covalent interactions (hydrogen bonds, salt bridges, hydrophobic contacts) in the 3D structure.

### Component Interface

```typescript
/**
 * InteractionsPanel Component
 *
 * Display and control non-covalent molecular interactions visualization.
 * Computes and renders hydrogen bonds, salt bridges, and hydrophobic contacts.
 */

export type InteractionType = 'hydrogen-bond' | 'salt-bridge' | 'hydrophobic' | 'pi-pi';

export interface Interaction {
  id: string;
  type: InteractionType;
  /** First atom in interaction */
  atom1: {
    serialNumber: number;
    element: string;
    residue: {
      name: string;
      sequenceNumber: number;
      chainId: string;
    };
    position: [number, number, number];
  };
  /** Second atom in interaction */
  atom2: {
    serialNumber: number;
    element: string;
    residue: {
      name: string;
      sequenceNumber: number;
      chainId: string;
    };
    position: [number, number, number];
  };
  /** Distance between atoms (Angstroms) */
  distance: number;
  /** Interaction strength/score (0-1) */
  strength?: number;
  /** Angle for H-bonds (degrees) */
  angle?: number;
  /** Is interaction intra-chain or inter-chain */
  isInterChain: boolean;
}

export interface InteractionThresholds {
  /** Max distance for H-bonds (Angstroms) */
  hydrogenBondDistance: number;
  /** Min angle for H-bonds (degrees) */
  hydrogenBondAngle: number;
  /** Max distance for salt bridges (Angstroms) */
  saltBridgeDistance: number;
  /** Max distance for hydrophobic contacts (Angstroms) */
  hydrophobicDistance: number;
  /** Max distance for pi-pi stacking (Angstroms) */
  piPiDistance: number;
}

export interface InteractionsPanelProps {
  /** Available interactions */
  interactions: Interaction[];
  /** Currently visible interaction types */
  visibleTypes: Set<InteractionType>;
  /** Callback when interaction type visibility changes */
  onToggleType: (type: InteractionType) => void;
  /** Callback when specific interaction is focused */
  onFocusInteraction: (interaction: Interaction) => void;
  /** Callback when thresholds change */
  onThresholdsChange?: (thresholds: InteractionThresholds) => void;
  /** Current thresholds */
  thresholds?: InteractionThresholds;
  /** Show interaction labels in 3D */
  showLabels?: boolean;
  /** Callback when label visibility changes */
  onToggleLabels?: (show: boolean) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Custom CSS class */
  className?: string;
}
```

### Component Structure

```typescript
/**
 * InteractionsPanel.tsx
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Zap,
  Magnet,
  Droplet,
  Disc,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
} from 'lucide-react';

const INTERACTION_CONFIG: Record<
  InteractionType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  'hydrogen-bond': {
    icon: <Zap className="w-4 h-4" />,
    label: 'Hydrogen Bonds',
    color: 'text-blue-500',
  },
  'salt-bridge': {
    icon: <Magnet className="w-4 h-4" />,
    label: 'Salt Bridges',
    color: 'text-red-500',
  },
  hydrophobic: {
    icon: <Droplet className="w-4 h-4" />,
    label: 'Hydrophobic',
    color: 'text-gray-500',
  },
  'pi-pi': {
    icon: <Disc className="w-4 h-4" />,
    label: 'π-π Stacking',
    color: 'text-purple-500',
  },
};

export function InteractionsPanel({
  interactions,
  visibleTypes,
  onToggleType,
  onFocusInteraction,
  onThresholdsChange,
  thresholds,
  showLabels = false,
  onToggleLabels,
  isLoading = false,
  error = null,
  className,
}: InteractionsPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [filterIntraChain, setFilterIntraChain] = useState(false);

  // Group interactions by type
  const groupedInteractions = useMemo(() => {
    const filtered = filterIntraChain
      ? interactions.filter((i) => !i.isInterChain)
      : interactions;

    return {
      'hydrogen-bond': filtered.filter((i) => i.type === 'hydrogen-bond'),
      'salt-bridge': filtered.filter((i) => i.type === 'salt-bridge'),
      hydrophobic: filtered.filter((i) => i.type === 'hydrophobic'),
      'pi-pi': filtered.filter((i) => i.type === 'pi-pi'),
    };
  }, [interactions, filterIntraChain]);

  const totalVisible = useMemo(() => {
    return Object.entries(groupedInteractions).reduce((sum, [type, items]) => {
      return sum + (visibleTypes.has(type as InteractionType) ? items.length : 0);
    }, 0);
  }, [groupedInteractions, visibleTypes]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(interactions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interactions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [interactions]);

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Interactions</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {totalVisible}/{interactions.length}
            </Badge>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Type Toggles */}
        <div className="space-y-2">
          {(Object.entries(INTERACTION_CONFIG) as [InteractionType, typeof INTERACTION_CONFIG[InteractionType]][]).map(
            ([type, config]) => {
              const count = groupedInteractions[type].length;
              const isVisible = visibleTypes.has(type);

              return (
                <div
                  key={type}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => onToggleType(type)}
                >
                  <div className="flex items-center gap-2">
                    <div className={config.color}>{config.icon}</div>
                    <span className="text-sm">{config.label}</span>
                    <Badge variant="outline" className="ml-2">
                      {count}
                    </Badge>
                  </div>
                  <Switch checked={isVisible} />
                </div>
              );
            }
          )}
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              checked={filterIntraChain}
              onCheckedChange={setFilterIntraChain}
            />
            <span>Intra-chain only</span>
          </div>
          {onToggleLabels && (
            <div className="flex items-center gap-2">
              <Switch checked={showLabels} onCheckedChange={onToggleLabels} />
              <span>Show labels</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={interactions.length === 0}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && thresholds && onThresholdsChange && (
        <div className="p-4 border-b bg-accent/50 space-y-4">
          <h4 className="text-sm font-medium">Detection Thresholds</h4>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">
                H-Bond Distance (Å): {thresholds.hydrogenBondDistance.toFixed(1)}
              </label>
              <Slider
                value={[thresholds.hydrogenBondDistance]}
                onValueChange={([val]) =>
                  onThresholdsChange({ ...thresholds, hydrogenBondDistance: val })
                }
                min={2.0}
                max={4.0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                H-Bond Angle (°): {thresholds.hydrogenBondAngle.toFixed(0)}
              </label>
              <Slider
                value={[thresholds.hydrogenBondAngle]}
                onValueChange={([val]) =>
                  onThresholdsChange({ ...thresholds, hydrogenBondAngle: val })
                }
                min={90}
                max={180}
                step={5}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">
                Salt Bridge Distance (Å): {thresholds.saltBridgeDistance.toFixed(1)}
              </label>
              <Slider
                value={[thresholds.saltBridgeDistance]}
                onValueChange={([val]) =>
                  onThresholdsChange({ ...thresholds, saltBridgeDistance: val })
                }
                min={2.0}
                max={6.0}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Interactions List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4 text-center text-red-500">
            {error}
          </div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
            <Zap className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No interactions detected</p>
            <p className="text-xs mt-2">Try adjusting detection thresholds</p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {(Object.entries(groupedInteractions) as [InteractionType, Interaction[]][]).map(
              ([type, items]) => {
                if (!visibleTypes.has(type) || items.length === 0) return null;

                const config = INTERACTION_CONFIG[type];

                return (
                  <div key={type}>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <div className={config.color}>{config.icon}</div>
                      {config.label}
                    </h4>
                    <div className="space-y-2">
                      {items.map((interaction) => (
                        <InteractionItem
                          key={interaction.id}
                          interaction={interaction}
                          config={config}
                          onFocus={() => onFocusInteraction(interaction)}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

interface InteractionItemProps {
  interaction: Interaction;
  config: { icon: React.ReactNode; label: string; color: string };
  onFocus: () => void;
}

function InteractionItem({ interaction, config, onFocus }: InteractionItemProps) {
  const { atom1, atom2, distance, angle, strength, isInterChain } = interaction;

  return (
    <Card
      className="p-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={onFocus}
    >
      <div className="space-y-2">
        {/* Atom 1 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono">
            {atom1.residue.name}{atom1.residue.sequenceNumber}:{atom1.element}
          </span>
          <span className="text-muted-foreground">Chain {atom1.residue.chainId}</span>
        </div>

        {/* Connection */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={cn('flex-1 h-px', config.color.replace('text-', 'bg-'))} />
          <span>{distance.toFixed(2)} Å</span>
          <div className={cn('flex-1 h-px', config.color.replace('text-', 'bg-'))} />
        </div>

        {/* Atom 2 */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono">
            {atom2.residue.name}{atom2.residue.sequenceNumber}:{atom2.element}
          </span>
          <span className="text-muted-foreground">Chain {atom2.residue.chainId}</span>
        </div>

        {/* Additional Info */}
        <div className="flex items-center gap-2 mt-2">
          {isInterChain && (
            <Badge variant="outline" className="text-xs">
              Inter-chain
            </Badge>
          )}
          {angle !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {angle.toFixed(1)}°
            </Badge>
          )}
          {strength !== undefined && (
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: `rgba(34, 197, 94, ${strength})`,
              }}
            >
              Strength: {(strength * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

**Document Status**: Part 2 of 4 Complete
**Next**: [Part 3 - Enhanced MolstarService API →](./component-specifications-part3.md)
