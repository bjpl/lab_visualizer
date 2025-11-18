/**
 * Zustand store slice for collaboration state management
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {
  CollaborationState,
  CollaborationSession,
  CollaborationUser,
  Annotation,
  ActivityEvent,
  CameraState,
} from '@/types/collaboration';

const MAX_ACTIVITIES = 100; // Keep last 100 activities

const initialState = {
  currentSession: null,
  users: new Map<string, CollaborationUser>(),
  currentUserId: null,
  annotations: new Map<string, Annotation>(),
  activities: [],
  cameraState: null,
  isConnected: false,
  isFollowingCamera: false,
  selectedAnnotation: null,
};

export const useCollaborationStore = create<CollaborationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Session Management
      setSession: (session) => {
        set({ currentSession: session }, false, 'setSession');
      },

      setCurrentUser: (userId) => {
        set({ currentUserId: userId }, false, 'setCurrentUser');
      },

      // User Management
      updateUser: (user) => {
        set((state) => {
          const users = new Map(state.users);
          users.set(user.id, user);
          return { users };
        }, false, 'updateUser');
      },

      removeUser: (userId) => {
        set((state) => {
          const users = new Map(state.users);
          users.delete(userId);
          return { users };
        }, false, 'removeUser');
      },

      // Annotation Management
      addAnnotation: (annotation) => {
        set((state) => {
          const annotations = new Map(state.annotations);
          annotations.set(annotation.id, annotation);
          return { annotations };
        }, false, 'addAnnotation');
      },

      updateAnnotation: (id, update) => {
        set((state) => {
          const annotations = new Map(state.annotations);
          const existing = annotations.get(id);
          if (existing) {
            annotations.set(id, {
              ...existing,
              ...update,
              updatedAt: Date.now(),
            });
          }
          return { annotations };
        }, false, 'updateAnnotation');
      },

      deleteAnnotation: (id) => {
        set((state) => {
          const annotations = new Map(state.annotations);
          annotations.delete(id);
          return {
            annotations,
            selectedAnnotation: state.selectedAnnotation === id ? null : state.selectedAnnotation
          };
        }, false, 'deleteAnnotation');
      },

      // Activity Management
      addActivity: (activity) => {
        set((state) => {
          const activities = [...state.activities, activity];
          // Keep only last MAX_ACTIVITIES
          if (activities.length > MAX_ACTIVITIES) {
            activities.splice(0, activities.length - MAX_ACTIVITIES);
          }
          return { activities };
        }, false, 'addActivity');
      },

      // Camera Management
      updateCameraState: (state) => {
        set({ cameraState: state }, false, 'updateCameraState');
      },

      // UI State
      setConnected: (connected) => {
        set({ isConnected: connected }, false, 'setConnected');
      },

      setFollowingCamera: (following) => {
        set({ isFollowingCamera: following }, false, 'setFollowingCamera');
      },

      setSelectedAnnotation: (id) => {
        set({ selectedAnnotation: id }, false, 'setSelectedAnnotation');
      },

      // Reset
      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    { name: 'CollaborationStore' }
  )
);

// Selectors for optimized access
export const selectCurrentSession = (state: CollaborationState) => state.currentSession;
export const selectUsers = (state: CollaborationState) => Array.from(state.users.values());
export const selectUserById = (userId: string) => (state: CollaborationState) =>
  state.users.get(userId);
export const selectCurrentUser = (state: CollaborationState) =>
  state.currentUserId ? state.users.get(state.currentUserId) : null;
export const selectAnnotations = (state: CollaborationState) =>
  Array.from(state.annotations.values());
export const selectAnnotationById = (id: string) => (state: CollaborationState) =>
  state.annotations.get(id);
export const selectActivities = (state: CollaborationState) => state.activities;
export const selectIsOwner = (state: CollaborationState) => {
  const user = selectCurrentUser(state);
  return user?.role === 'owner';
};
export const selectCanControl = (state: CollaborationState) => {
  const user = selectCurrentUser(state);
  return user?.role === 'owner' || user?.role === 'presenter';
};
