/**
 * Visualization State Slice
 *
 * Manages 3D visualization state:
 * - Loaded structure
 * - Representation style
 * - Color scheme
 * - Selection
 * - Camera position
 */

import type { StateCreator } from 'zustand';

export interface Structure {
  pdbId: string;
  content: string;
  metadata?: {
    title?: string;
    resolution?: number;
    chains?: string[];
    atoms?: number;
  };
}

export interface Camera {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  zoom: number;
}

export interface Selection {
  type: 'atom' | 'residue' | 'chain' | 'none';
  ids: string[];
  color?: string;
}

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

export interface VisualizationSlice {
  // State
  structure: Structure | null;
  representation: RepresentationType;
  colorScheme: ColorScheme;
  selection: Selection;
  camera: Camera;
  isLoading: boolean;

  // Actions
  loadStructure: (structure: Structure) => void;
  setRepresentation: (representation: RepresentationType) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  setSelection: (selection: Selection) => void;
  setCamera: (camera: Partial<Camera>) => void;
  resetVisualization: () => void;
}

const initialCamera: Camera = {
  position: [0, 0, 50],
  target: [0, 0, 0],
  fov: 45,
  zoom: 1,
};

const initialSelection: Selection = {
  type: 'none',
  ids: [],
};

export const createVisualizationSlice: StateCreator<
  VisualizationSlice,
  [['zustand/immer', never]],
  [],
  VisualizationSlice
> = (set) => ({
  // Initial state
  structure: null,
  representation: 'cartoon',
  colorScheme: 'chain',
  selection: initialSelection,
  camera: initialCamera,
  isLoading: false,

  // Actions
  loadStructure: (structure) =>
    set((state) => {
      state.structure = structure;
      state.isLoading = false;
      // Reset camera to default when loading new structure
      state.camera = initialCamera;
      state.selection = initialSelection;
    }),

  setRepresentation: (representation) =>
    set((state) => {
      state.representation = representation;
    }),

  setColorScheme: (colorScheme) =>
    set((state) => {
      state.colorScheme = colorScheme;
    }),

  setSelection: (selection) =>
    set((state) => {
      state.selection = selection;
    }),

  setCamera: (cameraUpdate) =>
    set((state) => {
      state.camera = { ...state.camera, ...cameraUpdate };
    }),

  resetVisualization: () =>
    set((state) => {
      state.structure = null;
      state.representation = 'cartoon';
      state.colorScheme = 'chain';
      state.selection = initialSelection;
      state.camera = initialCamera;
      state.isLoading = false;
    }),
});
