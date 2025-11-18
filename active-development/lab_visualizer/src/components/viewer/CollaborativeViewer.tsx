/**
 * CollaborativeViewer - Integrated MolStar Viewer with Collaboration Features
 * Combines molecular visualization with real-time collaboration
 */
'use client';

import type React from 'react';
import { useEffect, useCallback, useRef } from 'react';

import { CursorOverlay } from '@/components/collaboration/CursorOverlay';
import { MolecularViewer } from '@/components/MolecularViewer';
import { useCollaboration, useCameraSync } from '@/hooks/use-collaboration';
import { useMolstar } from '@/hooks/use-molstar';
import { useCollaborationStore, selectCurrentSession } from '@/store/collaboration-slice';
import type { CameraState as CollabCameraState } from '@/types/collaboration';
import type { MolstarConfig, CameraState as MolstarCameraState } from '@/types/molstar';

export interface CollaborativeViewerProps {
  /**
   * User ID for collaboration
   */
  userId: string;

  /**
   * User name for display
   */
  userName: string;

  /**
   * PDB ID to load
   */
  pdbId?: string;

  /**
   * PDB data to load
   */
  pdbData?: string;

  /**
   * MolStar configuration
   */
  config?: MolstarConfig;

  /**
   * Enable LOD progressive rendering
   */
  enableLOD?: boolean;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Callback when structure is loaded
   */
  onStructureLoaded?: (metadata: any) => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Convert MolStar camera state to collaboration camera state
 */
function molstarToCollabCamera(state: MolstarCameraState): CollabCameraState {
  return {
    position: state.position,
    target: state.target,
    up: state.up,
    zoom: state.zoom || 1,
    fov: state.fov || 45,
  };
}

/**
 * Convert collaboration camera state to MolStar camera state
 */
function collabToMolstarCamera(state: CollabCameraState): MolstarCameraState {
  return {
    position: state.position,
    target: state.target,
    up: state.up,
    zoom: state.zoom,
    fov: state.fov,
  };
}

export const CollaborativeViewer: React.FC<CollaborativeViewerProps> = ({
  userId,
  userName,
  pdbId,
  pdbData,
  config,
  enableLOD = false,
  className = '',
  onStructureLoaded,
  onError,
}) => {
  const session = useCollaborationStore(selectCurrentSession);
  const { isFollowing, updateCamera, toggleFollow } = useCameraSync();
  const { cameraState: remoteCameraState } = useCollaborationStore();

  const viewerRef = useRef<any>(null);
  const isApplyingRemoteCamera = useRef(false);
  const lastBroadcastTime = useRef(0);
  const CAMERA_BROADCAST_THROTTLE = 100; // ms

  /**
   * Handle local camera changes - broadcast to other users
   */
  const handleCameraChange = useCallback((cameraState: MolstarCameraState) => {
    if (!session || isFollowing || isApplyingRemoteCamera.current) {
      return;
    }

    const now = Date.now();
    if (now - lastBroadcastTime.current < CAMERA_BROADCAST_THROTTLE) {
      return;
    }

    lastBroadcastTime.current = now;
    const collabState = molstarToCollabCamera(cameraState);
    updateCamera(collabState);
  }, [session, isFollowing, updateCamera]);

  /**
   * Apply remote camera state to viewer
   */
  useEffect(() => {
    if (!isFollowing || !remoteCameraState || !viewerRef.current) {
      return;
    }

    try {
      isApplyingRemoteCamera.current = true;
      const molstarState = collabToMolstarCamera(remoteCameraState);

      // Apply camera state to MolStar viewer
      // This would use the actual MolStar API to set camera
      // viewerRef.current.setCamera(molstarState);

      console.log('[CollaborativeViewer] Applied remote camera state:', molstarState);
    } catch (error) {
      console.error('[CollaborativeViewer] Failed to apply remote camera:', error);
    } finally {
      isApplyingRemoteCamera.current = false;
    }
  }, [isFollowing, remoteCameraState]);

  /**
   * Handle cursor movement - broadcast to other users
   */
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!session) return;

    // Throttle cursor updates
    const now = Date.now();
    if (now - lastBroadcastTime.current < 50) {
      return;
    }

    lastBroadcastTime.current = now;

    // Get viewport-relative coordinates
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Broadcast cursor position
    // This would use the collaboration service
    // collaborationSession.broadcast('cursor-move', { userId, x, y });
  }, [session, userId]);

  /**
   * Handle structure selection - broadcast to other users
   */
  const handleSelection = useCallback((selection: any) => {
    if (!session) return;

    // Broadcast selection to other users
    console.log('[CollaborativeViewer] Selection changed:', selection);
    // collaborationSession.broadcast('selection-change', { userId, selection });
  }, [session, userId]);

  /**
   * Handle structure loaded
   */
  const handleStructureLoaded = useCallback((metadata: any) => {
    console.log('[CollaborativeViewer] Structure loaded:', metadata);
    onStructureLoaded?.(metadata);

    if (session) {
      // Broadcast structure load event
      // collaborationSession.broadcast('activity', {
      //   type: 'structure-loaded',
      //   userId,
      //   userName,
      //   timestamp: Date.now(),
      //   message: `${userName} loaded structure ${pdbId}`,
      // });
    }
  }, [session, userId, userName, pdbId, onStructureLoaded]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      viewerRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative h-full w-full ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* MolStar Viewer */}
      <MolecularViewer
        pdbId={pdbId}
        pdbData={pdbData}
        config={config}
        enableLOD={enableLOD}
        onStructureLoaded={handleStructureLoaded}
        onError={onError}
        className="h-full w-full"
      />

      {/* Collaboration Overlays */}
      {session && (
        <>
          {/* Cursor Overlay for other users */}
          <CursorOverlay />

          {/* Following indicator */}
          {isFollowing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg flex items-center gap-2 z-10">
              <svg
                className="w-4 h-4 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-sm font-medium">Following camera</span>
              <button
                onClick={toggleFollow}
                className="ml-2 p-1 hover:bg-blue-700 rounded"
                aria-label="Stop following"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Session indicator */}
          <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/75 text-white rounded text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Session: {session.name}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
