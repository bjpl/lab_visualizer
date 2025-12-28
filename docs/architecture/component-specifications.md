# Interactive Features - Component Specifications

## 1. HoverTooltip Component

### Purpose
Display real-time molecular information when the user hovers over atoms, residues, or chains in the 3D viewer.

### Component Interface

```typescript
/**
 * HoverTooltip Component
 *
 * Displays contextual information about molecular elements on hover.
 * Optimized for performance with throttled updates and position caching.
 */

import { CSSProperties } from 'react';

export interface AtomInfo {
  /** Atom serial number from PDB */
  serialNumber: number;
  /** Element symbol (C, N, O, etc.) */
  element: string;
  /** Atom name (CA, CB, etc.) */
  name: string;
  /** 3D coordinates [x, y, z] in Angstroms */
  coordinates: [number, number, number];
  /** B-factor (temperature factor) */
  bFactor?: number;
  /** Occupancy value */
  occupancy?: number;
}

export interface ResidueInfo {
  /** Three-letter residue code (ALA, GLY, etc.) */
  name: string;
  /** One-letter code (A, G, etc.) */
  code: string;
  /** Residue sequence number */
  sequenceNumber: number;
  /** Chain identifier */
  chainId: string;
  /** Secondary structure type */
  secondaryStructure?: 'helix' | 'sheet' | 'turn' | 'coil';
  /** Number of atoms in residue */
  atomCount: number;
}

export interface ChainInfo {
  /** Chain identifier (A, B, C, etc.) */
  chainId: string;
  /** Chain description/name */
  description?: string;
  /** Number of residues in chain */
  residueCount: number;
  /** Molecule type (protein, DNA, RNA, etc.) */
  moleculeType: 'protein' | 'dna' | 'rna' | 'other';
}

export interface HoverData {
  /** Type of hovered element */
  type: 'atom' | 'residue' | 'chain' | 'none';
  /** Atom-level information */
  atom?: AtomInfo;
  /** Residue-level information */
  residue?: ResidueInfo;
  /** Chain-level information */
  chain?: ChainInfo;
  /** Screen coordinates for tooltip positioning */
  screenPosition: { x: number; y: number };
  /** Timestamp of hover event (for throttling) */
  timestamp: number;
}

export interface HoverTooltipProps {
  /** Current hover data from MolStar */
  hoverData: HoverData | null;
  /** Enable/disable tooltip display */
  enabled?: boolean;
  /** Custom CSS class for styling */
  className?: string;
  /** Tooltip theme variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Maximum width of tooltip in pixels */
  maxWidth?: number;
  /** Offset from cursor in pixels */
  offset?: { x: number; y: number };
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Custom render function for tooltip content */
  renderContent?: (data: HoverData) => React.ReactNode;
  /** Callback when tooltip is shown */
  onShow?: (data: HoverData) => void;
  /** Callback when tooltip is hidden */
  onHide?: () => void;
}
```

### Component Structure

