/**
 * Main Application Store (Zustand)
 *
 * Central state management with persistence and middleware
 * Combines slices for:
 * - 3D visualization state
 * - Collaboration state
 * - Simulation job state
 * - UI state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { CollaborationSlice} from './slices/collaboration-slice';
import { createCollaborationSlice } from './slices/collaboration-slice';
import type { SimulationSlice} from './slices/simulation-slice';
import { createSimulationSlice } from './slices/simulation-slice';
import type { UISlice} from './slices/ui-slice';
import { createUISlice } from './slices/ui-slice';
import { createVisualizationSlice } from './slices/visualization-slice';
import type { VisualizationSlice} from './slices/visualization-slice';

/**
 * Combined application state
 */
export type AppState = VisualizationSlice &
  CollaborationSlice &
  SimulationSlice &
  UISlice;

/**
 * Main application store with all slices
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((...a) => ({
        // Combine all slices
        ...createVisualizationSlice(...a),
        ...createCollaborationSlice(...a),
        ...createSimulationSlice(...a),
        ...createUISlice(...a),
      })),
      {
        name: 'lab-visualizer-storage',
        partialize: (state) => ({
          // Only persist specific parts of state
          visualization: {
            representation: state.representation,
            colorScheme: state.colorScheme,
          },
          ui: {
            sidebarOpen: state.sidebarOpen,
            theme: state.theme,
          },
          // Don't persist collaboration or simulation state
        }),
      }
    ),
    {
      name: 'LAB Visualizer',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useVisualization = () =>
  useAppStore((state) => ({
    structure: state.structure,
    representation: state.representation,
    colorScheme: state.colorScheme,
    selection: state.selection,
    camera: state.camera,
    loadStructure: state.loadStructure,
    setRepresentation: state.setRepresentation,
    setColorScheme: state.setColorScheme,
    setSelection: state.setSelection,
    setCamera: state.setCamera,
    resetVisualization: state.resetVisualization,
  }));

export const useCollaboration = () =>
  useAppStore((state) => ({
    session: state.session,
    users: state.users,
    cursor: state.cursor,
    isConnected: state.isConnected,
    connectSession: state.connectSession,
    disconnectSession: state.disconnectSession,
    updateUser: state.updateUser,
    updateCursor: state.updateCursor,
    broadcastAction: state.broadcastAction,
  }));

export const useSimulation = () =>
  useAppStore((state) => ({
    jobs: state.jobs,
    activeJobId: state.activeJobId,
    results: state.results,
    createJob: state.createJob,
    updateJob: state.updateJob,
    deleteJob: state.deleteJob,
    setActiveJob: state.setActiveJob,
    storeResult: state.storeResult,
  }));

export const useUI = () =>
  useAppStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    theme: state.theme,
    loading: state.loading,
    error: state.error,
    notifications: state.notifications,
    toggleSidebar: state.toggleSidebar,
    setTheme: state.setTheme,
    setLoading: state.setLoading,
    setError: state.setError,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
  }));

/**
 * Shallow comparison hooks for performance
 */
export const useShallowVisualization = () =>
  useAppStore(
    (state) => ({
      structure: state.structure,
      representation: state.representation,
      colorScheme: state.colorScheme,
    }),
    (a, b) =>
      a.structure === b.structure &&
      a.representation === b.representation &&
      a.colorScheme === b.colorScheme
  );
