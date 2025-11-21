/**
 * Re-export visualization store from main stores
 * This provides the expected import path for components
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Visualization state types
export type RepresentationType =
  | 'cartoon'
  | 'ball-and-stick'
  | 'spacefill'
  | 'ribbon'
  | 'surface';

export type ColorScheme =
  | 'element'
  | 'chain'
  | 'residue'
  | 'secondary-structure'
  | 'rainbow';

export interface VisualizationState {
  // Display settings
  representation: RepresentationType;
  colorScheme: ColorScheme;
  backgroundColor: string;
  showBackbone: boolean;
  showSidechains: boolean;
  showLigands: boolean;
  showWater: boolean;
  quality: 'low' | 'medium' | 'high';

  // Selection state
  selectedAtoms: string[];
  selectionHistory: string[];

  // Actions
  setRepresentation: (rep: RepresentationType) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setBackgroundColor: (color: string) => void;
  setShowBackbone: (show: boolean) => void;
  setShowSidechains: (show: boolean) => void;
  setShowLigands: (show: boolean) => void;
  setShowWater: (show: boolean) => void;
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  resetSettings: () => void;

  // Selection actions
  setSelectedAtoms: (atoms: string[]) => void;
  clearSelection: () => void;
  focusOnSelection: () => void;
}

const defaultState = {
  representation: 'cartoon' as RepresentationType,
  colorScheme: 'chain' as ColorScheme,
  backgroundColor: '#1a1a2e',
  showBackbone: true,
  showSidechains: false,
  showLigands: true,
  showWater: false,
  quality: 'medium' as const,
  selectedAtoms: [] as string[],
  selectionHistory: [] as string[],
};

export const useVisualizationStore = create<VisualizationState>()(
  persist(
    (set) => ({
      ...defaultState,

      setRepresentation: (representation) => set({ representation }),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
      setShowBackbone: (showBackbone) => set({ showBackbone }),
      setShowSidechains: (showSidechains) => set({ showSidechains }),
      setShowLigands: (showLigands) => set({ showLigands }),
      setShowWater: (showWater) => set({ showWater }),
      setQuality: (quality) => set({ quality }),
      resetSettings: () => set(defaultState),

      // Selection actions
      setSelectedAtoms: (selectedAtoms) => set((state) => ({
        selectedAtoms,
        selectionHistory: selectedAtoms.length > 0
          ? [...state.selectionHistory.slice(-9), selectedAtoms.join(',')]
          : state.selectionHistory,
      })),
      clearSelection: () => set({ selectedAtoms: [] }),
      focusOnSelection: () => {
        // This will be implemented by the viewer component
        console.log('Focus on selection requested');
      },
    }),
    {
      name: 'visualization-settings',
    }
  )
);
