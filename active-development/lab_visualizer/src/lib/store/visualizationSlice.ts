/**
 * Visualization Store Hook
 * Exports a hook specifically for visualization state
 */

import { useAppStore } from '@/stores/app-store';

export const useVisualizationStore = () =>
  useAppStore((state) => ({
    representation: state.representation,
    colorScheme: state.colorScheme,
    backgroundColor: '#000000', // Default value, should be added to slice if needed
    showBackbone: true, // Default value, should be added to slice if needed
    showSidechains: true, // Default value, should be added to slice if needed
    showLigands: true, // Default value, should be added to slice if needed
    showWater: false, // Default value, should be added to slice if needed
    quality: 'high', // Default value, should be added to slice if needed
    setRepresentation: state.setRepresentation,
    setColorScheme: state.setColorScheme,
    structure: state.structure,
    selection: state.selection,
    camera: state.camera,
    isLoading: state.isLoading,
    loadStructure: state.loadStructure,
    setSelection: state.setSelection,
    setCamera: state.setCamera,
    resetVisualization: state.resetVisualization,
  }));