```typescript
/**
 * HoverTooltip.tsx
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function HoverTooltip({
  hoverData,
  enabled = true,
  className,
  variant = 'default',
  maxWidth = 320,
  offset = { x: 10, y: 10 },
  animationDuration = 150,
  renderContent,
  onShow,
  onHide,
}: HoverTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cachedData, setCachedData] = useState<HoverData | null>(null);

  // Throttle position updates for performance
  useEffect(() => {
    if (!enabled || !hoverData) {
      setIsVisible(false);
      onHide?.();
      return;
    }

    // Calculate optimal position (prevent overflow)
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    let x = hoverData.screenPosition.x + offset.x;
    let y = hoverData.screenPosition.y + offset.y;

    // Adjust if tooltip would overflow
    if (x + maxWidth > screenWidth) {
      x = hoverData.screenPosition.x - maxWidth - offset.x;
    }
    if (y + 200 > screenHeight) { // Estimated tooltip height
      y = hoverData.screenPosition.y - 200 - offset.y;
    }

    setPosition({ x, y });
    setCachedData(hoverData);
    setIsVisible(true);
    onShow?.(hoverData);
  }, [hoverData, enabled, offset, maxWidth, onShow, onHide]);

  // Memoize tooltip content for performance
  const content = useMemo(() => {
    if (!cachedData || cachedData.type === 'none') return null;

    if (renderContent) {
      return renderContent(cachedData);
    }

    return (
      <div className="space-y-2">
        {/* Atom Information */}
        {cachedData.atom && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {cachedData.atom.element}
              </Badge>
              <span className="text-sm font-medium">{cachedData.atom.name}</span>
              <span className="text-xs text-muted-foreground">
                #{cachedData.atom.serialNumber}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>
                Position: ({cachedData.atom.coordinates[0].toFixed(2)},
                {cachedData.atom.coordinates[1].toFixed(2)},
                {cachedData.atom.coordinates[2].toFixed(2)})
              </div>
              {cachedData.atom.bFactor !== undefined && (
                <div>B-factor: {cachedData.atom.bFactor.toFixed(2)}</div>
              )}
            </div>
          </div>
        )}

        {/* Residue Information */}
        {cachedData.residue && (
          <div className="space-y-1 border-t pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {cachedData.residue.name} ({cachedData.residue.code})
              </Badge>
              <span className="text-sm">
                Residue {cachedData.residue.sequenceNumber}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>Chain: {cachedData.residue.chainId}</div>
              {cachedData.residue.secondaryStructure && (
                <div className="capitalize">
                  Structure: {cachedData.residue.secondaryStructure}
                </div>
              )}
              <div>{cachedData.residue.atomCount} atoms</div>
            </div>
          </div>
        )}

        {/* Chain Information */}
        {cachedData.chain && variant === 'detailed' && (
          <div className="space-y-1 border-t pt-2">
            <div className="flex items-center gap-2">
              <Badge>Chain {cachedData.chain.chainId}</Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {cachedData.chain.moleculeType}
              </span>
            </div>
            {cachedData.chain.description && (
              <div className="text-xs">{cachedData.chain.description}</div>
            )}
            <div className="text-xs text-muted-foreground">
              {cachedData.chain.residueCount} residues
            </div>
          </div>
        )}
      </div>
    );
  }, [cachedData, variant, renderContent]);

  if (!isVisible || !content) return null;

  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    maxWidth: `${maxWidth}px`,
    zIndex: 9999,
    pointerEvents: 'none',
    transition: `opacity ${animationDuration}ms ease-in-out`,
  };

  return (
    <div style={tooltipStyle} className={cn('animate-in fade-in-0 zoom-in-95', className)}>
      <Card className="p-3 shadow-lg border-2">
        {content}
      </Card>
    </div>
  );
}
```

### State Management

```typescript
/**
 * useHoverDetection.ts
 * Custom hook for detecting hover events on MolStar canvas
 */

import { useEffect, useRef, useCallback } from 'react';
import { molstarService } from '@/services/molstar-service';
import { HoverData } from './HoverTooltip';

export interface UseHoverDetectionOptions {
  /** Throttle interval in milliseconds */
  throttleMs?: number;
  /** Enable hover detection */
  enabled?: boolean;
  /** Callback when hover data changes */
  onHoverChange?: (data: HoverData | null) => void;
}

export function useHoverDetection(options: UseHoverDetectionOptions = {}) {
  const { throttleMs = 100, enabled = true, onHoverChange } = options;

  const lastHoverTime = useRef(0);
  const hoverDataRef = useRef<HoverData | null>(null);

  const handleMouseMove = useCallback(async (event: MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastHoverTime.current < throttleMs) return;
    lastHoverTime.current = now;

    try {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Get hover info from MolStar service
      const hoverInfo = await molstarService.getHoverInfo(x, y);

      if (hoverInfo) {
        const hoverData: HoverData = {
          type: hoverInfo.type,
          atom: hoverInfo.atom,
          residue: hoverInfo.residue,
          chain: hoverInfo.chain,
          screenPosition: { x: event.clientX, y: event.clientY },
          timestamp: now,
        };

        hoverDataRef.current = hoverData;
        onHoverChange?.(hoverData);
      } else {
        hoverDataRef.current = null;
        onHoverChange?.(null);
      }
    } catch (error) {
      console.error('[useHoverDetection] Error:', error);
      hoverDataRef.current = null;
      onHoverChange?.(null);
    }
  }, [enabled, throttleMs, onHoverChange]);

  useEffect(() => {
    if (!enabled) return;

    const canvas = document.querySelector('canvas[data-molstar-canvas]');
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove as EventListener);
    canvas.addEventListener('mouseleave', () => {
      hoverDataRef.current = null;
      onHoverChange?.(null);
    });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove as EventListener);
    };
  }, [enabled, handleMouseMove, onHoverChange]);

  return hoverDataRef.current;
}
```

