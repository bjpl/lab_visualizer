/**
 * CursorOverlay component - Real-time cursor broadcasting and display
 * Shows other users' cursors with avatars and labels
 */
'use client';

import type React from 'react';
import { useEffect, useRef, useCallback } from 'react';

import { collaborationSession } from '@/services/collaboration-session';
import { useCollaborationStore, selectUsers } from '@/store/collaboration-slice';
import type { CursorUpdate } from '@/types/collaboration';

const CURSOR_UPDATE_THROTTLE = 100; // 10Hz

interface CursorPosition {
  x: number;
  y: number;
  target?: string;
  interpolatedX: number;
  interpolatedY: number;
  lastUpdate: number;
}

export const CursorOverlay: React.FC = () => {
  const users = useCollaborationStore(selectUsers);
  const currentUserId = useCollaborationStore((state) => state.currentUserId);
  const updateUser = useCollaborationStore((state) => state.updateUser);

  const cursorsRef = useRef<Map<string, CursorPosition>>(new Map());
  const lastBroadcastRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Broadcast cursor position (throttled)
   */
  const broadcastCursor = useCallback(
    (x: number, y: number, target?: string) => {
      if (!currentUserId) return;

      const now = Date.now();
      if (now - lastBroadcastRef.current < CURSOR_UPDATE_THROTTLE) {
        return;
      }

      lastBroadcastRef.current = now;

      const update: CursorUpdate = {
        userId: currentUserId,
        x,
        y,
        target,
        timestamp: now,
      };

      collaborationSession.broadcast('cursor-move', update).catch((error) => {
        console.error('Failed to broadcast cursor:', error);
      });
    },
    [currentUserId]
  );

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Get target element if hovering over molecular structure
      const target = (e.target as HTMLElement)?.dataset?.atomId;

      broadcastCursor(x, y, target);
    },
    [broadcastCursor]
  );

  /**
   * Interpolate cursor positions for smooth rendering
   */
  const interpolateCursors = useCallback(() => {
    const now = Date.now();
    let needsUpdate = false;

    cursorsRef.current.forEach((cursor, _userId) => {
      const timeSinceUpdate = now - cursor.lastUpdate;
      const alpha = Math.min(timeSinceUpdate / CURSOR_UPDATE_THROTTLE, 1);

      // Smooth interpolation
      const newX = cursor.interpolatedX + (cursor.x - cursor.interpolatedX) * alpha * 0.3;
      const newY = cursor.interpolatedY + (cursor.y - cursor.interpolatedY) * alpha * 0.3;

      if (Math.abs(newX - cursor.interpolatedX) > 0.01 || Math.abs(newY - cursor.interpolatedY) > 0.01) {
        cursor.interpolatedX = newX;
        cursor.interpolatedY = newY;
        needsUpdate = true;
      }
    });

    if (needsUpdate && containerRef.current) {
      // Force re-render by updating state
      updateUser({ id: 'force-render-' + Date.now() } as any);
    }

    animationFrameRef.current = requestAnimationFrame(interpolateCursors);
  }, [updateUser]);

  /**
   * Handle cursor updates from other users
   */
  useEffect(() => {
    users.forEach((user) => {
      if (user.id !== currentUserId && user.cursor) {
        const existing = cursorsRef.current.get(user.id);

        if (existing) {
          existing.x = user.cursor.x;
          existing.y = user.cursor.y;
          existing.target = user.cursor.target;
          existing.lastUpdate = Date.now();
        } else {
          cursorsRef.current.set(user.id, {
            x: user.cursor.x,
            y: user.cursor.y,
            target: user.cursor.target,
            interpolatedX: user.cursor.x,
            interpolatedY: user.cursor.y,
            lastUpdate: Date.now(),
          });
        }
      }
    });

    // Clean up cursors for users who left
    const activeUserIds = new Set(users.map((u) => u.id));
    cursorsRef.current.forEach((_, userId) => {
      if (!activeUserIds.has(userId)) {
        cursorsRef.current.delete(userId);
      }
    });
  }, [users, currentUserId]);

  /**
   * Setup event listeners and animation
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(interpolateCursors);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove, interpolateCursors]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    >
      {users
        .filter((user) => user.id !== currentUserId && user.cursor)
        .map((user) => {
          const cursor = cursorsRef.current.get(user.id);
          if (!cursor) return null;

          return (
            <div
              key={user.id}
              className="absolute transition-opacity duration-200"
              style={{
                left: `${cursor.interpolatedX}%`,
                top: `${cursor.interpolatedY}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Cursor icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-lg"
                style={{ color: user.color }}
              >
                <path
                  d="M5 3L19 12L12 13L9 19L5 3Z"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>

              {/* User label */}
              <div
                className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
                {cursor.target && (
                  <span className="ml-1 opacity-75">• {cursor.target}</span>
                )}
              </div>

              {/* Avatar (optional) */}
              {user.avatar && (
                <div
                  className="absolute -left-2 -top-2 w-6 h-6 rounded-full border-2 overflow-hidden"
                  style={{ borderColor: user.color }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
