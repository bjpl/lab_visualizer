/**
 * React hooks for collaboration features
 * Provides convenient access to collaboration state and actions
 */
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useCollaborationStore } from '@/store/collaboration-slice';
import { collaborationSession } from '@/services/collaboration-session';
import { cameraSync } from '@/services/camera-sync';
import type {
  CollaborationSession,
  CollaborationUser,
  RealtimeEvents,
  CameraState,
} from '@/types/collaboration';

/**
 * Main collaboration hook
 * Manages session lifecycle and real-time updates
 */
export function useCollaboration(userId: string, userName: string) {
  const {
    currentSession,
    setSession,
    setCurrentUser,
    updateUser,
    removeUser,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addActivity,
    updateCameraState,
    setConnected,
    reset,
  } = useCollaborationStore();

  const isConnectedRef = useRef(false);

  /**
   * Create a new collaboration session
   */
  const createSession = useCallback(
    async (name: string) => {
      try {
        const session = await collaborationSession.createSession(
          name,
          userId,
          userName
        );

        setSession(session);
        setCurrentUser(userId);

        // Add owner as first user
        updateUser({
          id: userId,
          name: userName,
          role: 'owner',
          status: 'active',
          color: '#FF6B6B',
          lastActivity: Date.now(),
        });

        // Add activity
        addActivity({
          id: `activity-${Date.now()}`,
          type: 'session-created',
          userId,
          userName,
          timestamp: Date.now(),
          message: `${userName} created the session`,
        });

        return session;
      } catch (error) {
        console.error('Failed to create session:', error);
        throw error;
      }
    },
    [userId, userName, setSession, setCurrentUser, updateUser, addActivity]
  );

  /**
   * Join an existing session
   */
  const joinSession = useCallback(
    async (sessionId: string) => {
      try {
        const { session, user } = await collaborationSession.joinSession(
          sessionId,
          userId,
          userName
        );

        setSession(session);
        setCurrentUser(userId);
        updateUser(user);

        return { session, user };
      } catch (error) {
        console.error('Failed to join session:', error);
        throw error;
      }
    },
    [userId, userName, setSession, setCurrentUser, updateUser]
  );

  /**
   * Join by invite code
   */
  const joinByInvite = useCallback(
    async (inviteCode: string) => {
      try {
        const { session, user } = await collaborationSession.joinByInviteCode(
          inviteCode,
          userId,
          userName
        );

        setSession(session);
        setCurrentUser(userId);
        updateUser(user);

        return { session, user };
      } catch (error) {
        console.error('Failed to join by invite:', error);
        throw error;
      }
    },
    [userId, userName, setSession, setCurrentUser, updateUser]
  );

  /**
   * Leave current session
   */
  const leaveSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      // Broadcast leave event
      await collaborationSession.broadcast('user-leave', { userId });

      // Disconnect and reset
      collaborationSession.disconnectFromChannel();
      cameraSync.cleanup();
      setConnected(false);
      reset();
    } catch (error) {
      console.error('Failed to leave session:', error);
      throw error;
    }
  }, [currentSession, userId, setConnected, reset]);

  /**
   * Handle realtime events
   */
  const handleRealtimeEvent = useCallback(
    <K extends keyof RealtimeEvents>(type: K, payload: RealtimeEvents[K]) => {
      switch (type) {
        case 'cursor-move':
          const cursorUpdate = payload as RealtimeEvents['cursor-move'];
          updateUser({
            id: cursorUpdate.userId,
            cursor: {
              x: cursorUpdate.x,
              y: cursorUpdate.y,
              target: cursorUpdate.target,
            },
          } as CollaborationUser);
          break;

        case 'annotation-add':
          addAnnotation(payload as RealtimeEvents['annotation-add']);
          break;

        case 'annotation-edit':
          const editPayload = payload as RealtimeEvents['annotation-edit'];
          updateAnnotation(editPayload.id, editPayload);
          break;

        case 'annotation-delete':
          const deletePayload = payload as RealtimeEvents['annotation-delete'];
          deleteAnnotation(deletePayload.id);
          break;

        case 'camera-update':
          const cameraPayload = payload as RealtimeEvents['camera-update'];
          updateCameraState(cameraPayload.state);
          break;

        case 'user-join':
          const joinPayload = payload as RealtimeEvents['user-join'];
          updateUser(joinPayload);
          addActivity({
            id: `activity-${Date.now()}`,
            type: 'user-join',
            userId: joinPayload.id,
            userName: joinPayload.name,
            timestamp: Date.now(),
            message: `${joinPayload.name} joined the session`,
          });
          break;

        case 'user-leave':
          const leavePayload = payload as RealtimeEvents['user-leave'];
          removeUser(leavePayload.userId);
          addActivity({
            id: `activity-${Date.now()}`,
            type: 'user-leave',
            userId: leavePayload.userId,
            userName: 'User',
            timestamp: Date.now(),
            message: 'User left the session',
          });
          break;

        case 'user-update':
          const updatePayload = payload as RealtimeEvents['user-update'];
          updateUser(updatePayload as CollaborationUser);
          break;

        case 'activity':
          addActivity(payload as RealtimeEvents['activity']);
          break;

        case 'session-update':
          const sessionPayload = payload as RealtimeEvents['session-update'];
          if (currentSession) {
            setSession({ ...currentSession, ...sessionPayload });
          }
          break;
      }
    },
    [
      updateUser,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      updateCameraState,
      removeUser,
      addActivity,
      currentSession,
      setSession,
    ]
  );

  /**
   * Connect to realtime channel
   */
  useEffect(() => {
    if (!currentSession || isConnectedRef.current) return;

    collaborationSession.connectToChannel(
      currentSession.id,
      userId,
      handleRealtimeEvent
    );

    cameraSync.initialize(userId);
    setConnected(true);
    isConnectedRef.current = true;

    // Broadcast join event
    collaborationSession
      .broadcast('user-join', {
        id: userId,
        name: userName,
        role: 'viewer',
        status: 'active',
        color: '#FF6B6B',
        lastActivity: Date.now(),
      })
      .catch(console.error);

    return () => {
      if (isConnectedRef.current) {
        collaborationSession.disconnectFromChannel();
        cameraSync.cleanup();
        isConnectedRef.current = false;
      }
    };
  }, [currentSession, userId, userName, handleRealtimeEvent, setConnected]);

  return {
    session: currentSession,
    isConnected: isConnectedRef.current,
    createSession,
    joinSession,
    joinByInvite,
    leaveSession,
  };
}