### Integration with MolStarViewer

```typescript
/**
 * Enhanced MolStarViewer with HoverTooltip
 */

import { HoverTooltip } from '@/components/viewer/HoverTooltip';
import { useHoverDetection } from '@/hooks/useHoverDetection';

export function MolStarViewerWithTooltip(props: MolStarViewerProps) {
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [tooltipEnabled, setTooltipEnabled] = useState(true);

  useHoverDetection({
    enabled: tooltipEnabled,
    onHoverChange: setHoverData,
  });

  return (
    <div className="relative w-full h-full">
      <MolStarViewer {...props} />
      <HoverTooltip
        hoverData={hoverData}
        enabled={tooltipEnabled}
        variant="default"
      />
    </div>
  );
}
```

### Styling (Tailwind CSS)

```typescript
// Tailwind classes used:
const tooltipClasses = {
  container: 'fixed z-[9999] pointer-events-none',
  card: 'p-3 shadow-lg border-2 bg-background',
  animation: 'animate-in fade-in-0 zoom-in-95 duration-150',
  badge: {
    element: 'variant-outline font-mono text-xs',
    residue: 'variant-secondary text-xs',
    chain: 'variant-default text-xs',
  },
  text: {
    primary: 'text-sm font-medium',
    secondary: 'text-xs text-muted-foreground',
    coordinates: 'font-mono text-xs',
  },
};
```

### Performance Characteristics

| Metric | Target | Actual (Est.) |
|--------|--------|---------------|
| Hover response | <100ms | ~80ms |
| Memory per tooltip | <1KB | ~0.5KB |
| Re-renders per second | <10 | ~8 |
| Bundle size impact | <5KB | ~4KB |

### Testing Strategy

```typescript
/**
 * HoverTooltip.test.tsx
 */

describe('HoverTooltip', () => {
  it('should render tooltip with atom information', () => {
    const hoverData: HoverData = {
      type: 'atom',
      atom: { /* ... */ },
      screenPosition: { x: 100, y: 100 },
      timestamp: Date.now(),
    };

    render(<HoverTooltip hoverData={hoverData} enabled />);
    expect(screen.getByText(/Position:/)).toBeInTheDocument();
  });

  it('should handle rapid hover changes', async () => {
    const { rerender } = render(<HoverTooltip hoverData={null} enabled />);

    for (let i = 0; i < 100; i++) {
      const newData = createMockHoverData();
      rerender(<HoverTooltip hoverData={newData} enabled />);
      await waitFor(() => expect(screen.getByRole('tooltip')).toBeVisible());
    }

    // Should not cause performance degradation
    expect(performance.now()).toBeLessThan(1000);
  });
});
```

---

## 2. MeasurementsPanel Component

### Purpose
Allow users to create, manage, and visualize distance, angle, and dihedral measurements between atoms in the 3D structure.

### Component Interface

