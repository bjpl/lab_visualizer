/**
 * Collaboration State Slice
 *
 * Manages real-time collaboration:
 * - Session management
 * - Connected users
 * - Cursor positions
 * - Shared actions
 */

import type { StateCreator } from 'zustand';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: number;
}

export interface CollaborationSession {
  id: string;
  name: string;
  createdAt: number;
  createdBy: string;
  userCount: number;
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  z?: number;
  timestamp: number;
}

export type CollaborationAction =
  | { type: 'structure-load'; pdbId: string }
  | { type: 'representation-change'; representation: string }
  | { type: 'selection-change'; selection: unknown }
  | { type: 'camera-move'; camera: unknown }
  | { type: 'annotation-add'; annotation: unknown };

export interface CollaborationSlice {
  // State
  session: CollaborationSession | null;
  users: Map<string, User>;
  cursor: Map<string, CursorPosition>;
  isConnected: boolean;
  actionHistory: CollaborationAction[];

  // Actions
  connectSession: (session: CollaborationSession, currentUser: User) => void;
  disconnectSession: () => void;
  updateUser: (userId: string, user: Partial<User>) => void;
  updateCursor: (userId: string, position: Omit<CursorPosition, 'userId' | 'timestamp'>) => void;
  broadcastAction: (action: CollaborationAction) => void;
  removeUser: (userId: string) => void;
}

export const createCollaborationSlice: StateCreator<
  CollaborationSlice,
  [['zustand/immer', never]],
  [],
  CollaborationSlice
> = (set) => ({
  // Initial state
  session: null,
  users: new Map(),
  cursor: new Map(),
  isConnected: false,
  actionHistory: [],

  // Actions
  connectSession: (session, currentUser) =>
    set((state) => {
      state.session = session;
      state.isConnected = true;
      state.users.set(currentUser.id, currentUser);
      console.log(`[Collaboration] Connected to session ${session.id}`);
    }),

  disconnectSession: () =>
    set((state) => {
      state.session = null;
      state.isConnected = false;
      state.users.clear();
      state.cursor.clear();
      state.actionHistory = [];
      console.log('[Collaboration] Disconnected from session');
    }),

  updateUser: (userId, userUpdate) =>
    set((state) => {
      const existingUser = state.users.get(userId);
      if (existingUser) {
        state.users.set(userId, {
          ...existingUser,
          ...userUpdate,
          lastSeen: Date.now(),
        });
      } else {
        // New user joining
        state.users.set(userId, {
          id: userId,
          name: userUpdate.name || `User ${userId.slice(0, 4)}`,
          color: userUpdate.color || '#000000',
          isActive: userUpdate.isActive ?? true,
          lastSeen: Date.now(),
          ...userUpdate,
        });
      }
    }),

  updateCursor: (userId, position) =>
    set((state) => {
      state.cursor.set(userId, {
        userId,
        ...position,
        timestamp: Date.now(),
      });

      // Clean up old cursor positions (older than 5 seconds)
      const cutoff = Date.now() - 5000;
      for (const [id, cursor] of state.cursor.entries()) {
        if (cursor.timestamp < cutoff) {
          state.cursor.delete(id);
        }
      }
    }),

  broadcastAction: (action) =>
    set((state) => {
      state.actionHistory.push(action);

      // Keep only last 100 actions
      if (state.actionHistory.length > 100) {
        state.actionHistory = state.actionHistory.slice(-100);
      }

      console.log('[Collaboration] Action broadcasted:', action.type);
    }),

  removeUser: (userId) =>
    set((state) => {
      state.users.delete(userId);
      state.cursor.delete(userId);
      console.log(`[Collaboration] User ${userId} removed`);
    }),
});
