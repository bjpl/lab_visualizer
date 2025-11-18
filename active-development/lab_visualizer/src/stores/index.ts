/**
 * Stores barrel export
 * Re-exports all store hooks and types
 */

export {
  useAppStore,
  useVisualization,
  useCollaboration,
  useSimulation,
  useUI,
  useShallowVisualization,
  type AppState,
} from './app-store';

// Alias for backwards compatibility
export { useAppStore as useStore } from './app-store';
