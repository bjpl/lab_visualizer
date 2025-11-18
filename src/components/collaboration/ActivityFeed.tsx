/**
 * ActivityFeed component - Real-time activity log
 * Shows user actions, structure changes, and session events
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCollaborationStore, selectActivities } from '@/store/collaboration-slice';
import type { ActivityType } from '@/types/collaboration';

interface ActivityFeedProps {
  maxHeight?: string;
  showFilters?: boolean;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  'user-join': '👋',
  'user-leave': '👋',
  'structure-change': '🧬',
  'annotation-add': '📝',
  'annotation-edit': '✏️',
  'annotation-delete': '🗑️',
  'camera-move': '📷',
  'simulation-start': '▶️',
  'simulation-stop': '⏸️',
  'role-change': '👤',
  'session-created': '✨',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  'user-join': 'text-green-600 dark:text-green-400',
  'user-leave': 'text-gray-600 dark:text-gray-400',
  'structure-change': 'text-blue-600 dark:text-blue-400',
  'annotation-add': 'text-purple-600 dark:text-purple-400',
  'annotation-edit': 'text-purple-600 dark:text-purple-400',
  'annotation-delete': 'text-red-600 dark:text-red-400',
  'camera-move': 'text-indigo-600 dark:text-indigo-400',
  'simulation-start': 'text-green-600 dark:text-green-400',
  'simulation-stop': 'text-orange-600 dark:text-orange-400',
  'role-change': 'text-blue-600 dark:text-blue-400',
  'session-created': 'text-yellow-600 dark:text-yellow-400',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  maxHeight = '400px',
  showFilters = true,
}) => {
  const activities = useCollaborationStore(selectActivities);
  const feedRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterTypes, setFilterTypes] = useState<Set<ActivityType>>(new Set());

  /**
   * Auto-scroll to bottom when new activities arrive
   */
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities, autoScroll]);

  /**
   * Detect manual scrolling
   */
  const handleScroll = () => {
    if (!feedRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  /**
   * Toggle filter
   */
  const toggleFilter = (type: ActivityType) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(
    (activity) => filterTypes.size === 0 || filterTypes.has(activity.type)
  );

  // Get unique activity types
  const activityTypes = Array.from(new Set(activities.map((a) => a.type)));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Activity Feed
        </h3>

        {/* Filters */}
        {showFilters && activityTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => {
              const isActive = filterTypes.has(type) || filterTypes.size === 0;
              return (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {ACTIVITY_ICONS[type]} {type.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity list */}
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {filteredActivities.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {filterTypes.size > 0
              ? 'No activities match the selected filters'
              : 'No activities yet'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredActivities.map((activity, index) => {
              const isLast = index === filteredActivities.length - 1;

              return (
                <div
                  key={activity.id}
                  className={`p-3 transition-all ${
                    isLast && autoScroll
                      ? 'bg-blue-50 dark:bg-blue-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0">
                      {ACTIVITY_ICONS[activity.type]}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          ACTIVITY_COLORS[activity.type]
                        }`}
                      >
                        {activity.message}
                      </p>

                      {/* Additional data */}
                      {activity.data && Object.keys(activity.data).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {Object.entries(activity.data).map(([key, value]) => (
                            <div key={key}>
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {filteredActivities.length} event{filteredActivities.length !== 1 ? 's' : ''}
        </div>
        {!autoScroll && (
          <button
            onClick={() => {
              setAutoScroll(true);
              if (feedRef.current) {
                feedRef.current.scrollTop = feedRef.current.scrollHeight;
              }
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Scroll to latest ↓
          </button>
        )}
      </div>
    </div>
  );
};