```typescript
/**
 * MeasurementsPanel Component
 *
 * Interactive panel for creating and managing molecular measurements.
 * Supports distance, angle, and dihedral angle calculations.
 */

export type MeasurementType = 'distance' | 'angle' | 'dihedral';
export type MeasurementUnit = 'angstrom' | 'nanometer';
export type AngleUnit = 'degree' | 'radian';

export interface MeasurementAtom {
  /** Atom serial number */
  serialNumber: number;
  /** Element symbol */
  element: string;
  /** Atom name */
  name: string;
  /** 3D coordinates */
  position: [number, number, number];
  /** Residue information */
  residue: {
    name: string;
    sequenceNumber: number;
    chainId: string;
  };
}

export interface DistanceMeasurement {
  id: string;
  type: 'distance';
  atoms: [MeasurementAtom, MeasurementAtom];
  /** Distance value in Angstroms */
  value: number;
  label?: string;
  color?: string;
  visible: boolean;
  createdAt: number;
}

export interface AngleMeasurement {
  id: string;
  type: 'angle';
  atoms: [MeasurementAtom, MeasurementAtom, MeasurementAtom];
  /** Angle value in degrees */
  value: number;
  label?: string;
  color?: string;
  visible: boolean;
  createdAt: number;
}

export interface DihedralMeasurement {
  id: string;
  type: 'dihedral';
  atoms: [MeasurementAtom, MeasurementAtom, MeasurementAtom, MeasurementAtom];
  /** Dihedral angle in degrees (-180 to 180) */
  value: number;
  label?: string;
  color?: string;
  visible: boolean;
  createdAt: number;
}

export type Measurement = DistanceMeasurement | AngleMeasurement | DihedralMeasurement;

export interface MeasurementsPanelProps {
  /** Current list of measurements */
  measurements: Measurement[];
  /** Callback when new measurement is created */
  onCreateMeasurement: (measurement: Measurement) => void;
  /** Callback when measurement is deleted */
  onDeleteMeasurement: (id: string) => void;
  /** Callback when measurement visibility changes */
  onToggleVisibility: (id: string) => void;
  /** Callback when measurement is updated */
  onUpdateMeasurement: (id: string, updates: Partial<Measurement>) => void;
  /** Current measurement mode */
  measurementMode: MeasurementType | null;
  /** Callback to change measurement mode */
  onMeasurementModeChange: (mode: MeasurementType | null) => void;
  /** Display unit preferences */
  units?: {
    distance: MeasurementUnit;
    angle: AngleUnit;
  };
  /** Maximum number of measurements allowed */
  maxMeasurements?: number;
  /** Enable/disable panel */
  enabled?: boolean;
  /** Custom CSS class */
  className?: string;
}
```

### Component Structure

