/**
 * useToast Hook - Toast notification system
 *
 * Features:
 * - Success, error, warning, info notifications
 * - Auto-dismiss with configurable duration
 * - Queue management
 * - Position control
 * - XSS protection with automatic sanitization
 */

import { useState, useCallback, useEffect } from 'react';
import { sanitizeText } from '@/lib/sanitize';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

export interface ToastOptions {
  type?: ToastType;
  message?: string;
  duration?: number;
}

const DEFAULT_DURATION = 5000; // 5 seconds
const MAX_TOASTS = 5;

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, options: ToastOptions = {}) => {
    const {
      type = 'info',
      message,
      duration = DEFAULT_DURATION,
    } = options;

    const toast: Toast = {
      id: `toast-${++toastId}`,
      type,
      title,
      message,
      duration,
      timestamp: Date.now(),
    };

    setToasts((prev) => {
      const updated = [toast, ...prev];
      // Keep only MAX_TOASTS
      return updated.slice(0, MAX_TOASTS);
    });

    return toast.id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Auto-dismiss toasts
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.duration && t.duration > 0)
      .map((toast) =>
        setTimeout(() => {
          dismissToast(toast.id);
        }, toast.duration!)
      );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dismissToast]);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast(title, { type: 'success', message, duration });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast(title, { type: 'error', message, duration });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast(title, { type: 'warning', message, duration });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast(title, { type: 'info', message, duration });
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Toast Container Component
 * Renders toast notifications
 */
export function ToastContainer({ toasts, onDismiss }: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  // Sanitize user-provided content to prevent XSS attacks
  const safeTitle = sanitizeText(toast.title);
  const safeMessage = toast.message ? sanitizeText(toast.message) : undefined;

  return (
    <div
      className={`pointer-events-auto border rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right ${colors[toast.type]}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[toast.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{safeTitle}</div>
          {safeMessage && (
            <div className="text-sm mt-1 opacity-90">{safeMessage}</div>
          )}
        </div>
        <button
          className="text-lg opacity-50 hover:opacity-100 transition-opacity"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
