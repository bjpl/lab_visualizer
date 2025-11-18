/**
 * UI State Slice
 *
 * Manages global UI state:
 * - Sidebar visibility
 * - Theme
 * - Loading states
 * - Error messages
 * - Notifications
 */

import type { StateCreator } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

export interface UISlice {
  // State
  sidebarOpen: boolean;
  theme: Theme;
  loading: boolean;
  error: string | null;
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [['zustand/immer', never]],
  [],
  UISlice
> = (set) => ({
  // Initial state
  sidebarOpen: true,
  theme: 'system',
  loading: false,
  error: null,
  notifications: [],

  // Actions
  toggleSidebar: () =>
    set((state) => {
      state.sidebarOpen = !state.sidebarOpen;
    }),

  setSidebarOpen: (open) =>
    set((state) => {
      state.sidebarOpen = open;
    }),

  setTheme: (theme) =>
    set((state) => {
      state.theme = theme;

      // Apply theme to document
      if (typeof window !== 'undefined') {
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      }
    }),

  setLoading: (loading) =>
    set((state) => {
      state.loading = loading;
    }),

  setError: (error) =>
    set((state) => {
      state.error = error;

      if (error) {
        console.error('[UI] Error:', error);
      }
    }),

  addNotification: (notification) =>
    set((state) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now(),
        duration: notification.duration ?? 5000,
      };

      state.notifications.push(newNotification);

      // Auto-remove after duration
      if (newNotification.duration > 0) {
        setTimeout(() => {
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id);
          });
        }, newNotification.duration);
      }
    }),

  removeNotification: (id) =>
    set((state) => {
      state.notifications = state.notifications.filter((n) => n.id !== id);
    }),

  clearNotifications: () =>
    set((state) => {
      state.notifications = [];
    }),
});