```typescript
/**
 * MeasurementsPanel.tsx
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Ruler,
  Triangle,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Download,
  Info,
} from 'lucide-react';

export function MeasurementsPanel({
  measurements,
  onCreateMeasurement,
  onDeleteMeasurement,
  onToggleVisibility,
  onUpdateMeasurement,
  measurementMode,
  onMeasurementModeChange,
  units = { distance: 'angstrom', angle: 'degree' },
  maxMeasurements = 100,
  enabled = true,
  className,
}: MeasurementsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group measurements by type
  const groupedMeasurements = useMemo(() => {
    return {
      distance: measurements.filter((m) => m.type === 'distance'),
      angle: measurements.filter((m) => m.type === 'angle'),
      dihedral: measurements.filter((m) => m.type === 'dihedral'),
    };
  }, [measurements]);

  const handleModeToggle = useCallback(
    (mode: MeasurementType) => {
      onMeasurementModeChange(measurementMode === mode ? null : mode);
    },
    [measurementMode, onMeasurementModeChange]
  );

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach((id) => onDeleteMeasurement(id));
    setSelectedIds(new Set());
  }, [selectedIds, onDeleteMeasurement]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(measurements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [measurements]);

  const formatValue = useCallback(
    (measurement: Measurement): string => {
      if (measurement.type === 'distance') {
        const value =
          units.distance === 'nanometer' ? measurement.value / 10 : measurement.value;
        const unit = units.distance === 'nanometer' ? 'nm' : 'Å';
        return `${value.toFixed(2)} ${unit}`;
      } else {
        const value =
          units.angle === 'radian' ? (measurement.value * Math.PI) / 180 : measurement.value;
        const unit = units.angle === 'radian' ? 'rad' : '°';
        return `${value.toFixed(2)}${unit}`;
      }
    },
    [units]
  );

  if (!enabled) return null;

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Measurements</h3>
          <Badge variant="secondary">
            {measurements.length}/{maxMeasurements}
          </Badge>
        </div>

        {/* Measurement Mode Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={measurementMode === 'distance' ? 'default' : 'outline'}
            onClick={() => handleModeToggle('distance')}
            disabled={measurements.length >= maxMeasurements}
            className="flex-1"
          >
            <Ruler className="w-4 h-4 mr-2" />
            Distance
          </Button>
          <Button
            size="sm"
            variant={measurementMode === 'angle' ? 'default' : 'outline'}
            onClick={() => handleModeToggle('angle')}
            disabled={measurements.length >= maxMeasurements}
            className="flex-1"
          >
            <Triangle className="w-4 h-4 mr-2" />
            Angle
          </Button>
          <Button
            size="sm"
            variant={measurementMode === 'dihedral' ? 'default' : 'outline'}
            onClick={() => handleModeToggle('dihedral')}
            disabled={measurements.length >= maxMeasurements}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Dihedral
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExport}
            disabled={measurements.length === 0}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Measurements List */}
      <ScrollArea className="flex-1 p-4">
        {measurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Info className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">No measurements yet</p>
            <p className="text-xs mt-2">
              Select a measurement mode and click on atoms to create measurements
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedMeasurements).map(([type, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={type}>
                  <h4 className="text-sm font-medium mb-2 capitalize">{type}</h4>
                  <div className="space-y-2">
                    {items.map((measurement) => (
                      <MeasurementItem
                        key={measurement.id}
                        measurement={measurement}
                        formattedValue={formatValue(measurement)}
                        isExpanded={expandedId === measurement.id}
                        isSelected={selectedIds.has(measurement.id)}
                        onToggleExpand={() =>
                          setExpandedId(
                            expandedId === measurement.id ? null : measurement.id
                          )
                        }
                        onToggleSelect={() => {
                          const newSelected = new Set(selectedIds);
                          if (newSelected.has(measurement.id)) {
                            newSelected.delete(measurement.id);
                          } else {
                            newSelected.add(measurement.id);
                          }
                          setSelectedIds(newSelected);
                        }}
                        onToggleVisibility={() =>
                          onToggleVisibility(measurement.id)
                        }
                        onDelete={() => onDeleteMeasurement(measurement.id)}
                        onUpdate={(updates) =>
                          onUpdateMeasurement(measurement.id, updates)
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}

interface MeasurementItemProps {
  measurement: Measurement;
  formattedValue: string;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Measurement>) => void;
}

function MeasurementItem({
  measurement,
  formattedValue,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onToggleVisibility,
  onDelete,
  onUpdate,
}: MeasurementItemProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onToggleExpand}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-sm">
              {measurement.label || `${measurement.type}-${measurement.id.slice(0, 6)}`}
            </div>
            <div className="text-xs text-muted-foreground">{formattedValue}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="h-8 w-8"
          >
            {measurement.visible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t text-xs space-y-2">
          {measurement.atoms.map((atom, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="font-mono">
                {atom.residue.name}{atom.residue.sequenceNumber}.{atom.name}
              </span>
              <span className="text-muted-foreground">
                Chain {atom.residue.chainId}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={measurement.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Add label..."
              className="flex-1 px-2 py-1 text-xs border rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
```

### State Management

