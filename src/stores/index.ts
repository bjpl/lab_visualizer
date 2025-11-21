/**
 * Stores Index
 * Re-exports all store hooks and types for convenient importing
 */

export {
  useAppStore,
  useAppStore as useStore,
  useVisualization,
  useCollaboration,
  useSimulation,
  useUI,
  useShallowVisualization,
  type AppState,
} from './app-store';

// Re-export slice types if needed
export type { VisualizationSlice } from './slices/visualization-slice';
export type { CollaborationSlice } from './slices/collaboration-slice';
export type { SimulationSlice } from './slices/simulation-slice';
export type { UISlice } from './slices/ui-slice';
