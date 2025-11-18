/**
 * CollaborationPanel - Main integration component
 * Combines all collaboration features into a unified panel
 */
'use client';

import type React from 'react';
import { useState } from 'react';

import { ActivityFeed } from './ActivityFeed';
import { AnnotationTools } from './AnnotationTools';
import { CursorOverlay } from './CursorOverlay';
import { UserPresence } from './UserPresence';

import { useCollaboration, useCameraSync, useInviteLink } from '@/hooks/use-collaboration';
import { useCollaborationStore, selectCurrentSession } from '@/store/collaboration-slice';

interface CollaborationPanelProps {
  userId: string;
  userName: string;
  structureId?: string;
  onClose?: () => void;
}

type PanelTab = 'users' | 'annotations' | 'activity';

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  userId,
  userName,
  structureId,
  onClose,
}) => {
  const { session, isConnected, createSession, joinByInvite, leaveSession } =
    useCollaboration(userId, userName);
  const { isFollowing, requestControl, releaseControl, toggleFollow } = useCameraSync();
  const { inviteLink, inviteCode, copyToClipboard } = useInviteLink();

  const [activeTab, setActiveTab] = useState<PanelTab>('users');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create new session
   */
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await createSession(sessionName);
      setShowCreateForm(false);
      setSessionName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Join session by code
   */
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await joinByInvite(joinCode.toUpperCase());
      setShowJoinForm(false);
      setJoinCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Leave session
   */
  const handleLeaveSession = async () => {
    const confirmed = confirm('Are you sure you want to leave this session?');
    if (!confirmed) return;

    try {
      await leaveSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
    }
  };

  /**
   * Copy invite link
   */
  const handleCopyInvite = async () => {
    const success = await copyToClipboard();
    if (success) {
      // Show success feedback
      alert('Invite link copied to clipboard!');
    }
  };

  /**
   * Request/release camera control
   */
  const handleToggleCameraControl = async () => {
    if (!session) return;

    try {
      if (isFollowing) {
        await releaseControl(session.id);
      } else {
        await requestControl(session.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change camera control');
    }
  };

  // Not in session - show join/create options
  if (!session) {
    return (
      <div className="w-96 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Collaboration
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start or join a collaborative session
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Create session form */}
        {showCreateForm ? (
          <div className="p-4">
            <form onSubmit={handleCreateSession}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Protein Analysis"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={isLoading}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !sessionName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : showJoinForm ? (
          <div className="p-4">
            <form onSubmit={handleJoinSession}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC12345"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase"
                disabled={isLoading}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !joinCode.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                >
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full max-w-xs px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg"
            >
              Create New Session
            </button>
            <button
              onClick={() => setShowJoinForm(true)}
              className="w-full max-w-xs px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium"
            >
              Join Session
            </button>
          </div>
        )}
      </div>
    );
  }

  // In session - show collaboration UI
  return (
    <>
      {/* Cursor overlay */}
      <CursorOverlay />

      {/* Panel */}
      <div className="w-96 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {session.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCopyInvite}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
              title="Copy invite link"
            >
              Invite
            </button>
            <button
              onClick={toggleFollow}
              className={`flex-1 px-3 py-1.5 text-sm rounded ${
                isFollowing
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleLeaveSession}
              className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {([
            { id: 'users', label: 'Users' },
            { id: 'annotations', label: 'Annotations' },
            { id: 'activity', label: 'Activity' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'users' && <UserPresence sessionId={session.id} />}
          {activeTab === 'annotations' && (
            <AnnotationTools structureId={structureId} />
          )}
          {activeTab === 'activity' && <ActivityFeed />}
        </div>
      </div>
    </>
  );
};
