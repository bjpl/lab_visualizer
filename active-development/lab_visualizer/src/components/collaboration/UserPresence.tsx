/**
 * UserPresence component - User presence panel with role management
 * Shows active users, their roles, and provides management controls
 */
'use client';

import type React from 'react';
import { useState } from 'react';

import { collaborationSession } from '@/services/collaboration-session';
import {
  useCollaborationStore,
  selectUsers,
  selectCurrentUser,
  selectIsOwner,
} from '@/store/collaboration-slice';
import type { CollaborationUser, UserRole } from '@/types/collaboration';

interface UserPresenceProps {
  sessionId: string;
  onUserClick?: (user: CollaborationUser) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  presenter: 'Presenter',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  presenter: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  viewer: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
};

const STATUS_INDICATORS: Record<CollaborationUser['status'], string> = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-400',
};

export const UserPresence: React.FC<UserPresenceProps> = ({
  sessionId,
  onUserClick,
}) => {
  const users = useCollaborationStore(selectUsers);
  const currentUser = useCollaborationStore(selectCurrentUser);
  const isOwner = useCollaborationStore(selectIsOwner);
  const addActivity = useCollaborationStore((state) => state.addActivity);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);

  /**
   * Change user role (owner only)
   */
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    if (!isOwner || !currentUser) return;

    setIsChangingRole(true);
    try {
      await collaborationSession.changeUserRole(sessionId, userId, newRole);

      // Add activity
      addActivity({
        id: `activity-${Date.now()}`,
        type: 'role-change',
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        message: `${currentUser.name} changed role for user`,
        data: { targetUserId: userId, newRole },
      });
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('Failed to change user role');
    } finally {
      setIsChangingRole(false);
      setSelectedUserId(null);
    }
  };

  /**
   * Kick user (owner only)
   */
  const handleKickUser = async (userId: string) => {
    if (!isOwner || !currentUser) return;

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const confirmed = confirm(`Are you sure you want to remove ${user.name} from the session?`);
    if (!confirmed) return;

    try {
      await collaborationSession.kickUser(sessionId, userId);

      // Add activity
      addActivity({
        id: `activity-${Date.now()}`,
        type: 'user-leave',
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        message: `${user.name} was removed from the session`,
        data: { removedUserId: userId },
      });
    } catch (error) {
      console.error('Failed to kick user:', error);
      alert('Failed to remove user');
    }
  };

  /**
   * Format last activity time
   */
  const formatLastActivity = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'active now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  // Sort users: owner first, then by activity
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'owner') return -1;
    if (b.role === 'owner') return 1;
    return b.lastActivity - a.lastActivity;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Participants
          </h3>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            {users.length}
          </span>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No users in session
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedUsers.map((user) => {
              const isCurrentUser = user.id === currentUser?.id;
              const isSelected = user.id === selectedUserId;

              return (
                <div
                  key={user.id}
                  className={`p-3 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Status indicator */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
                          STATUS_INDICATORS[user.status]
                        }`}
                      />
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              (you)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Role badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded ${
                            ROLE_COLORS[user.role]
                          }`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>

                      {/* Last activity */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatLastActivity(user.lastActivity)}
                      </div>

                      {/* Actions (owner only, not for self) */}
                      {isOwner && !isCurrentUser && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() =>
                              setSelectedUserId(isSelected ? null : user.id)
                            }
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Change role
                          </button>
                          <button
                            onClick={() => handleKickUser(user.id)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Click handler for custom actions */}
                    {onUserClick && (
                      <button
                        onClick={() => onUserClick(user)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="More actions"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Role selection dropdown */}
                  {isSelected && isOwner && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Select new role:
                      </p>
                      <div className="flex gap-2">
                        {(['presenter', 'viewer'] as UserRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleChangeRole(user.id, role)}
                            disabled={isChangingRole}
                            className={`flex-1 px-3 py-1 text-xs font-medium rounded transition-colors ${
                              user.role === role
                                ? ROLE_COLORS[role]
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with permissions info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium mb-1">Role permissions:</div>
          <div className="space-y-0.5">
            <div>• Owner: Full control</div>
            <div>• Presenter: Camera & annotations</div>
            <div>• Viewer: View only</div>
          </div>
        </div>
      </div>
    </div>
  );
};