/**
 * Hook for camera synchronization
 */
export function useCameraSync() {
  const { isFollowingCamera, cameraState, setFollowingCamera } =
    useCollaborationStore();

  const currentCameraRef = useRef<CameraState | null>(null);

  /**
   * Broadcast camera update
   */
  const updateCamera = useCallback((state: CameraState) => {
    currentCameraRef.current = state;
    cameraSync.broadcastCameraUpdate(state);
  }, []);

  /**
   * Request camera control
   */
  const requestControl = useCallback(async (sessionId: string) => {
    await cameraSync.requestControl(sessionId);
  }, []);

  /**
   * Release camera control
   */
  const releaseControl = useCallback(async (sessionId: string) => {
    await cameraSync.releaseControl(sessionId);
  }, []);

  /**
   * Toggle follow mode
   */
  const toggleFollow = useCallback(() => {
    const newFollowing = !isFollowingCamera;
    setFollowingCamera(newFollowing);
    cameraSync.setFollowing(newFollowing);
  }, [isFollowingCamera, setFollowingCamera]);

  /**
   * Apply camera updates from leader
   */
  useEffect(() => {
    if (
      isFollowingCamera &&
      cameraState &&
      currentCameraRef.current &&
      cameraState !== currentCameraRef.current
    ) {
      // Smooth transition handled by cameraSync service
      const onUpdate = (state: CameraState) => {
        currentCameraRef.current = state;
        // Update your 3D camera here
      };

      cameraSync.applyCameraUpdate(
        cameraState,
        currentCameraRef.current,
        onUpdate
      );
    }
  }, [cameraState, isFollowingCamera]);

  return {
    isFollowing: isFollowingCamera,
    updateCamera,
    requestControl,
    releaseControl,
    toggleFollow,
  };
}

/**
 * Hook for session invite link
 */
export function useInviteLink() {
  const session = useCollaborationStore((state) => state.currentSession);

  const inviteLink = session
    ? collaborationSession.getInviteLink(session)
    : null;

  const copyToClipboard = useCallback(async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      return true;
    } catch (error) {
      console.error('Failed to copy invite link:', error);
      return false;
    }
  }, [inviteLink]);

  return {
    inviteLink,
    inviteCode: session?.inviteCode,
    copyToClipboard,
  };
}
