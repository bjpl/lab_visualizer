'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Focus, History } from 'lucide-react';
import { useVisualizationStore } from '@/lib/store/visualizationSlice';

interface SelectionInfo {
  type: 'atom' | 'residue' | 'chain';
  id: string;
  name: string;
  details: Record<string, string>;
}

export function SelectionPanel() {
  const { selectedAtoms, selectionHistory, clearSelection, focusOnSelection } =
    useVisualizationStore();

  // Mock selection info - will be populated by Mol*
  const currentSelection: SelectionInfo | null = selectedAtoms.length > 0 ? {
    type: 'residue',
    id: 'A.123',
    name: 'LEU 123',
    details: {
      Chain: 'A',
      Residue: 'LEU',
      'Residue Number': '123',
      'Secondary Structure': 'α-helix',
      Atoms: '8 selected',
    },
  } : null;

  if (!currentSelection && selectionHistory.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed p-6 text-center"
        role="status"
        aria-label="No selection"
      >
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Focus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No Selection</p>
        <p className="text-xs text-muted-foreground">
          Click on atoms or residues to view details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Selection details">
      {/* Current Selection */}
      {currentSelection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Selection</h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={focusOnSelection}
                aria-label="Focus on selection"
              >
                <Focus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentSelection.type}</Badge>
              <p className="font-mono text-sm font-medium">{currentSelection.name}</p>
            </div>

            <div className="space-y-1.5">
              {Object.entries(currentSelection.details).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={focusOnSelection}
          >
            <Focus className="mr-2 h-4 w-4" />
            Center on Selection
          </Button>
        </div>
      )}

      {/* Selection History */}
      {selectionHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Selection History
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Clear history
                console.log('Clear history');
              }}
              aria-label="Clear selection history"
            >
              Clear
            </Button>
          </div>

          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {selectionHistory.map((item, index) => (
                <button
                  key={index}
                  className="w-full rounded-lg border bg-card p-2 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={() => {
                    // Re-select this item
                    console.log('Re-select:', item);
                  }}
                  aria-label={`Re-select ${item}`}
                >
                  <p className="font-mono text-sm">{item}</p>
                  <p className="text-xs text-muted-foreground">
                    Click to re-select
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs font-medium mb-1">Keyboard Shortcuts</p>
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          <li><kbd className="px-1 py-0.5 rounded bg-background">Esc</kbd> Clear selection</li>
          <li><kbd className="px-1 py-0.5 rounded bg-background">F</kbd> Focus on selection</li>
          <li><kbd className="px-1 py-0.5 rounded bg-background">Ctrl+Click</kbd> Multi-select</li>
        </ul>
      </div>
    </div>
  );
}