```typescript
/**
 * useMeasurements.ts
 * Hook for managing measurement creation and state
 */

import { useState, useCallback, useRef } from 'react';
import { molstarService } from '@/services/molstar-service';
import { v4 as uuidv4 } from 'uuid';

export interface UseMeasurementsOptions {
  maxMeasurements?: number;
  onMeasurementCreated?: (measurement: Measurement) => void;
  onMeasurementDeleted?: (id: string) => void;
}

export function useMeasurements(options: UseMeasurementsOptions = {}) {
  const { maxMeasurements = 100, onMeasurementCreated, onMeasurementDeleted } = options;

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementMode, setMeasurementMode] = useState<MeasurementType | null>(null);
  const selectedAtomsRef = useRef<MeasurementAtom[]>([]);

  const handleAtomClick = useCallback(
    async (atomInfo: AtomInfo) => {
      if (!measurementMode) return;

      const atom: MeasurementAtom = {
        serialNumber: atomInfo.serialNumber,
        element: atomInfo.element,
        name: atomInfo.name,
        position: atomInfo.coordinates,
        residue: {
          name: '', // Get from MolStar
          sequenceNumber: 0,
          chainId: '',
        },
      };

      selectedAtomsRef.current.push(atom);

      const requiredAtoms = measurementMode === 'distance' ? 2 : measurementMode === 'angle' ? 3 : 4;

      if (selectedAtomsRef.current.length === requiredAtoms) {
        // Create measurement
        const measurement = await createMeasurement(
          measurementMode,
          selectedAtomsRef.current as any
        );

        setMeasurements((prev) => {
          if (prev.length >= maxMeasurements) {
            console.warn('Maximum measurements reached');
            return prev;
          }
          return [...prev, measurement];
        });

        onMeasurementCreated?.(measurement);

        // Reset selection
        selectedAtomsRef.current = [];
        setMeasurementMode(null);
      }
    },
    [measurementMode, maxMeasurements, onMeasurementCreated]
  );

  const deleteMeasurement = useCallback(
    (id: string) => {
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      molstarService.removeMeasurement(id);
      onMeasurementDeleted?.(id);
    },
    [onMeasurementDeleted]
  );

  const toggleVisibility = useCallback((id: string) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m))
    );
    molstarService.updateMeasurementVisibility(id);
  }, []);

  const updateMeasurement = useCallback((id: string, updates: Partial<Measurement>) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  return {
    measurements,
    measurementMode,
    setMeasurementMode,
    handleAtomClick,
    deleteMeasurement,
    toggleVisibility,
    updateMeasurement,
    clearAll: () => setMeasurements([]),
  };
}

async function createMeasurement(
  type: MeasurementType,
  atoms: MeasurementAtom[]
): Promise<Measurement> {
  const id = uuidv4();
  const createdAt = Date.now();

  if (type === 'distance') {
    const [a1, a2] = atoms;
    const value = calculateDistance(a1.position, a2.position);
    return {
      id,
      type,
      atoms: [a1, a2],
      value,
      visible: true,
      createdAt,
    };
  } else if (type === 'angle') {
    const [a1, a2, a3] = atoms;
    const value = calculateAngle(a1.position, a2.position, a3.position);
    return {
      id,
      type,
      atoms: [a1, a2, a3],
      value,
      visible: true,
      createdAt,
    };
  } else {
    const [a1, a2, a3, a4] = atoms;
    const value = calculateDihedral(a1.position, a2.position, a3.position, a4.position);
    return {
      id,
      type,
      atoms: [a1, a2, a3, a4],
      value,
      visible: true,
      createdAt,
    };
  }
}

function calculateDistance(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calculateAngle(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): number {
  const v1 = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
  const v2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]];

  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
  const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);

  const cosAngle = dot / (mag1 * mag2);
  return (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
}

function calculateDihedral(
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  p4: [number, number, number]
): number {
  // Dihedral angle calculation
  const b1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const b2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]];
  const b3 = [p4[0] - p3[0], p4[1] - p3[1], p4[2] - p3[2]];

  const n1 = cross(b1, b2);
  const n2 = cross(b2, b3);

  const x = dot(n1, n2);
  const y = dot(cross(n1, n2), normalize(b2));

  return Math.atan2(y, x) * (180 / Math.PI);
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v: number[]): number[] {
  const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}
```

---

*[Continue in next document for SequenceViewer, InteractionsPanel, and Enhanced MolstarService specifications...]*

## Document Navigation

- **Part 1**: HoverTooltip & MeasurementsPanel (this document)
- **Part 2**: SequenceViewer & InteractionsPanel
- **Part 3**: Enhanced MolstarService API
- **Part 4**: Integration Guide & Implementation Plan

**Next**: [Part 2 - SequenceViewer & InteractionsPanel →](./component-specifications-part2.md)
